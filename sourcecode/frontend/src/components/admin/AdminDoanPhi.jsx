import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useToast } from '../common/Toast';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import Loading from '../common/Loading';

const API = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/doan-phi';
const H = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });
const fmt = (n) => n?.toLocaleString('vi-VN') + 'đ';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';

const TT_COLOR = {
  'Đang mở thu': 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  'Đã đóng lại': 'bg-gray-50 text-gray-600 ring-1 ring-gray-200',
  'Chưa mở':     'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  'Đã nộp':      'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  'Chưa nộp':    'bg-rose-50 text-rose-600 ring-1 ring-rose-200',
};
const DOT = {
  'Đang mở thu': 'bg-emerald-500',
  'Đã đóng lại': 'bg-gray-400',
  'Chưa mở':     'bg-amber-500',
  'Đã nộp':      'bg-blue-500',
  'Chưa nộp':    'bg-rose-500',
};

const Badge = ({ tt }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${TT_COLOR[tt] || 'bg-gray-50 text-gray-500 ring-1 ring-gray-200'}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${DOT[tt] || 'bg-gray-400'}`} />
    {tt}
  </span>
);

// ── MODAL TẠO MỨC PHÍ ──
const TaoMucPhiModal = ({ danhMuc, onClose, onSaved }) => {
  const [form, setForm] = useState({ namHoc: '', soTien: '' });
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setErr('');
    
    const amount = Number(form.soTien);
    if (!form.namHoc.trim()) {
      setErr('Vui lòng nhập năm học');
      setSaving(false); return;
    }
    if (amount <= 10000) {
      setErr('Số tiền phải lớn hơn 10.000 VNĐ');
      setSaving(false); return;
    }
    
    const isDuplicate = danhMuc?.some(d => d.namHoc.trim() === form.namHoc.trim());
    if (isDuplicate) {
      setErr(`Đợt thu cho năm học ${form.namHoc} đã tồn tại!`);
      setSaving(false); return;
    }

    try {
      await axios.post(`${API}/danh-muc`, form, { headers: H() });
      onSaved();
    } catch (e) { setErr(e.response?.data?.message || 'Lỗi'); }
    finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-[#004581] to-[#0066bb] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-white fill text-xl">payments</span>
            </div>
            <div>
              <h3 className="text-white font-bold text-base">Tạo đợt thu phí mới</h3>
              <p className="text-blue-200 text-xs mt-0.5">Thiết lập mức phí cho năm học</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors p-1">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-6">
          {err && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200 flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>{err}
          </div>}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Năm học (vd: 2025-2026)</label>
              <input value={form.namHoc} onChange={e => setForm(p => ({...p, namHoc: e.target.value}))} placeholder="2025-2026"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#004581] focus:ring-2 focus:ring-[#004581]/10 bg-gray-50 focus:bg-white transition-all text-gray-800 font-semibold" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Số tiền (VNĐ)</label>
              <input type="number" value={form.soTien} onChange={e => setForm(p => ({...p, soTien: e.target.value}))} placeholder="120000"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#004581] focus:ring-2 focus:ring-[#004581]/10 bg-gray-50 focus:bg-white transition-all text-gray-800 font-semibold" />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
              <button type="button" onClick={onClose} className="px-5 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">Hủy bỏ</button>
              <button type="submit" disabled={saving} className="px-6 py-2.5 bg-gradient-to-r from-[#004581] to-[#0066bb] text-white rounded-xl text-sm font-bold hover:shadow-lg disabled:opacity-50 transition-all flex items-center gap-2">
                {saving ? 'Đang lưu...' : 'Tạo mức phí'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};


// ── AUTOCOMPLETE SEARCH ──
const AutocompleteSearch = ({ data, onSelect, placeholder }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen]   = useState(false);

  const filtered = query.trim().length > 0
    ? data.filter(d =>
        d.hoTen?.toLowerCase().includes(query.toLowerCase()) ||
        d.maDV?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : [];

  return (
    <div className="relative flex-1" onBlur={() => setTimeout(() => setOpen(false), 150)}>
      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">search</span>
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); onSelect(e.target.value); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder || 'Tìm kiếm theo tên hoặc mã sinh viên...'}
        className="w-full bg-white/60 backdrop-blur-xl rounded-2xl py-3.5 pl-12 pr-12 text-sm font-medium text-gray-800 focus:outline-none focus:bg-white shadow-[0_2px_10px_rgb(0,0,0,0.02)] focus:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all placeholder:text-gray-400"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-3 bg-white/90 backdrop-blur-2xl rounded-3xl shadow-[0_20px_60px_rgb(0,0,0,0.12)] border border-white/50 overflow-hidden">
          <div className="p-2 space-y-1 max-h-72 overflow-y-auto custom-scrollbar">
            {filtered.map(d => (
              <button key={d.maDV} onMouseDown={() => { setQuery(d.hoTen); setOpen(false); onSelect(d.hoTen); }}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-white/80 hover:shadow-sm transition-all text-left group">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#004581] to-[#0066bb] flex items-center justify-center text-white text-sm font-bold shadow-md shadow-blue-900/20 group-hover:scale-105 transition-transform">
                  {d.hoTen?.split(' ').pop()?.[0] || '?'}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 group-hover:text-[#004581] transition-colors">{d.hoTen}</p>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{d.maDV}</p>
                </div>
                <span className={`ml-auto text-[11px] font-bold px-3 py-1 rounded-xl ${d.trangThai === 'Đã nộp' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
                  {d.trangThai || 'Chưa nộp'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
      {query && (
        <button onClick={() => { setQuery(''); onSelect(''); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600 transition-colors bg-gray-100/50 hover:bg-gray-100 p-1 rounded-full">
          <span className="material-symbols-outlined text-base block">close</span>
        </button>
      )}
    </div>
  );
};

// ── MODAL DUYỆT THU TIỀN MẶT ──
const DuyetPhiModal = ({ dv, mucPhi, onClose, onSuccess }) => {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const handleDuyet = async () => {
    setSaving(true); setErr('');
    try {
      await axios.put(`${API}/duyet-thu-cong`, {
        maDV: dv.maDV,
        idMucDoanPhi: mucPhi._idMucDoanPhi
      }, { headers: H() });
      onSuccess();
    } catch(e) {
      setErr(e.response?.data?.message || 'Lỗi khi duyệt');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-xl fill">payments</span>
          </div>
          <div>
            <h3 className="text-white font-bold text-base">Duyệt thu tiền mặt</h3>
            <p className="text-emerald-100 text-xs mt-0.5">Xác nhận đoàn viên đã nộp tiền trực tiếp</p>
          </div>
          <button onClick={onClose} className="ml-auto text-white/60 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        {/* Body */}
        <div className="p-6 space-y-4">
          {err && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>{err}
            </div>
          )}
          {/* Thông tin đoàn viên */}
          <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#004581] to-[#0066bb] flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
              {dv.hoTen?.split(' ').pop()?.[0] || '?'}
            </div>
            <div>
              <p className="font-bold text-gray-900">{dv.hoTen}</p>
              <p className="text-xs font-mono text-gray-500 mt-0.5">{dv.maDV}</p>
            </div>
          </div>
          {/* Chi tiết khoản phí */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Năm học</span>
              <span className="font-bold text-gray-800">{mucPhi.namHoc}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Số tiền</span>
              <span className="font-black text-emerald-600 text-base">{fmt(mucPhi.soTien)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Phương thức</span>
              <span className="font-bold text-gray-800 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-emerald-600">payments</span>Tiền mặt
              </span>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
            <span className="material-symbols-outlined text-amber-600 text-base mt-0.5">info</span>
            <p className="text-xs text-amber-700 font-medium">Sau khi xác nhận, trạng thái sẽ chuyển thành <strong>Đã nộp</strong> và ghi nhận ngay thời gian hiện tại.</p>
          </div>
        </div>
        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
            Hủy bỏ
          </button>
          <button onClick={handleDuyet} disabled={saving}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-sm font-bold hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2">
            {saving
              ? <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>Đang xử lý...</>
              : <><span className="material-symbols-outlined text-base fill">check_circle</span>Xác nhận đã nộp</>
            }
          </button>
        </div>
      </div>
    </div>
  );
};

// ── VIEW: DANH SÁCH CHI ĐOÀN + XÁC NHẬN THU ──
const ChiDoanView = ({ mucPhi, onBack }) => {
  const [tienDo, setTienDo]   = useState([]);
  const [selected, setSelected] = useState(null);
  const [dvList, setDvList]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [dvLoading, setDvLoading] = useState(false);
  const [search, setSearch]   = useState('');
  const [duyetModal, setDuyetModal] = useState(null); // { dv }
  const toast = useToast();

  const fetchTienDo = useCallback(async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API}/tien-do?idMucDoanPhi=${mucPhi._idMucDoanPhi}`, { headers: H() });
      setTienDo(r.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [mucPhi]);

  useEffect(() => { fetchTienDo(); }, [fetchTienDo]);

  const openChiDoan = async (cd) => {
    setSelected(cd);
    setDvLoading(true);
    try {
      const r = await axios.get(`${API}/chi-doan/${cd.maChiDoan}?idMucDoanPhi=${mucPhi._idMucDoanPhi}`, { headers: H() });
      setDvList(r.data.data || []);
    } finally { setDvLoading(false); }
  };

  const refreshDvList = async () => {
    if (!selected) return;
    const r = await axios.get(`${API}/chi-doan/${selected.maChiDoan}?idMucDoanPhi=${mucPhi._idMucDoanPhi}`, { headers: H() });
    setDvList(r.data.data || []);
    fetchTienDo(); // cập nhật tiến độ tổng
  };

  const inPhieu = (dv) => {
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>Biên lai đoàn phí</title>
    <style>body{font-family:Arial;padding:40px;max-width:500px;margin:auto}h2{text-align:center;color:#004581}table{width:100%;border-collapse:collapse}td{padding:8px;border-bottom:1px solid #eee}.sig{margin-top:60px;text-align:right}</style></head>
    <body><h2>BIÊN LAI ĐOÀN PHÍ</h2><h3 style="text-align:center">Năm học ${mucPhi.namHoc}</h3>
    <table><tr><td><b>Họ tên:</b></td><td>${dv.hoTen}</td></tr>
    <tr><td><b>Mã ĐV:</b></td><td>${dv.maDV}</td></tr>
    <tr><td><b>Số tiền:</b></td><td>${fmt(mucPhi.soTien)}</td></tr>
    <tr><td><b>Phương thức:</b></td><td>${dv.phuongThucThanhToan || 'Tiền mặt'}</td></tr>
    <tr><td><b>Ngày nộp:</b></td><td>${fmtDate(dv.ThoiGianThanhToan)}</td></tr>
    <tr><td><b>Trạng thái:</b></td><td><b style="color:green">ĐÃ NỘP</b></td></tr></table>
    <div class="sig"><p>Người thu</p><br/><p>........................</p></div>
    </body></html>`);
    w.document.close(); w.print();
  };

  // ── CHI TIẾT ĐOÀN VIÊN TRONG CHI ĐOÀN ──
  if (selected) {
    const filteredDv = dvList.filter(d =>
      !search || d.hoTen?.toLowerCase().includes(search.toLowerCase()) || d.maDV?.toLowerCase().includes(search.toLowerCase())
    );
    const daNopCount   = dvList.filter(d => d.trangThai === 'Đã nộp').length;
    const chuaNopCount = dvList.filter(d => d.trangThai !== 'Đã nộp').length;

    return (
      <div className="flex flex-col gap-6 animate-in slide-in-from-right-8 duration-500">
        {/* Breadcrumb Header Mới */}
        <div className="bg-white/80 backdrop-blur-2xl rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-wrap items-center gap-5">
          <button onClick={() => { setSelected(null); setSearch(''); }} 
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-400 hover:bg-[#004581] hover:text-white hover:shadow-lg hover:shadow-blue-900/20 transition-all group">
            <span className="material-symbols-outlined text-2xl group-hover:-translate-x-1 transition-transform">arrow_back</span>
          </button>
          
          <div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">{selected.tenChiDoan}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-[#004581]"></span>
              <p className="text-sm text-gray-500 font-medium">Chi tiết đóng phí · Năm học {mucPhi.namHoc}</p>
            </div>
          </div>

          {/* Dữ liệu thống kê được dời lên đây */}
          <div className="ml-auto flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-blue-50/50 px-3 py-1.5 rounded-xl border border-blue-100">
              <span className="material-symbols-outlined text-blue-500 text-sm">group</span>
              <span className="text-sm font-bold text-blue-700">{dvList.length} SV</span>
            </div>
            <div className="flex items-center gap-2 bg-emerald-50/50 px-3 py-1.5 rounded-xl border border-emerald-100">
              <span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span>
              <span className="text-sm font-bold text-emerald-700">{daNopCount} Đã nộp</span>
            </div>
            <div className="flex items-center gap-2 bg-rose-50/50 px-3 py-1.5 rounded-xl border border-rose-100">
              <span className="material-symbols-outlined text-rose-500 text-sm">pending_actions</span>
              <span className="text-sm font-bold text-rose-700">{chuaNopCount} Còn nợ</span>
            </div>
            
            {/* Phân cách */}
            <div className="w-px h-6 bg-gray-200 mx-1"></div>
            
            <Badge tt={mucPhi.trangThai} />
          </div>
        </div>

        {/* Search Bar - Lơ lửng, Bóng đổ */}
        <div className="relative z-20">
          <AutocompleteSearch data={dvList} onSelect={setSearch} placeholder="Nhập tên hoặc mã sinh viên để tìm kiếm nhanh..." />
        </div>

        {/* Table Không Viền */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          {dvLoading ? (
            <Loading variant="fullscreen" text="Đang tải danh sách đoàn viên..." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead>
                  <tr className="bg-transparent border-b border-gray-100/50">
                    {['Sinh viên', 'Mã ĐV', 'Trạng thái', 'Ngày nộp', 'Phương thức', ''].map((h, i) => (
                      <th key={h} className={`px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest ${i === 5 ? 'text-right' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50/50">
                  {filteredDv.length === 0 ? (
                    <tr><td colSpan={6} className="py-24 text-center">
                      <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-4xl text-gray-300">person_off</span>
                      </div>
                      <p className="text-gray-500 font-bold text-lg">Không tìm thấy sinh viên nào</p>
                      <p className="text-gray-400 text-sm mt-1">Vui lòng thử tìm kiếm với từ khóa khác</p>
                    </td></tr>
                  ) : filteredDv.map(dv => (
                    <tr key={dv.maDV} className="transition-all duration-300 hover:bg-gray-50/80 group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white text-sm font-bold shadow-sm transition-transform group-hover:scale-105 ${dv.trangThai === 'Đã nộp' ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/20' : 'bg-gradient-to-br from-gray-300 to-gray-400 shadow-gray-500/20'}`}>
                            {dv.hoTen?.split(' ').pop()?.[0] || '?'}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 group-hover:text-[#004581] transition-colors">{dv.hoTen}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-[12px] font-semibold text-gray-500 bg-gray-100/80 px-2.5 py-1 rounded-lg">{dv.maDV}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${dv.trangThai === 'Đã nộp' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                          <span className="material-symbols-outlined text-sm">{dv.trangThai === 'Đã nộp' ? 'check_circle' : 'error'}</span>
                          {dv.trangThai || 'Chưa nộp'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs font-semibold">{fmtDate(dv.ThoiGianThanhToan)}</td>
                      <td className="px-6 py-4">
                        {dv.phuongThucThanhToan ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 bg-gray-50 px-3 py-1.5 rounded-xl">
                            <span className="material-symbols-outlined text-sm">{dv.phuongThucThanhToan === 'Tiền mặt' ? 'payments' : 'credit_card'}</span>
                            {dv.phuongThucThanhToan}
                          </span>
                        ) : <span className="text-gray-300 font-bold">—</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {dv.trangThai !== 'Đã nộp' && mucPhi.trangThai === 'Đang mở thu' && (
                            <button onClick={() => setDuyetModal(dv)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-xs font-bold hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5 transition-all">
                              <span className="material-symbols-outlined text-base fill">how_to_reg</span>Duyệt thu
                            </button>
                          )}
                          {dv.trangThai === 'Đã nộp' && (
                            <button onClick={() => inPhieu(dv)} title="In biên lai"
                              className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-[#004581] hover:bg-[#004581] hover:text-white hover:shadow-lg hover:shadow-blue-900/20 hover:-translate-y-0.5 transition-all">
                              <span className="material-symbols-outlined text-lg">receipt_long</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal duyệt */}
        {duyetModal && (
          <DuyetPhiModal
            dv={duyetModal}
            mucPhi={mucPhi}
            onClose={() => setDuyetModal(null)}
            onSuccess={() => {
              setDuyetModal(null);
              toast.success(`Đã duyệt thu phí cho ${duyetModal.hoTen} thành công!`);
              refreshDvList();
            }}
          />
        )}
      </div>
    );
  }

  // ── DANH SÁCH TIẾN ĐỘ CÁC CHI ĐOÀN ──
  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-left-8 duration-500">
      <div className="bg-white/80 backdrop-blur-2xl rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-5">
        <button onClick={onBack} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-400 hover:bg-[#004581] hover:text-white hover:shadow-lg hover:shadow-blue-900/20 transition-all group">
          <span className="material-symbols-outlined text-2xl group-hover:-translate-x-1 transition-transform">arrow_back</span>
        </button>
        <div>
          <h3 className="text-2xl font-black text-gray-900 tracking-tight">Tiến độ thu phí các Chi đoàn</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-[#004581]"></span>
            <p className="text-sm text-gray-500 font-medium">Năm học {mucPhi.namHoc}</p>
          </div>
        </div>
        <div className="ml-auto"><Badge tt={mucPhi.trangThai} /></div>
      </div>

      {loading ? (
        <Loading variant="fullscreen" text="Đang tải dữ liệu tiến độ..." />
      ) : (
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-transparent border-b border-gray-100/50">
                {['Chi đoàn', 'Khoa', 'Tổng SV', 'Đã nộp', 'Tiến độ', 'Thao tác'].map((h, i) => (
                  <th key={h} className={`px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest ${i === 5 ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50/50">
              {tienDo.map(cd => {
                const pct = cd.tongSV > 0 ? Math.round((cd.daNop / cd.tongSV) * 100) : 0;
                return (
                  <tr key={cd.maChiDoan} className="hover:bg-gray-50/80 transition-all duration-300 group">
                    <td className="px-6 py-5 font-bold text-gray-900 group-hover:text-[#004581] text-base transition-colors">{cd.tenChiDoan}</td>
                    <td className="px-6 py-5 text-gray-500 font-medium">{cd.tenKhoa || '—'}</td>
                    <td className="px-6 py-5 font-black text-gray-700 text-base">{cd.tongSV}</td>
                    <td className="px-6 py-5 font-black text-emerald-600 text-base">{cd.daNop} <span className="text-gray-400 font-semibold text-sm">/ {cd.tongSV}</span></td>
                    <td className="px-6 py-5 min-w-[200px]">
                      <div className="flex items-center gap-4">
                        <div className="flex-1 bg-gray-100/80 rounded-full h-3 overflow-hidden shadow-inner">
                          <div className={`h-full rounded-full transition-all duration-1000 ${pct === 100 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : pct > 50 ? 'bg-gradient-to-r from-blue-400 to-blue-600' : 'bg-gradient-to-r from-amber-400 to-amber-500'}`}
                            style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-sm font-black text-gray-700 w-12 text-right">{pct}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button onClick={() => openChiDoan(cd)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-50/50 text-[#004581] rounded-xl text-xs font-bold hover:bg-[#004581] hover:text-white hover:shadow-lg hover:shadow-blue-900/20 hover:-translate-y-0.5 transition-all">
                        <span className="material-symbols-outlined text-base">visibility</span>Xem chi tiết
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!tienDo.length && (
                <tr><td colSpan={6} className="py-24 text-center">
                  <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-5xl text-gray-300 block">account_balance_wallet</span>
                  </div>
                  <p className="text-gray-500 font-bold text-lg">Chưa có dữ liệu tiến độ</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ── MODAL XUẤT BÁO CÁO EXCEL ──
const XuatBaoCaoModal = ({ danhMuc, onClose, toast }) => {
  const [selectedId, setSelectedId] = useState('');
  const [exporting, setExporting]   = useState(false);

  const selectedDm = danhMuc.find(d => String(d._idMucDoanPhi) === String(selectedId));

  const handleExport = async () => {
    if (!selectedId) { toast?.error('Vui lòng chọn năm học cần xuất'); return; }
    setExporting(true);
    try {
      const r = await axios.get(`${API}/bao-cao?idMucDoanPhi=${selectedId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const { mucPhi, chitiet, tongHop } = r.data.data;

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Hệ thống Quản lý Đoàn viên';
      workbook.created = new Date();

      // ==========================================
      // SHEET 1: CHI TIẾT
      // ==========================================
      const ws1 = workbook.addWorksheet('Chi tiết thu phí', { views: [{ showGridLines: false }] });

      // Cấu hình chiều rộng cột
      ws1.columns = [
        { key: 'stt', width: 6 },
        { key: 'mssv', width: 15 },
        { key: 'hoten', width: 28 },
        { key: 'lop', width: 18 },
        { key: 'khoa', width: 25 },
        { key: 'tt', width: 16 },
        { key: 'sotien', width: 18 },
        { key: 'ngaynop', width: 16 },
        { key: 'pt', width: 18 },
        { key: 'magd', width: 22 },
      ];

      // Tiêu đề chính
      ws1.mergeCells('A1:J1');
      const titleCell = ws1.getCell('A1');
      titleCell.value = `BÁO CÁO CHI TIẾT THU ĐOÀN PHÍ – NĂM HỌC ${mucPhi.namHoc}`;
      titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF004581' } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      ws1.getRow(1).height = 40;

      // Tiêu đề phụ
      ws1.mergeCells('A2:J2');
      const subCell = ws1.getCell('A2');
      subCell.value = `Số tiền quy định: ${mucPhi.soTien?.toLocaleString('vi-VN')}đ  |  Trạng thái đợt thu: ${mucPhi.trangThai}  |  Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`;
      subCell.font = { name: 'Arial', size: 11, italic: true, color: { argb: 'FF333333' } };
      subCell.alignment = { vertical: 'middle', horizontal: 'center' };
      ws1.getRow(2).height = 25;

      ws1.addRow([]); // Dòng trống

      // Header Bảng
      const headerRow = ws1.addRow(['STT', 'MSSV', 'Họ và tên', 'Lớp sinh hoạt', 'Khoa', 'Trạng thái', 'Số tiền (VNĐ)', 'Ngày nộp', 'Phương thức', 'Mã GD (nếu có)']);
      headerRow.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.height = 30;
      headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0066BB' } };
        cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
      });

      // Dữ liệu bảng chi tiết
      chitiet.forEach((row, idx) => {
        const isDaNop = row.trangThai === 'Đã nộp';
        const r = ws1.addRow([
          idx + 1,
          row.mssv,
          row.hoTen,
          row.lopSinhHoat || '—',
          row.tenKhoa || '—',
          row.trangThai,
          isDaNop ? mucPhi.soTien : 0,
          row.ngayNop ? new Date(row.ngayNop).toLocaleDateString('vi-VN') : '—',
          row.phuongThucThanhToan || '—',
          row.maGiaoDich || '—'
        ]);
        
        r.font = { name: 'Arial', size: 11, color: { argb: isDaNop ? 'FF000000' : 'FFD32F2F' } };
        r.height = 25;
        
        r.eachCell((cell, colNumber) => {
          cell.border = { top: {style:'thin', color:{argb:'FFCCCCCC'}}, left: {style:'thin', color:{argb:'FFCCCCCC'}}, bottom: {style:'thin', color:{argb:'FFCCCCCC'}}, right: {style:'thin', color:{argb:'FFCCCCCC'}} };
          cell.alignment = { vertical: 'middle' };
          // Căn giữa cho các cột: STT, MSSV, Trạng thái, Ngày, Phương thức
          if ([1, 2, 4, 6, 8, 9].includes(colNumber)) cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });
        
        r.getCell(7).numFmt = '#,##0'; // Định dạng số tiền
        r.getCell(6).font = { bold: true, color: { argb: isDaNop ? 'FF2E7D32' : 'FFD32F2F' } }; // Đổi màu trạng thái
      });

      // ==========================================
      // SHEET 2: TỔNG HỢP & THỐNG KÊ
      // ==========================================
      const ws2 = workbook.addWorksheet('Tổng hợp & Thống kê', { views: [{ showGridLines: false }] });
      ws2.columns = [
        { key: 'col1', width: 5 },
        { key: 'col2', width: 35 },
        { key: 'col3', width: 25 },
        { key: 'col4', width: 30 },
        { key: 'col5', width: 20 },
      ];

      // ── BÁO CÁO TỔNG QUAN ──
      ws2.mergeCells('B2:D2');
      const t1 = ws2.getCell('B2');
      t1.value = 'BÁO CÁO TỔNG QUAN ĐOÀN PHÍ';
      t1.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
      t1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF004581' } };
      t1.alignment = { vertical: 'middle', horizontal: 'center' };
      ws2.getRow(2).height = 35;

      const styleThongKe = (label, value, isMoney = false, isBold = false) => {
        const row = ws2.addRow(['', label, value]);
        row.height = 25;
        row.getCell(2).font = { name: 'Arial', size: 12, bold: true };
        row.getCell(2).alignment = { vertical: 'middle' };
        row.getCell(3).font = { name: 'Arial', size: 12, bold: isBold, color: { argb: isBold ? 'FFD32F2F' : 'FF000000' } };
        row.getCell(3).alignment = { vertical: 'middle', horizontal: 'right' };
        if (isMoney) row.getCell(3).numFmt = '#,##0" đ"';
        row.eachCell({ includeEmpty: false }, c => {
          c.border = { top: {style:'thin', color:{argb:'FFAAAAAA'}}, left: {style:'thin', color:{argb:'FFAAAAAA'}}, bottom: {style:'thin', color:{argb:'FFAAAAAA'}}, right: {style:'thin', color:{argb:'FFAAAAAA'}} };
        });
        ws2.mergeCells(`C${row.number}:D${row.number}`);
        return row;
      };

      styleThongKe('Tổng số đoàn viên phải nộp', tongHop.tongSV);
      styleThongKe('Số đoàn viên đã nộp hoàn thành', tongHop.daNop);
      styleThongKe('Số đoàn viên chưa nộp', tongHop.chuaNop, false, true);
      const tyLe = tongHop.tongSV > 0 ? (tongHop.daNop/tongHop.tongSV) : 0;
      const tyLeRow = styleThongKe('Tỷ lệ hoàn thành', tyLe);
      tyLeRow.getCell(3).numFmt = '0.00%';
      tyLeRow.getCell(3).font = { size: 12, bold: true, color: { argb: 'FF2E7D32' } };

      styleThongKe('Tổng doanh thu thực tế', tongHop.tongTienThu, true);
      styleThongKe('Tổng doanh thu còn thiếu', tongHop.chuaNop * mucPhi.soTien, true, true);

      // ── THỐNG KÊ THEO THÁNG ──
      const daNopList  = chitiet.filter(r => r.trangThai === 'Đã nộp');
      const chuaNopList= chitiet.filter(r => r.trangThai !== 'Đã nộp');

      const theoThang = {};
      daNopList.forEach(r => {
        if (!r.ngayNop) return;
        const d = new Date(r.ngayNop);
        const key = `Tháng ${String(d.getMonth()+1).padStart(2,'0')} / ${d.getFullYear()}`;
        if (!theoThang[key]) theoThang[key] = { soLuong: 0, soTien: 0 };
        theoThang[key].soLuong++;
        theoThang[key].soTien += mucPhi.soTien;
      });

      ws2.addRow([]);
      ws2.addRow([]);
      ws2.mergeCells(`B${ws2.rowCount+1}:D${ws2.rowCount+1}`);
      const t2 = ws2.getCell(`B${ws2.rowCount}`);
      t2.value = 'THỐNG KÊ DOANH THU THEO THÁNG';
      t2.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
      t2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0066BB' } };
      t2.alignment = { vertical: 'middle', horizontal: 'center' };
      ws2.getRow(ws2.rowCount).height = 30;

      const hRow2 = ws2.addRow(['', 'Tháng / Năm', 'Số lượng SV đã nộp', 'Doanh thu thu được (VNĐ)']);
      hRow2.font = { bold: true, color: { argb: 'FFFFFFFF' } }; 
      hRow2.alignment = { vertical: 'middle', horizontal: 'center' };
      hRow2.height = 25;
      hRow2.eachCell({ includeEmpty: false }, c => {
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF555555' } };
        c.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
      });

      Object.entries(theoThang).sort().forEach(([k,v]) => {
        const r = ws2.addRow(['', k, v.soLuong, v.soTien]);
        r.height = 22;
        r.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
        r.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };
        r.getCell(4).alignment = { vertical: 'middle', horizontal: 'right' };
        r.getCell(4).numFmt = '#,##0" đ"';
        r.eachCell({ includeEmpty: false }, c => c.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} });
      });

      if (Object.keys(theoThang).length === 0) {
        const rEmpty = ws2.addRow(['', 'Chưa có giao dịch nộp phí nào', '', '']);
        ws2.mergeCells(`B${rEmpty.number}:D${rEmpty.number}`);
        rEmpty.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
        rEmpty.getCell(2).font = { italic: true, color: { argb: 'FF888888' } };
      }

      // ── DANH SÁCH CHƯA NỘP ──
      ws2.addRow([]);
      ws2.addRow([]);
      ws2.mergeCells(`B${ws2.rowCount+1}:E${ws2.rowCount+1}`);
      const t3 = ws2.getCell(`B${ws2.rowCount}`);
      t3.value = `DANH SÁCH SINH VIÊN CÒN NỢ PHÍ (${chuaNopList.length} SV)`;
      t3.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
      t3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD32F2F' } };
      t3.alignment = { vertical: 'middle', horizontal: 'center' };
      ws2.getRow(ws2.rowCount).height = 30;

      const hRow3 = ws2.addRow(['', 'MSSV', 'Họ và tên', 'Lớp sinh hoạt', 'Khoa']);
      hRow3.font = { bold: true, color: { argb: 'FFD32F2F' } }; 
      hRow3.alignment = { vertical: 'middle', horizontal: 'center' };
      hRow3.height = 25;
      hRow3.eachCell({ includeEmpty: false }, c => {
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFCDD2' } };
        c.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
      });

      chuaNopList.forEach(r => {
        const row = ws2.addRow(['', r.mssv, r.hoTen, r.lopSinhHoat || '—', r.tenKhoa || '—']);
        row.height = 22;
        row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
        row.eachCell({ includeEmpty: false }, c => c.border = { top: {style:'thin', color:{argb:'FFCCCCCC'}}, left: {style:'thin', color:{argb:'FFCCCCCC'}}, bottom: {style:'thin', color:{argb:'FFCCCCCC'}}, right: {style:'thin', color:{argb:'FFCCCCCC'}} });
      });

      if (chuaNopList.length === 0) {
        const rEmpty = ws2.addRow(['', 'Tất cả sinh viên đã hoàn thành nộp phí!', '', '', '']);
        ws2.mergeCells(`B${rEmpty.number}:E${rEmpty.number}`);
        rEmpty.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
        rEmpty.getCell(2).font = { italic: true, bold: true, color: { argb: 'FF2E7D32' } };
      }

      // Xuất file
      const buffer = await workbook.xlsx.writeBuffer();
      const fileName = `BaoCao_DoanPhi_${mucPhi.namHoc.replace('-','_')}_${new Date().toLocaleDateString('vi-VN').replace(/\//g,'')}.xlsx`;
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, fileName);
      
      toast?.success(`Đã xuất file "${fileName}" thành công!`);
      onClose();
    } catch(e) {
      console.error(e);
      toast?.error(e.response?.data?.message || 'Lỗi khi xuất báo cáo');
    } finally { setExporting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-[#004581] to-[#0066bb] px-6 py-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-2xl fill">table_chart</span>
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">Xuất báo cáo thống kê</h3>
            <p className="text-blue-200 text-xs mt-0.5">Xuất file Excel chi tiết đoàn phí theo năm học</p>
          </div>
          <button onClick={onClose} className="ml-auto text-white/60 hover:text-white transition-colors p-1">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Chọn năm học */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Chọn năm học xuất báo cáo *</label>
            <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 focus:outline-none focus:border-[#004581] bg-gray-50 focus:bg-white transition-all">
              <option value="">-- Chọn đợt thu --</option>
              {danhMuc.map(dm => (
                <option key={dm._idMucDoanPhi} value={dm._idMucDoanPhi}>
                  Năm học {dm.namHoc} — {dm.soTien?.toLocaleString('vi-VN')}đ ({dm.trangThai})
                </option>
              ))}
            </select>
          </div>

          {/* Preview thông tin nếu đã chọn */}
          {selectedDm && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
              <p className="text-xs font-bold text-[#004581] uppercase tracking-widest mb-3">Thông tin đợt thu đã chọn</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Năm học', value: selectedDm.namHoc },
                  { label: 'Mức phí', value: `${selectedDm.soTien?.toLocaleString('vi-VN')}đ` },
                  { label: 'Tổng SV', value: selectedDm.tongSV || 0 },
                  { label: 'Đã nộp', value: selectedDm.daNop || 0 },
                  { label: 'Chưa nộp', value: selectedDm.chuaNop || 0 },
                  { label: 'Trạng thái', value: selectedDm.trangThai },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 shadow-sm">
                    <span className="text-xs text-gray-500 font-medium">{item.label}</span>
                    <span className="text-sm font-bold text-gray-800">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mô tả nội dung file */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">File Excel sẽ bao gồm</p>
            {[
              { icon: 'list_alt', text: 'Sheet "Chi tiết": MSSV, Họ tên, Lớp, Trạng thái, Số tiền, Ngày nộp, Phương thức, Mã GD' },
              { icon: 'bar_chart', text: 'Sheet "Tổng hợp": Số liệu tổng quan, thống kê theo tháng, danh sách chưa nộp' },
            ].map(item => (
              <div key={item.text} className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[#004581] text-base mt-0.5 flex-shrink-0">{item.icon}</span>
                <p className="text-xs text-gray-600 font-medium">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
            Hủy bỏ
          </button>
          <button onClick={handleExport} disabled={!selectedId || exporting}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-[#004581] to-[#0066bb] text-white rounded-xl text-sm font-bold hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2">
            {exporting ? (
              <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
              </svg>Đang tạo file...</>
            ) : (
              <><span className="material-symbols-outlined text-base fill">download</span>Xuất Excel</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── MAIN COMPONENT ──
const AdminDoanPhi = () => {
  const [danhMuc, setDanhMuc]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [xuatModal, setXuatModal] = useState(false);
  const [activeMuc, setActiveMuc] = useState(null);
  const [acting, setActing]     = useState(null);
  const [thongKe, setThongKe]   = useState(null);
  const toast = useToast();

  const fetchDanhMuc = useCallback(async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API}/danh-muc`, { headers: H() });
      setDanhMuc(r.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDanhMuc(); }, [fetchDanhMuc]);

  const doKichHoat = async (dm) => {
    const confirmed = await toast.confirm(`Mở đợt thu "${dm.namHoc}"? Hệ thống sẽ tạo bản ghi cho tất cả đoàn viên đang sinh hoạt.`);
    if (!confirmed) return;
    setActing(dm._idMucDoanPhi);
    try {
      const r = await axios.put(`${API}/danh-muc/${dm._idMucDoanPhi}/kich-hoat`, {}, { headers: H() });
      toast.success(r.data.message || 'Mở đợt thu thành công!');
      fetchDanhMuc();
    } catch (e) { toast.error(e.response?.data?.message || 'Lỗi'); }
    finally { setActing(null); }
  };

  const doDong = async (dm) => {
    const confirmed = await toast.confirm(`Đóng đợt thu "${dm.namHoc}"?`);
    if (!confirmed) return;
    setActing(dm._idMucDoanPhi);
    try {
      await axios.put(`${API}/danh-muc/${dm._idMucDoanPhi}/dong`, {}, { headers: H() });
      toast.success('Đã đóng đợt thu thành công!');
      fetchDanhMuc();
    } catch (e) { toast.error(e.response?.data?.message || 'Lỗi'); }
    finally { setActing(null); }
  };

  const loadThongKe = async (dm) => {
    try {
      const r = await axios.get(`${API}/thong-ke?idMucDoanPhi=${dm._idMucDoanPhi}`, { headers: H() });
      setThongKe(r.data.data);
    } catch (e) { console.error(e); }
  };

  const doXoa = async (dm) => {
    const confirmed = await toast.confirm(
      `Bạn có chắc muốn xóa đợt thu "${dm.namHoc}"?\nChỉ được xóa khi 100% sinh viên chưa nộp tiền.`
    );
    if (!confirmed) return;
    setActing(dm._idMucDoanPhi);
    try {
      const r = await axios.delete(`${API}/danh-muc/${dm._idMucDoanPhi}`, { headers: H() });
      toast.success(r.data.message || 'Đã xóa đợt thu thành công!');
      fetchDanhMuc();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi khi xóa đợt thu');
    } finally { setActing(null); }
  };

  if (activeMuc) return <ChiDoanView mucPhi={activeMuc} onBack={() => setActiveMuc(null)} />;

  return (
    <div className="flex flex-col gap-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Quản lý Đoàn phí</h2>
          <p className="text-sm text-gray-400 mt-0.5">Quản lý các đợt thu phí của đoàn viên theo năm học</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setXuatModal(true)}
            className="border-2 border-[#004581] text-[#004581] font-bold px-4 py-2.5 rounded-xl hover:bg-[#004581] hover:text-white transition-all flex items-center gap-2 text-sm">
            <span className="material-symbols-outlined text-base fill">download</span>Xuất báo cáo
          </button>
          <button onClick={() => setModal(true)} className="bg-gradient-to-r from-[#004581] to-[#0066bb] text-white font-bold px-5 py-2.5 rounded-xl hover:shadow-lg transition-all flex items-center gap-2 text-sm">
            <span className="material-symbols-outlined text-base fill">add_card</span>Tạo mức phí mới
          </button>
        </div>
      </div>

      {/* Thống kê nhanh */}
      {thongKe && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4">
          {[
            { label: 'Tổng ĐV phải nộp', value: thongKe.tong, icon: 'group', bg: 'bg-blue-50', ic: 'text-blue-600' },
            { label: 'Đã nộp thành công',  value: thongKe.daNop, icon: 'check_circle', bg: 'bg-emerald-50', ic: 'text-emerald-600' },
            { label: 'Đang nợ phí', value: thongKe.chuaNop, icon: 'error', bg: 'bg-rose-50', ic: 'text-rose-600' },
            { label: 'Tổng số tiền thu được', value: fmt(thongKe.tongThuDuoc), icon: 'account_balance', bg: 'bg-[#004581]/10', ic: 'text-[#004581]' },
          ].map(c => (
            <div key={c.label} className="bg-white border border-gray-100 rounded-2xl p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 rounded-xl ${c.bg} ${c.ic} flex items-center justify-center flex-shrink-0`}>
                <span className="material-symbols-outlined text-xl fill">{c.icon}</span>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{c.label}</p>
                <p className="text-2xl font-black text-gray-900">{c.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Danh sách đợt thu */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 text-center"><span className="material-symbols-outlined animate-spin text-5xl text-gray-200">refresh</span></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  {['Năm học', 'Số tiền', 'Tổng SV', 'Đã nộp', 'Chưa nộp', 'Trạng thái', 'Thao tác'].map((h,i) => (
                    <th key={h} className={`px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest ${i===6?'text-right':''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {danhMuc.length === 0 ? (
                  <tr><td colSpan={7} className="py-20 text-center">
                    <span className="material-symbols-outlined text-6xl text-gray-200 block mb-3">account_balance_wallet</span>
                    <p className="text-gray-400 font-semibold mb-2">Chưa có đợt thu nào</p>
                    <button onClick={() => setModal(true)} className="text-[#004581] hover:underline font-medium text-sm">Tạo đợt thu đầu tiên →</button>
                  </td></tr>
                ) : danhMuc.map(dm => (
                  <tr key={dm._idMucDoanPhi} className={`transition-colors group hover:bg-gray-50 ${thongKe?.idMucDoanPhi === dm._idMucDoanPhi ? 'bg-blue-50/30' : ''}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 font-bold">
                          <span className="material-symbols-outlined text-xl">calendar_month</span>
                        </div>
                        <span className="font-extrabold text-gray-900 text-base group-hover:text-[#004581] transition-colors">{dm.namHoc}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-emerald-600 font-bold text-base">{fmt(dm.soTien)}</td>
                    <td className="px-5 py-4 font-semibold text-gray-600">{dm.tongSV || 0}</td>
                    <td className="px-5 py-4 text-blue-600 font-bold">{dm.daNop || 0}</td>
                    <td className="px-5 py-4 text-rose-500 font-bold">{dm.chuaNop || 0}</td>
                    <td className="px-5 py-4"><Badge tt={dm.trangThai} /></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {dm.trangThai !== 'Đang mở thu' && (
                          <button onClick={() => doKichHoat(dm)} disabled={acting === dm._idMucDoanPhi}
                            className="px-3 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 hover:shadow-md disabled:opacity-50 transition-all flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-base fill">play_circle</span>Mở thu
                          </button>
                        )}
                        {dm.trangThai === 'Đang mở thu' && (
                          <>
                            <button onClick={() => { setActiveMuc(dm); loadThongKe(dm); }}
                              className="px-3 py-2 border-2 border-[#004581] text-[#004581] rounded-xl text-xs font-bold hover:bg-[#004581] hover:text-white transition-all flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-base">monitoring</span>Tiến độ
                            </button>
                            <button onClick={() => doDong(dm)} disabled={acting === dm._idMucDoanPhi}
                              className="px-3 py-2 border-2 border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 disabled:opacity-50 transition-all flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-base">stop_circle</span>Đóng
                            </button>
                          </>
                        )}
                        {dm.trangThai === 'Đã đóng lại' && (
                          <button onClick={() => { setActiveMuc(dm); loadThongKe(dm); }}
                            className="px-3 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-base">visibility</span>Xem
                          </button>
                        )}
                        <button onClick={() => loadThongKe(dm)} title="Thống kê" className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-[#004581] transition-all ml-1">
                          <span className="material-symbols-outlined text-base">pie_chart</span>
                        </button>
                        <button
                          onClick={() => doXoa(dm)}
                          disabled={acting === dm._idMucDoanPhi}
                          title="Xóa đợt thu"
                          className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-rose-50 hover:text-rose-500 disabled:opacity-40 transition-all"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && <TaoMucPhiModal danhMuc={danhMuc} onClose={() => setModal(false)} onSaved={() => { setModal(false); fetchDanhMuc(); }} />}
      {xuatModal && <XuatBaoCaoModal danhMuc={danhMuc} onClose={() => setXuatModal(false)} toast={toast} />}
    </div>
  );
};

export default AdminDoanPhi;
