const { getConnection } = require('../config/database');

// GET /api/doan-vien – Tất cả đoàn viên (Admin / Đoàn khoa)
// GET /api/doan-vien – Tất cả đoàn viên kèm bộ lọc nâng cao (Tìm kiếm, Chi đoàn, Trạng thái)
const getAllDoanVien = async (req, res) => {
  try {
    // 💡 Hứng các tham số lọc được gửi từ Frontend qua URL query params
    const { search, maChiDoan, trangThaiSH } = req.query;
    const pool = await getConnection();

    // 1. Khởi tạo câu lệnh truy vấn gốc
    let sql = `
      SELECT
        dv.*,
        cd.tenChiDoan,
        k.tenKhoa
      FROM DoanVien dv
      LEFT JOIN ChiDoan cd ON dv.maChiDoan = cd.maChiDoan
      LEFT JOIN Khoa    k  ON cd.maKhoa    = k.maKhoa
    `;

    // 2. Tự động xây dựng điều kiện lọc động dựa trên những gì Admin chọn
    let conditions = [];
    let queryParams = [];

    // Nếu gõ ô tìm kiếm (Tìm theo Họ tên hoặc Mã đoàn viên)
    if (search && search.trim() !== '') {
      conditions.push(`(dv.hoTen LIKE ? OR dv.maDV LIKE ?)`);
      queryParams.push(`%${search.trim()}%`);
      queryParams.push(`%${search.trim()}%`);
    }

    // Nếu chọn bộ lọc Chi đoàn
    if (maChiDoan && maChiDoan.trim() !== '') {
      conditions.push(`dv.maChiDoan = ?`);
      queryParams.push(maChiDoan.trim());
    }

    // Nếu chọn bộ lọc Trạng thái sinh hoạt
    if (trangThaiSH && trangThaiSH.trim() !== '') {
      conditions.push(`dv.trangThaiSH = ?`);
      queryParams.push(trangThaiSH.trim());
    }

    // Nếu có ít nhất 1 điều kiện, nối chữ WHERE vào câu lệnh SQL
    if (conditions.length > 0) {
      sql += ` WHERE ` + conditions.join(' AND ');
    }

    // Sắp xếp theo thứ tự bảng chữ cái tên đoàn viên
    sql += ` ORDER BY dv.hoTen`;

    // 3. Thực thi câu lệnh SQL với mảng tham số an toàn (tránh lỗi SQL Injection)
    const [rows] = await pool.query(sql, queryParams);

    return res.json({ success: true, data: rows, total: rows.length });
  } catch (error) {
    console.error('Lỗi lấy danh sách đoàn viên:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách Đoàn viên',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
// GET /api/doan-vien/:id – Theo maDV
const getDoanVienById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();
    const [rows] = await pool.query(`
      SELECT
        dv.*,
        cd.tenChiDoan,
        k.tenKhoa,
        tk.email
      FROM DoanVien dv
      LEFT JOIN ChiDoan  cd ON dv.maChiDoan = cd.maChiDoan
      LEFT JOIN Khoa     k  ON cd.maKhoa    = k.maKhoa
      LEFT JOIN TaiKhoan tk ON dv.maDV       = tk.maDV
      WHERE dv.maDV = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy Đoàn viên' });
    }
    return res.json({ success: true, data: rows[0] });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin Đoàn viên',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// GET /api/doan-vien/chi-doan/:maChiDoan – Đoàn viên theo chi đoàn
const getDoanVienByChiDoan = async (req, res) => {
  try {
    const { maChiDoan } = req.params;
    const pool = await getConnection();
    const [rows] = await pool.query(`
      SELECT dv.*, cd.tenChiDoan
      FROM DoanVien dv
      LEFT JOIN ChiDoan cd ON dv.maChiDoan = cd.maChiDoan
      WHERE dv.maChiDoan = ?
      ORDER BY dv.hoTen
    `, [maChiDoan]);

    return res.json({ success: true, data: rows, total: rows.length });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách Đoàn viên theo Chi đoàn',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// POST /api/doan-vien/avatar - Upload avatar
const uploadAvatar = async (req, res) => {
  try {
    const { maDV } = req.user;
    if (!maDV) {
      return res.status(400).json({ success: false, message: 'Người dùng không có mã đoàn viên' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn ảnh để tải lên' });
    }

    const imagePath = `/uploads/${req.file.filename}`;

    const pool = await getConnection();
    await pool.query('UPDATE DoanVien SET anhDaiDien = ? WHERE maDV = ?', [imagePath, maDV]);

    return res.json({
      success: true,
      message: 'Cập nhật ảnh đại diện thành công',
      data: { anhDaiDien: imagePath }
    });
  } catch (error) {
    console.error('Lỗi khi upload avatar:', error);
    return res.status(500).json({ success: false, message: 'Lỗi khi tải ảnh lên' });
  }
};
// POST /api/doan-vien – Thêm mới Đoàn viên + Tự động tạo tài khoản & Sổ đoàn (Đã chuẩn hóa cột)
const createDoanVien = async (req, res) => {
  try {
    const data = req.body;
    const pool = await getConnection();

    // 1. Kiểm tra xem mã đoàn viên đã tồn tại chưa
    const [exist] = await pool.query('SELECT maDV FROM DoanVien WHERE maDV = ?', [data.maDV]);
    if (exist.length > 0) {
      return res.status(400).json({ success: false, message: 'Mã đoàn viên này đã tồn tại trong hệ thống' });
    }

    // XỬ LÝ AN TOÀN: Ép chuỗi rỗng về null
    const ngaySinh = data.ngaySinh && data.ngaySinh.trim() !== '' ? data.ngaySinh : null;
    const ngayVaoDoan = data.ngayVaoDoan && data.ngayVaoDoan.trim() !== '' ? data.ngayVaoDoan : null;
    const maChiDoan = data.maChiDoan && data.maChiDoan.trim() !== '' && data.maChiDoan !== '-- Chọn chi đoàn --' ? data.maChiDoan : null;
    // ===== KIỂM TRA CCCD =====
    if (data.cccd && !/^\d{12}$/.test(data.cccd)) {
      return res.status(400).json({
        success: false,
        message: 'CCCD phải gồm đúng 12 chữ số'
      });
    }

    if (data.cccd) {
      const [cccdExist] = await pool.query(
        'SELECT maDV FROM DoanVien WHERE cccd = ?',
        [data.cccd]
      );

      if (cccdExist.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'CCCD đã tồn tại trong hệ thống'
        });
      }
    }
    // ===== KIỂM TRA SỐ ĐIỆN THOẠI =====
    if (data.SDT && !/^0\d{9}$/.test(data.SDT.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại không hợp lệ'
      });
    }
    // ===== KIỂM TRA NGÀY SINH =====
    if (ngaySinh) {
      const birthDate = new Date(ngaySinh);
      const today = new Date();

      if (isNaN(birthDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Ngày sinh không hợp lệ'
        });
      }

      if (birthDate > today) {
        return res.status(400).json({
          success: false,
          message: 'Ngày sinh không được lớn hơn ngày hiện tại'
        });
      }

      const age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();

      const realAge =
        m < 0 || (m === 0 && today.getDate() < birthDate.getDate())
          ? age - 1
          : age;

      if (realAge < 15) {
        return res.status(400).json({
          success: false,
          message: 'Đoàn viên phải từ 15 tuổi trở lên'
        });
      }
    }

    // ===== KIỂM TRA NGÀY VÀO ĐOÀN =====
    if (ngayVaoDoan) {
      const joinDate = new Date(ngayVaoDoan);
      const today = new Date();

      if (isNaN(joinDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Ngày vào Đoàn không hợp lệ'
        });
      }

      if (joinDate > today) {
        return res.status(400).json({
          success: false,
          message: 'Ngày vào Đoàn không được lớn hơn ngày hiện tại'
        });
      }

      if (ngaySinh) {
        const birthDate = new Date(ngaySinh);

        if (joinDate <= birthDate) {
          return res.status(400).json({
            success: false,
            message: 'Ngày vào Đoàn phải sau ngày sinh'
          });
        }

        const ageWhenJoin = joinDate.getFullYear() - birthDate.getFullYear();
        const monthDiff = joinDate.getMonth() - birthDate.getMonth();

        const realAgeWhenJoin =
          monthDiff < 0 ||
            (monthDiff === 0 && joinDate.getDate() < birthDate.getDate())
            ? ageWhenJoin - 1
            : ageWhenJoin;

        if (realAgeWhenJoin < 15) {
          return res.status(400).json({
            success: false,
            message: 'Đoàn viên phải đủ 15 tuổi khi vào Đoàn'
          });
        }
      }
    }
    // 2. Chèn thông tin hồ sơ vào bảng DoanVien
    await pool.query(`
      INSERT INTO DoanVien 
        (maDV, hoTen, ngaySinh, gioiTinh, danToc, tonGiao, cccd, queQuan, diaChiThuongTru, SDT, chucVu, maChiDoan, ngayVaoDoan, noiVaoDoan, trangThaiSH)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.maDV, data.hoTen, ngaySinh, data.gioiTinh, data.danToc, data.tonGiao,
      data.cccd || null, data.queQuan, data.diaChiThuongTru, data.SDT || null, data.chucVu, maChiDoan,
      ngayVaoDoan, data.noiVaoDoan, data.trangThaiSH || 'Đang sinh hoạt'
    ]);

    // 3. 🚀 TỰ ĐỘNG ĐỒNG BỘ: Tạo tài khoản
    const userEmail = `${data.maDV.toLowerCase()}@sv.ute.udn.vn`;
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('123456', 10); // Mật khẩu mặc định: 123456
    const idVaiTroMacDinh = 4; // 4 tương ứng với quyền 'Đoàn viên' trong bảng VaiTro

    let initialAccStatus = 1; // Mặc định hoạt động (1)
    if (data.trangThaiSH === 'Đã tốt nghiệp') {
      initialAccStatus = 2; // Đã tốt nghiệp
    } else if (data.trangThaiSH === 'Đã rút hồ sơ') {
      initialAccStatus = 0; // Bị khóa
    }

    await pool.query(`
      INSERT INTO TaiKhoan (maDV, email, tenNguoiDung, matKhau, IdVaiTro, trangThai)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [data.maDV, userEmail, data.hoTen, hashedPassword, idVaiTroMacDinh, initialAccStatus]);

    // 4. 🚀 TỰ ĐỘNG ĐỒNG BỘ: Tạo Sổ Đoàn (Khớp chuẩn xác tên cột maSoDoan và trangThai của bạn)
    const maSoDoanTuDong = `SD${data.maDV}`; // Tạo mã sổ đoàn tạm thời không trùng
    await pool.query(`
      INSERT INTO SoDoan (maSoDoan, maDV, ngayCap, noiCap, trangThai)
      VALUES (?, ?, ?, ?, 'Đã nộp')
    `, [maSoDoanTuDong, data.maDV, ngayVaoDoan, data.noiVaoDoan || 'THPT']);

    return res.status(201).json({ success: true, message: 'Thêm đoàn viên và khởi tạo tài khoản đồng bộ thành công!' });
  } catch (error) {
    console.error('Lỗi Backend Thêm mới:', error);
    return res.status(500).json({ success: false, message: 'Lỗi khi thêm đoàn viên', error: error.message });
  }
};

// PUT /api/doan-vien/:id – Cập nhật thông tin Đoàn viên (Bản chuẩn hóa tránh lỗi 500)
const updateDoanVien = async (req, res) => {
  try {
    const { id } = req.params; // id này chính là mã đoàn viên (maDV) gửi từ URL
    const data = req.body;
    const pool = await getConnection();

    // 1. Chuẩn hóa dữ liệu đầu vào: Nếu để trống hoặc không chọn thì ép về null để MySQL không bắt lỗi
    // 1. Chuẩn hóa dữ liệu đầu vào
    const ngaySinh = data.ngaySinh && data.ngaySinh.trim() !== '' ? data.ngaySinh : null;
    const ngayVaoDoan = data.ngayVaoDoan && data.ngayVaoDoan.trim() !== '' ? data.ngayVaoDoan : null;

    // Nếu maChiDoan trống hoặc không hợp lệ, ép về null để không gãy khóa ngoại
    const maChiDoan = data.maChiDoan && data.maChiDoan.trim() !== '' &&
      data.maChiDoan !== '-- Chọn chi đoàn --'
      ? data.maChiDoan
      : null;

    // ===== KIỂM TRA CCCD =====
    if (data.cccd && !/^\d{12}$/.test(data.cccd.trim())) {
      return res.status(400).json({
        success: false,
        message: 'CCCD phải gồm đúng 12 chữ số'
      });
    }

    if (data.cccd) {
      const [cccdExist] = await pool.query(
        'SELECT maDV FROM DoanVien WHERE cccd = ? AND maDV <> ?',
        [data.cccd.trim(), id]
      );

      if (cccdExist.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'CCCD đã tồn tại trong hệ thống'
        });
      }
    }

    // ===== KIỂM TRA SĐT =====
    if (data.SDT && !/^0\d{9}$/.test(data.SDT.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại không hợp lệ'
      });
    }

    // ===== KIỂM TRA NGÀY SINH =====
    if (ngaySinh) {
      const birthDate = new Date(ngaySinh);
      const today = new Date();

      if (isNaN(birthDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Ngày sinh không hợp lệ'
        });
      }

      if (birthDate > today) {
        return res.status(400).json({
          success: false,
          message: 'Ngày sinh không được lớn hơn ngày hiện tại'
        });
      }
    }

    // ===== KIỂM TRA NGÀY VÀO ĐOÀN =====
    if (ngayVaoDoan) {
      const joinDate = new Date(ngayVaoDoan);
      const today = new Date();

      if (isNaN(joinDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Ngày vào Đoàn không hợp lệ'
        });
      }

      if (joinDate > today) {
        return res.status(400).json({
          success: false,
          message: 'Ngày vào Đoàn không được lớn hơn ngày hiện tại'
        });
      }

      if (ngaySinh) {
        const birthDate = new Date(ngaySinh);

        if (joinDate <= birthDate) {
          return res.status(400).json({
            success: false,
            message: 'Ngày vào Đoàn phải sau ngày sinh'
          });
        }
      }
    }


    // 2. Ép chuỗi trạng thái sinh hoạt khớp chuẩn ENUM trong database của bạn
    let trangThaiSHClean = 'Đang sinh hoạt';
    if (data.trangThaiSH) {
      const ts = data.trangThaiSH.toString().trim().toLowerCase();
      if (ts.includes('rút') || ts.includes('rut')) {
        trangThaiSHClean = 'Đã rút hồ sơ';
      } else if (ts.includes('nghiệp') || ts.includes('nghiep')) {
        trangThaiSHClean = 'Đã tốt nghiệp';
      }
    }

    // 3. Thực thi lệnh UPDATE với cấu trúc mảng tham số khớp chuẩn 100% với số dấu chấm hỏi (?)
    const [result] = await pool.query(`
      UPDATE DoanVien SET 
        hoTen = ?, 
        ngaySinh = ?, 
        gioiTinh = ?, 
        danToc = ?, 
        tonGiao = ?, 
        cccd = ?, 
        queQuan = ?, 
        diaChiThuongTru = ?, 
        SDT = ?, 
        chucVu = ?, 
        maChiDoan = ?, 
        ngayVaoDoan = ?, 
        noiVaoDoan = ?, 
        trangThaiSH = ?
      WHERE maDV = ?
    `, [
      data.hoTen,
      ngaySinh,
      data.gioiTinh,
      data.danToc || 'Kinh',
      data.tonGiao || 'Không',
      data.cccd && data.cccd.trim() !== ''
        ? data.cccd.trim()
        : null,
      data.queQuan || null,
      data.diaChiThuongTru || null,
      data.SDT && data.SDT.trim() !== ''
        ? data.SDT.trim()
        : null,
      data.chucVu || 'Đoàn viên',
      maChiDoan,
      ngayVaoDoan,
      data.noiVaoDoan || null,
      trangThaiSHClean,
      id // Bản ghi cần cập nhật (maDV) nằm ở cuối mảng ứng với WHERE maDV = ?
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đoàn viên để cập nhật' });
    }

    // Tự động đồng bộ trạng thái tài khoản hệ thống
    let newAccStatus = 1; // Mặc định hoạt động (1)
    if (trangThaiSHClean === 'Đã tốt nghiệp') {
      newAccStatus = 2; // Đã tốt nghiệp
    } else if (trangThaiSHClean === 'Đã rút hồ sơ') {
      newAccStatus = 0; // Khóa
    }
    await pool.query('UPDATE TaiKhoan SET trangThai = ? WHERE maDV = ?', [newAccStatus, id]);

    // Tự động dọn dẹp (xóa) các khoản nợ đoàn phí chưa nộp khi tốt nghiệp/rút hồ sơ
    if (trangThaiSHClean === 'Đã tốt nghiệp' || trangThaiSHClean === 'Đã rút hồ sơ') {
      await pool.query(`
        DELETE FROM DoanPhi 
        WHERE maDV = ? 
        AND trangThai = 'Chưa nộp'
        AND _idMucDoanPhi IN (
          SELECT _idMucDoanPhi FROM DanhMucDoanPhi WHERE trangThai IN ('Đang mở thu', 'Chưa mở')
        )
      `, [id]);
    }

    return res.json({ success: true, message: 'Cập nhật thông tin thành công' });
  } catch (error) {
    // In lỗi chi tiết ra màn hình terminal để dễ kiểm tra nếu database bị lệch tên cột
    console.error('Lỗi SQL chi tiết tại Backend:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống ngầm khi cập nhật dữ liệu',
      error: error.message
    });
  }
};
module.exports = {
  getAllDoanVien,
  getDoanVienById,
  getDoanVienByChiDoan,
  uploadAvatar,
  createDoanVien, // Đảm bảo có dòng này để phục vụ chức năng Thêm mới
  updateDoanVien  // Đảm bảo có dòng này để phục vụ chức năng Sửa
};