const express = require('express');
const router = express.Router();
const { getAllTaiKhoan, updateVaiTro, updateTrangThai, createTaiKhoan } = require('../controllers/taiKhoanController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.get('/',                          authenticateToken, authorizeRole([1]), getAllTaiKhoan);
router.post('/',                         authenticateToken, authorizeRole([1]), createTaiKhoan);
router.put('/:idUser/vai-tro',           authenticateToken, authorizeRole([1]), updateVaiTro);
router.put('/:idUser/trang-thai',        authenticateToken, authorizeRole([1]), updateTrangThai);

module.exports = router;
