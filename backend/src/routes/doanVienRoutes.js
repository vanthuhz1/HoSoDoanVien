const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { 
  getAllDoanVien, 
  getDoanVienById, 
  getDoanVienByChiDoan, 
  uploadAvatar,
  createDoanVien, // <-- Đã tích hợp hàm Thêm mới ngầm
  updateDoanVien  // <-- Đã tích hợp hàm Cập nhật ngầm
} = require('../controllers/doanVienController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Cấu hình lưu trữ tệp tin tải lên (Avatar) bằng Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Sử dụng maDV từ token người dùng để định danh file ảnh tránh trùng lặp
    const identifier = req.user?.maDV || 'admin';
    cb(null, 'avatar-' + identifier + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

/* ==========================================================================
   HỆ THỐNG ROUTES ĐỒNG BỘ VỚI FRONTEND CRUD
   ========================================================================== */

// 1. Lấy danh sách tất cả Đoàn viên (Phục vụ hiển thị bảng danh sách Admin)
router.get('/', authenticateToken, getAllDoanVien);

// 2. Thêm mới một Đoàn viên (Gọi từ Modal "Thêm mới" trên giao diện Admin)
router.post('/', authenticateToken, createDoanVien);

// 3. Cập nhật thông tin Đoàn viên theo mã định danh (Gọi từ Modal "Sửa" trên giao diện Admin)
router.put('/:id', authenticateToken, updateDoanVien);

// 4. Lấy danh sách Đoàn viên phân loại riêng theo từng Chi đoàn (Phục vụ bộ lọc Filter)
router.get('/chi-doan/:maChiDoan', authenticateToken, getDoanVienByChiDoan);

// 5. Cập nhật tải lên ảnh đại diện cho hồ sơ Đoàn viên
router.post('/avatar', authenticateToken, upload.single('avatar'), uploadAvatar);

// 6. Lấy chi tiết toàn bộ hồ sơ của một cá nhân Đoàn viên dựa theo mã maDV
router.get('/:id', authenticateToken, getDoanVienById);

module.exports = router;