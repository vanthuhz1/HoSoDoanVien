const mysql = require('mysql2/promise');
require('dotenv').config();

const checkRows = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'defaultdb',
    ssl: { rejectUnauthorized: false }
  });

  try {
    const [khoa] = await connection.query('SELECT COUNT(*) as count FROM Khoa');
    const [doanVien] = await connection.query('SELECT COUNT(*) as count FROM DoanVien');
    const [taiKhoan] = await connection.query('SELECT COUNT(*) as count FROM TaiKhoan');
    const [danhMucDoanPhi] = await connection.query('SELECT COUNT(*) as count FROM DanhMucDoanPhi');
    
    console.log('Khoa count:', khoa[0].count);
    console.log('DoanVien count:', doanVien[0].count);
    console.log('TaiKhoan count:', taiKhoan[0].count);
    console.log('DanhMucDoanPhi count:', danhMucDoanPhi[0].count);
  } catch (error) {
    console.error('Lỗi khi đếm số dòng:', error.message);
  } finally {
    await connection.end();
  }
};

checkRows();
