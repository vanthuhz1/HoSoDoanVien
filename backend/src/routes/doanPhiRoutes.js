const express = require('express');
const router = express.Router();
const { getMyFees, paymentFee, getInvoice } = require('../controllers/doanPhiController');

// GET /api/doan-phi/my-fees - Lấy danh sách đoàn phí của đoàn viên
router.get('/my-fees', getMyFees);

// POST /api/doan-phi/payment - Thanh toán đoàn phí
router.post('/payment', paymentFee);

// GET /api/doan-phi/invoice/:id - Lấy thông tin hóa đơn
router.get('/invoice/:id', getInvoice);

module.exports = router;
