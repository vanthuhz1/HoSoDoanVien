const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function addSampleActivities() {
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

    // Tắt foreign key check tạm thời
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Xóa dữ liệu cũ
    await connection.query('DELETE FROM KhieuNai');
    await connection.query('DELETE FROM DanhSachDangKy');
    await connection.query('DELETE FROM HoatDongDoan');
    
    // Bật lại foreign key check
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('✓ Đã xóa dữ liệu hoạt động cũ\n');

    // Thêm hoạt động mẫu
    const activities = [
      {
        idHD: 'HD001',
        tenHD: 'Chiến dịch Mùa hè xanh 2026',
        moTa: 'Tham gia các hoạt động tình nguyện tại vùng cao, giúp đỡ bà con dân tộc thiểu số',
        ngayToChuc: '2026-06-15 08:00:00',
        diaDiem: 'Tỉnh Kon Tum',
        soLuongMAX: 50,
        diemHoatDong: 10,
        trangThaiHD: 'Đang mở',
        donViToChuc: 'Đoàn trường',
        maKhoa: 'CNTT'
      },
      {
        idHD: 'HD002',
        tenHD: 'Hiến máu nhân đạo',
        moTa: 'Chương trình hiến máu tình nguyện "Giọt hồng yêu thương"',
        ngayToChuc: '2026-05-20 07:00:00',
        diaDiem: 'Hội trường A - Trường ĐHSPKT',
        soLuongMAX: 100,
        diemHoatDong: 5,
        trangThaiHD: 'Đang mở',
        donViToChuc: 'Đoàn trường',
        maKhoa: null
      },
      {
        idHD: 'HD003',
        tenHD: 'Ngày hội Việc làm 2026',
        moTa: 'Gặp gỡ các doanh nghiệp, tìm hiểu cơ hội việc làm và thực tập',
        ngayToChuc: '2026-05-25 08:30:00',
        diaDiem: 'Sân vận động trường',
        soLuongMAX: 200,
        diemHoatDong: 3,
        trangThaiHD: 'Đang mở',
        donViToChuc: 'Phòng Công tác sinh viên',
        maKhoa: null
      },
      {
        idHD: 'HD004',
        tenHD: 'Workshop: Kỹ năng lập trình Web',
        moTa: 'Học cách xây dựng website với React và Node.js từ cơ bản đến nâng cao',
        ngayToChuc: '2026-05-18 14:00:00',
        diaDiem: 'Phòng Lab 301 - Khoa CNTT',
        soLuongMAX: 40,
        diemHoatDong: 4,
        trangThaiHD: 'Đang mở',
        donViToChuc: 'Khoa CNTT',
        maKhoa: 'CNTT'
      },
      {
        idHD: 'HD005',
        tenHD: 'Giải bóng đá Sinh viên 2026',
        moTa: 'Giải bóng đá giao hữu giữa các khoa, tăng cường tinh thần đoàn kết',
        ngayToChuc: '2026-05-22 15:00:00',
        diaDiem: 'Sân bóng trường',
        soLuongMAX: 80,
        diemHoatDong: 3,
        trangThaiHD: 'Đang mở',
        donViToChuc: 'Đoàn trường',
        maKhoa: null
      },
      {
        idHD: 'HD006',
        tenHD: 'Tọa đàm: Khởi nghiệp cho sinh viên',
        moTa: 'Gặp gỡ các doanh nhân thành công, chia sẻ kinh nghiệm khởi nghiệp',
        ngayToChuc: '2026-05-28 09:00:00',
        diaDiem: 'Hội trường B',
        soLuongMAX: 150,
        diemHoatDong: 4,
        trangThaiHD: 'Đang mở',
        donViToChuc: 'Khoa Kinh tế',
        maKhoa: 'KT'
      },
      {
        idHD: 'HD007',
        tenHD: 'Chương trình "Tiếp sức mùa thi"',
        moTa: 'Hỗ trợ thí sinh và phụ huynh trong kỳ thi tốt nghiệp THPT',
        ngayToChuc: '2026-06-25 06:00:00',
        diaDiem: 'Các điểm thi tại Đà Nẵng',
        soLuongMAX: 60,
        diemHoatDong: 8,
        trangThaiHD: 'Đang mở',
        donViToChuc: 'Đoàn trường',
        maKhoa: null
      },
      {
        idHD: 'HD008',
        tenHD: 'Cuộc thi "Ý tưởng sáng tạo"',
        moTa: 'Thi thiết kế sản phẩm công nghệ giải quyết vấn đề thực tiễn',
        ngayToChuc: '2026-06-01 08:00:00',
        diaDiem: 'Phòng hội thảo C',
        soLuongMAX: 30,
        diemHoatDong: 6,
        trangThaiHD: 'Đang mở',
        donViToChuc: 'Khoa CNTT',
        maKhoa: 'CNTT'
      }
    ];

    for (const activity of activities) {
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
    }

    console.log(`✅ Đã thêm ${activities.length} hoạt động mẫu\n`);

    // Hiển thị danh sách
    const [rows] = await connection.query(
      'SELECT idHD, tenHD, trangThaiHD, soLuongMAX, diemHoatDong FROM HoatDongDoan ORDER BY ngayToChuc'
    );

    console.log('📋 Danh sách hoạt động:');
    rows.forEach(row => {
      console.log(`   - [${row.idHD}] ${row.tenHD} | ${row.trangThaiHD} | Max: ${row.soLuongMAX} | Điểm: ${row.diemHoatDong}`);
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

addSampleActivities();
