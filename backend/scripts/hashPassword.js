const bcrypt = require('bcryptjs');

// Hash password "123456"
const password = '123456';

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  console.log('Password:', password);
  console.log('Hashed:', hash);
  console.log('\nSQL Update:');
  console.log(`UPDATE TaiKhoan SET matKhau = '${hash}' WHERE tenNguoiDung IN ('admin', '23115053122241', '23115053122242', '23115053122244', '23115053122245');`);
});
