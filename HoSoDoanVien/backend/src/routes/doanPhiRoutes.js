const express = require('express');
const router = express.Router();
const { 
  getMyFees, paymentFee, getInvoice,
  getDanhMuc, createDanhMuc, kichHoatDanhMuc, dongDanhMuc,
  getThongKeDoanPhi, getTienDoDoanPhi, getChiTietChiDoan,
  deleteDanhMuc
} = require('../controllers/doanPhiController');

// GET /api/doan-phi/my-fees - Lấy danh sách đoàn phí của đoàn viên
router.get('/my-fees', getMyFees);

// POST /api/doan-phi/payment - Thanh toán đoàn phí
router.post('/payment', paymentFee);

// GET /api/doan-phi/invoice/:id - Lấy thông tin hóa đơn
router.get('/invoice/:id', getInvoice);

// ==================== ADMIN QUẢN LÝ ĐOÀN PHÍ ====================
router.get('/danh-muc', getDanhMuc);
router.post('/danh-muc', createDanhMuc);
router.put('/danh-muc/:id/kich-hoat', kichHoatDanhMuc);
router.put('/danh-muc/:id/dong', dongDanhMuc);
router.delete('/danh-muc/:id', deleteDanhMuc);
router.get('/thong-ke', getThongKeDoanPhi);
router.get('/tien-do', getTienDoDoanPhi);
router.get('/chi-doan/:id', getChiTietChiDoan);

module.exports = router;
