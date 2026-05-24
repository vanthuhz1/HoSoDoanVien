const { getConnection } = require('../config/database');

// GET /api/activities/home
// Chỉ trả hoạt động ĐANG MỞ (trangThaiHD = 'Đang mở')
const getHomeActivities = async (req, res) => {
  try {
    const { search, date, maxQty, diemRenLuyen } = req.query;
    const pool = await getConnection();

    // Lấy maDV từ token nếu user đã đăng nhập
    const maDV = req.user?.maDV || null;

    let sql = `
      SELECT
        hd.idHD,
        hd.tenHD,
        hd.moTa,
        hd.ngayToChuc,
        hd.diaDiem,
        hd.soLuongMAX,
        hd.soLuongDaDK,
        hd.diemHoatDong,
        hd.trangThaiHD,
        hd.donViToChuc,
        hd.Linkdinhkem  AS luuY,
        k.tenKhoa,
        COUNT(dk.maDV)  AS soLuongDaDangKy,
        MAX(CASE WHEN dk.maDV = ? THEN 1 ELSE 0 END) AS daDangKy
      FROM HoatDongDoan hd
      LEFT JOIN DanhSachDangKy dk ON hd.idHD   = dk.idHD
      LEFT JOIN Khoa           k  ON hd.maKhoa  = k.maKhoa
      WHERE hd.trangThaiHD = 'Đang mở' AND hd.ngayToChuc > NOW()
    `;
    const params = [maDV];

    if (search) { sql += ` AND hd.tenHD LIKE ?`; params.push(`%${search}%`); }
    if (date) { sql += ` AND DATE(hd.ngayToChuc) >= ?`; params.push(date); }
    if (maxQty) { sql += ` AND hd.soLuongMAX <= ?`; params.push(parseInt(maxQty)); }
    if (diemRenLuyen) { sql += ` AND hd.diemHoatDong = ?`; params.push(parseInt(diemRenLuyen)); }

    sql += ` GROUP BY hd.idHD ORDER BY hd.ngayToChuc ASC`;

    const [rows] = await pool.query(sql, params);

    const data = rows.map(r => ({
      idHD: r.idHD,
      tenHD: r.tenHD,
      moTa: r.moTa,
      ngayToChuc: r.ngayToChuc,
      diaDiem: r.diaDiem,
      soLuongMAX: r.soLuongMAX,
      soLuongDaDangKy: parseInt(r.soLuongDaDangKy) || 0,
      donViToChuc: r.tenKhoa || r.donViToChuc || 'Chưa xác định',
      trangThaiHD: r.trangThaiHD,
      diemHoatDong: r.diemHoatDong,
      luuY: r.luuY,
      daDangKy: r.daDangKy === 1
    }));

    return res.json({ success: true, data, total: data.length });

  } catch (error) {
    console.error('getHomeActivities error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách hoạt động',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// GET /api/activities/all – Tất cả (Admin / Đoàn khoa / Bí thư)
const getAllActivities = async (req, res) => {
  try {
    const { search, trangThai, maKhoa } = req.query;
    const pool = await getConnection();

    let sql = `
      SELECT
        hd.idHD, hd.tenHD, hd.moTa, hd.ngayToChuc, hd.diaDiem,
        hd.soLuongMAX, hd.soLuongDaDK, hd.diemHoatDong,
        hd.trangThaiHD, hd.donViToChuc, hd.maKhoa,
        hd.Linkdinhkem,
        k.tenKhoa,
        COUNT(dk.maDV) AS soLuongDaDangKy
      FROM HoatDongDoan hd
      LEFT JOIN DanhSachDangKy dk ON hd.idHD  = dk.idHD
      LEFT JOIN Khoa           k  ON hd.maKhoa = k.maKhoa
      WHERE 1=1
    `;
    const params = [];

    if (search) { sql += ` AND hd.tenHD LIKE ?`; params.push(`%${search}%`); }
    if (trangThai) { sql += ` AND hd.trangThaiHD = ?`; params.push(trangThai); }
    if (maKhoa) { sql += ` AND hd.maKhoa = ?`; params.push(maKhoa); }

    sql += ` GROUP BY hd.idHD ORDER BY hd.ngayToChuc DESC`;

    const [rows] = await pool.query(sql, params);
    const data = rows.map(r => ({ ...r, soLuongDaDangKy: parseInt(r.soLuongDaDangKy) || 0 }));

    return res.json({ success: true, data, total: data.length });

  } catch (error) {
    console.error('getAllActivities error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách hoạt động',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// POST /api/activities – Tạo hoạt động mới (Admin)
const createActivity = async (req, res) => {
  try {
    const { tenHD, moTa, ngayToChuc, diaDiem, soLuongMAX, diemHoatDong } = req.body;
    if (!tenHD || !ngayToChuc) return res.status(400).json({ success: false, message: 'Tên và ngày tổ chức là bắt buộc' });
    if (soLuongMAX > 130) return res.status(400).json({ success: false, message: 'Số lượng tối đa không được vượt quá 130' });
    if (diemHoatDong > 10) return res.status(400).json({ success: false, message: 'Điểm hoạt động không được vượt quá 10' });
    const pool = await getConnection();

    // Sử dụng trigger tại database: truyền idHD là '0' hoặc để trống (ở đây ta không cung cấp cột idHD để DB tự lấy DEFAULT '0' và chạy trigger).
    // Tuy nhiên do lỗi strict của MySQL, ta an toàn nhất là truyền thẳng '0' vào cột idHD.
    await pool.query(
      `INSERT INTO HoatDongDoan (idHD, tenHD, moTa, ngayToChuc, diaDiem, soLuongMAX, diemHoatDong, trangThaiHD, donViToChuc, soLuongDaDK)
       VALUES ('0',?,?,?,?,?,?,?,'Đoàn trường',0)`,
      [tenHD, moTa || '', ngayToChuc, diaDiem || '', soLuongMAX || 50, diemHoatDong || 0, 'Sắp diễn ra']
    );
    return res.status(201).json({ success: true, message: 'Tạo hoạt động thành công' });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

// PUT /api/activities/:id/trang-thai – Duyệt / Từ chối / Cập nhật trạng thái
const updateTrangThai = async (req, res) => {
  try {
    const { id } = req.params;
    const { trangThaiHD, lyDoTuChoi } = req.body;
    const pool = await getConnection();

    // Ràng buộc: Chặn phê duyệt hoạt động có ngày tổ chức đã qua
    if (trangThaiHD === 'Đang mở' || trangThaiHD === 'Sắp diễn ra') {
      const [act] = await pool.query('SELECT ngayToChuc FROM HoatDongDoan WHERE idHD = ?', [id]);
      if (act.length > 0) {
        const ngayToChuc = new Date(act[0].ngayToChuc);
        if (ngayToChuc < new Date()) {
          return res.status(400).json({
            success: false,
            message: 'Ngày tổ chức đã qua, không thể phê duyệt. Yêu cầu Đoàn khoa cập nhật lại thời gian!'
          });
        }
      }
    }

    await pool.query('UPDATE HoatDongDoan SET trangThaiHD = ?, lyDoTuChoi = ? WHERE idHD = ?', [trangThaiHD, lyDoTuChoi || null, id]);
    return res.json({ success: true, message: 'Cập nhật trạng thái thành công' });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/activities/:id/dang-ky – DS đăng ký của 1 hoạt động
const getDangKy = async (req, res) => {
  try {
    const { id } = req.params;
    const { trangThai, maKhoa } = req.query;
    const pool = await getConnection();
    let sql = `
      SELECT dk.maDV, dk.trangThaiThamGia, dk.trangThaiCongDiem,
             dk.ngayDangKy, dk.ThoiGianCheckIn,
             dv.hoTen, dv.maChiDoan,
             cd.maKhoa, k.tenKhoa
      FROM DanhSachDangKy dk
      JOIN DoanVien dv ON dk.maDV = dv.maDV
      LEFT JOIN ChiDoan cd ON dv.maChiDoan = cd.maChiDoan
      LEFT JOIN Khoa k ON cd.maKhoa = k.maKhoa
      WHERE dk.idHD = ?`;
    const params = [id];
    if (trangThai) { sql += ' AND dk.trangThaiThamGia = ?'; params.push(trangThai); }
    if (maKhoa) { sql += ' AND cd.maKhoa = ?'; params.push(maKhoa); }
    sql += ' ORDER BY dv.hoTen';
    const [rows] = await pool.query(sql, params);
    return res.json({ success: true, data: rows });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

// PUT /api/activities/duyet-minh-chung – Duyệt / Từ chối minh chứng hàng loạt
const duyetMinhChung = async (req, res) => {
  try {
    const { idList, idHD, trangThai } = req.body; // idList: mảng maDV, idHD: mã hoạt động
    if (!idList?.length || !idHD) return res.status(400).json({ success: false, message: 'Vui lòng chọn ít nhất 1 đoàn viên' });
    const pool = await getConnection();
    const isDuyet = trangThai === 'Đã tham gia';
    await pool.query(
      `UPDATE DanhSachDangKy
       SET trangThaiThamGia = ?, trangThaiCongDiem = ?
       WHERE idHD = ? AND maDV IN (?)`,
      [trangThai, isDuyet ? 'Đã tích lũy' : 'Chưa cộng', idHD, idList]
    );
    return res.json({ success: true, message: `Đã ${isDuyet ? 'duyệt' : 'từ chối'} ${idList.length} đoàn viên` });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/activities/:id – Lấy chi tiết 1 hoạt động
const getActivityById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    // Lấy maDV từ token nếu user đã đăng nhập
    const maDV = req.user?.maDV || null;

    const sql = `
      SELECT
        hd.idHD,
        hd.tenHD,
        hd.moTa,
        hd.ngayToChuc,
        hd.diaDiem,
        hd.soLuongMAX,
        hd.soLuongDaDK,
        hd.diemHoatDong,
        hd.trangThaiHD,
        hd.donViToChuc,
        hd.Linkdinhkem AS luuY,
        k.tenKhoa,
        COUNT(dk.maDV) AS soLuongDaDangKy,
        MAX(CASE WHEN dk.maDV = ? THEN 1 ELSE 0 END) AS daDangKy,
        MAX(CASE WHEN dk.maDV = ? THEN dk.trangThaiThamGia ELSE NULL END) AS trangThaiThamGia
      FROM HoatDongDoan hd
      LEFT JOIN DanhSachDangKy dk ON hd.idHD = dk.idHD
      LEFT JOIN Khoa k ON hd.maKhoa = k.maKhoa
      WHERE hd.idHD = ?
      GROUP BY hd.idHD
    `;

    const [rows] = await pool.query(sql, [maDV, maDV, id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hoạt động'
      });
    }

    const activity = rows[0];
    const data = {
      idHD: activity.idHD,
      tenHD: activity.tenHD,
      moTa: activity.moTa,
      ngayToChuc: activity.ngayToChuc,
      diaDiem: activity.diaDiem,
      soLuongMAX: activity.soLuongMAX,
      soLuongDaDangKy: parseInt(activity.soLuongDaDangKy) || 0,
      donViToChuc: activity.tenKhoa || activity.donViToChuc || 'Chưa xác định',
      trangThaiHD: activity.trangThaiHD,
      diemHoatDong: activity.diemHoatDong,
      luuY: activity.luuY,
      daDangKy: activity.daDangKy === 1,
      trangThaiThamGia: activity.trangThaiThamGia || null
    };

    return res.json({ success: true, data });

  } catch (error) {
    console.error('getActivityById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin hoạt động',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// GET /api/activities/my-activities – DS hoạt động đã đăng ký của 1 đoàn viên
const getMyActivities = async (req, res) => {
  try {
    // req.user được gán từ middleware authenticateToken
    const { maDV } = req.user;
    if (!maDV) {
      return res.status(400).json({ success: false, message: 'Tài khoản không được liên kết với đoàn viên nào' });
    }

    const pool = await getConnection();
    const sql = `
      SELECT 
        dk.maDV, dk.trangThaiThamGia, dk.trangThaiCongDiem, dk.ngayDangKy,
        hd.idHD, hd.tenHD, hd.ngayToChuc, hd.diemHoatDong, hd.trangThaiHD, hd.diaDiem,
        CASE WHEN kn.MaKhieuNai IS NOT NULL THEN 1 ELSE 0 END AS daKhieuNai,
        kn.TrangThai AS trangThaiKhieuNai,
        kn.loaiKhieuNai,
        kn.diemCongThem,
        kn.GhiChu as ghiChuKhieuNai
      FROM DanhSachDangKy dk
      JOIN HoatDongDoan hd ON dk.idHD = hd.idHD
      LEFT JOIN KhieuNai kn ON dk.maDV = kn.maDV AND dk.idHD = kn.idHD
      WHERE dk.maDV = ?
      ORDER BY dk.ngayDangKy DESC
    `;
    const [rows] = await pool.query(sql, [maDV]);

    const data = rows.map(r => ({
      ...r,
      daKhieuNai: r.daKhieuNai === 1
    }));
    return res.json({ success: true, data });
  } catch (error) {
    console.error('getMyActivities error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/activities/:id/register – Đăng ký tham gia hoạt động
const registerActivity = async (req, res) => {
  try {
    const { id } = req.params; // idHD
    const { maDV } = req.user; // Lấy từ token

    if (!maDV) {
      return res.status(400).json({
        success: false,
        message: 'Tài khoản không được liên kết với đoàn viên'
      });
    }

    const pool = await getConnection();

    // 1. Kiểm tra hoạt động có tồn tại và đang mở không
    const [activities] = await pool.query(
      'SELECT idHD, tenHD, trangThaiHD, soLuongMAX, soLuongDaDK FROM HoatDongDoan WHERE idHD = ?',
      [id]
    );

    if (activities.length === 0) {
      return res.status(404).json({ success: false, message: 'Hoạt động không tồn tại' });
    }

    const activity = activities[0];

    if (activity.trangThaiHD !== 'Đang mở') {
      return res.status(400).json({
        success: false,
        message: 'Hoạt động này không còn mở đăng ký'
      });
    }

    // 2. Kiểm tra số lượng đã đủ chưa
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM DanhSachDangKy WHERE idHD = ?',
      [id]
    );

    const currentCount = countResult[0].total;
    if (currentCount >= activity.soLuongMAX) {
      return res.status(400).json({
        success: false,
        message: 'Hoạt động đã đủ số lượng đăng ký'
      });
    }

    // 3. Kiểm tra đã đăng ký chưa
    const [existing] = await pool.query(
      'SELECT * FROM DanhSachDangKy WHERE maDV = ? AND idHD = ?',
      [maDV, id]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã đăng ký hoạt động này rồi'
      });
    }

    // 4. Thêm vào danh sách đăng ký
    await pool.query(
      `INSERT INTO DanhSachDangKy (maDV, idHD, ngayDangKy, trangThaiThamGia, trangThaiCongDiem)
       VALUES (?, ?, NOW(), 'Đã Đăng Ký', 'Chưa cộng')`,
      [maDV, id]
    );

    // 5. Cập nhật số lượng đã đăng ký (optional, vì đã dùng COUNT trong query)
    await pool.query(
      'UPDATE HoatDongDoan SET soLuongDaDK = soLuongDaDK + 1 WHERE idHD = ?',
      [id]
    );

    return res.status(201).json({
      success: true,
      message: `Đăng ký tham gia "${activity.tenHD}" thành công!`
    });

  } catch (error) {
    console.error('registerActivity error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi đăng ký hoạt động',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// DELETE /api/activities/:id/unregister – Hủy đăng ký hoạt động
const unregisterActivity = async (req, res) => {
  try {
    const { id } = req.params; // idHD
    const { maDV } = req.user;

    if (!maDV) {
      return res.status(400).json({
        success: false,
        message: 'Tài khoản không được liên kết với đoàn viên'
      });
    }

    const pool = await getConnection();

    // 1. Kiểm tra đã đăng ký chưa
    const [existing] = await pool.query(
      'SELECT * FROM DanhSachDangKy WHERE maDV = ? AND idHD = ?',
      [maDV, id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bạn chưa đăng ký hoạt động này'
      });
    }

    // 2. Kiểm tra trạng thái (chỉ cho phép hủy nếu chưa tham gia)
    if (existing[0].trangThaiThamGia !== 'Đã Đăng Ký') {
      return res.status(400).json({
        success: false,
        message: 'Không thể hủy đăng ký vì bạn đã tham gia hoặc hoạt động đã kết thúc'
      });
    }

    // 3. Xóa đăng ký
    await pool.query(
      'DELETE FROM DanhSachDangKy WHERE maDV = ? AND idHD = ?',
      [maDV, id]
    );

    // 4. Giảm số lượng đã đăng ký
    await pool.query(
      'UPDATE HoatDongDoan SET soLuongDaDK = GREATEST(soLuongDaDK - 1, 0) WHERE idHD = ?',
      [id]
    );

    return res.json({
      success: true,
      message: 'Hủy đăng ký thành công'
    });

  } catch (error) {
    console.error('unregisterActivity error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi hủy đăng ký',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// POST /api/activities/:id/khieu-nai - Gửi khiếu nại
const submitKhieuNai = async (req, res) => {
  try {
    const { id } = req.params; // idHD
    const { maDV } = req.user;
    const { loaiKhieuNai, ghiChu } = req.body;

    if (!maDV) return res.status(400).json({ success: false, message: 'Tài khoản không được liên kết với đoàn viên' });
    if (!req.files || req.files.length === 0) return res.status(400).json({ success: false, message: 'Vui lòng upload ảnh minh chứng' });

    const pool = await getConnection();

    // Kiểm tra hoạt động
    const [activities] = await pool.query('SELECT trangThaiHD, ngayToChuc FROM HoatDongDoan WHERE idHD = ?', [id]);
    if (activities.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy hoạt động' });

    const activity = activities[0];
    if (activity.trangThaiHD !== 'Đã kết thúc') {
      return res.status(400).json({ success: false, message: 'Chỉ được khiếu nại hoạt động đã kết thúc' });
    }

    const daysSinceEnded = (new Date() - new Date(activity.ngayToChuc)) / (1000 * 3600 * 24);
    if (daysSinceEnded > 7) {
      return res.status(400).json({ success: false, message: 'Đã quá hạn 7 ngày để khiếu nại' });
    }

    // Kiểm tra đăng ký và trạng thái
    const [existing] = await pool.query('SELECT trangThaiThamGia FROM DanhSachDangKy WHERE maDV = ? AND idHD = ?', [maDV, id]);
    if (existing.length === 0) {
      return res.status(400).json({ success: false, message: 'Bạn chưa đăng ký hoạt động này' });
    }
    const tt = existing[0].trangThaiThamGia;
    if (tt !== 'Vắng mặt' && tt !== 'Đã tham gia') {
      return res.status(400).json({ success: false, message: 'Trạng thái tham gia không hợp lệ để khiếu nại' });
    }

    // Kiểm tra đã khiếu nại chưa
    const [kn] = await pool.query('SELECT MaKhieuNai, TrangThai FROM KhieuNai WHERE maDV = ? AND idHD = ?', [maDV, id]);
    
    const linkMinhChung = req.files.map(f => `/uploads/${f.filename}`).join(',');

    if (kn.length > 0) {
      if (kn[0].TrangThai === 'Từ chối') {
        await pool.query(
          `UPDATE KhieuNai SET TrangThai='Chờ xử lý', LinkMinhChung=?, loaiKhieuNai=?, GhiChu=?, diemCongThem=0, NgayTao=CURRENT_TIMESTAMP, NguoiXuLy=NULL WHERE MaKhieuNai=?`,
          [linkMinhChung, loaiKhieuNai || 'Vắng mặt', ghiChu || '', kn[0].MaKhieuNai]
        );
        return res.json({ success: true, message: 'Gửi lại khiếu nại thành công' });
      } else {
        return res.status(400).json({ success: false, message: 'Bạn đã gửi khiếu nại cho hoạt động này rồi' });
      }
    }

    await pool.query(
      `INSERT INTO KhieuNai (maDV, idHD, LinkMinhChung, TrangThai, loaiKhieuNai, GhiChu) VALUES (?, ?, ?, 'Chờ xử lý', ?, ?)`,
      [maDV, id, linkMinhChung, loaiKhieuNai || 'Vắng mặt', ghiChu || '']
    );

    return res.json({ success: true, message: 'Gửi khiếu nại thành công' });
  } catch (error) {
    console.error('submitKhieuNai error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi gửi khiếu nại' });
  }
};

module.exports = {
  getHomeActivities,
  getAllActivities,
  getActivityById,
  createActivity,
  updateTrangThai,
  getDangKy,
  duyetMinhChung,
  getMyActivities,
  registerActivity,
  unregisterActivity,
  submitKhieuNai
};
