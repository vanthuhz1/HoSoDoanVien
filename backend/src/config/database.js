const mysql = require('mysql2/promise');
require('dotenv').config();

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'QUAN_LY_DOAN_VIEN',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
};

let pool = null;

const getConnection = async () => {
  try {
    if (!pool) {
      pool = mysql.createPool(config);
      // Test connection
      await pool.query('SELECT 1');
      console.log('✓ Kết nối MySQL thành công');
    }
    return pool;
  } catch (error) {
    console.error('✗ Lỗi kết nối MySQL:', error.message);
    throw error;
  }
};

module.exports = { getConnection };
