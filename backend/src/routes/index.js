const express = require('express');
const router = express.Router();
const doanVienRoutes = require('./doanVienRoutes');
const authRoutes = require('./authRoutes');

// Auth routes
router.use('/auth', authRoutes);

// Doan vien routes
router.use('/doan-vien', doanVienRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API đang hoạt động',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
