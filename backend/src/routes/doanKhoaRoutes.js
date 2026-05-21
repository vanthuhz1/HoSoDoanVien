const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/doanKhoaController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const guard = [authenticateToken, authorizeRole([1, 2])]; // Admin hoặc Đoàn khoa (role 2)

router.get('/dashboard',        ...guard, ctrl.getDashboard);
router.get('/chart-data',       ...guard, ctrl.getChartData);
router.get('/hoat-dong',        ...guard, ctrl.getHoatDong);
router.post('/hoat-dong',       ...guard, ctrl.createHoatDong);
router.put('/hoat-dong/:idHD',  ...guard, ctrl.updateHoatDong);
router.delete('/hoat-dong/:idHD',...guard, ctrl.deleteHoatDong);
router.get('/hoat-dong-dang-mo',...guard, ctrl.getHoatDongDangMo);
router.get('/diem-danh/:idHD',  ...guard, ctrl.getDiemDanh);
router.put('/check-in',         ...guard, ctrl.checkIn);

// ==========================================
// CÁC ROUTE QUẢN LÝ CHI ĐOÀN VÀ ĐOÀN VIÊN
// ==========================================
router.get('/chi-doan',         ...guard, ctrl.getChiDoan);
router.post('/chi-doan',        ...guard, ctrl.createChiDoan);      // API Thêm mới
router.put('/chi-doan/:id',     ...guard, ctrl.updateChiDoan);      // API Sửa
router.delete('/chi-doan/:id',  ...guard, ctrl.deleteChiDoan);      // API Xóa/Khóa
router.put('/chi-doan/:maDV/chuc-vu', ...guard, ctrl.updateChucVu); // API Sửa chức vụ
// ==========================================

router.get('/tien-do',          ...guard, ctrl.getTienDo);
router.get('/khieu-nai',        ...guard, ctrl.getKhieuNai);
router.put('/khieu-nai/:id/chap-nhan', ...guard, ctrl.chapNhanKhieuNai);
router.put('/khieu-nai/:id/tu-choi',   ...guard, ctrl.tuChoiKhieuNai);

module.exports = router;