const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function cleanupActivities() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'QUAN_LY_DOAN_VIEN',
    });

    console.log('✓ Kết nối database thành công\n');

    // Tắt foreign key check
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Xóa tất cả dữ liệu hoạt động
    await connection.query('DELETE FROM KhieuNai');
    await connection.query('DELETE FROM DanhSachDangKy');
    await connection.query('DELETE FROM HoatDongDoan');
    
    // Bật lại foreign key check
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('✓ Đã xóa tất cả hoạt động cũ\n');

    // Thêm CHỈ 1 hoạt động "Đang mở"
    const activity = {
      idHD: 'HD001',
      tenHD: 'Chiến dịch Mùa hè xanh 2026',
      moTa: 'Tham gia các hoạt động tình nguyện tại vùng cao, giúp đỡ bà con dân tộc thiểu số. Đây là hoạt động ý nghĩa giúp sinh viên rèn luyện kỹ năng sống và tinh thần tình nguyện.',
      ngayToChuc: '2026-06-15 08:00:00',
      diaDiem: 'Tỉnh Kon Tum',
      soLuongMAX: 50,
      diemHoatDong: 10,
      trangThaiHD: 'Đang mở',
      donViToChuc: 'Đoàn trường',
      maKhoa: null
    };

    await connection.query(
      `INSERT INTO HoatDongDoan 
      (idHD, tenHD, moTa, ngayToChuc, diaDiem, soLuongMAX, soLuongDaDK, diemHoatDong, trangThaiHD, donViToChuc, maKhoa)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
      [
        activity.idHD,
        activity.tenHD,
        activity.moTa,
        activity.ngayToChuc,
        activity.diaDiem,
        activity.soLuongMAX,
        activity.diemHoatDong,
        activity.trangThaiHD,
        activity.donViToChuc,
        activity.maKhoa
      ]
    );

    console.log('✅ Đã thêm 1 hoạt động "Đang mở"\n');

    // Hiển thị thông tin
    const [rows] = await connection.query(
      'SELECT idHD, tenHD, trangThaiHD, soLuongMAX, diemHoatDong, ngayToChuc FROM HoatDongDoan'
    );

    console.log('📋 Hoạt động hiện có:');
    rows.forEach(row => {
      console.log(`   - [${row.idHD}] ${row.tenHD}`);
      console.log(`     Trạng thái: ${row.trangThaiHD} | Max: ${row.soLuongMAX} | Điểm: ${row.diemHoatDong}`);
      console.log(`     Ngày: ${new Date(row.ngayToChuc).toLocaleDateString('vi-VN')}\n`);
    });

    console.log('✅ Hoàn thành! Giờ trang chủ chỉ hiển thị 1 hoạt động duy nhất.');

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✓ Đã đóng kết nối database');
    }
  }
}

cleanupActivities();
