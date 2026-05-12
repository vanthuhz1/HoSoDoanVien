const { getConnection } = require('../config/database');
const bcrypt = require('bcryptjs');

// GET /api/tai-khoan – Tất cả tài khoản với vai trò
const getAllTaiKhoan = async (req, res) => {
  try {
    const { search, idVaiTro } = req.query;
    const pool = await getConnection();
    let sql = `
      SELECT tk.idUser, tk.email, tk.tenNguoiDung, tk.trangThai,
             tk.ngayTao, tk.maDV, tk.IdVaiTro,
             vt.tenVaiTro,
             dv.hoTen, dv.maChiDoan, cd.tenChiDoan
      FROM TaiKhoan tk
      LEFT JOIN VaiTro   vt ON tk.IdVaiTro   = vt.idVaiTro
      LEFT JOIN DoanVien dv ON tk.maDV        = dv.maDV
      LEFT JOIN ChiDoan  cd ON dv.maChiDoan   = cd.maChiDoan
      WHERE 1=1
    `;
    const params = [];
    if (search)   { sql += ` AND (tk.email LIKE ? OR tk.tenNguoiDung LIKE ?)`; params.push(`%${search}%`, `%${search}%`); }
    if (idVaiTro) { sql += ` AND tk.IdVaiTro = ?`; params.push(idVaiTro); }
    sql += ` ORDER BY tk.IdVaiTro ASC, tk.ngayTao DESC`;
    const [rows] = await pool.query(sql, params);
    return res.json({ success: true, data: rows, total: rows.length });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách tài khoản', error: error.message });
  }
};

// PUT /api/tai-khoan/:idUser/vai-tro – Đổi vai trò
const updateVaiTro = async (req, res) => {
  try {
    const { idUser } = req.params;
    const { idVaiTro } = req.body;
    if (![1,2,3,4].includes(parseInt(idVaiTro))) {
      return res.status(400).json({ success: false, message: 'Vai trò không hợp lệ' });
    }
    const pool = await getConnection();
    await pool.query('UPDATE TaiKhoan SET IdVaiTro = ? WHERE idUser = ?', [idVaiTro, idUser]);
    return res.json({ success: true, message: 'Cập nhật vai trò thành công' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi cập nhật vai trò', error: error.message });
  }
};

// PUT /api/tai-khoan/:idUser/trang-thai – Khóa/Mở khóa
const updateTrangThai = async (req, res) => {
  try {
    const { idUser } = req.params;
    const { trangThai } = req.body;
    const pool = await getConnection();
    await pool.query('UPDATE TaiKhoan SET trangThai = ? WHERE idUser = ?', [trangThai, idUser]);
    return res.json({ success: true, message: trangThai === 1 ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi cập nhật trạng thái', error: error.message });
  }
};

// POST /api/tai-khoan – Tạo tài khoản mới
const createTaiKhoan = async (req, res) => {
  try {
    const { email, tenNguoiDung, matKhau, idVaiTro, maDV } = req.body;
    if (!email || !tenNguoiDung || !matKhau || !idVaiTro) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin' });
    }
    const pool = await getConnection();
    const [exist] = await pool.query('SELECT idUser FROM TaiKhoan WHERE email = ?', [email]);
    if (exist.length > 0) return res.status(409).json({ success: false, message: 'Email đã tồn tại' });
    const hash = await bcrypt.hash(matKhau, 10);
    await pool.query(
      'INSERT INTO TaiKhoan (email, tenNguoiDung, matKhau, IdVaiTro, maDV) VALUES (?,?,?,?,?)',
      [email, tenNguoiDung, hash, idVaiTro, maDV || null]
    );
    return res.status(201).json({ success: true, message: 'Tạo tài khoản thành công' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi tạo tài khoản', error: error.message });
  }
};

module.exports = { getAllTaiKhoan, updateVaiTro, updateTrangThai, createTaiKhoan };
