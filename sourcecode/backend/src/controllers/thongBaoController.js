const { getConnection } = require('../config/database');

// GET /api/thong-bao
const getAll = async (req, res) => {
  try {
    const { search, loai, phamVi } = req.query;
    const pool = await getConnection();
    let sql = `
      SELECT tb.idThongBao, tb.tieuDe, tb.noiDung, tb.loai, tb.phamVi,
             tb.anhBia, tb.ngayTao, tk.tenNguoiDung AS nguoiDang
      FROM ThongBao tb
      LEFT JOIN TaiKhoan tk ON tb.nguoiTao = tk.idUser
      WHERE 1=1`;
    const params = [];
    if (loai)   { sql += ' AND tb.loai = ?';            params.push(loai); }
    if (phamVi) { sql += ' AND tb.phamVi = ?';          params.push(phamVi); }
    if (search) { sql += ' AND tb.tieuDe LIKE ?';        params.push(`%${search}%`); }
    sql += ' ORDER BY tb.ngayTao DESC';
    const [rows] = await pool.query(sql, params);
    return res.json({ success: true, data: rows });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/thong-bao/:id
const getOne = async (req, res) => {
  try {
    const pool = await getConnection();
    const [[row]] = await pool.query(
      `SELECT tb.*, tk.tenNguoiDung AS nguoiDang
       FROM ThongBao tb LEFT JOIN TaiKhoan tk ON tb.nguoiTao = tk.idUser
       WHERE tb.idThongBao = ?`, [req.params.id]
    );
    if (!row) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    return res.json({ success: true, data: row });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

// POST /api/thong-bao
const create = async (req, res) => {
  try {
    const { tieuDe, noiDung, loai, phamVi, anhBia } = req.body;
    if (!tieuDe) return res.status(400).json({ success: false, message: 'Tiêu đề là bắt buộc' });
    const pool = await getConnection();
    await pool.query(
      `INSERT INTO ThongBao (tieuDe, noiDung, loai, phamVi, anhBia, nguoiTao)
       VALUES (?,?,?,?,?,?)`,
      [tieuDe, noiDung || '', loai || 'Thông báo', phamVi || 'Công khai', anhBia || null, req.user.idUser]
    );
    return res.status(201).json({ success: true, message: 'Tạo thông báo thành công' });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

// PUT /api/thong-bao/:id
const update = async (req, res) => {
  try {
    const { tieuDe, noiDung, loai, phamVi, anhBia } = req.body;
    const pool = await getConnection();
    await pool.query(
      `UPDATE ThongBao SET tieuDe=?, noiDung=?, loai=?, phamVi=?, anhBia=? WHERE idThongBao=?`,
      [tieuDe, noiDung, loai, phamVi, anhBia || null, req.params.id]
    );
    return res.json({ success: true, message: 'Cập nhật thành công' });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

// DELETE /api/thong-bao/:id
const remove = async (req, res) => {
  try {
    const pool = await getConnection();
    await pool.query('DELETE FROM ThongBao WHERE idThongBao=?', [req.params.id]);
    return res.json({ success: true, message: 'Đã xóa' });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { getAll, getOne, create, update, remove };
