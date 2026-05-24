const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
  console.log('🔍 Đang kiểm tra kết nối database...\n');
  
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'QUAN_LY_DOAN_VIEN',
  };

  console.log('📋 Thông tin kết nối:');
  console.log(`   Host: ${config.host}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   User: ${config.user}`);
  console.log(`   Password: ${'*'.repeat(config.password.length)}`);
  console.log(`   Database: ${config.database}\n`);

  try {
    // Test kết nối đến MySQL server (không chỉ định database)
    console.log('1️⃣ Kiểm tra kết nối MySQL server...');
    const connectionWithoutDB = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
    });
    console.log('   ✅ Kết nối MySQL server thành công!\n');

    // Kiểm tra database có tồn tại không
    console.log('2️⃣ Kiểm tra database có tồn tại...');
    const [databases] = await connectionWithoutDB.query(
      `SHOW DATABASES LIKE '${config.database}'`
    );
    
    if (databases.length === 0) {
      console.log(`   ❌ Database '${config.database}' KHÔNG tồn tại!`);
      console.log(`   💡 Bạn cần import file sqldoanphanmemscrip.sql\n`);
      await connectionWithoutDB.end();
      return;
    }
    console.log(`   ✅ Database '${config.database}' tồn tại!\n`);
    await connectionWithoutDB.end();

    // Test kết nối đến database cụ thể
    console.log('3️⃣ Kiểm tra kết nối đến database...');
    const connection = await mysql.createConnection(config);
    console.log('   ✅ Kết nối database thành công!\n');

    // Kiểm tra các bảng
    console.log('4️⃣ Kiểm tra các bảng trong database...');
    const [tables] = await connection.query('SHOW TABLES');
    
    if (tables.length === 0) {
      console.log('   ❌ Database rỗng, không có bảng nào!');
      console.log('   💡 Bạn cần import file sqldoanphanmemscrip.sql\n');
    } else {
      console.log(`   ✅ Tìm thấy ${tables.length} bảng:`);
      tables.forEach((table, index) => {
        const tableName = Object.values(table)[0];
        console.log(`      ${index + 1}. ${tableName}`);
      });
      console.log('');
    }

    // Kiểm tra một số bảng quan trọng
    console.log('5️⃣ Kiểm tra dữ liệu mẫu...');
    const importantTables = [
      { name: 'TaiKhoan', query: 'SELECT COUNT(*) as count FROM TaiKhoan' },
      { name: 'DoanVien', query: 'SELECT COUNT(*) as count FROM DoanVien' },
      { name: 'HoatDongDoan', query: 'SELECT COUNT(*) as count FROM HoatDongDoan' },
    ];

    for (const table of importantTables) {
      try {
        const [result] = await connection.query(table.query);
        const count = result[0].count;
        console.log(`   ✅ Bảng ${table.name}: ${count} bản ghi`);
      } catch (error) {
        console.log(`   ❌ Bảng ${table.name}: Không tồn tại hoặc lỗi`);
      }
    }

    await connection.end();
    
    console.log('\n🎉 KẾT LUẬN: Kết nối database hoàn toàn OK!');
    console.log('💡 Bạn có thể chạy backend bằng lệnh: npm start\n');

  } catch (error) {
    console.error('\n❌ LỖI KẾT NỐI:');
    console.error(`   ${error.message}\n`);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 GIẢI PHÁP:');
      console.log('   - MySQL server chưa được khởi động');
      console.log('   - Kiểm tra MySQL service đang chạy');
      console.log('   - Kiểm tra port 3306 có đang được sử dụng\n');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 GIẢI PHÁP:');
      console.log('   - Username hoặc password không đúng');
      console.log('   - Kiểm tra lại file .env\n');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('💡 GIẢI PHÁP:');
      console.log('   - Database không tồn tại');
      console.log('   - Import file sqldoanphanmemscrip.sql\n');
    }
  }
}

testConnection();
