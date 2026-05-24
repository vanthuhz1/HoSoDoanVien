const { getConnection } = require('../config/database');

// GET /api/doan-phi/my-fees - Lấy danh sách đoàn phí của đoàn viên
const getMyFees = async (req, res) => {
  try {
    const { maDV } = req.query;

    if (!maDV) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu mã đoàn viên'
      });
    }

    const pool = await getConnection();
    const sql = `
      SELECT 
        dp._idDoanPhi,
        dp._idMucDoanPhi,
        dp.maDV,
        dp.trangThai,
        dp.NgayHetHan,
        dp.phuongThucThanhToan,
        dp.maGiaoDich,
        dp.ThoiGianThanhToan,
        dmp.namHoc,
        dmp.soTien,
        dmp.trangThai as trangThaiMuc
      FROM DoanPhi dp
      INNER JOIN DanhMucDoanPhi dmp ON dp._idMucDoanPhi = dmp._idMucDoanPhi
      WHERE dp.maDV = ?
      ORDER BY dmp.namHoc DESC, dp.NgayHetHan DESC
    `;

    const [fees] = await pool.query(sql, [maDV]);

    return res.status(200).json({
      success: true,
      data: fees
    });

  } catch (error) {
    console.error('Error fetching fees:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách đoàn phí',
      error: error.message
    });
  }
};

// POST /api/doan-phi/payment - Thanh toán đoàn phí
const paymentFee = async (req, res) => {
  try {
    const { _idDoanPhi, phuongThucThanhToan, maGiaoDich } = req.body;

    if (!_idDoanPhi || !phuongThucThanhToan) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin thanh toán'
      });
    }

    const pool = await getConnection();
    const sql = `
      UPDATE DoanPhi 
      SET 
        trangThai = 'Đã nộp',
        phuongThucThanhToan = ?,
        maGiaoDich = ?,
        ThoiGianThanhToan = NOW()
      WHERE _idDoanPhi = ?
    `;

    await pool.query(sql, [phuongThucThanhToan, maGiaoDich || null, _idDoanPhi]);

    return res.status(200).json({
      success: true,
      message: 'Thanh toán đoàn phí thành công'
    });

  } catch (error) {
    console.error('Error processing payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xử lý thanh toán',
      error: error.message
    });
  }
};

// GET /api/doan-phi/invoice/:id - Lấy thông tin hóa đơn
const getInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const pool = await getConnection();
    const sql = `
      SELECT 
        dp._idDoanPhi,
        dp.maDV,
        dp.trangThai,
        dp.NgayHetHan,
        dp.phuongThucThanhToan,
        dp.maGiaoDich,
        dp.ThoiGianThanhToan,
        dmp.namHoc,
        dmp.soTien,
        dv.hoTen,
        dv.SDT,
        cd.tenChiDoan,
        k.tenKhoa,
        tk.email
      FROM DoanPhi dp
      INNER JOIN DanhMucDoanPhi dmp ON dp._idMucDoanPhi = dmp._idMucDoanPhi
      INNER JOIN DoanVien dv ON dp.maDV = dv.maDV
      LEFT JOIN ChiDoan cd ON dv.maChiDoan = cd.maChiDoan
      LEFT JOIN Khoa k ON cd.maKhoa = k.maKhoa
      LEFT JOIN TaiKhoan tk ON dv.maDV = tk.maDV
      WHERE dp._idDoanPhi = ?
    `;

    const [invoices] = await pool.query(sql, [id]);

    if (invoices.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hóa đơn'
      });
    }

    return res.status(200).json({
      success: true,
      data: invoices[0]
    });

  } catch (error) {
    console.error('Error fetching invoice:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin hóa đơn',
      error: error.message
    });
  }
};

// ==================== ADMIN QUẢN LÝ ĐOÀN PHÍ ====================

// GET /api/doan-phi/danh-muc
const getDanhMuc = async (req, res) => {
  try {
    const pool = await getConnection();
    const sql = `
      SELECT 
        dm.*,
        (SELECT COUNT(*) FROM DoanPhi dp WHERE dp._idMucDoanPhi = dm._idMucDoanPhi) AS tongSV,
        (SELECT COUNT(*) FROM DoanPhi dp WHERE dp._idMucDoanPhi = dm._idMucDoanPhi AND dp.trangThai = 'Đã nộp') AS daNop,
        (SELECT COUNT(*) FROM DoanPhi dp WHERE dp._idMucDoanPhi = dm._idMucDoanPhi AND dp.trangThai = 'Chưa nộp') AS chuaNop
      FROM DanhMucDoanPhi dm
      ORDER BY dm._idMucDoanPhi DESC
    `;
    const [rows] = await pool.query(sql);
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/doan-phi/danh-muc
const createDanhMuc = async (req, res) => {
  try {
    const { namHoc, soTien } = req.body;
    if (!namHoc || !soTien) return res.status(400).json({ success: false, message: 'Thiếu thông tin' });
    const pool = await getConnection();
    await pool.query(
      `INSERT INTO DanhMucDoanPhi (namHoc, soTien, trangThai) VALUES (?, ?, 'Chưa mở')`,
      [namHoc, soTien]
    );
    return res.status(201).json({ success: true, message: 'Tạo đợt thu thành công' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/doan-phi/danh-muc/:id/kich-hoat
const kichHoatDanhMuc = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    // 1. Lấy thông tin đợt thu
    const [[dm]] = await pool.query('SELECT namHoc FROM DanhMucDoanPhi WHERE _idMucDoanPhi = ?', [id]);
    if (!dm) return res.status(404).json({ success: false, message: 'Không tìm thấy đợt thu' });

    // 2. Tính ngày hết hạn (tạm tính là 31/05 năm sau của năm học)
    let namSau = new Date().getFullYear() + 1; 
    const match = dm.namHoc.match(/\d{4}-(\d{4})/);
    if (match) namSau = parseInt(match[1]);
    const ngayHetHan = `${namSau}-05-31`;

    // 3. Insert DoanPhi cho tất cả đoàn viên đang sinh hoạt (nếu chưa có)
    const sqlInsert = `
      INSERT INTO DoanPhi (_idMucDoanPhi, maDV, trangThai, NgayHetHan)
      SELECT ?, maDV, 'Chưa nộp', ?
      FROM DoanVien
      WHERE trangThaiSH = 'Đang sinh hoạt'
      AND maDV NOT IN (
        SELECT maDV FROM DoanPhi WHERE _idMucDoanPhi = ?
      )
    `;
    await pool.query(sqlInsert, [id, ngayHetHan, id]);

    // 4. Đổi trạng thái đợt thu
    await pool.query(`UPDATE DanhMucDoanPhi SET trangThai = 'Đang mở thu' WHERE _idMucDoanPhi = ?`, [id]);

    return res.status(200).json({ success: true, message: 'Kích hoạt đợt thu thành công' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/doan-phi/danh-muc/:id/dong
const dongDanhMuc = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();
    await pool.query(`UPDATE DanhMucDoanPhi SET trangThai = 'Đã đóng lại' WHERE _idMucDoanPhi = ?`, [id]);
    return res.status(200).json({ success: true, message: 'Đã đóng đợt thu' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/doan-phi/thong-ke
const getThongKeDoanPhi = async (req, res) => {
  try {
    const { idMucDoanPhi } = req.query;
    if (!idMucDoanPhi) return res.status(400).json({ success: false, message: 'Thiếu idMucDoanPhi' });
    const pool = await getConnection();
    
    const [[dm]] = await pool.query('SELECT soTien FROM DanhMucDoanPhi WHERE _idMucDoanPhi = ?', [idMucDoanPhi]);
    const soTien = dm ? dm.soTien : 0;

    const [[stats]] = await pool.query(`
      SELECT 
        COUNT(*) as tong,
        SUM(CASE WHEN trangThai = 'Đã nộp' THEN 1 ELSE 0 END) as daNop,
        SUM(CASE WHEN trangThai = 'Chưa nộp' THEN 1 ELSE 0 END) as chuaNop
      FROM DoanPhi WHERE _idMucDoanPhi = ?
    `, [idMucDoanPhi]);

    return res.status(200).json({ 
      success: true, 
      data: {
        tong: stats.tong || 0,
        daNop: stats.daNop || 0,
        chuaNop: stats.chuaNop || 0,
        tongThuDuoc: (stats.daNop || 0) * soTien
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/doan-phi/tien-do
const getTienDoDoanPhi = async (req, res) => {
  try {
    const { idMucDoanPhi } = req.query;
    if (!idMucDoanPhi) return res.status(400).json({ success: false, message: 'Thiếu idMucDoanPhi' });
    const pool = await getConnection();
    
    const sql = `
      SELECT 
        cd.maChiDoan, cd.tenChiDoan, k.tenKhoa,
        COUNT(dp.maDV) as tongSV,
        SUM(CASE WHEN dp.trangThai = 'Đã nộp' THEN 1 ELSE 0 END) as daNop
      FROM ChiDoan cd
      LEFT JOIN Khoa k ON cd.maKhoa = k.maKhoa
      LEFT JOIN DoanVien dv ON cd.maChiDoan = dv.maChiDoan
      LEFT JOIN DoanPhi dp ON dv.maDV = dp.maDV AND dp._idMucDoanPhi = ?
      GROUP BY cd.maChiDoan
      HAVING tongSV > 0
      ORDER BY cd.tenChiDoan ASC
    `;
    const [rows] = await pool.query(sql, [idMucDoanPhi]);
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/doan-phi/chi-doan/:id
const getChiTietChiDoan = async (req, res) => {
  try {
    const { id } = req.params; // maChiDoan
    const { idMucDoanPhi } = req.query;
    if (!idMucDoanPhi) return res.status(400).json({ success: false, message: 'Thiếu idMucDoanPhi' });
    
    const pool = await getConnection();
    const sql = `
      SELECT 
        dv.maDV, dv.hoTen,
        dp.trangThai, dp.ThoiGianThanhToan, dp.phuongThucThanhToan
      FROM DoanVien dv
      LEFT JOIN DoanPhi dp ON dv.maDV = dp.maDV AND dp._idMucDoanPhi = ?
      WHERE dv.maChiDoan = ? AND dp._idDoanPhi IS NOT NULL
      ORDER BY dv.hoTen ASC
    `;
    const [rows] = await pool.query(sql, [idMucDoanPhi, id]);
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/doan-phi/danh-muc/:id
const deleteDanhMuc = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    // 1. Kiểm tra đợt thu tồn tại
    const [[dm]] = await pool.query(
      'SELECT _idMucDoanPhi, namHoc FROM DanhMucDoanPhi WHERE _idMucDoanPhi = ?',
      [id]
    );
    if (!dm) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đợt thu' });
    }

    // 2. Kiểm tra xem có sinh viên nào đã nộp không
    const [[paid]] = await pool.query(
      `SELECT COUNT(*) AS soLuong FROM DoanPhi
       WHERE _idMucDoanPhi = ? AND trangThai = 'Đã nộp'`,
      [id]
    );

    if (paid.soLuong > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa đợt thu "${dm.namHoc}" vì đã có ${paid.soLuong} sinh viên nộp tiền. Chỉ được xóa khi 100% sinh viên chưa nộp.`
      });
    }

    // 3. Xóa các bản ghi DoanPhi trước (nếu có – trạng thái 'Chưa nộp')
    await pool.query('DELETE FROM DoanPhi WHERE _idMucDoanPhi = ?', [id]);

    // 4. Xóa DanhMucDoanPhi
    await pool.query('DELETE FROM DanhMucDoanPhi WHERE _idMucDoanPhi = ?', [id]);

    return res.status(200).json({ success: true, message: `Đã xóa đợt thu "${dm.namHoc}" thành công` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMyFees,
  paymentFee,
  getInvoice,
  getDanhMuc,
  createDanhMuc,
  kichHoatDanhMuc,
  dongDanhMuc,
  getThongKeDoanPhi,
  getTienDoDoanPhi,
  getChiTietChiDoan,
  deleteDanhMuc
};
