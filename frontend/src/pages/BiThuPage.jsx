import { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import Navigation from '../components/layout/Navigation';
import Footer from '../components/layout/Footer';
import { authService } from '../services/authService';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const BiThuPage = () => {
  const currentUser = authService.getCurrentUser();
  const [chiDoanMembers, setChiDoanMembers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [activeTab, setActiveTab] = useState('members');
  const [loading, setLoading] = useState(true);

  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${getToken()}` };

      // Lấy thành viên chi đoàn của bí thư
      const maChiDoan = currentUser?.maChiDoan;
      const [dvRes, actRes] = await Promise.all([
        maChiDoan
          ? axios.get(`${API_URL}/doan-vien/chi-doan/${maChiDoan}`, { headers })
          : axios.get(`${API_URL}/doan-vien`, { headers }),
        axios.get(`${API_URL}/activities/all`, { headers }),
      ]);

      setChiDoanMembers(dvRes.data.data || []);
      setActivities(actRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { key: 'members', label: 'Đoàn viên', icon: 'groups' },
    { key: 'hoat-dong', label: 'Hoạt động', icon: 'event' },
    { key: 'doan-phi', label: 'Đoàn phí', icon: 'payments' },
  ];

  const getStatusColor = (tt) => ({
    'Sắp diễn ra': 'bg-blue-100 text-blue-700',
    'Đã kết thúc': 'bg-gray-100 text-gray-600',
    'Đang diễn ra': 'bg-green-100 text-green-700',
  }[tt] || 'bg-purple-100 text-purple-700');

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col">
      <Header />
      <Navigation />

      <main className="flex-grow py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-500 fill">groups</span>
              Quản lý Chi đoàn
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Xin chào, <strong>{currentUser?.hoTen || currentUser?.tenNguoiDung}</strong> – Bí thư chi đoàn
              {currentUser?.maChiDoan && <span className="ml-1 text-[#004581]">({currentUser.maChiDoan})</span>}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {[
              { icon: 'groups', label: 'Thành viên', value: chiDoanMembers.length, color: 'bg-blue-500' },
              { icon: 'how_to_reg', label: 'Đang SH', value: chiDoanMembers.filter(d => d.trangThaiSH === 'Đang sinh hoạt').length, color: 'bg-green-500' },
              { icon: 'event', label: 'Hoạt động sắp tới', value: activities.filter(a => a.trangThaiHD === 'Sắp diễn ra').length, color: 'bg-purple-500' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.color}`}>
                  <span className="material-symbols-outlined text-2xl text-white fill">{s.icon}</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{s.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex border-b border-gray-200">
              {tabs.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                    activeTab === tab.key ? 'border-[#004581] text-[#004581]' : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}>
                  <span className="material-symbols-outlined text-base fill">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {loading ? (
                <div className="text-center py-12"><span className="material-symbols-outlined animate-spin text-5xl text-gray-300">refresh</span></div>
              ) : (
                <>
                  {/* Members Tab */}
                  {activeTab === 'members' && (
                    <div>
                      <p className="text-sm text-gray-500 mb-4">{chiDoanMembers.length} đoàn viên trong chi đoàn</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {chiDoanMembers.map(dv => (
                          <div key={dv.maDV} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="w-10 h-10 rounded-full bg-[#004581] flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-bold text-sm">
                                {dv.hoTen.split(' ').pop()[0]}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 truncate">{dv.hoTen}</p>
                              <p className="text-xs text-gray-500">{dv.chucVu || 'Đoàn viên'} · {dv.maDV}</p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 font-medium ${
                              dv.trangThaiSH === 'Đang sinh hoạt' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {dv.trangThaiSH === 'Đang sinh hoạt' ? 'Đang SH' : 'Rút HS'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hoạt động Tab */}
                  {activeTab === 'hoat-dong' && (
                    <div className="space-y-3">
                      {activities.map(act => (
                        <div key={act.idHD} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <span className="material-symbols-outlined text-blue-600 fill">event</span>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800">{act.tenHD}</p>
                              <p className="text-xs text-gray-500">{new Date(act.ngayToChuc).toLocaleDateString('vi-VN')}</p>
                            </div>
                          </div>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${getStatusColor(act.trangThaiHD)}`}>
                            {act.trangThaiHD}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Đoàn phí Tab */}
                  {activeTab === 'doan-phi' && (
                    <div className="text-center py-12">
                      <span className="material-symbols-outlined text-6xl text-gray-300">payments</span>
                      <p className="text-gray-500 mt-3">Chức năng quản lý đoàn phí đang được phát triển</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BiThuPage;
