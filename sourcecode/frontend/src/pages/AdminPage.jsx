import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import axios from 'axios';
import AdminDoanVien  from '../components/admin/AdminDoanVien';
import AdminSoDoan    from '../components/admin/AdminSoDoan';
import AdminPhanQuyen from '../components/admin/AdminPhanQuyen';
import AdminDoanPhi   from '../components/admin/AdminDoanPhi';
import AdminHoatDong  from '../components/admin/AdminHoatDong';
import AdminThongBao  from '../components/admin/AdminThongBao';

const API_URL = 'http://localhost:5000/api';

const NAV_ITEMS = [
  { key: 'dashboard',  icon: 'dashboard',   label: 'Tổng quan' },
  { key: 'doan-vien',  icon: 'group',       label: 'Quản lý Đoàn viên' },
  { key: 'so-doan',    icon: 'book',        label: 'Quản lý Sổ Đoàn' },
  { key: 'doan-phi',   icon: 'payments',   label: 'Đoàn phí' },
  { key: 'hoat-dong',  icon: 'event',       label: 'Hoạt động' },
  { key: 'thong-bao',  icon: 'campaign',   label: 'Thông báo & Tin tức' },
  { key: 'phan-quyen', icon: 'security',   label: 'Phân quyền' },
];

const STATUS_MAP = {
  'Sắp diễn ra': { cls: 'bg-blue-50 text-blue-700',   dot: 'bg-blue-500',   label: 'Sắp diễn ra' },
  'Đang diễn ra': { cls: 'bg-green-50 text-green-700', dot: 'bg-green-500',  label: 'Đang hoạt động' },
  'Đã kết thúc':  { cls: 'bg-gray-100 text-gray-600',  dot: 'bg-gray-400',   label: 'Đã hoàn thành' },
};
const getStatus = (tt) => STATUS_MAP[tt] || { cls: 'bg-red-50 text-red-600', dot: 'bg-red-500', label: tt };



const AdminPage = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const [activeNav, setActiveNav] = useState('dashboard');
  const [searchTable, setSearchTable] = useState('');
  const [stats, setStats] = useState({ doanVien: 0, hoatDong: 0, chiDoan: 0, khieuNai: 0 });
  const [activities, setActivities] = useState([]);
  const [doanViens, setDoanViens] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
      const [dvRes, actRes] = await Promise.all([
        axios.get(`${API_URL}/doan-vien`, { headers }),
        axios.get(`${API_URL}/activities/all`, { headers }),
      ]);
      const dvData  = dvRes.data.data  || [];
      const actData = actRes.data.data || [];
      setDoanViens(dvData);
      setActivities(actData);
      const chiDoanSet = new Set(dvData.map(d => d.maChiDoan).filter(Boolean));
      setStats({ doanVien: dvData.length, hoatDong: actData.length, chiDoan: chiDoanSet.size, khieuNai: 0 });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleLogout = () => { authService.logout(); navigate('/login'); };

  const filteredActs = activities.filter(a =>
    a.tenHD?.toLowerCase().includes(searchTable.toLowerCase())
  );

  return (
    <div className="bg-[#f8f9fa] text-[#191c1d] font-sans min-h-screen">

      {/* ── SIDEBAR ── */}
      <nav className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-[#00213d] to-[#003566] flex-col z-50 shadow-2xl">
        {/* Logo */}
        <div className="px-5 py-5 flex items-center gap-3 border-b border-white/10">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center flex-shrink-0 border border-white/20">
            <span className="material-symbols-outlined text-white text-xl fill">school</span>
          </div>
          <div>
            <h1 className="font-extrabold text-white text-sm leading-tight tracking-wide">Đoàn Thanh niên</h1>
            <p className="text-xs text-blue-300/80 mt-0.5">Cổng Quản trị viên</p>
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-4 px-3">
          <p className="text-[10px] font-bold text-blue-300/50 uppercase tracking-[0.15em] px-3 mb-2">Quản lý</p>
          <ul className="flex flex-col gap-0.5">
            {NAV_ITEMS.map(item => {
              const isActive = activeNav === item.key;
              return (
                <li key={item.key}>
                  <button
                    onClick={() => setActiveNav(item.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-white text-[#004581] shadow-lg shadow-black/20 font-bold'
                        : 'text-blue-100/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-[20px] flex-shrink-0 ${
                      isActive ? 'text-[#004581]' : 'text-blue-300'
                    }`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                    {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#004581] flex-shrink-0" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* User at bottom */}
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0 border-2 border-white/20 shadow">
              <span className="text-white text-sm font-bold">{(currentUser?.hoTen||'A')[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{currentUser?.hoTen || 'Admin'}</p>
              <p className="text-[11px] text-blue-300/70 truncate">{currentUser?.email}</p>
            </div>
            <button onClick={handleLogout} className="text-blue-300/60 hover:text-red-400 transition-colors flex-shrink-0" title="Đăng xuất">
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── MAIN AREA ── */}
      <div className="md:ml-64 flex flex-col min-h-screen bg-[#f0f4f8]">



        {/* DASHBOARD CONTENT */}
        <main className="flex-1 p-8 max-w-[1280px] w-full mx-auto">

          {/* Sub-pages */}
          {activeNav === 'doan-vien'  && <AdminDoanVien />}
          {activeNav === 'so-doan'    && <AdminSoDoan />}
          {activeNav === 'phan-quyen' && <AdminPhanQuyen />}
          {activeNav === 'doan-phi'   && <AdminDoanPhi />}
          {activeNav === 'hoat-dong'  && <AdminHoatDong />}
          {activeNav === 'thong-bao'  && <AdminThongBao />}

          {/* WIP pages */}
          {!['dashboard','doan-vien','so-doan','phan-quyen','doan-phi','hoat-dong','thong-bao'].includes(activeNav) && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <span className="material-symbols-outlined text-6xl mb-4">construction</span>
              <p className="text-lg font-medium">Tính năng đang được phát triển</p>
              <button onClick={() => setActiveNav('dashboard')} className="mt-4 text-[#004581] underline text-sm">Về trang tổng quan</button>
            </div>
          )}

          {/* DASHBOARD */}
          {activeNav === 'dashboard' && (() => {
            const doanVienActive  = doanViens.filter(d => d.trangThaiSH === 'Đang sinh hoạt').length;
            const doanVienInact   = doanViens.length - doanVienActive;
            const actByStatus     = [
              { label:'Sắp diễn ra', val: activities.filter(a=>a.trangThaiHD==='Sắp diễn ra').length, color:'#60a5fa' },
              { label:'Đang mở',     val: activities.filter(a=>a.trangThaiHD==='Đang mở').length,     color:'#34d399' },
              { label:'Đang diễn ra',val: activities.filter(a=>a.trangThaiHD==='Đang diễn ra').length,color:'#a78bfa' },
              { label:'Đã kết thúc', val: activities.filter(a=>a.trangThaiHD==='Đã kết thúc').length, color:'#94a3b8' },
              { label:'Chờ duyệt',   val: activities.filter(a=>a.trangThaiHD==='Chờ duyệt').length,   color:'#fbbf24' },
            ];
            const totalAct = actByStatus.reduce((s,a)=>s+a.val,0) || 1;
            // Donut paths
            let cum = 0;
            const donutSlices = actByStatus.map(s => {
              const pct = s.val / totalAct;
              const start = cum; cum += pct;
              const a1 = 2*Math.PI*start - Math.PI/2;
              const a2 = 2*Math.PI*cum   - Math.PI/2;
              const r = 60, cx=70, cy=70;
              const x1=cx+r*Math.cos(a1), y1=cy+r*Math.sin(a1);
              const x2=cx+r*Math.cos(a2), y2=cy+r*Math.sin(a2);
              const lg = pct > 0.5 ? 1 : 0;
              return { ...s, d: pct < 0.002 ? '' : `M${cx},${cy} L${x1},${y1} A${r},${r},0,${lg},1,${x2},${y2} Z` };
            });
            // Bar chart – activities per month (mock from real data)
            const months = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];
            const actPerMonth = months.map((_,i) =>
              activities.filter(a => a.ngayToChuc && new Date(a.ngayToChuc).getMonth() === i).length
            );
            const maxBar = Math.max(...actPerMonth, 1);
            // Member gender
            const male   = doanViens.filter(d=>d.gioiTinh==='Nam').length;
            const female = doanViens.filter(d=>d.gioiTinh==='Nữ').length;
            const other  = doanViens.length - male - female;
            return (
              <div className="flex flex-col gap-6" style={{fontFamily:"'Inter',sans-serif"}}>
                {/* STAT CARDS */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label:'Tổng Đoàn viên', value: stats.doanVien,       icon:'group',        iconBg:'bg-blue-50',    iconC:'text-blue-600',    accent:'bg-gradient-to-r from-blue-500 to-cyan-400',    sub:`${doanVienActive} đang sinh hoạt` },
                    { label:'Hoạt động',       value: stats.hoatDong,       icon:'event',        iconBg:'bg-violet-50',  iconC:'text-violet-600',  accent:'bg-gradient-to-r from-violet-500 to-purple-400',sub:`${actByStatus[1].val} đang mở` },
                    { label:'Chi đoàn',        value: stats.chiDoan,        icon:'account_tree', iconBg:'bg-teal-50',    iconC:'text-teal-600',    accent:'bg-gradient-to-r from-teal-500 to-emerald-400', sub:'Đơn vị trực thuộc' },
                    { label:'Chờ duyệt HĐ',    value: actByStatus[4].val,  icon:'pending',      iconBg:'bg-amber-50',   iconC:'text-amber-600',   accent:'bg-gradient-to-r from-amber-400 to-orange-400', sub:'Cần xem xét' },
                  ].map(c => (
                    <div key={c.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden hover:shadow-md transition-shadow">
                      <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl ${c.accent}`} />
                      <div className="p-5 mt-1">
                        <div className="flex justify-between items-start mb-4">
                          <div className={`w-11 h-11 rounded-xl ${c.iconBg} flex items-center justify-center`}>
                            <span className={`material-symbols-outlined text-xl fill ${c.iconC}`}>{c.icon}</span>
                          </div>
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${c.iconBg} ${c.iconC}`}>{c.sub}</span>
                        </div>
                        <p className="text-3xl font-black text-gray-900 tracking-tight">{loading ? '—' : c.value}</p>
                        <p className="text-sm font-medium text-gray-400 mt-0.5">{c.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ROW 2: Bar Chart + Donut */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* Bar Chart – HĐ theo tháng */}
                  <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-base font-bold text-gray-900">Hoạt động theo tháng</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Số hoạt động tổ chức từng tháng trong năm</p>
                      </div>
                    </div>
                    <div className="flex items-end gap-1.5 h-44 px-1">
                      {actPerMonth.map((val, i) => {
                        const h = maxBar > 0 ? Math.round((val / maxBar) * 100) : 0;
                        const cur = new Date().getMonth() === i;
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                            <span className={`text-xs font-bold transition-opacity ${val>0?'opacity-100':'opacity-0'} ${cur?'text-[#004581]':'text-gray-500'}`}>{val||''}</span>
                            <div className="w-full relative" style={{height:'132px'}}>
                              <div className={`absolute bottom-0 w-full rounded-t-lg transition-all duration-700 ${cur?'bg-gradient-to-t from-[#004581] to-[#0066bb] shadow-md':'bg-gradient-to-t from-[#d4e3ff] to-blue-200 group-hover:from-[#004581] group-hover:to-[#0066bb]'}`}
                                style={{height:`${Math.max(h,3)}%`}} />
                            </div>
                            <span className={`text-xs font-semibold ${cur?'text-[#004581]':'text-gray-400'}`}>{months[i]}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Donut – Trạng thái HĐ */}
                  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col">
                    <h3 className="text-base font-bold text-gray-900 mb-1">Trạng thái hoạt động</h3>
                    <p className="text-xs text-gray-400 mb-4">Phân bố theo trạng thái hiện tại</p>
                    <div className="flex items-center justify-center mb-4">
                      <svg width="140" height="140" viewBox="0 0 140 140">
                        {donutSlices.map((s,i) => s.d && <path key={i} d={s.d} fill={s.color} stroke="white" strokeWidth="2" />)}
                        <circle cx="70" cy="70" r="38" fill="white" />
                        <text x="70" y="67" textAnchor="middle" className="fill-gray-800" style={{fontSize:'18px',fontWeight:'bold',fill:'#1f2937'}}>{totalAct}</text>
                        <text x="70" y="82" textAnchor="middle" style={{fontSize:'9px',fill:'#9ca3af'}}>Hoạt động</text>
                      </svg>
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                      {actByStatus.map(s => (
                        <div key={s.label} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{backgroundColor:s.color}} />
                            <span className="text-xs text-gray-600 font-medium">{s.label}</span>
                          </div>
                          <span className="text-xs font-bold text-gray-800">{s.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ROW 3: Đoàn viên theo giới + Tiến độ chi đoàn */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Giới tính */}
                  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                    <h3 className="text-base font-bold text-gray-900 mb-1">Cơ cấu đoàn viên</h3>
                    <p className="text-xs text-gray-400 mb-5">Phân bố theo giới tính và trạng thái sinh hoạt</p>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label:'Nam', value:male,   color:'#3b82f6', bg:'bg-blue-50', pct: doanViens.length>0?Math.round(male/doanViens.length*100):0 },
                        { label:'Nữ', value:female,  color:'#ec4899', bg:'bg-pink-50',  pct: doanViens.length>0?Math.round(female/doanViens.length*100):0 },
                        { label:'Đang SH', value:doanVienActive, color:'#10b981', bg:'bg-green-50', pct: doanViens.length>0?Math.round(doanVienActive/doanViens.length*100):0 },
                        { label:'Nghỉ SH', value:doanVienInact,  color:'#f59e0b', bg:'bg-amber-50',  pct: doanViens.length>0?Math.round(doanVienInact/doanViens.length*100):0 },
                      ].map(g => (
                        <div key={g.label} className={`${g.bg} rounded-xl p-3`}>
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-semibold text-gray-600">{g.label}</span>
                            <span className="text-xs font-bold" style={{color:g.color}}>{g.pct}%</span>
                          </div>
                          <p className="text-2xl font-black text-gray-900">{g.value}</p>
                          <div className="mt-2 h-1.5 bg-gray-200 rounded-full">
                            <div className="h-1.5 rounded-full transition-all duration-700" style={{width:`${g.pct}%`, backgroundColor:g.color}} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top 5 hoạt động mới nhất */}
                  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-base font-bold text-gray-900">Hoạt động gần đây</h3>
                        <p className="text-xs text-gray-400 mt-0.5">5 hoạt động mới nhất</p>
                      </div>
                      <button onClick={() => setActiveNav('hoat-dong')} className="text-xs text-[#004581] hover:underline font-semibold">Xem tất cả →</button>
                    </div>
                    <div className="flex flex-col gap-3">
                      {loading ? <p className="text-center text-gray-300 py-8"><span className="material-symbols-outlined animate-spin text-3xl">refresh</span></p>
                      : activities.slice(0,5).map(a => {
                        const s = getStatus(a.trangThaiHD);
                        const pct = a.soLuongMAX > 0 ? Math.round((a.soLuongDaDangKy||0)/a.soLuongMAX*100) : 0;
                        return (
                          <div key={a.idHD} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                            <div className="w-9 h-9 rounded-xl bg-[#d4e3ff] flex items-center justify-center flex-shrink-0">
                              <span className="material-symbols-outlined text-[#004581] text-base fill">event</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{a.tenHD}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex-1 h-1 bg-gray-100 rounded-full">
                                  <div className={`h-1 rounded-full ${pct>=90?'bg-red-400':pct>=60?'bg-amber-400':'bg-green-400'}`} style={{width:`${pct}%`}} />
                                </div>
                                <span className="text-xs text-gray-400 whitespace-nowrap">{a.soLuongDaDangKy||0}/{a.soLuongMAX}</span>
                              </div>
                            </div>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.cls} flex-shrink-0`}>{s.label}</span>
                          </div>
                        );
                      })}
                      {!loading && activities.length === 0 && <p className="text-center text-gray-400 text-sm py-6">Chưa có hoạt động nào</p>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

        </main>
      </div>
    </div>
  );
};

export default AdminPage;
