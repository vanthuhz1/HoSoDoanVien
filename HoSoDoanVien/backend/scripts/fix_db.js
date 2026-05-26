const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({ host: 'localhost', user: 'root', password: 'Nhoxthu23092005@', database: 'QUAN_LY_DOAN_VIEN' });
  await conn.query("ALTER TABLE KhieuNai ADD COLUMN loaiKhieuNai ENUM('Vắng mặt oan', 'Sai điểm vai trò') DEFAULT 'Vắng mặt oan'");
  await conn.query("ALTER TABLE KhieuNai ADD COLUMN diemCongThem INT DEFAULT 0");
  console.log('OK');
  process.exit(0);
}
run().catch(console.error);
