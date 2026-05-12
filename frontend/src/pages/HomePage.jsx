import { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import Navigation from '../components/layout/Navigation';
import Footer from '../components/layout/Footer';
import { activityService } from '../services/activityService';
import { authService } from '../services/authService';
import { thongBaoService } from '../services/thongBaoService';
import { useToast } from '../components/common/Toast';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const [activities, setActivities] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', diemRenLuyen: '' });
  const navigate = useNavigate();
  const toast = useToast();

  const isLoggedIn = authService.isAuthenticated();
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [activitiesRes, announcementsRes] = await Promise.all([
        activityService.getHomeActivities(filters),
        thongBaoService.getAll({ phamVi: 'Công khai' })
      ]);
      setActivities(activitiesRes.data || []);
      setAnnouncements(announcementsRes.data || []);
      setCurrentPage(1); // Reset page on new data
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => fetchData();

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') fetchData();
  };

  const handleRegister = async (activity) => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    const userRole = parseInt(currentUser?.role);
    if (![3, 4].includes(userRole)) {
      toast.warning('Chỉ Bí thư và Đoàn viên mới có thể đăng ký hoạt động');
      return;
    }

    const confirmed = await toast.confirm(`Xác nhận đăng ký tham gia "${activity.tenHD}"?`);
    if (!confirmed) return;

    try {
      const response = await activityService.registerActivity(activity.idHD);
      toast.success(response.message || 'Đăng ký thành công!');
      fetchData();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại';
      toast.error(errorMsg);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getAnnounceBadge = (loai) => {
    if (loai === 'Khẩn cấp') return 'bg-red-50 text-red-600 border-red-200';
    if (loai === 'Sự kiện') return 'bg-purple-50 text-purple-600 border-purple-200';
    return 'bg-blue-50 text-blue-600 border-blue-200';
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentActivities = activities.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(activities.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-[#f8fafc] text-gray-900 min-h-screen flex flex-col font-sans">
      <Header />
      <Navigation />

      <main className="flex-grow pb-16">
        {/* Main Content Layout */}
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-[100px] pt-8 relative z-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: Activities (Takes 9/12 width) */}
            <div className="lg:col-span-9 space-y-6">
              
              {/* Header & Search/Filter Bar */}
              <div className="bg-white rounded-2xl shadow-xl shadow-blue-900/5 border border-gray-100 p-4 pl-6">
                <h2 className="text-xl font-extrabold text-[#004581] flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-orange-500 fill text-2xl">local_fire_department</span>
                  HOẠT ĐỘNG MỞ ĐĂNG KÝ
                </h2>
                
                <div className="flex flex-col md:flex-row gap-3">
                  {/* Search by name */}
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-gray-400">search</span>
                    </span>
                    <input
                      type="text"
                      name="search"
                      value={filters.search}
                      onChange={handleFilterChange}
                      onKeyDown={handleKeyDown}
                      placeholder="Tìm theo tên hoạt động..."
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-[#004581]/20 focus:border-[#004581] transition-all outline-none"
                    />
                  </div>

                  {/* Filter by points */}
                  <div className="relative w-full md:w-48">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-gray-400">stars</span>
                    </span>
                    <select
                      name="diemRenLuyen"
                      value={filters.diemRenLuyen}
                      onChange={handleFilterChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-[#004581]/20 focus:border-[#004581] transition-all outline-none appearance-none cursor-pointer"
                    >
                      <option value="">Tất cả điểm</option>
                      <option value="1">1 điểm</option>
                      <option value="2">2 điểm</option>
                      <option value="3">3 điểm</option>
                      <option value="4">4 điểm</option>
                      <option value="5">5 điểm</option>
                      <option value="6">6 điểm</option>
                      <option value="7">7 điểm</option>
                      <option value="8">8 điểm</option>
                      <option value="9">9 điểm</option>
                      <option value="10">10 điểm</option>
                    </select>
                  </div>

                  <button
                    onClick={handleSearch}
                    className="bg-[#004581] text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">filter_alt</span>
                    Lọc
                  </button>
                </div>
              </div>

              {/* Activities Grid */}
              <div>
                {loading ? (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                    <span className="material-symbols-outlined text-4xl text-[#004581] animate-spin">refresh</span>
                    <p className="mt-4 text-gray-500 font-medium">Đang tải danh sách hoạt động...</p>
                  </div>
                ) : activities.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="material-symbols-outlined text-4xl text-gray-300">event_busy</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-700 mb-1">Không tìm thấy hoạt động</h3>
                    <p className="text-gray-500 text-sm">Hiện không có hoạt động nào đang mở hoặc phù hợp với tìm kiếm của bạn.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {currentActivities.map((activity) => {
                      const isFull = activity.soLuongDaDangKy >= activity.soLuongMAX;
                      const fillPercent = Math.min(100, Math.round((activity.soLuongDaDangKy / activity.soLuongMAX) * 100));
                      const daDangKy = activity.daDangKy === true;

                      return (
                        <div
                          key={activity.idHD}
                          className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-blue-900/10 hover:-translate-y-1 transition-all duration-300 flex flex-col relative"
                        >
                          {/* Card Body */}
                          <div className="p-5 flex-1 flex flex-col pt-6">
                            {/* Badge trạng thái và điểm */}
                            <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                              {/* Badge trạng thái động từ database */}
                              {activity.trangThaiHD && (
                                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border shadow-sm ${
                                  activity.trangThaiHD === 'Đang mở' 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                    : activity.trangThaiHD === 'Chờ duyệt'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : activity.trangThaiHD === 'Đã kết thúc'
                                    ? 'bg-gray-50 text-gray-700 border-gray-200'
                                    : 'bg-red-50 text-red-700 border-red-200'
                                }`}>
                                  <span className={`material-symbols-outlined text-[14px] fill ${
                                    activity.trangThaiHD === 'Đang mở' ? 'text-emerald-600' : 
                                    activity.trangThaiHD === 'Chờ duyệt' ? 'text-blue-600' :
                                    activity.trangThaiHD === 'Đã kết thúc' ? 'text-gray-600' : 'text-red-600'
                                  }`}>
                                    {activity.trangThaiHD === 'Đang mở' ? 'check_circle' : 
                                     activity.trangThaiHD === 'Chờ duyệt' ? 'schedule' :
                                     activity.trangThaiHD === 'Đã kết thúc' ? 'event_busy' : 'cancel'}
                                  </span>
                                  <span className="text-xs font-bold">{activity.trangThaiHD}</span>
                                </div>
                              )}
                              
                              {/* Badge điểm */}
                              {activity.diemHoatDong > 0 && (
                                <div className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-1 rounded-md border border-yellow-200 shadow-sm">
                                  <span className="material-symbols-outlined text-yellow-500 text-[14px] fill">stars</span>
                                  <span className="text-xs font-bold">+{activity.diemHoatDong}</span>
                                </div>
                              )}
                            </div>

                            <h3 className="font-bold text-[#004581] text-[17px] leading-snug mb-2 pr-24 group-hover:text-blue-600 transition-colors line-clamp-2">
                              {activity.tenHD}
                            </h3>
                            
                            {activity.moTa && (
                              <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                                {activity.moTa}
                              </p>
                            )}

                            {/* Details List */}
                            <div className="space-y-2.5 mb-5 mt-auto flex-1">
                              <div className="flex items-start gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                  <span className="material-symbols-outlined text-[#004581] text-[18px]">calendar_month</span>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Thời gian</p>
                                  <p className="text-sm text-gray-800 font-medium">
                                    {formatTime(activity.ngayToChuc)} - {formatDate(activity.ngayToChuc)}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-start gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                  <span className="material-symbols-outlined text-emerald-600 text-[18px]">location_on</span>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Địa điểm</p>
                                  <p className="text-sm text-gray-800 font-medium line-clamp-1">{activity.diaDiem}</p>
                                </div>
                              </div>
                            </div>

                            {/* Progress */}
                            <div className="bg-gray-50 rounded-xl p-3 mb-4 border border-gray-100">
                              <div className="flex justify-between items-end mb-2">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tiến độ</span>
                                <span className={`text-sm font-extrabold ${isFull ? 'text-red-600' : 'text-[#004581]'}`}>
                                  {activity.soLuongDaDangKy} <span className="text-xs text-gray-400 font-medium">/ {activity.soLuongMAX === 99999 ? '∞' : activity.soLuongMAX}</span>
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-1000 ${isFull ? 'bg-red-500' : fillPercent > 80 ? 'bg-orange-500' : 'bg-emerald-500'}`}
                                  style={{ width: `${fillPercent}%` }}
                                />
                              </div>
                            </div>

                            {/* Action Button - Đăng ký / Đã đăng ký */}
                            {!isLoggedIn ? (
                              <button
                                onClick={() => navigate('/login')}
                                className="w-full bg-[#004581] text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                              >
                                <span className="material-symbols-outlined text-[20px]">login</span>
                                Đăng nhập để đăng ký
                              </button>
                            ) : daDangKy ? (
                              <button
                                disabled
                                className="w-full bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl cursor-not-allowed flex items-center justify-center gap-2 shadow-md opacity-80"
                              >
                                <span className="material-symbols-outlined text-[20px] fill">check_circle</span>
                                Đã đăng ký
                              </button>
                            ) : isFull ? (
                              <button
                                disabled
                                className="w-full bg-gray-300 text-gray-500 font-bold py-3 px-4 rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
                              >
                                <span className="material-symbols-outlined text-[20px]">block</span>
                                Đã đủ số lượng
                              </button>
                            ) : (
                              <button
                                onClick={() => handleRegister(activity)}
                                className="w-full bg-[#004581] text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg group-hover:bg-[#003b70]"
                              >
                                <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
                                Đăng ký
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-8">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-50 flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                      </button>
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => handlePageChange(i + 1)}
                          className={`w-8 h-8 rounded-lg text-sm font-bold flex items-center justify-center transition-colors ${
                            currentPage === i + 1 
                              ? 'bg-[#004581] text-white' 
                              : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-50 flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

            {/* RIGHT COLUMN: Announcements (Takes 3/12 width) */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white rounded-2xl shadow-xl shadow-blue-900/5 border border-gray-100 overflow-hidden sticky top-6">
                
                {/* Premium Header */}
                <div className="bg-gradient-to-r from-gray-50 to-white px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
                    <span className="material-symbols-outlined text-[20px] fill">campaign</span>
                  </div>
                  <h2 className="text-gray-800 font-extrabold text-base uppercase tracking-wider">
                    Thông báo mới
                  </h2>
                </div>
                
                <div className="p-0">
                  {loading ? (
                    <div className="p-8 text-center text-gray-400">Đang tải...</div>
                  ) : announcements.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">Không có thông báo.</div>
                  ) : (
                    <div className="divide-y divide-gray-100 max-h-[800px] overflow-y-auto custom-scrollbar">
                      {announcements.map((tb) => (
                        <div key={tb.idThongBao} className="p-5 hover:bg-blue-50/50 transition-colors cursor-pointer group">
                          <div className="flex items-center gap-2 mb-2.5">
                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border rounded shadow-sm ${getAnnounceBadge(tb.loai)}`}>
                              Từ {tb.phamVi}
                            </span>
                            <span className="text-[11px] text-gray-400 font-medium">
                              {new Date(tb.ngayTao).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </span>
                          </div>
                          <h3 className="font-bold text-gray-800 text-[15px] leading-snug group-hover:text-[#004581] transition-colors">
                            {tb.tieuDe}
                          </h3>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background-color: #94a3b8; }
      `}</style>
    </div>
  );
};

export default HomePage;
