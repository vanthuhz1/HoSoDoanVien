import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/doan-khoa';
const H   = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const TABS = [
  { key: 'all',          label: 'Tất cả',        color: 'text-gray-600',   bg: 'bg-gray-100',   activeBg: 'bg-gray-700 text-white' },
  { key: 'Chờ xử lý',   label: 'Chờ xử lý',     color: 'text-orange-600', bg: 'bg-orange-100', activeBg: 'bg-orange-500 text-white' },
  { key: 'Đã xử lý',    label: 'Đã chấp nhận',  color: 'text-green-600',  bg: 'bg-green-100',  activeBg: 'bg-green-600 text-white' },
  { key: 'Từ chối',     label: 'Đã từ chối',    color: 'text-red-600',    bg: 'bg-red-100',    activeBg: 'bg-red-600 text-white' },
];

const STATUS_BADGE = {
  'Chờ xử lý': 'bg-orange-100 text-orange-700 border border-orange-200',
  'Đã xử lý':  'bg-green-100  text-green-700  border border-green-200',
  'Từ chối':   'bg-red-100    text-red-700    border border-red-200',
};

export default function DKKhieuNai() {
  const [tab, setTab]           = useState('all');
  const [list, setList]         = useState([]);
  const [loading, setLoading]   = useState(false);
  const [selected, setSelected] = useState(null);   // khiếu nại đang xem
  const [lyDo, setLyDo]         = useState('');
  const [diemCongThem, setDiemCongThem] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]       = useState(null);
  const [imgModal, setImgModal] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = tab !== 'all' ? `?trangThai=${encodeURIComponent(tab)}` : '';
      const { data } = await axios.get(`${API}/khieu-nai${params}`, { headers: H() });
      setList(data.data || []);
    } catch { showToast('Không tải được dữ liệu', 'error'); }
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleChapNhan = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const { data } = await axios.put(
        `${API}/khieu-nai/${selected.MaKhieuNai}/chap-nhan`, { diemCongThem },
        { headers: H() }
      );
      showToast(data.message);
      setSelected(null);
      fetchData();
    } catch (e) { showToast(e.response?.data?.message || 'Lỗi xử lý', 'error'); }
    finally { setSubmitting(false); }
  };

  const handleTuChoi = async () => {
    if (!lyDo.trim()) { showToast('Vui lòng nhập lý do từ chối', 'error'); return; }
    setSubmitting(true);
    try {
      const { data } = await axios.put(
        `${API}/khieu-nai/${selected.MaKhieuNai}/tu-choi`,
        { lyDo },
        { headers: H() }
      );
      showToast(data.message);
      setSelected(null); setLyDo('');
      fetchData();
    } catch (e) { showToast(e.response?.data?.message || 'Lỗi xử lý', 'error'); }
    finally { setSubmitting(false); }
  };

  const counts = TABS.reduce((acc, t) => {
    acc[t.key] = t.key === 'all' ? list.length : list.filter(x => x.TrangThai === t.key).length;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold flex items-center gap-2 transition-all
          ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          <span className="material-symbols-outlined text-[18px]">
            {toast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-800">Quản lý Khiếu nại</h2>
          <p className="text-sm text-gray-500 mt-0.5">Xử lý khiếu nại của sinh viên về điểm danh hoạt động</p>
        </div>
        <button onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-[#004581] text-white rounded-xl text-sm font-semibold hover:bg-[#003566] transition-colors shadow">
          <span className="material-symbols-outlined text-[18px]">refresh</span>Làm mới
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200
              ${tab === t.key ? t.activeBg : `bg-white border border-gray-200 ${t.color} hover:shadow-sm`}`}>
            {t.label}
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full
              ${tab === t.key ? 'bg-white/30 text-white' : t.bg + ' ' + t.color}`}>
              {counts[t.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <span className="material-symbols-outlined animate-spin text-3xl mr-3">progress_activity</span>
            Đang tải dữ liệu...
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <span className="material-symbols-outlined text-5xl mb-3">inbox</span>
            <p className="font-semibold">Không có khiếu nại nào</p>
            <p className="text-sm mt-1">Chưa có đơn khiếu nại trong tab này</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Sinh viên</th>
                  <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Chi đoàn</th>
                  <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Hoạt động</th>
                  <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Loại khiếu nại</th>
                  <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Nội dung khiếu nại</th>
                  <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Minh chứng</th>
                  <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Ngày gửi</th>
                  <th className="text-left px-4 py-3.5 text-xs font-bold text-orange-500 uppercase tracking-wider">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {list.map(kn => (
                  <tr key={kn.MaKhieuNai}
                    className={`transition-colors cursor-pointer ${
                      kn.TrangThai === 'Chờ xử lý'
                        ? 'hover:bg-orange-50/60 border-l-4 border-l-orange-400'
                        : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                    }`}
                    onClick={() => { setSelected(kn); setLyDo(''); }}>
                    <td className="px-5 py-4">
                      <p className="font-bold text-gray-800">{kn.hoTen}</p>
                      <p className="text-xs text-gray-500 font-mono">{kn.maDV}</p>
                    </td>
                    <td className="px-4 py-4 text-gray-600 text-xs">{kn.tenChiDoan}</td>
                    <td className="px-4 py-4 max-w-[180px]">
                      <p className="font-semibold text-gray-700 truncate" title={kn.tenHD}>{kn.tenHD}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200 whitespace-nowrap">
                        {kn.loaiKhieuNai || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-4 max-w-[220px]">
                      <p className="text-gray-600 text-xs truncate italic" title={kn.GhiChu}>{kn.GhiChu || '—'}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {kn.LinkMinhChung ? kn.LinkMinhChung.split(',').map((link, i) => (
                          <button key={i} onClick={e => { e.stopPropagation(); setImgModal(link); }}
                            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors whitespace-nowrap">
                            <span className="material-symbols-outlined text-[14px]">image</span>
                            {kn.LinkMinhChung.split(',').length > 1 ? `Ảnh ${i+1}` : 'Xem ảnh'}
                          </button>
                        )) : <span className="text-gray-400 text-xs">Không có</span>}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[kn.TrangThai] || 'bg-gray-100 text-gray-600'}`}>
                        {kn.TrangThai}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-gray-400">
                      {new Date(kn.NgayTao).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-4">
                      {kn.TrangThai === 'Chờ xử lý' ? (
                        <button
                          onClick={e => { e.stopPropagation(); setSelected(kn); setLyDo(''); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm whitespace-nowrap">
                          <span className="material-symbols-outlined text-[14px]">gavel</span>
                          Xử lý
                        </button>
                      ) : (
                        <button
                          onClick={e => { e.stopPropagation(); setSelected(kn); setLyDo(''); }}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 text-xs rounded-lg transition-colors whitespace-nowrap">
                          <span className="material-symbols-outlined text-[14px]">visibility</span>
                          Chi tiết
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#00213d] to-[#004581]">
              <div>
                <h3 className="text-base font-bold text-white">Chi tiết Khiếu nại #{selected.MaKhieuNai}</h3>
                <p className="text-xs text-blue-200 mt-0.5">
                  {new Date(selected.NgayTao).toLocaleString('vi-VN')}
                </p>
              </div>
              <button onClick={() => { setSelected(null); setLyDo(''); }}
                className="text-blue-200 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Sinh viên info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Sinh viên</p>
                  <p className="font-bold text-gray-800">{selected.hoTen}</p>
                  <p className="text-xs text-gray-500 font-mono">{selected.maDV}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Chi đoàn</p>
                  <p className="font-semibold text-gray-700 text-sm">{selected.tenChiDoan}</p>
                </div>
              </div>

              {/* Hoạt động */}
              <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                <p className="text-[10px] font-bold text-blue-400 uppercase mb-1">Hoạt động liên quan</p>
                <p className="font-semibold text-blue-800">{selected.tenHD}</p>
                <p className="text-xs text-blue-500 font-mono mt-0.5">ID: {selected.idHD}</p>
              </div>

              {/* Loại khiếu nại */}
              <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
                <p className="text-[10px] font-bold text-purple-500 uppercase mb-1">Loại khiếu nại</p>
                <p className="font-semibold text-purple-800">{selected.loaiKhieuNai || '—'}</p>
              </div>

              {/* Ghi chú SV */}
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                <p className="text-[10px] font-bold text-amber-500 uppercase mb-1">Nội dung khiếu nại</p>
                <p className="text-sm text-gray-700 italic">{selected.GhiChu || 'Không có ghi chú'}</p>
              </div>

              {/* Minh chứng */}
              {selected.LinkMinhChung && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Minh chứng kèm theo</p>
                  <div className="flex gap-2">
                    {selected.LinkMinhChung.split(',').map((link, i) => (
                      <a key={i} href={link} target="_blank" rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-semibold bg-blue-50 hover:bg-blue-100 rounded-xl px-4 py-2.5 transition-colors">
                        <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                        Mở ảnh {selected.LinkMinhChung.split(',').length > 1 ? i+1 : ''}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Trạng thái hiện tại */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500">Trạng thái:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_BADGE[selected.TrangThai]}`}>
                  {selected.TrangThai}
                </span>
              </div>

              {/* Action buttons – chỉ hiện khi chờ xử lý */}
              {selected.TrangThai === 'Chờ xử lý' ? (
                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Cộng điểm bù */}
                    {selected.loaiKhieuNai === 'Sai vai trò' && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-600 uppercase">
                          Điểm cộng bù (nếu duyệt)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={diemCongThem}
                          onChange={e => setDiemCongThem(e.target.value)}
                          className="w-full px-3 py-2.5 text-sm font-bold text-green-600 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-300 transition-all"
                        />
                      </div>
                    )}
                    {/* Từ chối */}
                    <div className={`space-y-2 ${selected.loaiKhieuNai !== 'Sai vai trò' ? 'md:col-span-2' : ''}`}>
                      <label className="text-xs font-bold text-gray-600 uppercase">
                        Lý do từ chối (bắt buộc)
                      </label>
                      <input
                        value={lyDo}
                        onChange={e => setLyDo(e.target.value)}
                        placeholder="VD: Không hợp lệ..."
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-300 transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={handleChapNhan} disabled={submitting}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 shadow-sm">
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      Chấp nhận & Cộng điểm
                    </button>
                    <button onClick={handleTuChoi} disabled={submitting || !lyDo.trim()}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-40 shadow-sm">
                      <span className="material-symbols-outlined text-[18px]">cancel</span>
                      Từ chối
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-t border-gray-100 pt-4 flex flex-col items-center">
                  <p className="text-sm text-gray-400 font-medium mb-2">
                    Khiếu nại này đã được xử lý
                  </p>
                  {selected.TrangThai === 'Đã xử lý' && selected.diemCongThem > 0 && (
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                      Đã cộng bù: +{selected.diemCongThem} điểm
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {imgModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80"
          onClick={() => setImgModal(null)}>
          <div className="relative max-w-2xl max-h-[80vh] rounded-2xl overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <img src={imgModal} alt="Minh chứng" className="object-contain max-h-[80vh]"
              onError={e => { e.target.src = 'https://placehold.co/600x400?text=Không+tải+được+ảnh'; }} />
            <button onClick={() => setImgModal(null)}
              className="absolute top-3 right-3 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/80">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
