const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  try {
    const conn = await mysql.createConnection({ host: 'localhost', user: 'root', password: 'Nhoxthu23092005@', database: 'QUAN_LY_DOAN_VIEN' });
    
    // Đặt lại các giá trị trống về mặc định để hiển thị đúng
    await conn.query("UPDATE KhieuNai SET loaiKhieuNai = 'Vắng mặt' WHERE loaiKhieuNai = ''");
    console.log("Cập nhật UPDATE thành công!");
    
    process.exit(0);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
run();
