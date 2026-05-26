const express = require('express');
const router = express.Router();
const { getAll, getOne, create, update, remove } = require('../controllers/thongBaoController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const admin = [authenticateToken, authorizeRole([1, 2])];

router.get('/',       getAll);
router.get('/:id',    getOne);
router.post('/',      ...admin, create);
router.put('/:id',    ...admin, update);
router.delete('/:id', ...admin, remove);

module.exports = router;
