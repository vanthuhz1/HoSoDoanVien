import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { authService } from '../../services/authService';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const currentUser = authService.getCurrentUser();
  const isLoggedIn = authService.isAuthenticated();

  // Nav items khi chưa đăng nhập (Bỏ nút Đăng nhập ra khỏi list này để render riêng)
  const publicNavItems = [
    { path: '/', label: 'TRANG CHỦ' },
    { path: '/huong-dan', label: 'HƯỚNG DẪN SỬ DỤNG' },
  ];

  // Nav items khi đã đăng nhập - theo vai trò
  const getNavItemsByRole = (role) => {
    const roleInt = parseInt(role);
    switch (roleInt) {
      case 1: // Admin
        return [
          { path: '/', label: 'TRANG CHỦ' },
          { path: '/admin', label: 'QUẢN TRỊ HỆ THỐNG', icon: 'admin_panel_settings' },
          { path: '/admin/doan-vien', label: 'ĐOÀN VIÊN' },
          { path: '/admin/hoat-dong', label: 'HOẠT ĐỘNG' },
          { path: '/admin/bao-cao', label: 'BÁO CÁO' },
        ];
      case 2: // Đoàn khoa
        return [
          { path: '/', label: 'TRANG CHỦ' },
          { path: '/doan-khoa', label: 'QUẢN LÝ KHOA', icon: 'school' },
          { path: '/doan-khoa/chi-doan', label: 'CHI ĐOÀN' },
          { path: '/doan-khoa/hoat-dong', label: 'HOẠT ĐỘNG' },
          { path: '/doan-khoa/bao-cao', label: 'BÁO CÁO' },
        ];
      case 3: // Bí thư
        return [
          { path: '/', label: 'TRANG CHỦ' },
          { path: '/doan-vien/ho-so', label: 'THÔNG TIN CÁ NHÂN' },
          { path: '/thong-tin', label: 'THÔNG TIN HOẠT ĐỘNG' },
          { path: '/doan-phi', label: 'ĐOÀN PHÍ' },
          { path: '/bi-thu', label: 'QUẢN LÝ CHI ĐOÀN', icon: 'groups' },
        ];
      case 4: // Đoàn viên
      default:
        return [
          { path: '/', label: 'TRANG CHỦ' },
          { path: '/doan-vien/ho-so', label: 'THÔNG TIN CÁ NHÂN' },
          { path: '/thong-tin', label: 'THÔNG TIN HOẠT ĐỘNG' },
          { path: '/doan-phi', label: 'ĐOÀN PHÍ' },
        ];
    }
  };

  const handleLogout = () => {
    authService.logout();
    setShowDropdown(false);
    navigate('/login');
  };

  const navItems = isLoggedIn
    ? getNavItemsByRole(currentUser?.role)
    : publicNavItems;

  const displayName = currentUser?.hoTen || currentUser?.tenNguoiDung || '';
  const roleName = currentUser?.roleName || '';

  return (
    <nav className="w-full bg-transparent relative z-50">
      <div className="w-full px-4 lg:px-[100px] flex items-center justify-between h-20">
        
        {/* Left Side: Logo & Title */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-full bg-[#004581] flex items-center justify-center shadow-md group-hover:shadow-lg transition-all">
            <span className="material-symbols-outlined text-white text-2xl fill">school</span>
          </div>
          <h1 className="text-[#004581] font-extrabold text-xl tracking-wide uppercase hidden sm:block">
            Hồ Sơ Đoàn Viên
          </h1>
        </Link>

        {/* Right Side: Nav Links & Auth Button */}
        <div className="flex items-center gap-8 h-full">
          
          {/* Nav Links */}
          <ul className="hidden md:flex items-center gap-6 h-full">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path ||
                (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <li key={item.path} className="h-full flex items-center">
                  <Link
                    to={item.path}
                    className={`flex items-center gap-1.5 text-sm font-bold uppercase transition-colors h-full relative ${
                      isActive
                        ? 'text-[#004581]'
                        : 'text-gray-500 hover:text-[#004581]'
                    }`}
                  >
                    {item.icon && (
                      <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                    )}
                    {item.label}
                    {/* Active Underline */}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 w-full h-1 bg-[#004581] rounded-t-md"></span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* User / Login Button Always on Far Right */}
          <div className="pl-6 border-l border-gray-200 h-10 flex items-center">
            {isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-3 group"
                >
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{roleName}</p>
                    <p className="text-sm font-extrabold text-[#004581]">{displayName}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-blue-50 border-2 border-[#004581] flex items-center justify-center text-[#004581] group-hover:bg-[#004581] group-hover:text-white transition-colors shadow-sm">
                    <span className="material-symbols-outlined">person</span>
                  </div>
                </button>

                {showDropdown && (
                  <>
                    <div className="absolute right-0 top-full mt-4 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                      <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
                        <p className="font-bold text-[#004581] truncate">{displayName}</p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{currentUser?.email}</p>
                      </div>
                      <div className="p-2">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined text-base">logout</span>
                          Đăng xuất
                        </button>
                      </div>
                    </div>
                    {/* Overlay to close dropdown */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowDropdown(false)}
                    />
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="bg-[#004581] text-white font-bold text-sm uppercase tracking-wide px-6 py-2.5 rounded-full shadow-[0_0_15px_rgba(0,69,129,0.3)] hover:shadow-[0_0_20px_rgba(0,69,129,0.5)] hover:-translate-y-0.5 transition-all flex items-center gap-2"
              >
                Đăng nhập
                <span className="material-symbols-outlined text-[18px]">login</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navigation;
