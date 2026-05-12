const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function updateAllPasswords() {
  let connection;
  try {
    // Kết nối database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'QUAN_LY_DOAN_VIEN',
    });

    console.log('✓ Kết nối database thành công');

    // Hash mật khẩu "123456"
    const plainPassword = '123456';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    
    console.log('\n📝 Thông tin:');
    console.log('   Mật khẩu gốc:', plainPassword);
    console.log('   Mật khẩu hash:', hashedPassword);

    // Cập nhật TẤT CẢ tài khoản
    const [result] = await connection.query(
      'UPDATE TaiKhoan SET matKhau = ?',
      [hashedPassword]
    );

    console.log('\n✅ Đã cập nhật mật khẩu cho', result.affectedRows, 'tài khoản');
    console.log('\n🔐 Tất cả tài khoản giờ có mật khẩu: 123456');
    
    // Hiển thị danh sách tài khoản
    const [accounts] = await connection.query(
      'SELECT idUser, email, tenNguoiDung, IdVaiTro FROM TaiKhoan ORDER BY IdVaiTro, idUser'
    );
    
    console.log('\n📋 Danh sách tài khoản:');
    accounts.forEach(acc => {
      const roleNames = { 1: 'Admin', 2: 'Đoàn khoa', 3: 'Bí thư', 4: 'Đoàn viên' };
      console.log(`   - ${acc.email} | ${acc.tenNguoiDung} | Role: ${roleNames[acc.IdVaiTro]}`);
    });

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✓ Đã đóng kết nối database');
    }
  }
}

updateAllPasswords();
