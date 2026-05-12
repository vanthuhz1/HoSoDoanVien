const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getConnection } = require('../config/database');
const { sendResetPasswordEmail } = require('../utils/emailService');

// OTP store in-memory (production: dùng Redis)
const otpStore = new Map();

// 4 vai trò theo DB mới
const ROLE_NAMES = {
  1: 'Admin',
  2: 'Đoàn khoa',
  3: 'Bí thư',
  4: 'Đoàn viên'
};

// ============================================================
// 1. LOGIN – đăng nhập bằng EMAIL + MẬT KHẨU
// ============================================================
const login = async (req, res) => {
  try {
    const { email, matKhau } = req.body;

    if (!email || !matKhau) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email và mật khẩu'
      });
    }

    const pool = await getConnection();

    // Tìm tài khoản theo email (trường đăng nhập mới)
    const [users] = await pool.query(
      `SELECT
         tk.idUser,
         tk.email,
         tk.tenNguoiDung,
         tk.matKhau,
         tk.IdVaiTro,
         tk.trangThai,
         tk.maDV,
         dv.hoTen,
         dv.maChiDoan,
         dv.chucVu,
         dv.trangThaiSH,
         vt.tenVaiTro
       FROM TaiKhoan tk
       LEFT JOIN DoanVien dv ON tk.maDV = dv.maDV
       LEFT JOIN VaiTro   vt ON tk.IdVaiTro = vt.idVaiTro
       WHERE tk.email = ?`,
      [email.trim().toLowerCase()]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    const user = users[0];

    // Kiểm tra trạng thái tài khoản
    if (user.trangThai !== 1 && user.trangThai !== '1') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên'
      });
    }

    // So sánh mật khẩu (bcrypt)
    const isPasswordValid = await bcrypt.compare(matKhau, user.matKhau);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    // Tạo JWT token
    const token = jwt.sign(
      {
        idUser:       user.idUser,
        IdVaiTro:     user.IdVaiTro,
        email:        user.email,
        tenNguoiDung: user.tenNguoiDung,
        maDV:         user.maDV
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    return res.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        token,
        user: {
          idUser:       user.idUser,
          email:        user.email,
          tenNguoiDung: user.tenNguoiDung,
          hoTen:        user.hoTen || user.tenNguoiDung,
          maDV:         user.maDV,
          maChiDoan:    user.maChiDoan,
          chucVu:       user.chucVu,
          trangThaiSH:  user.trangThaiSH,
          role:         user.IdVaiTro,
          roleName:     user.tenVaiTro || ROLE_NAMES[user.IdVaiTro] || 'Không xác định'
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi đăng nhập',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================================
// 2. FORGOT PASSWORD – gửi OTP về email
// ============================================================
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập địa chỉ email'
      });
    }

    const pool = await getConnection();

    const [users] = await pool.query(
      `SELECT tk.idUser, tk.email, tk.tenNguoiDung, dv.hoTen
       FROM TaiKhoan tk
       LEFT JOIN DoanVien dv ON tk.maDV = dv.maDV
       WHERE tk.email = ?`,
      [email.trim().toLowerCase()]
    );

    if (users.length === 0) {
      // Bảo mật: không tiết lộ email có tồn tại hay không
      return res.status(200).json({
        success: true,
        message: 'Nếu email tồn tại trong hệ thống, mã OTP đã được gửi'
      });
    }

    const user = users[0];
    const displayName = user.hoTen || user.tenNguoiDung;

    // Tạo OTP 6 chữ số
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Lưu OTP (15 phút)
    otpStore.set(user.email, {
      otp,
      idUser:    user.idUser,
      expiresAt: Date.now() + 15 * 60 * 1000
    });

    // Gửi email
    const sent = await sendResetPasswordEmail(user.email, otp, displayName);
    if (!sent) {
      otpStore.delete(user.email);
      return res.status(500).json({
        success: false,
        message: 'Không thể gửi email. Vui lòng thử lại sau'
      });
    }

    return res.json({
      success: true,
      message: 'Mã OTP đã được gửi đến email của bạn',
      data: {
        maskedEmail: user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
        realEmail:   user.email   // frontend cần để gọi resetPassword
      }
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi xử lý yêu cầu',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================================
// 3. RESET PASSWORD – xác thực OTP và đổi mật khẩu
// ============================================================
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (!email || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Mật khẩu xác nhận không khớp' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    const otpData = otpStore.get(email);
    if (!otpData) {
      return res.status(400).json({ success: false, message: 'Mã OTP không hợp lệ hoặc đã hết hạn' });
    }
    if (Date.now() > otpData.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ success: false, message: 'Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới' });
    }
    if (otpData.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Mã OTP không đúng' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const pool = await getConnection();
    await pool.query(
      'UPDATE TaiKhoan SET matKhau = ? WHERE idUser = ?',
      [hashedPassword, otpData.idUser]
    );

    otpStore.delete(email);

    return res.json({ success: true, message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại' });

  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi đặt lại mật khẩu',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================================
// 4. VERIFY TOKEN – kiểm tra token còn hạn
// ============================================================
const verifyToken = async (req, res) => {
  try {
    const pool = await getConnection();
    const [users] = await pool.query(
      `SELECT
         tk.idUser, tk.email, tk.tenNguoiDung, tk.IdVaiTro, tk.maDV,
         dv.hoTen, dv.maChiDoan, dv.chucVu, dv.trangThaiSH,
         vt.tenVaiTro
       FROM TaiKhoan tk
       LEFT JOIN DoanVien dv ON tk.maDV = dv.maDV
       LEFT JOIN VaiTro   vt ON tk.IdVaiTro = vt.idVaiTro
       WHERE tk.idUser = ?`,
      [req.user.idUser]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
    }

    const u = users[0];
    return res.json({
      success: true,
      data: {
        user: {
          idUser:       u.idUser,
          email:        u.email,
          tenNguoiDung: u.tenNguoiDung,
          hoTen:        u.hoTen || u.tenNguoiDung,
          maDV:         u.maDV,
          maChiDoan:    u.maChiDoan,
          chucVu:       u.chucVu,
          trangThaiSH:  u.trangThaiSH,
          role:         u.IdVaiTro,
          roleName:     u.tenVaiTro || ROLE_NAMES[u.IdVaiTro] || 'Không xác định'
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi xác thực token',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = { login, forgotPassword, resetPassword, verifyToken };
