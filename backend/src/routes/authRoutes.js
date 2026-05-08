const express = require('express');
const router = express.Router();
const { 
  login, 
  forgotPassword, 
  resetPassword,
  verifyToken 
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Public routes
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected route
router.get('/verify', authenticateToken, verifyToken);

module.exports = router;
