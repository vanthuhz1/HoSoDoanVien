const jwt = require('jsonwebtoken');

// Middleware xác thực JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Không tìm thấy token xác thực'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Token không hợp lệ hoặc đã hết hạn'
      });
    }

    req.user = user; // { idUser, IdVaiTro }
    next();
  });
};

// Middleware kiểm tra role - nhận array hoặc spread
const authorizeRole = (...args) => {
  // Hỗ trợ cả authorizeRole([1,2]) và authorizeRole(1,2)
  const allowedRoles = args.flat();
  return (req, res, next) => {
    const userRole = parseInt(req.user.IdVaiTro);
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập tài nguyên này'
      });
    }
    next();
  };
};

module.exports = { authenticateToken, authorizeRole };
