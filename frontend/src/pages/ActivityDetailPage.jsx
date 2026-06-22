import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Navigation from '../components/layout/Navigation';
import Footer from '../components/layout/Footer';
import { activityService } from '../services/activityService';
import { authService } from '../services/authService';
import { useToast } from '../components/common/Toast';

const ActivityDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const isLoggedIn = authService.isAuthenticated();
  const currentUser = authService.getCurrentUser();
  const userRole = parseInt(currentUser?.role);
  const canRegister = isLoggedIn && [3, 4].includes(userRole);

  useEffect(() => {
    fetchActivityDetail();
  }, [id]);

  const fetchActivityDetail = async () => {
    setLoading(true);
    try {
      const response = await activityService.getActivityById(id);
      setActivity(response.data);
    } catch (error) {
      console.error('Error fetching activity detail:', error);
      toast.error('Không thể tải thông tin hoạt động');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    if (!canRegister) {
      toast.warning('Chỉ Bí thư và Đoàn viên mới có thể đăng ký hoạt động');
      return;
    }

    const confirmed = await toast.confirm(`Xác nhận đăng ký tham gia "${activity.tenHD}"?`);
    if (!confirmed) return;

    try {
      const response = await activityService.registerActivity(activity.idHD);
      toast.success(response.message || 'Đăng ký thành công!');
      fetchActivityDetail();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại';
      toast.error(errorMsg);
    }
  };

  const handleUnregister = async () => {
    const confirmed = await toast.confirm(`Xác nhận HỦY đăng ký "${activity.tenHD}"?`);
    if (!confirmed) return;

    try {
      const response = await activityService.unregisterActivity(activity.idHD);
      toast.success(response.message || 'Hủy đăng ký thành công!');
      fetchActivityDetail();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Hủy đăng ký thất bại';
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

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-[#f8fafc] text-gray-900 min-h-screen flex flex-col font-sans">
        <Header />
        <Navigation />
        <main className="flex-grow flex items-center justify-center py-16">
          <div className="text-center">
            <span className="material-symbols-outlined text-6xl text-[#004581] animate-spin">refresh</span>
            <p className="mt-4 text-gray-500 font-medium text-lg">Đang tải thông tin hoạt động...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="bg-[#f8fafc] text-gray-900 min-h-screen flex flex-col font-sans">
        <Header />
        <Navigation />
        <main className="flex-grow flex items-center justify-center py-16">
          <div className="text-center">
            <span className="material-symbols-outlined text-6xl text-gray-400">event_busy</span>
            <p className="mt-4 text-gray-700 font-bold text-xl">Không tìm thấy hoạt động</p>
            <button
              onClick={() => navigate('/')}
              className="mt-6 bg-[#004581] text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700"
            >
              Quay về trang chủ
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isFull = activity.soLuongDaDangKy >= activity.soLuongMAX;
  const fillPercent = Math.min(100, Math.round((activity.soLuongDaDangKy / activity.soLuongMAX) * 100));
  const daDangKy = activity.daDangKy === true;
  const coTheHuy = daDangKy && activity.trangThaiThamGia === 'Đã Đăng Ký';

  return (
    <div className="bg-[#f8fafc] text-gray-900 min-h-screen flex flex-col font-sans">
      <Header />
      <Navigation />

      <main className="flex-grow pb-16">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-[100px] pt-8">
          {/* Back Button */}
          <button
            onClick={() => navigate('/')}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-[#004581] font-semibold transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Quay lại trang chủ
          </button>

          {/* Main Content */}
          <div className="bg-white rounded-2xl shadow-xl shadow-blue-900/5 border border-gray-100 overflow-hidden">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-[#004581] to-blue-600 px-8 py-8 text-white relative">
              <div className="absolute top-6 right-6 flex flex-col gap-2">
                {/* Badge trạng thái */}
                {activity.trangThaiHD && (
                  <div className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border-2 shadow-lg ${
                    activity.trangThaiHD === 'Đang mở' 
                      ? 'bg-emerald-500 text-white border-emerald-300' 
                      : activity.trangThaiHD === 'Chờ duyệt'
                      ? 'bg-blue-500 text-white border-blue-300'
                      : activity.trangThaiHD === 'Đã kết thúc'
                      ? 'bg-gray-500 text-white border-gray-300'
                      : 'bg-red-500 text-white border-red-300'
                  }`}>
                    <span className="material-symbols-outlined text-[16px] fill">
                      {activity.trangThaiHD === 'Đang mở' ? 'check_circle' : 
                       activity.trangThaiHD === 'Chờ duyệt' ? 'schedule' :
                       activity.trangThaiHD === 'Đã kết thúc' ? 'event_busy' : 'cancel'}
                    </span>
                    <span className="text-sm font-bold">{activity.trangThaiHD}</span>
                  </div>
                )}
                
                {/* Badge điểm */}
                {activity.diemHoatDong > 0 && (
                  <div className="inline-flex items-center gap-1 bg-yellow-400 text-yellow-900 px-3 py-1.5 rounded-lg border-2 border-yellow-300 shadow-lg">
                    <span className="material-symbols-outlined text-yellow-900 text-[16px] fill">stars</span>
                    <span className="text-sm font-bold">+{activity.diemHoatDong} điểm</span>
                  </div>
                )}
              </div>

              <h1 className="text-3xl font-extrabold mb-3 pr-48">{activity.tenHD}</h1>
              <div className="flex items-center gap-2 text-blue-100">
                <span className="material-symbols-outlined text-[20px]">business</span>
                <span className="font-medium">{activity.donViToChuc}</span>
              </div>
            </div>

            {/* Body Section */}
            <div className="p-8">
              {/* Mô tả */}
              {activity.moTa && (
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-[#004581] mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined">description</span>
                    Mô tả hoạt động
                  </h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">{activity.moTa}</p>
                </div>
              )}

              {/* Thông tin chi tiết - 2 cột */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Cột trái: Thời gian & Địa điểm */}
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-[#004581] text-[24px]">calendar_month</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Thời gian tổ chức</p>
                      <p className="text-base text-gray-800 font-bold">{formatDateTime(activity.ngayToChuc)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-emerald-600 text-[24px]">location_on</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Địa điểm</p>
                      <p className="text-base text-gray-800 font-bold">{activity.diaDiem}</p>
                    </div>
                  </div>
                </div>

                {/* Cột phải: Điểm & Trạng thái */}
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                    <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-yellow-600 text-[24px] fill">stars</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Điểm hoạt động</p>
                      <p className="text-base text-gray-800 font-bold">+{activity.diemHoatDong} điểm</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-purple-600 text-[24px]">
                        {activity.trangThaiHD === 'Đang mở' ? 'check_circle' : 
                         activity.trangThaiHD === 'Chờ duyệt' ? 'schedule' :
                         activity.trangThaiHD === 'Đã kết thúc' ? 'event_busy' : 'cancel'}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Trạng thái</p>
                      <p className="text-base text-gray-800 font-bold">{activity.trangThaiHD}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lưu ý / Link đính kèm */}
              {activity.luuY && (
                <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <h3 className="text-sm font-bold text-yellow-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">info</span>
                    Lưu ý
                  </h3>
                  <p className="text-gray-700">{activity.luuY}</p>
                </div>
              )}

              {/* Tiến độ đăng ký */}
              <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex justify-between items-end mb-3">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Tiến độ đăng ký</h3>
                  <span className={`text-2xl font-extrabold ${isFull ? 'text-red-600' : 'text-[#004581]'}`}>
                    {activity.soLuongDaDangKy} <span className="text-base text-gray-400 font-medium">/ {activity.soLuongMAX === 99999 ? '∞' : activity.soLuongMAX}</span>
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${isFull ? 'bg-red-500' : fillPercent > 80 ? 'bg-orange-500' : 'bg-emerald-500'}`}
                    style={{ width: `${fillPercent}%` }}
                  />
                </div>
                {isFull && (
                  <p className="mt-3 text-sm text-red-600 font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    Hoạt động đã đủ số lượng đăng ký
                  </p>
                )}
              </div>

              {/* Trạng thái đăng ký */}
              {daDangKy && (
                <div className="mb-6">
                  {activity.trangThaiThamGia === 'Đã Đăng Ký' ? (
                    <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl flex items-center gap-3">
                      <span className="material-symbols-outlined text-emerald-600 text-[28px] fill">check_circle</span>
                      <div>
                        <span className="text-base font-bold text-emerald-700 block">Bạn đã đăng ký hoạt động này</span>
                        <span className="text-sm text-emerald-600">Trạng thái: {activity.trangThaiThamGia}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl flex items-center gap-3">
                      <span className="material-symbols-outlined text-blue-600 text-[28px] fill">info</span>
                      <div>
                        <span className="text-base font-bold text-blue-700 block">Bạn đã đăng ký hoạt động này</span>
                        <span className="text-sm text-blue-600">Trạng thái: {activity.trangThaiThamGia}</span>
                        <span className="text-xs text-blue-500 block mt-1">Không thể hủy đăng ký vì đã {activity.trangThaiThamGia.toLowerCase()}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                {!isLoggedIn ? (
                  <button
                    onClick={() => navigate('/login')}
                    className="flex-1 bg-[#004581] text-white font-bold py-4 px-6 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <span className="material-symbols-outlined text-[24px]">login</span>
                    Đăng nhập để đăng ký
                  </button>
                ) : !canRegister ? (
                  <div className="flex-1 p-4 bg-gray-100 border border-gray-300 rounded-xl text-center">
                    <p className="text-gray-600 font-semibold">Chỉ Bí thư và Đoàn viên mới có thể đăng ký hoạt động</p>
                  </div>
                ) : daDangKy ? (
                  <>
                    {coTheHuy ? (
                      <button
                        onClick={handleUnregister}
                        className="flex-1 bg-red-500 text-white font-bold py-4 px-6 rounded-xl hover:bg-red-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg"
                      >
                        <span className="material-symbols-outlined text-[24px]">cancel</span>
                        Hủy đăng ký
                      </button>
                    ) : (
                      <button
                        disabled
                        className="flex-1 bg-gray-300 text-gray-500 font-bold py-4 px-6 rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[24px]">lock</span>
                        Không thể hủy đăng ký
                      </button>
                    )}
                    <button
                      onClick={() => navigate('/')}
                      className="px-6 py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[24px]">home</span>
                      Trang chủ
                    </button>
                  </>
                ) : isFull ? (
                  <button
                    disabled
                    className="flex-1 bg-gray-300 text-gray-500 font-bold py-4 px-6 rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[24px]">block</span>
                    Đã đủ số lượng
                  </button>
                ) : activity.trangThaiHD !== 'Đang mở' ? (
                  <button
                    disabled
                    className="flex-1 bg-gray-300 text-gray-500 font-bold py-4 px-6 rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[24px]">lock</span>
                    Hoạt động không mở đăng ký
                  </button>
                ) : (
                  <button
                    onClick={handleRegister}
                    className="flex-1 bg-emerald-500 text-white font-bold py-4 px-6 rounded-xl hover:bg-emerald-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <span className="material-symbols-outlined text-[24px]">how_to_reg</span>
                    Đăng ký tham gia
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ActivityDetailPage;
