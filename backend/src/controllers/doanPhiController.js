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

module.exports = {
  getMyFees,
  paymentFee,
  getInvoice
};
