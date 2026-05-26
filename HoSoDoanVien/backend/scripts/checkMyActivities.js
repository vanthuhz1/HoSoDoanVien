const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { getConnection } = require('../src/config/database');

async function checkMyActivities() {
  try {
    const pool = await getConnection();
    
    console.log('=== KIỂM TRA DỮ LIỆU ĐĂNG KÝ HOẠT ĐỘNG ===\n');

    // 1. Kiểm tra tổng số đăng ký
    const [totalCount] = await pool.query('SELECT COUNT(*) as total FROM DanhSachDangKy');
    console.log(`📊 Tổng số đăng ký: ${totalCount[0].total}\n`);

    if (totalCount[0].total === 0) {
      console.log('⚠️  KHÔNG CÓ DỮ LIỆU ĐĂNG KÝ NÀO!\n');
      console.log('Hãy đăng ký hoạt động từ trang chủ để test.\n');
      process.exit(0);
    }

    // 2. Lấy danh sách đăng ký
    const [registrations] = await pool.query(`
      SELECT 
        dk.maDV,
        dv.hoTen,
        dk.idHD,
        hd.tenHD,
        dk.ngayDangKy,
        dk.trangThaiThamGia,
        dk.trangThaiCongDiem
      FROM DanhSachDangKy dk
      JOIN DoanVien dv ON dk.maDV = dv.maDV
      JOIN HoatDongDoan hd ON dk.idHD = hd.idHD
      ORDER BY dk.ngayDangKy DESC
      LIMIT 10
    `);

    console.log('📋 10 đăng ký gần nhất:\n');
    registrations.forEach((reg, idx) => {
      console.log(`${idx + 1}. ${reg.hoTen} (${reg.maDV})`);
      console.log(`   Hoạt động: ${reg.tenHD}`);
      console.log(`   Ngày đăng ký: ${reg.ngayDangKy}`);
      console.log(`   Trạng thái: ${reg.trangThaiThamGia} | ${reg.trangThaiCongDiem}`);
      console.log('');
    });

    // 3. Kiểm tra user cụ thể (lấy user đầu tiên)
    const [firstUser] = await pool.query(`
      SELECT tk.maDV, dv.hoTen, tk.email
      FROM TaiKhoan tk
      JOIN DoanVien dv ON tk.maDV = dv.maDV
      WHERE tk.IdVaiTro IN (3, 4)
      LIMIT 1
    `);

    if (firstUser.length > 0) {
      const testUser = firstUser[0];
      console.log(`\n🧪 Test với user: ${testUser.hoTen} (${testUser.email})`);
      console.log(`   maDV: ${testUser.maDV}\n`);

      const [userActivities] = await pool.query(`
        SELECT 
          dk.maDV, dk.trangThaiThamGia, dk.trangThaiCongDiem, dk.ngayDangKy,
          hd.idHD, hd.tenHD, hd.ngayToChuc, hd.diemHoatDong, hd.trangThaiHD, hd.diaDiem
        FROM DanhSachDangKy dk
        JOIN HoatDongDoan hd ON dk.idHD = hd.idHD
        WHERE dk.maDV = ?
        ORDER BY dk.ngayDangKy DESC
      `, [testUser.maDV]);

      console.log(`   Số hoạt động đã đăng ký: ${userActivities.length}\n`);
      
      if (userActivities.length > 0) {
        console.log('   Danh sách hoạt động:');
        userActivities.forEach((act, idx) => {
          console.log(`   ${idx + 1}. ${act.tenHD} - ${act.trangThaiThamGia}`);
        });
      } else {
        console.log('   ⚠️  User này chưa đăng ký hoạt động nào!');
      }
    }

    console.log('\n✅ Kiểm tra hoàn tất!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  }
}

checkMyActivities();
