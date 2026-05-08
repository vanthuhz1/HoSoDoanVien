const express = require('express');
const cors = require('cors');
require('dotenv').config();

const routes = require('./routes');
const { getConnection } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'API Quản lý Đoàn viên',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      doanVien: '/api/doan-vien'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Đã xảy ra lỗi server',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`\n🚀 Server đang chạy tại http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV}`);
  
  // Test database connection
  try {
    await getConnection();
  } catch (error) {
    console.error('⚠️  Cảnh báo: Không thể kết nối database');
  }
});
