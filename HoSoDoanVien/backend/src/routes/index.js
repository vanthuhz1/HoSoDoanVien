const express = require('express');
const router = express.Router();
const doanVienRoutes  = require('./doanVienRoutes');
const authRoutes      = require('./authRoutes');
const activityRoutes  = require('./activityRoutes');
const soDoanRoutes    = require('./soDoanRoutes');
const taiKhoanRoutes  = require('./taiKhoanRoutes');
const doanPhiRoutes   = require('./doanPhiRoutes');
const thongBaoRoutes  = require('./thongBaoRoutes');

const doanKhoaRoutes  = require('./doanKhoaRoutes');

router.use('/auth',       authRoutes);
router.use('/doan-vien',  doanVienRoutes);
router.use('/activities', activityRoutes);
router.use('/so-doan',    soDoanRoutes);
router.use('/tai-khoan',  taiKhoanRoutes);
router.use('/doan-phi',   doanPhiRoutes);
router.use('/thong-bao',  thongBaoRoutes);
router.use('/doan-khoa',  doanKhoaRoutes);


router.get('/health', (req, res) => {
  res.json({ success: true, message: 'API đang hoạt động', timestamp: new Date().toISOString() });
});

module.exports = router;
