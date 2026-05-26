/**
 * Script tạo hash bcrypt cho mật khẩu mẫu và tạo câu lệnh SQL UPDATE
 * Chạy: node scripts/hashPasswords.js
 * Mật khẩu mặc định tất cả tài khoản: 123456
 */
const bcrypt = require('bcryptjs');

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
  console.log('-- =============================================');
  console.log('-- CẬP NHẬT MẬT KHẨU ĐÃ HASH (bcrypt, rounds=10)');
  console.log('-- Mật khẩu mặc định: 123456');
  console.log('-- Chạy các lệnh này trong MySQL sau khi import schema');
  console.log('-- =============================================\n');
  console.log('USE QUAN_LY_DOAN_VIEN;\n');

  for (const acc of accounts) {
    const hash = await bcrypt.hash(acc.password, 10);
    console.log(`UPDATE TaiKhoan SET matKhau = '${hash}' WHERE email = '${acc.email}';`);
  }

  console.log('\n-- Xác nhận kết quả:');
  console.log("SELECT email, LEFT(matKhau,7) AS hash_prefix, IdVaiTro FROM TaiKhoan;");
}

main().catch(console.error);
