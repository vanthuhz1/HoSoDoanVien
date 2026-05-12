const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'Nhoxthu23092005@',
    database: 'QUAN_LY_DOAN_VIEN',
    charset: 'utf8mb4'
  });

  // Cập nhật đúng tiếng Việt
  await conn.query(
    "UPDATE KhieuNai SET TrangThai='Chờ xử lý', GhiChu='Em đã đăng ký thi Olympic Tin học và có mặt nhưng máy quét QR bị lỗi, em chụp ảnh màn hình làm minh chứng' WHERE MaKhieuNai=5"
  );
  await conn.query(
    "UPDATE KhieuNai SET TrangThai='Chờ xử lý', GhiChu='Em hiến máu rồi nhưng hệ thống ghi nhận nhầm là vắng mặt, kính nhờ Khoa xem xét cộng điểm' WHERE MaKhieuNai=6"
  );
  await conn.query(
    "UPDATE KhieuNai SET TrangThai='Đã xử lý', GhiChu='Đã chấp nhận – cộng bù điểm hoạt động' WHERE MaKhieuNai=7"
  );
  await conn.query(
    "UPDATE KhieuNai SET TrangThai='Từ chối', GhiChu='Ảnh minh chứng mờ, không xác minh được sự có mặt của sinh viên' WHERE MaKhieuNai=8"
  );

  const [res] = await conn.query('SELECT MaKhieuNai, maDV, TrangThai, GhiChu FROM KhieuNai ORDER BY MaKhieuNai');
  console.log('✅ KhieuNai data:');
  res.forEach(r => console.log(`  [${r.MaKhieuNai}] ${r.maDV} | ${r.TrangThai} | ${r.GhiChu?.substring(0, 50)}`));
  await conn.end();
}

run().catch(console.error);
