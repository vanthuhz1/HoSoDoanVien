import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Navigation from '../components/layout/Navigation';
import Footer from '../components/layout/Footer';
import { authService } from '../services/authService';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [realEmail, setRealEmail] = useState(''); // Email thật để gọi resetPassword
  const [maskedEmail, setMaskedEmail] = useState('');

  const [formData, setFormData] = useState({
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPass, setShowPass] = useState({ new: false, confirm: false });

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!emailOrUsername.trim()) {
      setError('Vui lòng nhập địa chỉ email');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(emailOrUsername)) {
      setError('Email không đúng định dạng');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.forgotPassword(emailOrUsername);
      setSuccess(response.message);
      // response.data có thể không có (bảo mật)
      setMaskedEmail(response.data?.maskedEmail || '***');
      setRealEmail(response.data?.realEmail || emailOrUsername);
      setTimeout(() => {
        setStep(2);
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    const { otp, newPassword, confirmPassword } = formData;
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
      // Gửi email THẬT (không phải username nhập) lên backend
      const response = await authService.resetPassword(realEmail, otp, newPassword, confirmPassword);
      setSuccess(response.message);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col">
      <Header />
      <Navigation />

      <main className="flex-grow py-12 px-4">
        <div className="max-w-md mx-auto">
          {/* Steps indicator */}
          <div className="flex items-center justify-center gap-3 mb-8">
            {[1, 2].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                  step === s
                    ? 'bg-[#004581] border-[#004581] text-white'
                    : step > s
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}>
                  {step > s ? <span className="material-symbols-outlined text-sm">check</span> : s}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${step === s ? 'text-[#004581]' : 'text-gray-400'}`}>
                  {s === 1 ? 'Xác minh tài khoản' : 'Đặt mật khẩu mới'}
                </span>
                {s < 2 && <span className="material-symbols-outlined text-gray-300 text-base">chevron_right</span>}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-[#004581] rounded-full mb-3 shadow-md">
                <span className="material-symbols-outlined text-3xl text-white fill">
                  {step === 1 ? 'lock_reset' : 'key'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {step === 1 ? 'Quên Mật Khẩu' : 'Đặt Mật Khẩu Mới'}
              </h2>
              <p className="text-gray-500 text-sm">
                {step === 1
                  ? 'Nhập email hoặc mã sinh viên để nhận mã OTP'
                  : `Mã OTP đã gửi đến ${maskedEmail}`}
              </p>
            </div>

            {/* Messages */}
            {error && (
              <div className="mb-5 p-3.5 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-red-500 text-base fill">error</span>
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}
            {success && (
              <div className="mb-5 p-3.5 bg-green-50 border-l-4 border-green-500 rounded-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-green-500 text-base fill">check_circle</span>
                <p className="text-sm text-green-700 font-medium">{success}</p>
              </div>
            )}

            {/* Step 1: Request OTP */}
            {step === 1 && (
              <form onSubmit={handleRequestOTP} className="space-y-5">
                <div>
                  <label htmlFor="emailOrUsername" className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                    Địa chỉ Email
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#004581] text-base fill">
                      mail
                    </span>
                    <input
                      type="email"
                      id="emailOrUsername"
                      value={emailOrUsername}
                      onChange={(e) => setEmailOrUsername(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl py-3.5 pl-12 pr-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004581] focus:border-[#004581] transition-all"
                      placeholder="example@ute.vn"
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#004581] text-white font-bold text-sm rounded-xl hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg fill">send</span>
                      Gửi mã OTP
                    </>
                  )}
                </button>

                <div className="text-center">
                  <button type="button" onClick={() => navigate('/login')}
                    className="text-sm text-[#004581] hover:underline font-medium">
                    ← Quay lại đăng nhập
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Reset Password */}
            {step === 2 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                {/* OTP */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Mã OTP (6 số)</label>
                  <input
                    type="text"
                    name="otp"
                    value={formData.otp}
                    onChange={handleChange}
                    maxLength={6}
                    placeholder="000000"
                    disabled={loading}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl py-3.5 px-4 text-center text-2xl font-bold tracking-widest text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004581] focus:border-[#004581] transition-all"
                  />
                </div>

                {/* New password */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Mật khẩu mới</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#004581] text-base fill">lock</span>
                    <input
                      type={showPass.new ? 'text' : 'password'}
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      placeholder="Tối thiểu 6 ký tự"
                      disabled={loading}
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl py-3.5 pl-12 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-[#004581] focus:border-[#004581] transition-all"
                    />
                    <button type="button" onClick={() => setShowPass(p => ({ ...p, new: !p.new }))}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <span className="material-symbols-outlined text-base">{showPass.new ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Xác nhận mật khẩu</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#004581] text-base fill">lock_check</span>
                    <input
                      type={showPass.confirm ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Nhập lại mật khẩu mới"
                      disabled={loading}
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl py-3.5 pl-12 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-[#004581] focus:border-[#004581] transition-all"
                    />
                    <button type="button" onClick={() => setShowPass(p => ({ ...p, confirm: !p.confirm }))}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <span className="material-symbols-outlined text-base">{showPass.confirm ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#004581] text-white font-bold text-sm rounded-xl hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg fill">check_circle</span>
                      Đặt lại mật khẩu
                    </>
                  )}
                </button>

                <div className="text-center">
                  <button type="button"
                    onClick={() => { setStep(1); setFormData({ otp: '', newPassword: '', confirmPassword: '' }); setError(''); }}
                    className="text-sm text-[#004581] hover:underline font-medium">
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
