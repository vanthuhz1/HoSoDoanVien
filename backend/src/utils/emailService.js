const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

/**
 * Gửi email đặt lại mật khẩu với mã OTP
 * @param {string} toEmail - Email người nhận
 * @param {string} otp - Mã OTP 6 số
 * @param {string} username - Tên đăng nhập
 * @returns {boolean} - true nếu gửi thành công
 */
const sendResetPasswordEmail = async (toEmail, otp, username) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Hệ thống Quản lý Đoàn viên" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: '[Đoàn viên] Mã OTP đặt lại mật khẩu',
      html: `
        <!DOCTYPE html>
        <html lang="vi">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Đặt lại mật khẩu</title>
        </head>
        <body style="margin:0;padding:0;background-color:#f4f6f9;font-family:Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background:linear-gradient(135deg,#004581,#0066cc);padding:32px;text-align:center;">
                      <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:bold;">🏫 Hệ thống Quản lý Đoàn viên</h1>
                      <p style="color:#b3d4ff;margin:8px 0 0;">Trường Đại học Sư phạm Kỹ thuật</p>
                    </td>
                  </tr>
                  <!-- Body -->
                  <tr>
                    <td style="padding:40px 32px;">
                      <p style="color:#333;font-size:16px;margin:0 0 16px;">Xin chào <strong>${username}</strong>,</p>
                      <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
                        Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Vui lòng sử dụng mã OTP bên dưới:
                      </p>
                      <!-- OTP Box -->
                      <div style="background:#f0f7ff;border:2px solid #004581;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
                        <p style="color:#004581;font-size:13px;font-weight:bold;letter-spacing:2px;margin:0 0 8px;text-transform:uppercase;">Mã OTP của bạn</p>
                        <p style="color:#004581;font-size:40px;font-weight:bold;letter-spacing:12px;margin:0;font-family:monospace;">${otp}</p>
                        <p style="color:#888;font-size:13px;margin:12px 0 0;">⏱ Mã có hiệu lực trong <strong>15 phút</strong></p>
                      </div>
                      <p style="color:#888;font-size:13px;line-height:1.6;margin:0;">
                        Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. Tài khoản của bạn vẫn an toàn.
                      </p>
                    </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                    <td style="background:#f8f9fa;padding:20px 32px;text-align:center;border-top:1px solid #e9ecef;">
                      <p style="color:#aaa;font-size:12px;margin:0;">© 2024 Hệ thống Quản lý Đoàn viên – Trường ĐHSPKT</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✓ Đã gửi email OTP đến: ${toEmail}`);
    return true;
  } catch (error) {
    console.error('✗ Lỗi gửi email:', error.message);
    return false;
  }
};

module.exports = { sendResetPasswordEmail };
