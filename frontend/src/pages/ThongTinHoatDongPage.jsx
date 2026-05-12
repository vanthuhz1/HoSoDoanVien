import { useState, useEffect, useMemo } from 'react';
import { activityService } from '../services/activityService';
import { authService } from '../services/authService';
import { useToast } from '../components/common/Toast';
import Header from '../components/layout/Header';
import Navigation from '../components/layout/Navigation';
import Footer from '../components/layout/Footer';

const ThongTinHoatDongPage = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = authService.getCurrentUser();
  const toast = useToast();

  useEffect(() => {
    fetchMyActivities();
  }, []);

  const fetchMyActivities = async () => {
    setLoading(true);
    try {
      const response = await activityService.getMyActivities();
      if (response.success) {
        setActivities(response.data);
      } else {
        toast.error(response.message || 'Không thể tải danh sách hoạt động');
      }
    } catch (error) {
      toast.error('Không thể tải dữ liệu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelActivity = async (idHD, tenHD) => {
    const confirmed = await toast.confirm(`Bạn có chắc chắn muốn hủy đăng ký hoạt động "${tenHD}" không?`);
    if (!confirmed) return;
    
    try {
      const response = await activityService.unregisterActivity(idHD);
      if (response.success) {
        toast.success(response.message || 'Hủy đăng ký thành công!');
        fetchMyActivities();
      } else {
        toast.error(response.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi hủy đăng ký');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getThamGiaBadge = (status) => {
    switch (status) {
      case 'Đã tham gia': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'Vắng mặt': return 'bg-red-50 text-red-600 border-red-200';
      default: return 'bg-orange-50 text-orange-600 border-orange-200';
    }
  };

  const getCongDiemBadge = (status) => {
    switch (status) {
      case 'Đã cộng': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'Không được cộng': return 'bg-red-50 text-red-600 border-red-200';
      default: return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  };

  // Tính toán thống kê
  const stats = useMemo(() => {
    let totalPoints = 0;

    activities.forEach(act => {
      if (act.trangThaiCongDiem === 'Đã cộng') {
        totalPoints += Number(act.diemHoatDong) || 0;
      }
    });

    return { totalPoints };
  }, [activities]);

  return (
    <div className="bg-[#f8fafc] text-gray-900 min-h-screen flex flex-col font-sans">
      <Header />
      <Navigation />

      <main className="flex-grow py-8 px-4 sm:px-6 lg:px-[100px] w-full mx-auto relative z-20">
        
        {/* Page Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[#004581] uppercase tracking-wide mb-1">
              Thông Tin Hoạt Động
            </h1>
            <p className="text-gray-500 text-sm">
              Theo dõi lịch sử đăng ký và điểm rèn luyện của bạn
            </p>

          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT SIDEBAR: Stats */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-br from-[#004581] to-[#005a9c] p-6 text-center text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 rounded-full bg-white opacity-10 blur-xl"></div>
                <h3 className="text-sm font-medium text-blue-100 mb-1 uppercase tracking-wider">Tổng Điểm Tích Lũy</h3>
                <div className="text-5xl font-black drop-shadow-md flex items-center justify-center gap-2">
                  {stats.totalPoints}
                  <span className="material-symbols-outlined text-3xl text-yellow-400 fill">stars</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Table */}
          <div className="lg:col-span-9 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#004581]">history</span>
                Lịch sử hoạt động
              </h2>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Tên Hoạt Động</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center whitespace-nowrap">Ngày Tổ Chức</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center whitespace-nowrap">Điểm</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center whitespace-nowrap">Tham Gia</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center whitespace-nowrap">Cộng Điểm</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center whitespace-nowrap">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                        <span className="material-symbols-outlined text-4xl animate-spin text-[#004581] mb-2">refresh</span>
                        <p>Đang tải dữ liệu...</p>
                      </td>
                    </tr>
                  ) : activities.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <span className="material-symbols-outlined text-3xl text-gray-400">inbox</span>
                        </div>
                        <p className="font-medium text-gray-600">Bạn chưa đăng ký tham gia hoạt động nào</p>
                        <p className="text-sm mt-1">Hãy quay lại trang chủ để khám phá các hoạt động sắp tới nhé!</p>
                      </td>
                    </tr>
                  ) : (
                    activities.map((act, idx) => (
                      <tr key={`${act.idHD}-${idx}`} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-[#004581] line-clamp-2 leading-snug">{act.tenHD}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex items-center gap-1.5 text-sm text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md">
                            <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                            {formatDate(act.ngayToChuc)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-700 font-bold px-2 py-1 rounded border border-yellow-200">
                            +{act.diemHoatDong}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${getThamGiaBadge(act.trangThaiThamGia)}`}>
                            {act.trangThaiThamGia === 'Đã tham gia' && <span className="material-symbols-outlined text-[14px]">check_circle</span>}
                            {act.trangThaiThamGia === 'Đã Đăng Ký' && <span className="material-symbols-outlined text-[14px]">schedule</span>}
                            {act.trangThaiThamGia === 'Vắng mặt' && <span className="material-symbols-outlined text-[14px]">cancel</span>}
                            {act.trangThaiThamGia}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${getCongDiemBadge(act.trangThaiCongDiem)}`}>
                            {act.trangThaiCongDiem}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {act.trangThaiThamGia === 'Đã Đăng Ký' && (
                            <button
                              onClick={() => handleCancelActivity(act.idHD, act.tenHD)}
                              className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md text-xs font-bold transition-colors inline-flex items-center gap-1 border border-red-100"
                              title="Hủy đăng ký"
                            >
                              <span className="material-symbols-outlined text-[14px]">close</span>
                              Hủy
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Table Footer */}
            {activities.length > 0 && (
              <div className="p-4 border-t border-gray-100 bg-gray-50/50 text-xs text-gray-500 text-center">
                Hiển thị tổng số {activities.length} hoạt động bạn đã đăng ký
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ThongTinHoatDongPage;
