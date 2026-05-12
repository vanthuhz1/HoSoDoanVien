import { useState } from 'react';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import DKDashboard  from '../components/doankhoa/DKDashboard';
import DKHoatDong  from '../components/doankhoa/DKHoatDong';
import DKDiemDanh  from '../components/doankhoa/DKDiemDanh';
import DKChiDoan   from '../components/doankhoa/DKChiDoan';
import DKTienDo    from '../components/doankhoa/DKTienDo';
import DKKhieuNai  from '../components/doankhoa/DKKhieuNai';

const NAV = [
  { key:'dashboard',  label:'Tổng quan',       icon:'dashboard' },
  { key:'hoat-dong',  label:'Hoạt động Khoa',  icon:'event' },
  { key:'diem-danh',  label:'Duyệt Điểm danh', icon:'qr_code_scanner' },
  { key:'chi-doan',   label:'Chi đoàn & ĐV',   icon:'groups' },
  { key:'tien-do',    label:'Đoàn phí & Sổ',   icon:'payments' },
  { key:'khieu-nai',  label:'Khiếu nại',        icon:'report_problem' },
];

const DoanKhoaPage = () => {
  const [active, setActive] = useState('dashboard');
  const navigate  = useNavigate();
  const user      = authService.getCurrentUser();

  const logout = () => { authService.logout(); navigate('/login'); };

  return (
    <div className="flex min-h-screen bg-[#f0f4f8]" style={{fontFamily:"'Inter',sans-serif"}}>

      {/* SIDEBAR */}
      <nav className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-[#00213d] to-[#003566] flex-col z-50 shadow-2xl">
        {/* Logo */}
        <div className="px-5 py-5 flex items-center gap-3 border-b border-white/10">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-white text-xl fill">school</span>
          </div>
          <div>
            <h1 className="font-extrabold text-white text-sm leading-tight">Đoàn Khoa</h1>
            <p className="text-[11px] text-amber-300 mt-0.5 font-semibold">Quyền: Bí thư Đoàn Khoa</p>
          </div>
        </div>

        {/* Nav items */}
        <div className="flex-1 overflow-y-auto py-4 px-3">
          <p className="text-[10px] font-bold text-blue-300/50 uppercase tracking-[0.15em] px-3 mb-2">Quản lý</p>
          <ul className="flex flex-col gap-0.5">
            {NAV.map(item => {
              const on = active === item.key;
              return (
                <li key={item.key}>
                  <button onClick={() => setActive(item.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      on ? 'bg-white text-[#004581] shadow-lg font-bold' : 'text-blue-100/80 hover:bg-white/10 hover:text-white'
                    }`}>
                    <span className={`material-symbols-outlined text-[20px] flex-shrink-0 ${on?'text-[#004581]':'text-blue-300'}`}
                      style={on?{fontVariationSettings:"'FILL' 1"}:{}}>{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                    {on && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#004581]" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* User */}
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 border-2 border-white/20 shadow">
              <span className="text-white text-sm font-bold">{(user?.hoTen||'K')[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{user?.hoTen||'Bí thư Khoa'}</p>
              <p className="text-[11px] text-blue-300/70 truncate">{user?.email}</p>
            </div>
            <button onClick={logout} className="text-blue-300/60 hover:text-red-400 transition-colors" title="Đăng xuất">
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* MAIN */}
      <div className="md:ml-64 flex flex-col flex-1">
        {/* Topbar */}
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-200 px-8 h-14 flex items-center justify-between shadow-sm">
          <span className="text-sm font-semibold text-gray-500">
            {NAV.find(n=>n.key===active)?.label}
          </span>
          <span className="text-xs text-gray-400">{new Date().toLocaleDateString('vi-VN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</span>
        </div>

        <main className="flex-1 p-6 max-w-[1280px] w-full mx-auto">
          {active === 'dashboard'  && <DKDashboard />}
          {active === 'hoat-dong'  && <DKHoatDong />}
          {active === 'diem-danh'  && <DKDiemDanh />}
          {active === 'chi-doan'   && <DKChiDoan />}
          {active === 'tien-do'    && <DKTienDo />}
          {active === 'khieu-nai'  && <DKKhieuNai />}
        </main>
      </div>
    </div>
  );
};

export default DoanKhoaPage;
