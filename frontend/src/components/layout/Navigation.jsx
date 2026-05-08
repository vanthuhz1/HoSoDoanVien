import { Link, useLocation } from 'react-router-dom';

const Navigation = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'TRANG CHỦ' },
    { path: '/huong-dan', label: 'HƯỚNG DẪN SỬ DỤNG HỆ THỐNG' },
    { path: '/thong-tin', label: 'THÔNG TIN HOẠT ĐỘNG' },
    { path: '/doan-phi', label: 'ĐOÀN PHÍ' },
    { path: '/login', label: 'ĐĂNG NHẬP HỆ THỐNG', icon: 'account_circle' },
  ];

  return (
    <nav className="bg-[#004581] text-white shadow-md w-full relative z-20 border-b border-blue-800/30">
      <div className="max-w-7xl mx-auto px-8">
        <ul className="flex flex-row justify-center items-stretch w-full text-sm font-semibold divide-x divide-white/20">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path} className="flex">
                <Link
                  to={item.path}
                  className={`flex items-center justify-center gap-2 h-full py-4 px-6 whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-blue-700 text-white font-bold'
                      : 'text-white/80 hover:bg-blue-600 hover:text-white'
                  }`}
                >
                  {item.icon && (
                    <span className="material-symbols-outlined text-base fill">{item.icon}</span>
                  )}
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};

export default Navigation;
