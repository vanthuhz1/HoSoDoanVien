const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const importSql = async () => {
  // Kiểm tra xem đã cấu hình biến môi trường chưa
  if (!process.env.DB_HOST || process.env.DB_HOST === 'localhost') {
    console.error('✗ Lỗi: Vui lòng cấu hình các thông số kết nối Database Aiven vào file backend/.env trước!');
    process.exit(1);
  }

  console.log('🔄 Đang kết nối tới Database Aiven tại:', process.env.DB_HOST);

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: 'defaultdb', // Kết nối tạm vào defaultdb trước
      multipleStatements: true, // Cho phép chạy nhiều câu lệnh SQL cùng lúc
      ssl: {
        rejectUnauthorized: false // Bắt buộc cho Aiven MySQL
      }
    });

    console.log('✓ Kết nối thành công!');
    
    // Đọc file SQL
    const sqlPath = path.join(__dirname, '../../sqldoanphanmemscrip.sql');
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`Không tìm thấy file SQL tại đường dẫn: ${sqlPath}`);
    }
    
    console.log('🔄 Đang đọc file SQL...');
    let sql = fs.readFileSync(sqlPath, 'utf8');

    // Loại bỏ các lệnh tạo/xóa database để dùng trực tiếp defaultdb của Aiven (tránh lỗi cần quyền SUPER)
    console.log('🔄 Đang tối ưu hóa file SQL cho môi trường Cloud...');
    sql = sql
      .replace(/DROP DATABASE IF EXISTS QUAN_LY_DOAN_VIEN;/gi, '')
      .replace(/CREATE DATABASE QUAN_LY_DOAN_VIEN[\s\S]*?;/gi, '')
      .replace(/USE QUAN_LY_DOAN_VIEN;/gi, '');

    // Cắt bỏ phần BƯỚC 4 tạo event tự động ở cuối file do Aiven/mysql2 không hỗ trợ
    const eventIndex = sql.indexOf('-- BƯỚC 4: TẠO EVENT');
    if (eventIndex !== -1) {
      sql = sql.substring(0, eventIndex);
      console.log('✓ Đã lược bỏ các lệnh tạo Event tự động ở cuối file.');
    }

    console.log('🔄 Đang dọn dẹp các bảng cũ trên Aiven nếu có...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');
    await connection.query('DROP TABLE IF EXISTS NhatKiHeThong, KhieuNai, DoanPhi, DanhMucDoanPhi, SoDoan, TieuSu, DanhSachDangKy, HoatDongDoan, TaiKhoan, VaiTro, DoanVien, ChiDoan, Khoa, ThongBao;');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('✓ Dọn dẹp sạch sẽ database!');

    console.log('🔄 Đang import cấu trúc bảng và dữ liệu mẫu lên Aiven (quá trình này mất khoảng 5-10 giây)...');
    await connection.query(sql);
    
    console.log('🎉 Xong! Đã import toàn bộ cơ sở dữ liệu thành công lên Aiven!');
    await connection.end();
  } catch (error) {
    console.error('✗ Đã xảy ra lỗi trong quá trình import:', error.message);
  }
};

importSql();
