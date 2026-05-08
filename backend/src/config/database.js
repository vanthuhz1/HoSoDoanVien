const mysql = require('mysql2/promise');
require('dotenv').config();

const config = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
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
