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
  const [knModal, setKnModal] = useState(false);
  const [knActivity, setKnActivity] = useState(null);
  const [knForm, setKnForm] = useState({ loaiKhieuNai: 'Vắng mặt', ghiChu: '', files: [] });
  const [knSubmitting, setKnSubmitting] = useState(false);
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

  const canKhieuNai = (act) => {
    if (act.trangThaiKhieuNai === 'Từ chối') return true;
    if (act.daKhieuNai) return false;
    if (act.trangThaiHD !== 'Đã kết thúc') return false;
    if (act.daKhieuNai) return false;
    if (!['Vắng mặt', 'Đã tham gia'].includes(act.trangThaiThamGia)) return false;
    if (!act.ngayToChuc) return false;
    const daysSinceEnded = (new Date() - new Date(act.ngayToChuc)) / (1000 * 3600 * 24);
    if (daysSinceEnded > 7) return false;
    return true;
  };

  const handleKhieuNaiSubmit = async (e) => {
    e.preventDefault();
    if (!knForm.files || knForm.files.length === 0) { toast.warning('Vui lòng upload ảnh minh chứng!'); return; }
    if (knForm.files.length > 2) { toast.warning('Chỉ được phép upload tối đa 2 ảnh!'); return; }
    setKnSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('loaiKhieuNai', knForm.loaiKhieuNai);
      formData.append('ghiChu', knForm.ghiChu);
      Array.from(knForm.files).forEach(file => {
        formData.append('minhChung', file);
      });
      const res = await activityService.submitKhieuNai(knActivity.idHD, formData);
      if (res.success) {
        toast.success(res.message);
        setKnModal(false);
        fetchMyActivities();
      }
    } catch(err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setKnSubmitting(false);
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
      case 'Đã tích lũy': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'Chưa cộng': return 'bg-gray-100 text-gray-500 border-gray-200';
      default: return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  };

  // Tính toán thống kê
  const stats = useMemo(() => {
    let totalPoints = 0;

    activities.forEach(act => {
      if (act.trangThaiCongDiem === 'Đã tích lũy') {
        let pts = Number(act.diemHoatDong) || 0;
        if (act.trangThaiKhieuNai === 'Đã xử lý' && act.diemCongThem) {
          pts += Number(act.diemCongThem);
        }
        totalPoints += pts;
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
                          <div className="inline-flex flex-col items-center gap-1">
                            <div className="bg-yellow-50 text-yellow-700 font-bold px-2 py-1 rounded border border-yellow-200">
                              +{act.diemHoatDong}
                            </div>
                            {act.trangThaiKhieuNai === 'Đã xử lý' && act.diemCongThem > 0 && (
                              <div className="bg-green-50 text-green-700 font-bold text-xs px-2 py-0.5 rounded border border-green-200" title="Điểm cộng bù từ khiếu nại">
                                +{act.diemCongThem} bù
                              </div>
                            )}
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
                          <div className="flex flex-col gap-2 items-center justify-center">
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
                            {canKhieuNai(act) && (
                              <button
                                onClick={() => { 
                                  const fixedLoai = (act.trangThaiCongDiem === 'Đã tích lũy' || act.trangThaiThamGia === 'Đã tham gia') ? 'Sai vai trò' : 'Vắng mặt';
                                  setKnActivity(act); 
                                  setKnForm({ loaiKhieuNai: fixedLoai, ghiChu: '', files: [] }); 
                                  setKnModal(true); 
                                }}
                                className="text-orange-500 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-md text-xs font-bold transition-colors inline-flex items-center gap-1 border border-orange-100"
                                title={act.trangThaiKhieuNai === 'Từ chối' ? "Gửi lại khiếu nại" : "Khiếu nại"}
                              >
                                <span className="material-symbols-outlined text-[14px]">report_problem</span>
                                {act.trangThaiKhieuNai === 'Từ chối' ? "Gửi lại" : "Khiếu nại"}
                              </button>
                            )}
                            {act.daKhieuNai && act.trangThaiKhieuNai !== 'Từ chối' && (
                              <span className="text-gray-500 bg-gray-100 px-3 py-1.5 rounded-md text-xs font-bold inline-flex items-center gap-1 border border-gray-200">
                                <span className="material-symbols-outlined text-[14px]">check</span>
                                {act.trangThaiKhieuNai || 'Đã khiếu nại'}
                              </span>
                            )}
                          </div>
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

      {/* Modal Khiếu nại */}
      {knModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-[#004581] p-4 text-white flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2">
                <span className="material-symbols-outlined">report_problem</span>
                Gửi Đơn Khiếu Nại
              </h3>
              <button onClick={() => setKnModal(false)} className="hover:text-gray-200">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleKhieuNaiSubmit} className="p-6">
              <div className="mb-4">
                <p className="text-sm font-bold text-gray-700 mb-1">Hoạt động</p>
                <p className="text-sm text-gray-500 bg-gray-100 p-2 rounded-lg">{knActivity?.tenHD}</p>
              </div>

              <div className="mb-4">
                <label className="text-sm font-bold text-gray-700 block mb-1">Loại khiếu nại <span className="text-red-500">*</span></label>
                <select
                  value={knForm.loaiKhieuNai}
                  disabled={true}
                  className="w-full border border-gray-300 p-2 rounded-lg text-sm bg-gray-100 cursor-not-allowed outline-none"
                >
                  <option value="Vắng mặt">Vắng mặt (Đã đi nhưng đánh vắng)</option>
                  <option value="Sai vai trò">Sai vai trò (Đã đi nhưng sai điểm)</option>
                </select>
              </div>

              {knForm.loaiKhieuNai === 'Sai vai trò' && (
                <div className="mb-4 bg-orange-50 border border-orange-200 p-3 rounded-lg flex gap-2 text-sm text-orange-800">
                  <span className="material-symbols-outlined text-orange-500 text-[18px]">warning</span>
                  <span>Nếu khiếu nại sai điểm Ban tổ chức, bắt buộc phải chụp kèm thẻ đeo BTC hoặc minh chứng phân công.</span>
                </div>
              )}

              <div className="mb-4">
                <label className="text-sm font-bold text-gray-700 block mb-1">Ảnh minh chứng <span className="text-red-500">*</span></label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={e => setKnForm({ ...knForm, files: e.target.files })}
                  className="w-full border border-gray-300 p-2 rounded-lg text-sm"
                  required
                />
                {knForm.files && knForm.files.length > 2 && (
                  <p className="text-red-500 text-xs mt-1">Chỉ được chọn tối đa 2 ảnh</p>
                )}
              </div>

              <div className="mb-6">
                <label className="text-sm font-bold text-gray-700 block mb-1">Ghi chú thêm</label>
                <textarea
                  value={knForm.ghiChu}
                  onChange={e => setKnForm({ ...knForm, ghiChu: e.target.value })}
                  className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                  rows="3"
                  placeholder="Mô tả chi tiết vấn đề của bạn..."
                ></textarea>
              </div>

              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setKnModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-200">Hủy</button>
                <button type="submit" disabled={knSubmitting} className="px-4 py-2 bg-[#004581] text-white rounded-lg font-bold text-sm hover:bg-blue-800 disabled:opacity-50 flex items-center gap-2">
                  {knSubmitting ? 'Đang gửi...' : 'Gửi khiếu nại'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ThongTinHoatDongPage;
