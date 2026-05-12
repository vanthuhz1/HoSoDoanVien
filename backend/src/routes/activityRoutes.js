const express = require('express');
const router = express.Router();
const {
  getHomeActivities, getAllActivities, getActivityById, createActivity,
  updateTrangThai, getDangKy, duyetMinhChung, getMyActivities,
  registerActivity, unregisterActivity
} = require('../controllers/activityController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const auth = authenticateToken;
const admin = [authenticateToken, authorizeRole([1])];
const studentOrSecretary = [authenticateToken, authorizeRole([3, 4])]; // Bí thư và Đoàn viên

// ─── Routes cố định phải đặt TRƯỚC route dynamic /:id ───────────────────────

// Public: danh sách hoạt động trang chủ
router.get('/home', (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) return authenticateToken(req, res, next);
  next();
}, getHomeActivities);

// Protected: lịch sử hoạt động cá nhân (phải trước /:id)
router.get('/my-activities',          auth, getMyActivities);

// Protected (admin): tất cả hoạt động (phải trước /:id)
router.get('/all',                    auth, getAllActivities);

// Protected (admin): duyệt minh chứng (phải trước /:id)
router.put('/duyet-minh-chung',       ...admin, duyetMinhChung);

// ─── Route dynamic /:id ───────────────────────────────────────────────────────

// Public: chi tiết 1 hoạt động
router.get('/:id', (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) return authenticateToken(req, res, next);
  next();
}, getActivityById);

// Protected routes cho sinh viên/bí thư
router.post('/:id/register',          ...studentOrSecretary, registerActivity);
router.delete('/:id/unregister',      ...studentOrSecretary, unregisterActivity);

// Protected routes cho admin
router.post('/',                      ...admin, createActivity);
router.put('/:id/trang-thai',         ...admin, updateTrangThai);
router.get('/:id/dang-ky',            ...admin, getDangKy);

module.exports = router;
