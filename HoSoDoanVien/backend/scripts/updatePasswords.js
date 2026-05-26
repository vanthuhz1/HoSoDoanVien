/**
 * Script cập nhật mật khẩu hash cho tất cả tài khoản mẫu
 * Chạy: node scripts/updatePasswords.js
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { getConnection } = require('../src/config/database');

const accounts = [
  { email: 'admin@ute.vn',    password: '123456' },
  { email: 'khoa.tv@ute.vn',  password: '123456' },
  { email: 'an.nv@ute.vn',    password: '123456' },
  { email: 'dung.pm@ute.vn',  password: '123456' },
  { email: 'binh.tt@ute.vn',  password: '123456' },
  { email: 'cuong.lh@ute.vn', password: '123456' },
  { email: 'duy.vd@ute.vn',   password: '123456' },
];

async function main() {
  console.log('🔐 Đang cập nhật mật khẩu hash...\n');
  const pool = await getConnection();

  for (const acc of accounts) {
    const hash = await bcrypt.hash(acc.password, 10);
    const [result] = await pool.query(
      'UPDATE TaiKhoan SET matKhau = ? WHERE email = ?',
      [hash, acc.email]
    );
    if (result.affectedRows > 0) {
      console.log(`✓ Đã cập nhật: ${acc.email}`);
    } else {
      console.log(`⚠  Không tìm thấy email: ${acc.email}`);
    }
  }

  console.log('\n✅ Hoàn thành! Tất cả mật khẩu đã được hash.');
  console.log('📋 Thông tin đăng nhập:');
  console.log('   Email:    [email như trên]');
  console.log('   Mật khẩu: 123456\n');

  // Kiểm tra
  const [rows] = await pool.query(
    'SELECT email, tenNguoiDung, LEFT(matKhau,7) AS hash_prefix, IdVaiTro FROM TaiKhoan'
  );
  console.table(rows);
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Lỗi:', err.message);
  process.exit(1);
});
