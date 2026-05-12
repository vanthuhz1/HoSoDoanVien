const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getAllDoanVien, getDoanVienById, getDoanVienByChiDoan, uploadAvatar } = require('../controllers/doanVienController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Cấu hình multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + req.user.maDV + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Routes cho Đoàn viên (yêu cầu đăng nhập)
router.get('/', authenticateToken, getAllDoanVien);
router.get('/chi-doan/:maChiDoan', authenticateToken, getDoanVienByChiDoan);
router.post('/avatar', authenticateToken, upload.single('avatar'), uploadAvatar);
router.get('/:id', authenticateToken, getDoanVienById);

module.exports = router;
