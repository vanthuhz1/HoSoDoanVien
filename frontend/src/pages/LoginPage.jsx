import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Navigation from '../components/layout/Navigation';
import Breadcrumb from '../components/layout/Breadcrumb';
import Footer from '../components/layout/Footer';
import { authService } from '../services/authService';

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    studentId: '',
    password: ''
  });

  const [errors, setErrors] = useState({
    studentId: false,
    password: false
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { id, value } = e.target;
    const name = id === 'student_id' ? 'studentId' : 'password';
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: false
      }));
    }
    setErrorMessage('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const newErrors = {};
    
    if (!formData.studentId) {
      newErrors.studentId = true;
    }
    
    if (!formData.password) {
      newErrors.password = true;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const response = await authService.login(formData.studentId, formData.password);
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('role', response.data.user.role);

      const role = response.data.user.role;
      if (role === 2) {
        navigate('/admin/dashboard');
      } else if (role === 3) {
        navigate('/student/profile');
      } else {
        navigate('/');
      }
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại'
      );
    } finally {
      setLoading(false);
    }
  };

  const breadcrumbItems = [
    { path: '/', label: 'Trang chủ' },
    { label: 'Đăng nhập' }
  ];

  return (
    <div className="bg-gray-50 text-gray-900 min-h-screen flex flex-col">
      <Header />
      <Navigation />
      <Breadcrumb items={breadcrumbItems} />
      
      <main className="flex-grow bg-gray-100 py-12 px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-[50px] items-start justify-center">
          
          {/* LEFT COLUMN: Login Form */}
          <div className="lg:col-span-8 bg-white rounded-xl border border-gray-300 shadow-md p-8 relative overflow-hidden">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-100 opacity-20 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="text-center mb-10 relative z-10">
              <h2 className="text-2xl font-semibold text-[#004581] uppercase mb-3">
                ĐĂNG NHẬP HỆ THỐNG QUẢN LÝ CHUYÊN TRÁCH ĐOÀN - HỘI
              </h2>
              <p className="text-gray-600 text-lg">
                Vui lòng nhập thông tin tài khoản của bạn
              </p>
            </div>

            {errorMessage && (
              <div className="mb-6 p-4 bg-error-container border-l-4 border-error rounded-lg relative z-10">
                <p className="text-error text-sm font-medium">{errorMessage}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="flex flex-col gap-stack-lg relative z-10 max-w-2xl mx-auto">
              {/* Mã sinh viên */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-900 uppercase" htmlFor="student_id">
                  MÃ SINH VIÊN
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#004581]">
                    badge
                  </span>
                  <input
                    className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg py-4 pl-12 pr-4 focus:border-[#004581] focus:ring-1 focus:ring-[#004581] transition-colors text-base"
                    id="student_id"
                    placeholder="Nhập mã sinh viên"
                    type="text"
                    value={formData.studentId}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
                {errors.studentId && (
                  <p className="text-red-600 text-sm flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-base">cancel</span>
                    ⊗ Chưa nhập
                  </p>
                )}
              </div>

              {/* Mật khẩu */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-900 uppercase" htmlFor="password">
                  MẬT KHẨU
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#004581]">
                    lock
                  </span>
                  <input
                    className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg py-4 pl-12 pr-4 focus:border-[#004581] focus:ring-1 focus:ring-[#004581] transition-colors text-base"
                    id="password"
                    placeholder="Nhập mật khẩu"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
                {errors.password && (
                  <p className="text-red-600 text-sm flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-base">cancel</span>
                    ⊗ Chưa nhập
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <button
                  className="flex-1 bg-[#004581] text-white font-semibold text-base py-4 px-6 rounded-lg shadow-md hover:bg-blue-700 transition-colors flex justify-center items-center gap-2 uppercase disabled:opacity-50"
                  type="submit"
                  disabled={loading}
                >
                  <span className="material-symbols-outlined text-xl">login</span>
                  {loading ? 'ĐANG ĐĂNG NHẬP...' : 'ĐĂNG NHẬP TÀI KHOẢN'}
                </button>
                <button
                  className="sm:w-auto text-[#004581] border-2 border-[#004581] font-semibold text-base py-4 px-6 rounded-lg hover:bg-blue-50 transition-colors flex justify-center items-center gap-2 uppercase"
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                >
                  <span className="material-symbols-outlined text-xl">key</span>
                  QUÊN MẬT KHẨU?
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT COLUMN: Info Panel */}
          <div className="lg:col-span-4 bg-white rounded-xl border border-gray-300 shadow-md p-6 relative overflow-hidden border-l-4 border-l-[#004581]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 opacity-20 transform rotate-45 translate-x-16 -translate-y-16 pointer-events-none"></div>
            
            <h3 className="text-xl font-semibold text-[#004581] mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#004581] fill">info</span>
              VÌ SAO PHẢI SỬ DỤNG HỆ THỐNG?
            </h3>
            
            <p className="text-gray-600 text-sm mb-6">
              Hệ thống Quản lý Chuyên trách Đoàn - Hội là công cụ chính thức giúp tối ưu hóa công tác quản lý và đánh giá hoạt động phong trào.
            </p>

            <div className="flex flex-col gap-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 text-xl">groups</span>
                  Đối với thành viên:
                </h4>
                <ul className="flex flex-col gap-3 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-surface-tint text-[18px] mt-0.5">check_circle</span>
                    <span>Theo dõi điểm rèn luyện và lịch sử tham gia phong trào chính xác.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-surface-tint text-[18px] mt-0.5">check_circle</span>
                    <span>Đăng ký tham gia các hoạt động Đoàn - Hội trực tuyến nhanh chóng.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-surface-tint text-[18px] mt-0.5">check_circle</span>
                    <span>Nhận thông báo tự động về các sự kiện quan trọng.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-surface-tint text-[18px] mt-0.5">check_circle</span>
                    <span>Quản lý hồ sơ cá nhân và chứng nhận điện tử.</span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 text-xl">admin_panel_settings</span>
                  Đối với cán bộ lớp:
                </h4>
                <ul className="flex flex-col gap-3 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-surface-tint text-[18px] mt-0.5">check_circle</span>
                    <span>Quản lý danh sách và đánh giá hoạt động của chi đoàn/chi hội dễ dàng.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-surface-tint text-[18px] mt-0.5">check_circle</span>
                    <span>Trích xuất báo cáo thống kê tự động phục vụ công tác thi đua.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-surface-tint text-[18px] mt-0.5">check_circle</span>
                    <span>Phê duyệt minh chứng hoạt động trực tuyến thay vì nộp bản cứng.</span>
                  </li>
                </ul>
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
