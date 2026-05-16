const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  try {
    const conn = await mysql.createConnection({ host: 'localhost', user: 'root', password: 'Nhoxthu23092005@', database: 'QUAN_LY_DOAN_VIEN' });
    
    // Sửa cột loaiKhieuNai trong CSDL
    await conn.query("ALTER TABLE KhieuNai MODIFY COLUMN loaiKhieuNai ENUM('Vắng mặt', 'Sai vai trò') DEFAULT 'Vắng mặt'");
    console.log("Cập nhật ALTER TABLE thành công!");
    
    process.exit(0);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
run();
