const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendResetPasswordEmail = async (email, otp, userName) => {
  try {
    const mailOptions = {
      from: `"Hệ thống Quản lý Đoàn viên" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Yêu cầu đặt lại mật khẩu',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1976d2, #2196f3); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1>🔐 Đặt lại mật khẩu</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Xin chào <strong>${userName}</strong>,</p>
            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
            <div style="background: white; border: 2px dashed #1976d2; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <div style="font-size: 32px; font-weight: bold; color: #1976d2; letter-spacing: 8px;">${otp}</div>
              <p style="margin-top: 10px; color: #666;">Mã OTP có hiệu lực trong <strong>15 phút</strong></p>
            </div>
            <p><strong>Lưu ý:</strong> Không chia sẻ mã này với bất kỳ ai!</p>
            <p style="color: #f44336; font-size: 14px; margin-top: 20px;">Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('✓ Email đã được gửi đến:', email);
    return true;
  } catch (error) {
    console.error('✗ Lỗi gửi email:', error);
    return false;
  }
};

module.exports = { sendResetPasswordEmail };
