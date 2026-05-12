const { getConnection } = require('../config/database');

// Lấy maKhoa từ user đang đăng nhập
const getKhoaFromUser = async (idUser) => {
  const pool = await getConnection();
  // Bí thư Đoàn khoa: liên kết qua TaiKhoan -> DoanVien -> ChiDoan -> Khoa
  const [[row]] = await pool.query(
    `SELECT cd.maKhoa FROM TaiKhoan tk
     JOIN DoanVien dv ON tk.maDV = dv.maDV
     JOIN ChiDoan cd ON dv.maChiDoan = cd.maChiDoan
     WHERE tk.idUser = ? LIMIT 1`,
    [idUser]
  );
  return row?.maKhoa || null;
};

// GET /api/doan-khoa/dashboard – Tổng quan khoa
const getDashboard = async (req, res) => {
  try {
    const maKhoa = await getKhoaFromUser(req.user.idUser);
    if (!maKhoa) return res.status(403).json({ success: false, message: 'Không xác định được khoa' });
    const pool = await getConnection();

    const [[khoaInfo]] = await pool.query('SELECT * FROM Khoa WHERE maKhoa=?', [maKhoa]);

    // Tổng đoàn viên theo khoa
    const [[dvStat]] = await pool.query(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN dv.trangThaiSH='Đang sinh hoạt' THEN 1 ELSE 0 END) AS active
       FROM DoanVien dv JOIN ChiDoan cd ON dv.maChiDoan=cd.maChiDoan
       WHERE cd.maKhoa=?`, [maKhoa]
    );

    // Đoàn phí: tỷ lệ đã nộp (đợt mới nhất)
    const [[phiStat]] = await pool.query(
      `SELECT COUNT(*) AS total, SUM(CASE WHEN dp.trangThai='Đã nộp' THEN 1 ELSE 0 END) AS daNop
       FROM DoanPhi dp
       JOIN DoanVien dv ON dp.maDV=dv.maDV
       JOIN ChiDoan cd ON dv.maChiDoan=cd.maChiDoan
       JOIN DanhMucDoanPhi dm ON dp._idMucDoanPhi=dm._idMucDoanPhi
       WHERE cd.maKhoa=? AND dm.trangThai='Đang mở thu'`, [maKhoa]
    );

    // Sổ đoàn: tỷ lệ đã nộp
    const [[soDoanStat]] = await pool.query(
      `SELECT COUNT(*) AS total, SUM(CASE WHEN sd.trangThai='Đã nộp' THEN 1 ELSE 0 END) AS daNop
       FROM SoDoan sd
       JOIN DoanVien dv ON sd.maDV=dv.maDV
       JOIN ChiDoan cd ON dv.maChiDoan=cd.maChiDoan
       WHERE cd.maKhoa=?`, [maKhoa]
    );

    // Top 5 chi đoàn nợ đoàn phí nhiều nhất
    const [chiDoanNo] = await pool.query(
      `SELECT cd.maChiDoan, cd.tenChiDoan,
              COUNT(*) AS total,
              SUM(CASE WHEN dp.trangThai='Chưa nộp' THEN 1 ELSE 0 END) AS chuaNop
       FROM DoanPhi dp
       JOIN DoanVien dv ON dp.maDV=dv.maDV
       JOIN ChiDoan cd ON dv.maChiDoan=cd.maChiDoan
       JOIN DanhMucDoanPhi dm ON dp._idMucDoanPhi=dm._idMucDoanPhi
       WHERE cd.maKhoa=? AND dm.trangThai='Đang mở thu'
       GROUP BY cd.maChiDoan, cd.tenChiDoan
       HAVING chuaNop > 0 ORDER BY chuaNop DESC LIMIT 5`, [maKhoa]
    );

    // Hoạt động bị từ chối (cần tạo lại)
    const [tuChoiHD] = await pool.query(
      `SELECT idHD, tenHD, trangThaiHD FROM HoatDongDoan
       WHERE maKhoa=? AND trangThaiHD='Từ chối' ORDER BY idHD DESC LIMIT 5`, [maKhoa]
    );

    // Hoạt động chờ duyệt
    const [choDuyetHD] = await pool.query(
      `SELECT idHD, tenHD, trangThaiHD, ngayToChuc FROM HoatDongDoan
       WHERE maKhoa=? AND trangThaiHD='Chờ duyệt'`, [maKhoa]
    );

    return res.json({
      success: true,
      data: {
        maKhoa, tenKhoa: khoaInfo?.tenKhoa || maKhoa,
        doanVien: dvStat,
        doanPhi: phiStat,
        soDoan: soDoanStat,
        chiDoanNo,
        tuChoiHD,
        choDuyetHD,
      }
    });
  } catch(err) { return res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/doan-khoa/hoat-dong – Hoạt động của khoa
const getHoatDong = async (req, res) => {
  try {
    const maKhoa = await getKhoaFromUser(req.user.idUser);
    if (!maKhoa) return res.status(403).json({ success: false, message: 'Không xác định được khoa' });
    const pool = await getConnection();
    const [rows] = await pool.query(
      `SELECT hd.*, k.tenKhoa,
              (SELECT COUNT(*) FROM DanhSachDangKy dk WHERE dk.idHD=hd.idHD) AS soDaDangKy
       FROM HoatDongDoan hd
       LEFT JOIN Khoa k ON hd.maKhoa=k.maKhoa
       WHERE hd.maKhoa=? ORDER BY hd.ngayToChuc DESC`, [maKhoa]
    );
    return res.json({ success: true, data: rows });
  } catch(err) { return res.status(500).json({ success: false, message: err.message }); }
};

// POST /api/doan-khoa/hoat-dong – Đề xuất hoạt động
const createHoatDong = async (req, res) => {
  try {
    const maKhoa = await getKhoaFromUser(req.user.idUser);
    if (!maKhoa) return res.status(403).json({ success: false, message: 'Không xác định được khoa' });
    const { tenHD, moTa, ngayToChuc, diaDiem, soLuongMAX, diemHoatDong, Linkdinhkem } = req.body;
    if (!tenHD || !ngayToChuc) return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });

    const pool = await getConnection();
    const [[khoaInfo]] = await pool.query('SELECT tenKhoa FROM Khoa WHERE maKhoa=?', [maKhoa]);
    // Tạo ID HĐ: HD-{maKhoa}-{timestamp}
    const idHD = `HD-${maKhoa}-${Date.now()}`;
    await pool.query(
      `INSERT INTO HoatDongDoan (idHD, tenHD, moTa, ngayToChuc, diaDiem, soLuongMAX, diemHoatDong,
        trangThaiHD, donViToChuc, maKhoa, soLuongDaDK, Linkdinhkem)
       VALUES (?,?,?,?,?,?,?,'Chờ duyệt',?,?,0,?)`,
      [idHD, tenHD, moTa||'', ngayToChuc, diaDiem||'', soLuongMAX||50, diemHoatDong||0,
       `Đoàn khoa ${khoaInfo?.tenKhoa||maKhoa}`, maKhoa, Linkdinhkem||null]
    );
    return res.status(201).json({ success: true, message: 'Đã gửi đề xuất hoạt động lên Đoàn trường', idHD });
  } catch(err) { return res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/doan-khoa/diem-danh/:idHD – Danh sách đăng ký của HĐ
const getDiemDanh = async (req, res) => {
  try {
    const maKhoa = await getKhoaFromUser(req.user.idUser);
    if (!maKhoa) return res.status(403).json({ success: false, message: 'Không xác định được khoa' });
    const { idHD } = req.params;
    const pool = await getConnection();
    // Kiểm tra HĐ thuộc khoa này
    const [[hd]] = await pool.query('SELECT * FROM HoatDongDoan WHERE idHD=? AND maKhoa=?', [idHD, maKhoa]);
    if (!hd) return res.status(403).json({ success: false, message: 'Hoạt động không thuộc khoa bạn' });
    const [danhSach] = await pool.query(
      `SELECT dk.*, dv.hoTen, dv.maDV, dv.SDT, cd.tenChiDoan
       FROM DanhSachDangKy dk
       JOIN DoanVien dv ON dk.maDV=dv.maDV
       LEFT JOIN ChiDoan cd ON dv.maChiDoan=cd.maChiDoan
       WHERE dk.idHD=? ORDER BY dk.ngayDangKy ASC`, [idHD]
    );
    return res.json({ success: true, data: danhSach, hoatDong: hd });
  } catch(err) { return res.status(500).json({ success: false, message: err.message }); }
};

// PUT /api/doan-khoa/check-in – Quét QR check-in
const checkIn = async (req, res) => {
  try {
    const maKhoa = await getKhoaFromUser(req.user.idUser);
    if (!maKhoa) return res.status(403).json({ success: false, message: 'Không xác định được khoa' });
    const { maDV, idHD } = req.body;
    if (!maDV || !idHD) return res.status(400).json({ success: false, message: 'Thiếu maDV hoặc idHD' });
    const pool = await getConnection();
    // Kiểm tra HĐ thuộc khoa này
    const [[hd]] = await pool.query('SELECT idHD FROM HoatDongDoan WHERE idHD=? AND maKhoa=?', [idHD, maKhoa]);
    if (!hd) return res.status(403).json({ success: false, message: 'Không có quyền check-in cho hoạt động này' });
    // Kiểm tra đã đăng ký chưa
    const [[dk]] = await pool.query(
      'SELECT * FROM DanhSachDangKy WHERE maDV=? AND idHD=?', [maDV, idHD]
    );
    if (!dk) return res.status(404).json({ success: false, message: `Sinh viên ${maDV} chưa đăng ký hoạt động này` });
    if (dk.trangThaiThamGia === 'Đã tham gia')
      return res.status(409).json({ success: false, message: `${maDV} đã được check-in rồi`, alreadyChecked: true });
    // UPDATE check-in
    await pool.query(
      `UPDATE DanhSachDangKy SET trangThaiThamGia='Đã tham gia', ThoiGianCheckIn=NOW(), trangThaiCongDiem='Đã tích lũy'
       WHERE maDV=? AND idHD=?`, [maDV, idHD]
    );
    // Lấy thông tin sinh viên để trả về
    const [[dv]] = await pool.query('SELECT hoTen, maDV FROM DoanVien WHERE maDV=?', [maDV]);
    return res.json({ success: true, message: `Check-in thành công: ${dv?.hoTen||maDV}`, doanVien: dv });
  } catch(err) { return res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/doan-khoa/chi-doan – Danh sách chi đoàn + đoàn viên
const getChiDoan = async (req, res) => {
  try {
    const maKhoa = await getKhoaFromUser(req.user.idUser);
    if (!maKhoa) return res.status(403).json({ success: false, message: 'Không xác định được khoa' });
    const pool = await getConnection();
    const { maChiDoan } = req.query;
    let sql = `SELECT dv.*, cd.tenChiDoan FROM DoanVien dv JOIN ChiDoan cd ON dv.maChiDoan=cd.maChiDoan WHERE cd.maKhoa=?`;
    const params = [maKhoa];
    if (maChiDoan) { sql += ' AND dv.maChiDoan=?'; params.push(maChiDoan); }
    sql += ' ORDER BY dv.hoTen';
    const [rows] = await pool.query(sql, params);
    // Danh sách chi đoàn
    const [chiDoans] = await pool.query('SELECT * FROM ChiDoan WHERE maKhoa=? ORDER BY tenChiDoan', [maKhoa]);
    return res.json({ success: true, data: rows, chiDoans });
  } catch(err) { return res.status(500).json({ success: false, message: err.message }); }
};

// PUT /api/doan-khoa/chi-doan/:maDV/chuc-vu – Cập nhật chức vụ
const updateChucVu = async (req, res) => {
  try {
    const maKhoa = await getKhoaFromUser(req.user.idUser);
    const { maDV } = req.params;
    const { chucVu } = req.body;
    const pool = await getConnection();
    // Kiểm tra SV thuộc khoa này
    const [[dv]] = await pool.query(
      `SELECT dv.maDV FROM DoanVien dv JOIN ChiDoan cd ON dv.maChiDoan=cd.maChiDoan WHERE dv.maDV=? AND cd.maKhoa=?`,
      [maDV, maKhoa]
    );
    if (!dv) return res.status(403).json({ success: false, message: 'Sinh viên không thuộc khoa bạn' });
    await pool.query('UPDATE DoanVien SET chucVu=? WHERE maDV=?', [chucVu, maDV]);
    return res.json({ success: true, message: 'Cập nhật chức vụ thành công' });
  } catch(err) { return res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/doan-khoa/tien-do – Tiến độ đoàn phí & sổ đoàn theo chi đoàn
const getTienDo = async (req, res) => {
  try {
    const maKhoa = await getKhoaFromUser(req.user.idUser);
    if (!maKhoa) return res.status(403).json({ success: false, message: 'Không xác định được khoa' });
    const pool = await getConnection();
    const [rows] = await pool.query(
      `SELECT cd.maChiDoan, cd.tenChiDoan, cd.siSo,
              (SELECT COUNT(*) FROM DoanVien dv2 WHERE dv2.maChiDoan=cd.maChiDoan) AS tongDV,
              -- Đoàn phí (đợt đang mở)
              IFNULL((SELECT COUNT(*) FROM DoanPhi dp2 JOIN DoanVien dv2 ON dp2.maDV=dv2.maDV
                JOIN DanhMucDoanPhi dm ON dp2._idMucDoanPhi=dm._idMucDoanPhi
                WHERE dv2.maChiDoan=cd.maChiDoan AND dm.trangThai='Đang mở thu' AND dp2.trangThai='Đã nộp'),0) AS daNopPhi,
              IFNULL((SELECT COUNT(*) FROM DoanPhi dp2 JOIN DoanVien dv2 ON dp2.maDV=dv2.maDV
                JOIN DanhMucDoanPhi dm ON dp2._idMucDoanPhi=dm._idMucDoanPhi
                WHERE dv2.maChiDoan=cd.maChiDoan AND dm.trangThai='Đang mở thu'),0) AS tongPhi,
              -- Sổ đoàn
              IFNULL((SELECT COUNT(*) FROM SoDoan sd2 JOIN DoanVien dv2 ON sd2.maDV=dv2.maDV
                WHERE dv2.maChiDoan=cd.maChiDoan AND sd2.trangThai='Đã nộp'),0) AS daNopSo,
              IFNULL((SELECT COUNT(*) FROM SoDoan sd2 JOIN DoanVien dv2 ON sd2.maDV=dv2.maDV
                WHERE dv2.maChiDoan=cd.maChiDoan),0) AS tongSo
       FROM ChiDoan cd WHERE cd.maKhoa=? ORDER BY cd.tenChiDoan`, [maKhoa]
    );
    return res.json({ success: true, data: rows });
  } catch(err) { return res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/doan-khoa/hoat-dong-dang-mo – HĐ đang diễn ra (cho check-in dropdown)
const getHoatDongDangMo = async (req, res) => {
  try {
    const maKhoa = await getKhoaFromUser(req.user.idUser);
    if (!maKhoa) return res.status(403).json({ success: false, message: 'Không xác định được khoa' });
    const pool = await getConnection();
    const [rows] = await pool.query(
      `SELECT idHD, tenHD, ngayToChuc, diaDiem, soLuongMAX, soLuongDaDK
       FROM HoatDongDoan WHERE maKhoa=? AND trangThaiHD = 'Đang mở' AND DATE(ngayToChuc) = CURDATE()
       ORDER BY ngayToChuc DESC`, [maKhoa]
    );
    return res.json({ success: true, data: rows });
  } catch(err) { return res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/doan-khoa/chart-data – Dữ liệu biểu đồ dashboard
const getChartData = async (req, res) => {
  try {
    const maKhoa = await getKhoaFromUser(req.user.idUser);
    if (!maKhoa) return res.status(403).json({ success: false, message: 'Không xác định được khoa' });
    const pool = await getConnection();
    const year = new Date().getFullYear();

    // Tham gia hoạt động theo tháng (12 tháng)
    const [monthRows] = await pool.query(
      `SELECT MONTH(dk.ThoiGianCheckIn) AS thang, COUNT(*) AS soLuot
       FROM DanhSachDangKy dk
       JOIN HoatDongDoan hd ON dk.idHD = hd.idHD
       WHERE hd.maKhoa = ? AND dk.trangThaiThamGia = 'Đã tham gia'
         AND YEAR(dk.ThoiGianCheckIn) = ?
       GROUP BY thang ORDER BY thang`, [maKhoa, year]
    );
    // Map tất cả 12 tháng (fill 0 nếu không có)
    const byMonth = Array.from({ length: 12 }, (_, i) => {
      const found = monthRows.find(r => parseInt(r.thang) === i + 1);
      return { thang: `T${i + 1}`, soLuot: found ? parseInt(found.soLuot) : 0 };
    });

    // Top 5 chi đoàn năng nổ nhất (số lượt tham gia)
    const [top5] = await pool.query(
      `SELECT cd.tenChiDoan,
              COUNT(dk.maDV) AS luotThamGia
       FROM DanhSachDangKy dk
       JOIN DoanVien dv ON dk.maDV = dv.maDV
       JOIN ChiDoan cd ON dv.maChiDoan = cd.maChiDoan
       JOIN HoatDongDoan hd ON dk.idHD = hd.idHD
       WHERE cd.maKhoa = ? AND dk.trangThaiThamGia = 'Đã tham gia'
       GROUP BY cd.maChiDoan, cd.tenChiDoan
       ORDER BY luotThamGia DESC LIMIT 5`, [maKhoa]
    );

    // Số HĐ đang mở
    const [[hdMo]] = await pool.query(
      `SELECT COUNT(*) AS total FROM HoatDongDoan WHERE maKhoa=? AND trangThaiHD = 'Đang mở'`, [maKhoa]
    );

    return res.json({ success: true, data: { byMonth, top5, hdDangMo: parseInt(hdMo.total) } });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/doan-khoa/khieu-nai – Danh sách khiếu nại của khoa
const getKhieuNai = async (req, res) => {
  try {
    const maKhoa = await getKhoaFromUser(req.user.idUser);
    if (!maKhoa) return res.status(403).json({ success: false, message: 'Không xác định được khoa' });
    const { trangThai } = req.query;
    const pool = await getConnection();
    let sql = `
      SELECT kn.MaKhieuNai, kn.maDV, kn.idHD, kn.LinkMinhChung,
             kn.TrangThai, kn.NgayTao, kn.GhiChu,
             dv.hoTen, dv.SDT,
             cd.tenChiDoan,
             hd.tenHD
      FROM KhieuNai kn
      JOIN DoanVien dv ON kn.maDV = dv.maDV
      JOIN ChiDoan cd  ON dv.maChiDoan = cd.maChiDoan
      JOIN HoatDongDoan hd ON kn.idHD = hd.idHD
      WHERE cd.maKhoa = ?`;
    const params = [maKhoa];
    if (trangThai && trangThai !== 'all') {
      sql += ' AND kn.TrangThai = ?';
      params.push(trangThai);
    }
    sql += ' ORDER BY kn.NgayTao DESC';
    const [rows] = await pool.query(sql, params);
    return res.json({ success: true, data: rows });
  } catch(err) { return res.status(500).json({ success: false, message: err.message }); }
};

// PUT /api/doan-khoa/khieu-nai/:id/chap-nhan – Chấp nhận khiếu nại
const chapNhanKhieuNai = async (req, res) => {
  try {
    const maKhoa = await getKhoaFromUser(req.user.idUser);
    if (!maKhoa) return res.status(403).json({ success: false, message: 'Không xác định được khoa' });
    const { id } = req.params;
    const pool = await getConnection();
    // Lấy thông tin khiếu nại + kiểm tra khoa
    const [[kn]] = await pool.query(
      `SELECT kn.*, cd.maKhoa FROM KhieuNai kn
       JOIN DoanVien dv ON kn.maDV = dv.maDV
       JOIN ChiDoan cd ON dv.maChiDoan = cd.maChiDoan
       WHERE kn.MaKhieuNai = ?`, [id]
    );
    if (!kn) return res.status(404).json({ success: false, message: 'Không tìm thấy khiếu nại' });
    if (kn.maKhoa !== maKhoa) return res.status(403).json({ success: false, message: 'Không có quyền xử lý khiếu nại này' });
    if (kn.TrangThai !== 'Chờ xử lý') return res.status(400).json({ success: false, message: 'Khiếu nại này đã được xử lý rồi' });

    // Kiểm tra đã check-in chưa
    const [[dk]] = await pool.query(
      'SELECT * FROM DanhSachDangKy WHERE maDV=? AND idHD=?', [kn.maDV, kn.idHD]
    );

    if (dk) {
      // Cập nhật thành Đã tham gia + cộng điểm
      await pool.query(
        `UPDATE DanhSachDangKy SET trangThaiThamGia='Đã tham gia', ThoiGianCheckIn=NOW(), trangThaiCongDiem='Đã tích lũy'
         WHERE maDV=? AND idHD=?`, [kn.maDV, kn.idHD]
      );
    } else {
      // Thêm mới bản ghi check-in
      await pool.query(
        `INSERT INTO DanhSachDangKy (maDV, idHD, ngayDangKy, ThoiGianCheckIn, trangThaiThamGia, trangThaiCongDiem)
         VALUES (?, ?, NOW(), NOW(), 'Đã tham gia', 'Đã tích lũy')`, [kn.maDV, kn.idHD]
      );
    }

    // Cập nhật trạng thái khiếu nại
    await pool.query(
      `UPDATE KhieuNai SET TrangThai='Đã xử lý', NguoiXuLy=?, GhiChu='Đã chấp nhận – cộng bù điểm hoạt động'
       WHERE MaKhieuNai=?`, [req.user.idUser, id]
    );
    return res.json({ success: true, message: 'Đã chấp nhận khiếu nại và cộng bù điểm cho sinh viên' });
  } catch(err) { return res.status(500).json({ success: false, message: err.message }); }
};

// PUT /api/doan-khoa/khieu-nai/:id/tu-choi – Từ chối khiếu nại
const tuChoiKhieuNai = async (req, res) => {
  try {
    const maKhoa = await getKhoaFromUser(req.user.idUser);
    if (!maKhoa) return res.status(403).json({ success: false, message: 'Không xác định được khoa' });
    const { id } = req.params;
    const { lyDo } = req.body;
    if (!lyDo || !lyDo.trim()) return res.status(400).json({ success: false, message: 'Vui lòng nhập lý do từ chối' });
    const pool = await getConnection();
    const [[kn]] = await pool.query(
      `SELECT kn.*, cd.maKhoa FROM KhieuNai kn
       JOIN DoanVien dv ON kn.maDV = dv.maDV
       JOIN ChiDoan cd ON dv.maChiDoan = cd.maChiDoan
       WHERE kn.MaKhieuNai = ?`, [id]
    );
    if (!kn) return res.status(404).json({ success: false, message: 'Không tìm thấy khiếu nại' });
    if (kn.maKhoa !== maKhoa) return res.status(403).json({ success: false, message: 'Không có quyền xử lý khiếu nại này' });
    if (kn.TrangThai !== 'Chờ xử lý') return res.status(400).json({ success: false, message: 'Khiếu nại này đã được xử lý rồi' });
    await pool.query(
      `UPDATE KhieuNai SET TrangThai='Từ chối', NguoiXuLy=?, GhiChu=? WHERE MaKhieuNai=?`,
      [req.user.idUser, lyDo.trim(), id]
    );
    return res.json({ success: true, message: 'Đã từ chối khiếu nại' });
  } catch(err) { return res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { getDashboard, getHoatDong, createHoatDong, getDiemDanh, checkIn, getChiDoan, updateChucVu, getTienDo, getHoatDongDangMo, getChartData, getKhieuNai, chapNhanKhieuNai, tuChoiKhieuNai };
