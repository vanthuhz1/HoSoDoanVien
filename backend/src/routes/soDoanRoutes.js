const express = require('express');
const router = express.Router();
const { getAllSoDoan, updateTrangThai } = require('../controllers/soDoanController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.get('/', authenticateToken, authorizeRole([1, 2, 3]), getAllSoDoan);
router.put('/:maSoDoan/trang-thai', authenticateToken, authorizeRole([1, 2, 3]), updateTrangThai);

module.exports = router;
