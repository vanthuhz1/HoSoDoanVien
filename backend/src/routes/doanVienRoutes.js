const express = require('express');
const router = express.Router();
const { getAllDoanVien, getDoanVienById } = require('../controllers/doanVienController');

// Routes cho Đoàn viên
router.get('/', getAllDoanVien);
router.get('/:id', getDoanVienById);

module.exports = router;
