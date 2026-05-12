const { getConnection } = require('../config/database');

// GET /api/so-doan
const getAllSoDoan = async (req, res) => {
  try {
    const { search, trangThai } = req.query;
    const pool = await getConnection();
    let sql = `
      SELECT sd.*, dv.hoTen, dv.maChiDoan, cd.tenChiDoan
      FROM SoDoan sd
      LEFT JOIN DoanVien dv ON sd.maDV = dv.maDV
      LEFT JOIN ChiDoan  cd ON dv.maChiDoan = cd.maChiDoan
      WHERE 1=1
    `;
    const params = [];
    if (search)    { sql += ` AND (dv.hoTen LIKE ? OR sd.maSoDoan LIKE ? OR sd.maDV LIKE ?)`; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    if (trangThai) { sql += ` AND sd.trangThai = ?`; params.push(trangThai); }
    sql += ` ORDER BY sd.ngayCap DESC`;
    const [rows] = await pool.query(sql, params);
    return res.json({ success: true, data: rows, total: rows.length });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách Sổ Đoàn', error: error.message });
  }
};

// PUT /api/so-doan/:maSoDoan/trang-thai
const updateTrangThai = async (req, res) => {
  try {
    const { maSoDoan } = req.params;
    const { trangThai, lyDoRut, ngayRutSo } = req.body;
    const pool = await getConnection();
    await pool.query(
      'UPDATE SoDoan SET trangThai = ?, lyDoRut = ?, ngayRutSo = ? WHERE maSoDoan = ?',
      [trangThai, lyDoRut || null, ngayRutSo || null, maSoDoan]
    );
    return res.json({ success: true, message: 'Cập nhật trạng thái sổ đoàn thành công' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi cập nhật', error: error.message });
  }
};

module.exports = { getAllSoDoan, updateTrangThai };
