const { getConnection } = require('../config/database');

// Lấy danh sách tất cả Đoàn viên
const getAllDoanVien = async (req, res) => {
  try {
    const pool = await getConnection();
    const [rows] = await pool.query('SELECT * FROM doan_vien');
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách Đoàn viên',
      error: error.message
    });
  }
};

// Lấy thông tin Đoàn viên theo ID
const getDoanVienById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();
    const [rows] = await pool.query('SELECT * FROM doan_vien WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy Đoàn viên'
      });
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin Đoàn viên',
      error: error.message
    });
  }
};

module.exports = {
  getAllDoanVien,
  getDoanVienById
};
