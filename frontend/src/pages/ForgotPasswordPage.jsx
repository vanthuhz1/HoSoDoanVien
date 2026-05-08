import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Navigation from '../components/layout/Navigation';
import Footer from '../components/layout/Footer';
import { authService } from '../services/authService';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Enter email, 2: Enter OTP & new password
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Step 1 data
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');

  // Step 2 data
  const [formData, setFormData] = useState({
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Step 1: Request OTP
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!emailOrUsername.trim()) {
      setError('Vui lòng nhập email hoặc mã sinh viên');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.forgotPassword(emailOrUsername);
      setSuccess(response.message);
      setMaskedEmail(response.data.email);
      setTimeout(() => {
        setStep(2);
        setSuccess('');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const { otp, newPassword, confirmPassword } = formData;

    // Validation
    if (!otp || !newPassword || !confirmPassword) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.resetPassword(
        emailOrUsername,
        otp,
        newPassword,
        confirmPassword
      );
      setSuccess(response.message);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="bg-gradient-to-br from-doan-50 via-white to-doan-100 min-h-screen flex flex-col">
      <Header />
      <Navigation />

      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-strong p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-doan-500 to-doan-700 rounded-full mb-4 shadow-medium">
                <span className="material-symbols-outlined text-white text-4xl fill">
                  lock_reset
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Quên Mật Khẩu
              </h2>
              <p className="text-gray-600 text-sm">
                {step === 1
                  ? 'Nhập email hoặc mã sinh viên để nhận mã OTP'
                  : 'Nhập mã OTP và mật khẩu mới'}
              </p>
            </div>

            {/* Error & Success Messages */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-danger rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-danger text-xl">error</span>
                  <p className="text-sm text-danger font-medium">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border-l-4 border-success rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-success text-xl">check_circle</span>
                  <p className="text-sm text-success font-medium">{success}</p>
                </div>
              </div>
            )}

            {/* Step 1: Request OTP */}
            {step === 1 && (
              <form onSubmit={handleRequestOTP} className="space-y-6">
                <div>
                  <label htmlFor="emailOrUsername" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email hoặc Mã sinh viên
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-doan-500 text-xl">
                        mail
                      </span>
                    </div>
                    <input
                      type="text"
                      id="emailOrUsername"
                      value={emailOrUsername}
                      onChange={(e) => setEmailOrUsername(e.target.value)}
                      className="block w-full pl-12 pr-4 py-3.5 border-2 border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-doan-500 focus:ring-2 focus:ring-doan-500 focus:ring-opacity-50 transition-all"
                      placeholder="Nhập email hoặc mã sinh viên"
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-doan-600 to-doan-700 text-white font-bold text-base rounded-xl shadow-medium hover:shadow-strong hover:from-doan-700 hover:to-doan-800 focus:outline-none focus:ring-4 focus:ring-doan-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined text-2xl animate-spin">progress_activity</span>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-2xl">send</span>
                      GỬI MÃ OTP
                    </>
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="text-sm text-doan-600 hover:text-doan-800 font-medium transition-colors"
                  >
                    ← Quay lại đăng nhập
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Reset Password */}
            {step === 2 && (
              <form onSubmit={handleResetPassword} className="space-y-6">
                {maskedEmail && (
                  <div className="p-4 bg-doan-50 rounded-lg border border-doan-200">
                    <p className="text-sm text-gray-700">
                      Mã OTP đã được gửi đến: <strong>{maskedEmail}</strong>
                    </p>
                  </div>
                )}

                <div>
                  <label htmlFor="otp" className="block text-sm font-semibold text-gray-700 mb-2">
                    Mã OTP
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-doan-500 text-xl">
                        pin
                      </span>
                    </div>
                    <input
                      type="text"
                      id="otp"
                      name="otp"
                      value={formData.otp}
                      onChange={handleChange}
                      maxLength="6"
                      className="block w-full pl-12 pr-4 py-3.5 border-2 border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-doan-500 focus:ring-2 focus:ring-doan-500 focus:ring-opacity-50 transition-all text-center text-2xl tracking-widest font-bold"
                      placeholder="000000"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-doan-500 text-xl">
                        lock
                      </span>
                    </div>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      className="block w-full pl-12 pr-4 py-3.5 border-2 border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-doan-500 focus:ring-2 focus:ring-doan-500 focus:ring-opacity-50 transition-all"
                      placeholder="Nhập mật khẩu mới"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                    Xác nhận mật khẩu
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-doan-500 text-xl">
                        lock_check
                      </span>
                    </div>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="block w-full pl-12 pr-4 py-3.5 border-2 border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-doan-500 focus:ring-2 focus:ring-doan-500 focus:ring-opacity-50 transition-all"
                      placeholder="Nhập lại mật khẩu mới"
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-doan-600 to-doan-700 text-white font-bold text-base rounded-xl shadow-medium hover:shadow-strong hover:from-doan-700 hover:to-doan-800 focus:outline-none focus:ring-4 focus:ring-doan-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined text-2xl animate-spin">progress_activity</span>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-2xl">check_circle</span>
                      ĐẶT LẠI MẬT KHẨU
                    </>
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setFormData({ otp: '', newPassword: '', confirmPassword: '' });
                      setError('');
                    }}
                    className="text-sm text-doan-600 hover:text-doan-800 font-medium transition-colors"
                  >
                    ← Gửi lại mã OTP
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ForgotPasswordPage;
