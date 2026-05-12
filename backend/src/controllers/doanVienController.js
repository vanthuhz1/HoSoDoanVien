const { getConnection } = require('../config/database');

// GET /api/doan-vien – Tất cả đoàn viên (Admin / Đoàn khoa)
const getAllDoanVien = async (req, res) => {
  try {
    const pool = await getConnection();
    const [rows] = await pool.query(`
      SELECT
        dv.*,
        cd.tenChiDoan,
        k.tenKhoa
      FROM DoanVien dv
      LEFT JOIN ChiDoan cd ON dv.maChiDoan = cd.maChiDoan
      LEFT JOIN Khoa    k  ON cd.maKhoa    = k.maKhoa
      ORDER BY dv.hoTen
    `);
    return res.json({ success: true, data: rows, total: rows.length });
  } catch (error) {
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

module.exports = { getAllDoanVien, getDoanVienById, getDoanVienByChiDoan, uploadAvatar };
