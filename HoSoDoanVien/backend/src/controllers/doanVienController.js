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
    const maChiDoan = data.maChiDoan && data.maChiDoan.trim() !== '' ? data.maChiDoan : null;

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

    // 3. TỰ ĐỘNG ĐỒNG BỘ: Tạo tài khoản (Khớp chuẩn xác tên cột IdVaiTro của bạn)
    const userEmail = `${data.maDV.toLowerCase()}@sv.ute.udn.vn`;
    const hashedPassword = '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu'; // Mật khẩu 123456
    const idVaiTroMacDinh = 4; // 4 tương ứng với quyền 'Đoàn viên' trong bảng VaiTro của bạn

    await pool.query(`
      INSERT INTO TaiKhoan (maDV, email, tenNguoiDung, matKhau, IdVaiTro)
      VALUES (?, ?, ?, ?, ?)
    `, [data.maDV, userEmail, data.hoTen, hashedPassword, idVaiTroMacDinh]);

    // 4. TỰ ĐỘNG ĐỒNG BỘ: Tạo Sổ Đoàn (Khớp chuẩn xác tên cột maSoDoan và trangThai của bạn)
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
    const ngaySinh = data.ngaySinh && data.ngaySinh.trim() !== '' ? data.ngaySinh : null;
    const ngayVaoDoan = data.ngayVaoDoan && data.ngayVaoDoan.trim() !== '' ? data.ngayVaoDoan : null;
    
    // Nếu maChiDoan trống hoặc không hợp lệ, ép về null để không gãy khóa ngoại
    const maChiDoan = data.maChiDoan && data.maChiDoan.trim() !== '' && data.maChiDoan !== '-- Chọn chi đoàn --' ? data.maChiDoan : null;

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
      data.cccd && data.cccd.trim() !== '' ? data.cccd : null, 
      data.queQuan || null, 
      data.diaChiThuongTru || null, 
      data.SDT && data.SDT.trim() !== '' ? data.SDT : null, 
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
  createDoanVien, 
  updateDoanVien  
};