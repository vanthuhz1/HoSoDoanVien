import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import Navigation from '../components/layout/Navigation';
import Footer from '../components/layout/Footer';
import { authService } from '../services/authService';

const features = {
  member: [
    { icon: 'manage_accounts', text: 'Cập nhật thông tin cá nhân, thay đổi mật khẩu' },
    { icon: 'event_available', text: 'Đăng ký tham gia hoạt động ngoại khóa và tích điểm' },
    { icon: 'menu_book',       text: 'Kiểm tra sổ Đoàn, Đoàn – Hội phí, Hoạt động ngoại khóa' },
    { icon: 'qr_code_scanner', text: 'Thực hiện điểm danh bằng QR Code' },
  ],
  officer: [
    { icon: 'group',           text: 'Quản lý đầy đủ thông tin cá nhân thành viên lớp' },
    { icon: 'leaderboard',     text: 'Kiểm tra điểm hoạt động của thành viên lớp mình' },
    { icon: 'payments',        text: 'Kiểm tra Đoàn – Hội phí của thành viên lớp mình' },
  ],
};

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData]     = useState({ email: '', matKhau: '' });
  const [errors, setErrors]         = useState({});
  const [loading, setLoading]       = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    setErrorMessage('');
  };

  const validate = () => {
    const err = {};
    if (!formData.email.trim()) err.email = 'Vui lòng nhập email';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) err.email = 'Email không đúng định dạng';
    if (!formData.matKhau) err.matKhau = 'Vui lòng nhập mật khẩu';
    return err;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setLoading(true);
    setErrorMessage('');
    try {
      const response = await authService.login(formData.email, formData.matKhau);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('role', String(response.data.user.role));

      const role = parseInt(response.data.user.role);
      switch (role) {
        case 1: navigate('/admin');      break;
        case 2: navigate('/doan-khoa'); break;
        case 3:
        case 4:
        default: navigate('/');         break;
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#f0f4f9] text-gray-900 min-h-screen flex flex-col font-sans">
      <Header />
      <Navigation />

      <main className="flex-grow py-12 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ─── LEFT: Feature Panel ─── */}
          <div className="lg:col-span-7 space-y-6">
            {/* Intro */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-[#004581] to-[#0066cc] px-8 py-7 text-white">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">rocket_launch</span>
                  </div>
                  <h2 className="text-xl font-extrabold uppercase tracking-wide">Tham gia Hệ thống</h2>
                </div>
                <p className="text-blue-100 text-sm leading-relaxed">
                  Bạn sẽ sử dụng đầy đủ chức năng của <strong className="text-white">Trang Quản lý Chuyên trách Đoàn – Hội</strong> sau khi đăng nhập.
                </p>
              </div>

              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Thành viên */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                      <span className="material-symbols-outlined text-[#004581] text-base">person</span>
                    </div>
                    <h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wider">Đối với thành viên</h3>
                  </div>
                  <ul className="space-y-3">
                    {features.member.map((f, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#004581] flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="material-symbols-outlined text-[15px]">{f.icon}</span>
                        </div>
                        <p className="text-sm text-gray-600 leading-snug">
                          <span className="font-bold text-gray-700">{i + 1}.</span> {f.text}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Cán bộ lớp */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
                      <span className="material-symbols-outlined text-emerald-600 text-base">shield_person</span>
                    </div>
                    <h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wider">Đối với cán bộ lớp</h3>
                  </div>
                  <ul className="space-y-3">
                    {features.officer.map((f, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="material-symbols-outlined text-[15px]">{f.icon}</span>
                        </div>
                        <p className="text-sm text-gray-600 leading-snug">
                          <span className="font-bold text-gray-700">{i + 1}.</span> {f.text}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Help notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-6 py-4 flex items-start gap-3">
              <span className="material-symbols-outlined text-amber-500 mt-0.5">help_outline</span>
              <div>
                <p className="text-sm font-bold text-amber-800 mb-0.5">Cần hỗ trợ?</p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Nếu quên mật khẩu, sử dụng chức năng <strong>"Quên mật khẩu"</strong> dưới form đăng nhập hoặc liên hệ Ban Chấp hành để được cấp lại tài khoản.
                </p>
              </div>
            </div>
          </div>

          {/* ─── RIGHT: Login Form ─── */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Form header */}
              <div className="px-8 pt-8 pb-6 text-center border-b border-gray-100">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#004581] rounded-2xl mb-4 shadow-lg">
                  <span className="material-symbols-outlined text-4xl text-white">login</span>
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-1">Đăng Nhập</h2>
                <p className="text-gray-400 text-sm">Nhập thông tin tài khoản của bạn</p>
              </div>

              {/* Form body */}
              <div className="px-8 py-7">
                {errorMessage && (
                  <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
                    <span className="material-symbols-outlined text-red-500 flex-shrink-0">error</span>
                    <p className="text-red-700 text-sm font-medium">{errorMessage}</p>
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                  {/* Email */}
                  <div>
                    <label className="block text-xs font-extrabold text-gray-600 uppercase tracking-widest mb-2" htmlFor="email">
                      Địa chỉ Email
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-lg">mail</span>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={loading}
                        placeholder="example@ute.vn"
                        autoComplete="email"
                        className={`w-full border-2 rounded-xl py-3.5 pl-12 pr-4 text-sm focus:outline-none transition-all ${
                          errors.email
                            ? 'border-red-300 bg-red-50 focus:border-red-400'
                            : 'border-gray-200 bg-gray-50 focus:border-[#004581] focus:bg-white'
                        }`}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">cancel</span>{errors.email}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-extrabold text-gray-600 uppercase tracking-widest mb-2" htmlFor="matKhau">
                      Mật khẩu
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-lg">lock</span>
                      <input
                        id="matKhau"
                        name="matKhau"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.matKhau}
                        onChange={handleChange}
                        disabled={loading}
                        placeholder="Nhập mật khẩu"
                        autoComplete="current-password"
                        className={`w-full border-2 rounded-xl py-3.5 pl-12 pr-12 text-sm focus:outline-none transition-all ${
                          errors.matKhau
                            ? 'border-red-300 bg-red-50 focus:border-red-400'
                            : 'border-gray-200 bg-gray-50 focus:border-[#004581] focus:bg-white'
                        }`}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                        <span className="material-symbols-outlined text-lg">
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                    {errors.matKhau && (
                      <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">cancel</span>{errors.matKhau}
                      </p>
                    )}
                  </div>

                  {/* Forgot password */}
                  <div className="text-right -mt-2">
                    <Link to="/forgot-password" className="text-xs font-bold text-[#004581] hover:underline">
                      Quên mật khẩu?
                    </Link>
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#004581] text-white font-extrabold text-sm py-4 rounded-xl shadow-md hover:bg-blue-800 active:scale-[0.98] transition-all flex justify-center items-center gap-2 uppercase tracking-wider disabled:opacity-50 mt-2"
                  >
                    {loading ? (
                      <><span className="material-symbols-outlined text-xl animate-spin">progress_activity</span>Đang đăng nhập...</>
                    ) : (
                      <><span className="material-symbols-outlined text-xl">login</span>Đăng nhập</>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LoginPage;
