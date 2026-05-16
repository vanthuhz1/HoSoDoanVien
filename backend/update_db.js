const { getConnection } = require('./src/config/database');

(async () => {
  try {
    const pool = await getConnection();
    
    console.log('1. Cập nhật ENUM cho trangThaiHD...');
    await pool.query("ALTER TABLE HoatDongDoan MODIFY COLUMN trangThaiHD ENUM('Chờ duyệt', 'Sắp diễn ra', 'Đang mở', 'Đang diễn ra', 'Đã kết thúc', 'Từ chối', 'Bị từ chối')");
    
    console.log('2. Thêm cột lyDoTuChoi...');
    try {
      await pool.query('ALTER TABLE HoatDongDoan ADD COLUMN lyDoTuChoi TEXT NULL');
      console.log(' - Đã thêm cột lyDoTuChoi');
    } catch(e) {
      if(e.code === 'ER_DUP_FIELDNAME') console.log(' - Cột lyDoTuChoi đã tồn tại');
      else throw e;
    }

    console.log('3. Đặt DEFAULT 0 cho idHD...');
    await pool.query("ALTER TABLE HoatDongDoan ALTER COLUMN idHD SET DEFAULT '0'");

    console.log('4. Tạo Trigger trg_auto_idHD...');
    await pool.query("DROP TRIGGER IF EXISTS trg_auto_idHD");
    await pool.query(`
      CREATE TRIGGER trg_auto_idHD
      BEFORE INSERT ON HoatDongDoan
      FOR EACH ROW
      BEGIN
          DECLARE next_id INT;
          IF NEW.idHD = '0' OR NEW.idHD IS NULL THEN
              SELECT IFNULL(MAX(CAST(SUBSTRING(idHD, 3) AS UNSIGNED)), 0) + 1 INTO next_id FROM HoatDongDoan WHERE idHD LIKE 'HD%';
              SET NEW.idHD = CONCAT('HD', LPAD(next_id, 3, '0'));
          END IF;
      END;
    `);

    console.log('Hoàn thành cập nhật DB thành công!');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi khi cập nhật DB:', error);
    process.exit(1);
  }
})();
