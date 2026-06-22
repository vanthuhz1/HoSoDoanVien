import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useToast } from '../common/Toast';

const API = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/activities';
const H = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const TT = {
  'Sắp diễn ra': 'bg-blue-50 text-blue-700 border-blue-200',
  'Đang mở': 'bg-green-50 text-green-700 border-green-200',
  'Đang diễn ra': 'bg-purple-50 text-purple-700 border-purple-200',
  'Đã kết thúc': 'bg-gray-100 text-gray-500 border-gray-200',
  'Chờ duyệt': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'Bị từ chối': 'bg-red-50 text-red-600 border-red-200',
  'Đã tham gia': 'bg-green-50 text-green-700 border-green-200',
  'Chờ duyệt mc': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'Đã từ chối': 'bg-red-50 text-red-600 border-red-200',
};
const Badge = ({ tt }) => (
  <span className={`inline-flex px-2 py-0.5 rounded-full border text-xs font-semibold whitespace-nowrap ${TT[tt] || 'bg-gray-50 text-gray-500 border-gray-200'}`}>{tt}</span>
);

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';
const ALL_TABS = ['Tất cả', 'Chờ duyệt', 'Đang mở', 'Đang diễn ra', 'Đã kết thúc'];

/* ── Modal tạo hoạt động ── */
const TaoModal = ({ onClose, onSaved }) => {
  const [f, setF] = useState({ tenHD: '', moTa: '', ngayToChuc: '', diaDiem: '', soLuongMAX: 50, diemHoatDong: 5 });
  const [err, setErr] = useState(''); const [saving, setSaving] = useState(false);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const submit = async e => {
    e.preventDefault(); setSaving(true); setErr('');
    try { await axios.post(API, f, { headers: H() }); onSaved(); }
    catch (e) { setErr(e.response?.data?.message || 'Lỗi'); setSaving(false); }
  };
  const inputs = [
    { label: 'Tên hoạt động *', k: 'tenHD', span: 2 },
    { label: 'Mô tả', k: 'moTa', span: 2, area: true },
    { label: 'Ngày tổ chức *', k: 'ngayToChuc', type: 'date' },
    { label: 'Địa điểm', k: 'diaDiem' },
    { label: 'Số lượng tối đa (≤130)', k: 'soLuongMAX', type: 'number' },
    { label: 'Điểm hoạt động (≤10)', k: 'diemHoatDong', type: 'number' },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-[#004581] to-[#0066bb] p-5 flex justify-between items-center">
          <div><h3 className="text-white font-bold text-lg">Thêm hoạt động mới</h3>
            <p className="text-blue-200 text-xs mt-0.5">Hoạt động cấp Đoàn trường</p></div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><span className="material-symbols-outlined">close</span></button>
        </div>
        {err && <div className="mx-5 mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">{err}</div>}
        <form onSubmit={submit} className="p-5 grid grid-cols-2 gap-4">
          {inputs.map(({ label, k, type = 'text', span, area }) => (
            <div key={k} className={span === 2 ? 'col-span-2' : ''}>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{label}</label>
              {area ? <textarea value={f[k]} onChange={e => set(k, e.target.value)} rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#004581] resize-none" />
                : <input type={type} value={f[k]} onChange={e => set(k, type === 'number' ? +e.target.value : e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#004581]" />}
            </div>
          ))}
          <div className="col-span-2 flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Hủy</button>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-[#004581] text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">add</span>{saving ? 'Đang lưu...' : 'Tạo hoạt động'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Modal từ chối (với lý do) ── */
const TuChoiModal = ({ title, onClose, onConfirm }) => {
  const [lyDo, setLyDo] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-red-600">cancel</span>
          </div>
          <div><h3 className="font-bold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-400">Vui lòng nhập lý do</p></div>
        </div>
        <textarea value={lyDo} onChange={e => setLyDo(e.target.value)} rows={3} placeholder="Nhập lý do từ chối..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400 resize-none mb-4" />
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Hủy</button>
          <button onClick={() => onConfirm(lyDo)} disabled={!lyDo.trim()} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 disabled:opacity-40">Xác nhận từ chối</button>
        </div>
      </div>
    </div>
  );
};

/* ── PANEL DUYỆT HOẠT ĐỘNG TỪ ĐOÀN KHOA ── */
const DuyetHoatDongPanel = ({ items, onDuyet, onTuChoi, loading }) => {
  const [expanded, setExpanded] = useState(null);
  if (loading) return <div className="py-16 text-center"><span className="material-symbols-outlined animate-spin text-4xl text-gray-200">refresh</span></div>;
  if (!items.length) return (
    <div className="flex flex-col items-center py-16 text-gray-300">
      <span className="material-symbols-outlined text-6xl mb-3">check_circle</span>
      <p className="font-semibold text-gray-400">Không có hoạt động nào chờ duyệt</p>
      <p className="text-sm text-gray-300 mt-1">Tất cả đề xuất đã được xử lý</p>
    </div>
  );
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 px-1">
        <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
        <p className="text-sm font-semibold text-gray-600">{items.length} hoạt động đang chờ duyệt từ Đoàn khoa</p>
      </div>
      {items.map(hd => (
        <div key={hd.idHD} className="bg-white border-2 border-yellow-200 rounded-2xl overflow-hidden hover:border-yellow-300 hover:shadow-md transition-all">
          {/* Header card */}
          <div className="flex items-start justify-between p-5 gap-4">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center flex-shrink-0 shadow">
                <span className="material-symbols-outlined text-white fill text-2xl">event</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-base font-bold text-gray-900">{hd.tenHD}</h4>
                  <Badge tt={hd.trangThaiHD} />
                </div>
                <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <span className="material-symbols-outlined text-xs">calendar_today</span>{fmtDate(hd.ngayToChuc)}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <span className="material-symbols-outlined text-xs">location_on</span>{hd.diaDiem || '—'}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <span className="material-symbols-outlined text-xs">school</span>{hd.tenKhoa || hd.donViToChuc || '—'}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <span className="material-symbols-outlined text-xs">group</span>Tối đa {hd.soLuongMAX} người
                  </span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-[#004581]">
                    <span className="material-symbols-outlined text-xs">star</span>{hd.diemHoatDong || 0} điểm
                  </span>
                </div>
                {/* Link đính kèm */}
                {(hd.luuY || hd.Linkdinhkem) && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-blue-500">attach_file</span>
                    <a href={hd.luuY || hd.Linkdinhkem} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium truncate max-w-xs">
                      {hd.luuY || hd.Linkdinhkem}
                    </a>
                  </div>
                )}
              </div>
            </div>
            {/* Actions */}
            <div className="flex flex-col gap-2 flex-shrink-0">
              <button onClick={() => onDuyet(hd)}
                className="w-32 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-sm">
                <span className="material-symbols-outlined text-sm font-semibold">check</span>Duyệt
              </button>
              <button onClick={() => onTuChoi(hd)}
                className="w-32 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-sm">
                <span className="material-symbols-outlined text-sm font-semibold">close</span>Từ chối
              </button>
              <button onClick={() => setExpanded(expanded === hd.idHD ? null : hd.idHD)}
                className="w-32 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5">
                <span className="material-symbols-outlined text-sm font-semibold">{expanded === hd.idHD ? 'expand_less' : 'expand_more'}</span>
                {expanded === hd.idHD ? 'Thu gọn' : 'Chi tiết'}
              </button>
            </div>
          </div>
          {/* Expanded detail */}
          {expanded === hd.idHD && (
            <div className="border-t border-yellow-100 bg-yellow-50/50 px-5 py-4">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Mô tả hoạt động</p>
              <p className="text-sm text-gray-700 leading-relaxed">{hd.moTa || 'Không có mô tả'}</p>
              {(hd.luuY || hd.Linkdinhkem) && (
                <div className="mt-3">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Tài liệu / Minh chứng đính kèm</p>
                  <a href={hd.luuY || hd.Linkdinhkem} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm text-blue-600 hover:bg-blue-50 font-medium">
                    <span className="material-symbols-outlined text-base">open_in_new</span>
                    Mở tài liệu đính kèm
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

/* ── VIEW DUYỆT MINH CHỨNG ── */
const MinhChungView = ({ act, onBack }) => {
  const [list, setList] = useState([]);
  const [sel, setSel] = useState([]);
  const [loading, setL] = useState(true);
  const [tuChoi, setTC] = useState(null);
  const [msg, setMsg] = useState('');

  const fetch = useCallback(async () => {
    setL(true);
    const r = await axios.get(`${API}/${act.idHD}/dang-ky?trangThai=Chờ duyệt mc`, { headers: H() });
    setList(r.data.data || []); setSel([]); setL(false);
  }, [act.idHD]);

  useEffect(() => { fetch(); }, [fetch]);

  const toggleSel = maDV => setSel(p => p.includes(maDV) ? p.filter(x => x !== maDV) : [...p, maDV]);
  const toggleAll = () => setSel(sel.length === list.length ? [] : list.map(d => d.maDV));

  const doAction = async (trangThai) => {
    const ids = sel;
    if (!ids.length) return;
    try {
      const r = await axios.put(`${API}/duyet-minh-chung`, { idList: ids, idHD: act.idHD, trangThai }, { headers: H() });
      setMsg(r.data.message); fetch();
    } catch (e) { setMsg(e.response?.data?.message || 'Lỗi'); }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={onBack} className="flex items-center gap-1 text-[#004581] text-sm hover:underline font-medium">
          <span className="material-symbols-outlined text-base">arrow_back</span>Quay lại
        </button>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900">{act.tenHD}</h3>
          <p className="text-xs text-gray-400">{fmtDate(act.ngayToChuc)} · {act.diaDiem}</p>
        </div>
      </div>
      {msg && <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-200 flex items-center gap-2">
        <span className="material-symbols-outlined text-base">check_circle</span>{msg}
      </div>}
      <div className="bg-white border border-gray-200 rounded-xl p-3 flex flex-wrap gap-3 items-center">
        <span className="text-sm text-gray-500 flex-1">{sel.length} đã chọn / {list.length} chờ duyệt</span>
        <button onClick={() => doAction('Đã tham gia')} disabled={!sel.length}
          className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 disabled:opacity-40 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">check_circle</span>Duyệt đã chọn
        </button>
        <button onClick={() => { setSel(list.map(d => d.maDV)); setTimeout(() => doAction('Đã tham gia'), 0); }} disabled={!list.length}
          className="px-4 py-2 bg-[#004581] text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">done_all</span>Duyệt tất cả
        </button>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left table-auto">
          <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
            <tr>
              <th className="px-3.5 py-2.5 w-10"><input type="checkbox" onChange={toggleAll} checked={sel.length === list.length && list.length > 0} className="rounded" /></th>
              <th className="px-3.5 py-2.5">Họ tên</th><th className="px-3.5 py-2.5">Mã ĐV</th>
              <th className="px-3.5 py-2.5">Khoa</th><th className="px-3.5 py-2.5">Minh chứng</th>
              <th className="px-3.5 py-2.5">Trạng thái</th><th className="px-3.5 py-2.5 text-right w-[90px] min-w-[90px]">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? <tr><td colSpan={7} className="px-3.5 py-8 text-center"><span className="material-symbols-outlined animate-spin text-4xl text-gray-300">refresh</span></td></tr>
              : list.length === 0 ? <tr><td colSpan={7} className="px-3.5 py-8 text-center text-gray-400">Không có minh chứng chờ duyệt</td></tr>
                : list.map(dk => (
                  <tr key={dk.maDV} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3.5 py-2.5"><input type="checkbox" checked={sel.includes(dk.maDV)} onChange={() => toggleSel(dk.maDV)} className="rounded" /></td>
                    <td className="px-3.5 py-2.5 font-semibold text-gray-800">{dk.hoTen}</td>
                    <td className="px-3.5 py-2.5 font-mono text-xs text-gray-400">{dk.maDV}</td>
                    <td className="px-3.5 py-2.5 text-gray-500">{dk.tenKhoa || '—'}</td>
                    <td className="px-3.5 py-2.5">
                      {dk.minhChung ? <a href={dk.minhChung} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[#004581] hover:underline text-xs font-medium">
                        <span className="material-symbols-outlined text-sm">image</span>Xem ảnh</a>
                        : <span className="text-gray-300 text-xs">Không có</span>}
                    </td>
                    <td className="px-3.5 py-2.5"><Badge tt={dk.trangThaiThamGia} /></td>
                    <td className="px-3.5 py-2.5 text-right w-[90px] min-w-[90px]">
                      <div className="flex items-center justify-end gap-1.5 w-[90px] min-w-[90px]">
                        <button onClick={() => { setSel([dk.maDV]); setTimeout(() => doAction('Đã tham gia'), 0); }} title="Duyệt minh chứng" className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 transition-all active:scale-95 flex-shrink-0">
                          <span className="material-symbols-outlined text-base font-semibold">check</span>
                        </button>
                        <button onClick={() => setTC(dk)} title="Từ chối minh chứng" className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-all active:scale-95 flex-shrink-0">
                          <span className="material-symbols-outlined text-base font-semibold">close</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
      {tuChoi && <TuChoiModal title={`Từ chối: ${tuChoi.hoTen}`} onClose={() => setTC(null)} onConfirm={lyDo => doAction('Đã từ chối', lyDo)} />}
    </div>
  );
};

/* ── MAIN ── */
const AdminHoatDong = () => {
  const [tab, setTab] = useState('Tất cả');
  const [data, setData] = useState([]);
  const [loading, setL] = useState(true);
  const [modal, setModal] = useState(false);
  const [mcView, setMcView] = useState(null);
  const [tcModal, setTC] = useState(null);
  const [search, setSearch] = useState('');
  const toast = useToast();

  const fetchAll = useCallback(async () => {
    setL(true);
    try {
      const tt = tab === 'Tất cả' ? '' : tab;
      const r = await axios.get(`${API}/all?${tt ? `trangThai=${encodeURIComponent(tt)}` : ''}`, { headers: H() });
      setData(r.data.data || []);
    } catch (e) { console.error(e); }
    finally { setL(false); }
  }, [tab]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const duyet = async (hd) => {
    try {
      await axios.put(`${API}/${hd.idHD}/trang-thai`, { trangThaiHD: 'Đang mở' }, { headers: H() });
      toast.success('Duyệt hoạt động thành công');
      fetchAll();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi khi duyệt');
    }
  };
  const tuChoi = async (hd, lyDo) => {
    try {
      await axios.put(`${API}/${hd.idHD}/trang-thai`, { trangThaiHD: 'Bị từ chối', lyDoTuChoi: lyDo }, { headers: H() });
      toast.success('Đã từ chối hoạt động');
      setTC(null); 
      fetchAll();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi khi từ chối');
    }
  };
  const doiTT = async (hd, tt) => {
    try {
      await axios.put(`${API}/${hd.idHD}/trang-thai`, { trangThaiHD: tt }, { headers: H() });
      toast.success(`Cập nhật trạng thái thành "${tt}"`);
      fetchAll();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi cập nhật trạng thái');
    }
  };

  const filtered = data.filter(d => d.tenHD?.toLowerCase().includes(search.toLowerCase()));

  if (mcView) return <MinhChungView act={mcView} onBack={() => { setMcView(null); fetchAll(); }} />;

  const counts = {};
  ALL_TABS.forEach(t => {
    counts[t] = t === 'Tất cả' ? data.length : data.filter(d => d.trangThaiHD === t).length;
  });

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý Hoạt động</h2>
          <p className="text-sm text-gray-400 mt-0.5">Đoàn trường – Quản lý tất cả sự kiện phong trào</p>
        </div>
        <button onClick={() => setModal(true)}
          className="bg-gradient-to-r from-[#004581] to-[#0066bb] text-white font-semibold px-5 py-2.5 rounded-xl hover:shadow-lg transition-all flex items-center gap-2 text-sm">
          <span className="material-symbols-outlined text-base fill">add_circle</span>Thêm hoạt động
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {ALL_TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${tab === t ? 'bg-white text-[#004581] shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
            {t}
            {counts[t] > 0 && <span className={`px-1.5 py-0.5 rounded-full text-xs ${tab === t ? 'bg-[#004581] text-white' : 'bg-gray-200 text-gray-600'}`}>{counts[t]}</span>}
          </button>
        ))}
      </div>

      {/* Panel duyệt hoạt động - chỉ hiện khi tab Chờ duyệt */}
      {tab === 'Chờ duyệt' ? (
        <DuyetHoatDongPanel
          items={filtered}
          loading={loading}
          onDuyet={duyet}
          onTuChoi={setTC}
        />
      ) : (
        <>
          {/* Search - chỉ hiện ở tab khác */}
          <div className="relative w-full max-w-sm">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm tên hoạt động..."
              className="w-full border border-gray-200 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-[#004581] bg-white" />
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left table-auto">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Tên hoạt động</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Ngày</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Địa điểm</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">SL</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Điểm</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Đơn vị</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider text-right w-[90px] min-w-[90px]">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={8} className="py-16 text-center">
                    <span className="material-symbols-outlined animate-spin text-4xl text-gray-200">refresh</span>
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} className="py-16 text-center">
                    <span className="material-symbols-outlined text-5xl text-gray-200 block mb-2">event_busy</span>
                    <p className="text-gray-400 text-sm">Không có hoạt động nào</p>
                  </td></tr>
                ) : filtered.map(hd => {
                  const pct = hd.soLuongMAX > 0 ? Math.round((hd.soLuongDaDangKy / hd.soLuongMAX) * 100) : 0;
                  return (
                    <tr key={hd.idHD} className="hover:bg-[#f8faff] transition-colors group">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900 group-hover:text-[#004581] transition-colors">{hd.tenHD}</p>
                        {hd.moTa && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{hd.moTa}</p>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{fmtDate(hd.ngayToChuc)}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-[140px] truncate">{hd.diaDiem || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs font-bold text-gray-700">{hd.soLuongDaDangKy}/{hd.soLuongMAX}</span>
                          <div className="w-16 bg-gray-100 rounded-full h-1">
                            <div className={`h-1 rounded-full ${pct >= 90 ? 'bg-red-400' : pct >= 60 ? 'bg-orange-400' : 'bg-green-400'}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#d4e3ff] text-[#004581] text-xs font-bold">{hd.diemHoatDong || 0}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap max-w-[130px] truncate" title={hd.tenKhoa || hd.donViToChuc}>{hd.tenKhoa || hd.donViToChuc || '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap"><Badge tt={hd.trangThaiHD} /></td>
                      <td className="px-4 py-3 text-right whitespace-nowrap w-[90px] min-w-[90px]">
                        <div className="flex items-center justify-end gap-1.5 flex-nowrap w-[90px] min-w-[90px]">
                          {hd.trangThaiHD === 'Chờ duyệt' && (<>
                            <button onClick={() => duyet(hd)} title="Duyệt hoạt động" className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-all active:scale-95 flex-shrink-0">
                              <span className="material-symbols-outlined text-base font-semibold">check</span>
                            </button>
                            <button onClick={() => setTC(hd)} title="Từ chối hoạt động" className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all active:scale-95 flex-shrink-0">
                              <span className="material-symbols-outlined text-base font-semibold">close</span>
                            </button>
                          </>)}
                          {hd.trangThaiHD === 'Sắp diễn ra' && (
                            <button onClick={() => doiTT(hd, 'Đang mở')} title="Mở đăng ký" className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-all active:scale-95 flex-shrink-0">
                              <span className="material-symbols-outlined text-base font-semibold">lock_open</span>
                            </button>
                          )}
                          {hd.trangThaiHD === 'Đang mở' && (
                            <button onClick={() => doiTT(hd, 'Đang diễn ra')} title="Bắt đầu hoạt động" className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 transition-all active:scale-95 flex-shrink-0">
                              <span className="material-symbols-outlined text-base font-semibold">play_arrow</span>
                            </button>
                          )}
                          {hd.trangThaiHD === 'Đang diễn ra' && (<>
                            <button onClick={() => setMcView(hd)} title="Xem/Duyệt minh chứng" className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#004581] border border-blue-200 transition-all active:scale-95 flex-shrink-0">
                              <span className="material-symbols-outlined text-base font-semibold">fact_check</span>
                            </button>
                            <button onClick={() => doiTT(hd, 'Đã kết thúc')} title="Kết thúc hoạt động" className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 transition-all active:scale-95 flex-shrink-0">
                              <span className="material-symbols-outlined text-base font-semibold">stop</span>
                            </button>
                          </>)}
                          {hd.trangThaiHD === 'Đã kết thúc' && (
                            <button onClick={() => setMcView(hd)} title="Xem minh chứng" className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#004581] border border-blue-200 transition-all active:scale-95 flex-shrink-0">
                              <span className="material-symbols-outlined text-base font-semibold">fact_check</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </>
      )}

      {modal && <TaoModal onClose={() => setModal(false)} onSaved={() => { setModal(false); fetchAll(); }} />}
      {tcModal && <TuChoiModal title={`Từ chối: ${tcModal.tenHD}`} onClose={() => setTC(null)} onConfirm={lyDo => tuChoi(tcModal, lyDo)} />}
    </div>
  );
};

export default AdminHoatDong;
