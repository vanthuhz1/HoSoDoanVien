import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const API = 'http://localhost:5001/api/doan-khoa';
const H   = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });
const fmtTime = d => d ? new Date(d).toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit', second:'2-digit' }) : '—';

/* ── QR MOCK (jsQR nếu cần camera thật) ── */
const QR_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5Y2EzYWYiIGZvbnQtc2l6ZT0iMTQiIGR5PSIuM2VtIj5DYW1lcmEgUVIgU2Nhbm5lcjwvdGV4dD48L3N2Zz4=';

const DKDiemDanh = () => {
  const [hdList, setHdList]       = useState([]);
  const [selHD, setSelHD]         = useState('');
  const [hdInfo, setHdInfo]       = useState(null);
  const [danhSach, setDanhSach]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [scanning, setScanning]   = useState(false);
  const [manualId, setManualId]   = useState('');
  const [toast, setToast]         = useState(null);
  const [stats, setStats]         = useState({ total:0, checkedIn:0 });
  const inputRef = useRef(null);

  // Tải danh sách HĐ đang mở
  useEffect(() => {
    axios.get(`${API}/hoat-dong-dang-mo`, { headers: H() })
      .then(r => setHdList(r.data.data || []))
      .catch(console.error);
  }, []);

  // Tải danh sách đăng ký khi chọn HĐ
  const loadDanhSach = useCallback(async (idHD) => {
    if (!idHD) return;
    setLoading(true);
    try {
      const r = await axios.get(`${API}/diem-danh/${idHD}`, { headers: H() });
      const list = r.data.data || [];
      setDanhSach(list);
      setHdInfo(r.data.hoatDong);
      setStats({ total: list.length, checkedIn: list.filter(d=>d.trangThaiThamGia==='Đã tham gia').length });
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadDanhSach(selHD); }, [selHD, loadDanhSach]);

  const showToast = (msg, type='success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const doCheckIn = async (maDV) => {
    if (!selHD) { showToast('Vui lòng chọn hoạt động', 'error'); return; }
    const id = (maDV || manualId).trim();
    if (!id) return;
    try {
      const r = await axios.put(`${API}/check-in`, { maDV: id, idHD: selHD }, { headers: H() });
      showToast(`✅ Check-in: ${r.data.doanVien?.hoTen || id}`, 'success');
      // Cập nhật realtime trong danh sách
      setDanhSach(prev => prev.map(d =>
        d.maDV === id ? { ...d, trangThaiThamGia:'Đã tham gia', ThoiGianCheckIn: new Date().toISOString() } : d
      ));
      setStats(prev => ({ ...prev, checkedIn: prev.checkedIn + 1 }));
      setManualId('');
      if (inputRef.current) inputRef.current.focus();
    } catch(e) {
      const msg = e.response?.data?.message || 'Lỗi check-in';
      showToast(`❌ ${msg}`, 'error');
    }
  };

  const handleManualSubmit = e => { e.preventDefault(); doCheckIn(manualId); };
  const pct = stats.total > 0 ? Math.round(stats.checkedIn / stats.total * 100) : 0;

  return (
    <div className="flex flex-col gap-5" style={{fontFamily:"'Inter',sans-serif"}}>
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Duyệt Điểm Danh QR</h2>
        <p className="text-sm text-gray-400 mt-0.5">Quét mã QR sinh viên để ghi nhận tham dự</p>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-2xl text-white text-sm font-bold flex items-center gap-2 transition-all ${toast.type==='success'?'bg-emerald-500':'bg-red-500'}`}>
          {toast.msg}
        </div>
      )}

      {/* Chọn hoạt động */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Chọn hoạt động đang diễn ra</label>
        <select value={selHD} onChange={e => setSelHD(e.target.value)}
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 focus:outline-none focus:border-[#004581] bg-gray-50 focus:bg-white transition-all">
          <option value="">-- Chọn hoạt động --</option>
          {hdList.map(hd => (
            <option key={hd.idHD} value={hd.idHD}>{hd.tenHD} · {new Date(hd.ngayToChuc).toLocaleDateString('vi-VN')}</option>
          ))}
        </select>
        {hdList.length === 0 && (
          <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">info</span>
            Hiện chưa có hoạt động nào đang mở. Liên hệ Admin chuyển trạng thái.
          </p>
        )}
      </div>

      {selHD && (
        <>
          {/* Stats realtime */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label:'Tổng đăng ký', val: stats.total,                   bg:'bg-[#004581]' },
              { label:'Đã Check-in',  val: stats.checkedIn,               bg:'bg-emerald-500' },
              { label:'Chưa đến',     val: stats.total - stats.checkedIn, bg:'bg-gray-400' },
            ].map(s => (
              <div key={s.label} className={`${s.bg} text-white rounded-2xl p-4 text-center shadow-lg`}>
                <p className="text-4xl font-black">{s.val}</p>
                <p className="text-sm font-semibold opacity-80 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Progress */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-bold text-gray-700">Tiến độ điểm danh</span>
              <span className={`text-sm font-black ${pct>=80?'text-emerald-600':pct>=50?'text-amber-600':'text-red-500'}`}>{pct}%</span>
            </div>
            <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#004581] to-emerald-400 rounded-full transition-all duration-500"
                style={{width:`${pct}%`}} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Scanner Panel */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#004581] fill">qr_code_scanner</span>
                Quét mã QR
              </h3>

              {/* Camera mock / manual input */}
              <div className="flex flex-col gap-3">
                <button onClick={() => setScanning(s => !s)}
                  className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    scanning ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gradient-to-r from-[#004581] to-[#0066bb] text-white hover:shadow-lg'
                  }`}>
                  <span className="material-symbols-outlined fill">{scanning?'stop_circle':'photo_camera'}</span>
                  {scanning ? 'Dừng Camera' : 'Mở Camera Quét QR Sinh viên'}
                </button>

                {scanning && (
                  <div className="relative w-full h-52 bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center">
                    <img src={QR_PLACEHOLDER} alt="Camera" className="w-full h-full object-cover opacity-30" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="w-32 h-32 border-2 border-[#004581] rounded-lg relative">
                        <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-[#004581] rounded-tl" />
                        <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-[#004581] rounded-tr" />
                        <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-[#004581] rounded-bl" />
                        <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-[#004581] rounded-br" />
                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-[#004581] animate-bounce opacity-70" />
                      </div>
                      <p className="text-white/60 text-xs mt-3">Hướng camera vào mã QR của sinh viên</p>
                    </div>
                  </div>
                )}

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                  <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400 font-semibold">HOẶC NHẬP THỦ CÔNG</span></div>
                </div>

                <form onSubmit={handleManualSubmit} className="flex gap-2">
                  <input ref={inputRef} value={manualId} onChange={e=>setManualId(e.target.value)}
                    placeholder="Nhập MSSV / Mã ĐV..." autoFocus
                    className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#004581] bg-gray-50 focus:bg-white transition-all font-mono" />
                  <button type="submit"
                    className="px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm fill">how_to_reg</span>OK
                  </button>
                </form>
                <p className="text-xs text-gray-400 text-center">Nhấn Enter hoặc bấm OK sau khi quét/nhập mã</p>
              </div>
            </div>

            {/* Live Table */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#004581] fill text-base">list_alt</span>
                  Danh sách tham dự
                </h3>
                <button onClick={() => loadDanhSach(selHD)} className="text-gray-400 hover:text-[#004581] transition-colors p-1">
                  <span className="material-symbols-outlined text-sm">refresh</span>
                </button>
              </div>
              <div className="overflow-y-auto max-h-80">
                {loading ? (
                  <div className="py-12 text-center"><span className="material-symbols-outlined animate-spin text-4xl text-gray-200">refresh</span></div>
                ) : danhSach.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 text-sm">Chưa có ai đăng ký</div>
                ) : danhSach.map(dk => {
                  const done = dk.trangThaiThamGia === 'Đã tham gia';
                  return (
                    <div key={dk.maDV} className={`flex items-center gap-3 px-5 py-3 border-b border-gray-50 transition-all ${done?'bg-emerald-50':'hover:bg-gray-50'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${done?'bg-emerald-500 text-white':'bg-gray-200 text-gray-500'}`}>
                        {done ? <span className="material-symbols-outlined text-sm fill">check</span> : dk.hoTen?.[0]||'?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${done?'text-emerald-800':'text-gray-800'}`}>{dk.hoTen}</p>
                        <p className="text-[11px] text-gray-400 font-mono">{dk.maDV} · {dk.tenChiDoan||'—'}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {done ? (
                          <span className="text-[11px] text-emerald-600 font-bold block">{fmtTime(dk.ThoiGianCheckIn)}</span>
                        ) : (
                          <button onClick={() => doCheckIn(dk.maDV)}
                            className="px-2 py-1 text-[11px] font-bold border border-gray-200 rounded-lg hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700 transition-all">
                            Check-in
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DKDiemDanh;
