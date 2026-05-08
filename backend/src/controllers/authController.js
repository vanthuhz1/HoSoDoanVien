const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getConnection } = require('../config/database');
const { sendResetPasswordEmail } = require('../utils/emailService');

// Store OTP temporarily (in production, use Redis)
const otpStore = new Map();

// 1. LOGIN
const login = async (req, res) => {
  try {
    const { tenNguoiDung, matKhau } = req.body;

    // Validation
    if (!tenNguoiDung || !matKhau) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin'
      });
    }

    const pool = await getConnection();
    
    // Check user exists
    const [users] = await pool.query(
      'SELECT idUser, tenNguoiDung, matKhau, Email, IdVaiTro, trangThai FROM TaiKhoan WHERE tenNguoiDung = ?',
      [tenNguoiDung]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Tên đăng nhập hoặc mật khẩu không đúng'
      });
    }

    const user = users[0];

    // Check account status
    if (user.trangThai !== 1 && user.trangThai !== '1' && user.trangThai !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên'
      });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(matKhau, user.matKhau);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Tên đăng nhập hoặc mật khẩu không đúng'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        idUser: user.idUser, 
        IdVaiTro: user.IdVaiTro,
        tenNguoiDung: user.tenNguoiDung
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    // Return success
    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        token,
        user: {
          idUser: user.idUser,
          tenNguoiDung: user.tenNguoiDung,
          email: user.Email,
          role: user.IdVaiTro,
          roleName: user.IdVaiTro === 2 ? 'Bí thư chi đoàn' : 'Đoàn viên'
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đăng nhập',
      error: error.message
    });
  }
};

// 2. FORGOT PASSWORD - Request OTP
const forgotPassword = async (req, res) => {
  try {
    const { emailOrUsername } = req.body;

    if (!emailOrUsername) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email hoặc tên đăng nhập'
      });
    }

    const pool = await getConnection();
    
    // Find user by email or username
    const [users] = await pool.query(
      'SELECT idUser, tenNguoiDung, Email FROM TaiKhoan WHERE Email = ? OR tenNguoiDung = ?',
      [emailOrUsername, emailOrUsername]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản với thông tin này'
      });
    }

    const user = users[0];

    if (!user.Email) {
      return res.status(400).json({
        success: false,
        message: 'Tài khoản này chưa có email. Vui lòng liên hệ quản trị viên'
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP with expiration (15 minutes)
    otpStore.set(user.Email, {
      otp,
      idUser: user.idUser,
      expiresAt: Date.now() + 15 * 60 * 1000 // 15 minutes
    });

    // Send email
    const emailSent = await sendResetPasswordEmail(user.Email, otp, user.tenNguoiDung);

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Không thể gửi email. Vui lòng thử lại sau'
      });
    }

    res.json({
      success: true,
      message: 'Mã OTP đã được gửi đến email của bạn',
      data: {
        email: user.Email.replace(/(.{2})(.*)(@.*)/, '$1***$3') // Mask email
      }
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xử lý yêu cầu',
      error: error.message
    });
  }
};

// 3. RESET PASSWORD - Verify OTP and update password
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    // Validation
    if (!email || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu xác nhận không khớp'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự'
      });
    }

    // Check OTP
    const otpData = otpStore.get(email);

    if (!otpData) {
      return res.status(400).json({
        success: false,
        message: 'Mã OTP không hợp lệ hoặc đã hết hạn'
      });
    }

    if (otpData.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Mã OTP không đúng'
      });
    }

    if (Date.now() > otpData.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({
        success: false,
        message: 'Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    const pool = await getConnection();
    await pool.query(
      'UPDATE TaiKhoan SET matKhau = ? WHERE idUser = ?',
      [hashedPassword, otpData.idUser]
    );

    // Remove OTP from store
    otpStore.delete(email);

    res.json({
      success: true,
      message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đặt lại mật khẩu',
      error: error.message
    });
  }
};

// 4. VERIFY TOKEN (Optional - for protected routes)
const verifyToken = async (req, res) => {
  try {
    // Token already verified by middleware
    const pool = await getConnection();
    const [users] = await pool.query(
      'SELECT idUser, tenNguoiDung, Email, IdVaiTro FROM TaiKhoan WHERE idUser = ?',
      [req.user.idUser]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Người dùng không tồn tại'
      });
    }

    res.json({
      success: true,
      data: {
        user: users[0]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi xác thực token',
      error: error.message
    });
  }
};

module.exports = {
  login,
  forgotPassword,
  resetPassword,
  verifyToken
};
