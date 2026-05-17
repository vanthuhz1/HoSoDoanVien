import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useToast } from '../common/Toast';

const API = 'http://localhost:5001/api/thong-bao';
const H = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });
const fmtDate = d => d ? new Date(d).toLocaleDateString('vi-VN') : '—';

const LOAI = ['Thông báo', 'Tin tức'];
const PHAM_VI = ['Công khai', 'Nội bộ'];

const LOAI_COLOR = {
  'Thông báo': 'bg-blue-50 text-blue-700',
  'Tin tức':   'bg-purple-50 text-purple-700',
};
const PHAM_VI_COLOR = {
  'Công khai': 'bg-green-50 text-green-700 border-green-200',
  'Nội bộ':   'bg-orange-50 text-orange-700 border-orange-200',
};

/* ── RICH TEXT EDITOR ── */
const RichEditor = ({ value, onChange }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value || '';
  }, []);
  const cmd = (c, v) => { document.execCommand(c, false, v); ref.current?.focus(); };
  const tools = [
    { icon: 'format_bold',          c: 'bold' },
    { icon: 'format_italic',        c: 'italic' },
    { icon: 'format_underlined',    c: 'underline' },
    { icon: 'format_list_bulleted', c: 'insertUnorderedList' },
    { icon: 'format_list_numbered', c: 'insertOrderedList' },
    { icon: 'format_align_center',  c: 'justifyCenter' },
  ];
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:border-[#004581] focus-within:ring-2 focus-within:ring-[#004581]/10 transition-all">
      <div className="flex items-center gap-0.5 p-2 bg-gray-50 border-b border-gray-100 flex-wrap">
        {tools.map(t => (
          <button key={t.c} type="button" onMouseDown={e => { e.preventDefault(); cmd(t.c); }}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-white hover:text-[#004581] hover:shadow-sm transition-all">
            <span className="material-symbols-outlined text-base">{t.icon}</span>
          </button>
        ))}
        <div className="h-5 w-px bg-gray-200 mx-1" />
        <button type="button" onMouseDown={e => { e.preventDefault(); const u = prompt('URL:'); if(u) cmd('createLink',u); }}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-white hover:text-[#004581] hover:shadow-sm transition-all">
          <span className="material-symbols-outlined text-base">link</span>
        </button>
      </div>
      <div ref={ref} contentEditable suppressContentEditableWarning
        onInput={() => onChange(ref.current?.innerHTML || '')}
        className="min-h-[200px] p-4 text-sm text-gray-800 focus:outline-none leading-relaxed"
        style={{ fontFamily:"'Inter',sans-serif" }} />
    </div>
  );
};

/* ── EDITOR MODAL ── */
const EditorModal = ({ item, onClose, onSaved }) => {
  const [f, setF] = useState({
    tieuDe:  item?.tieuDe  || '',
    noiDung: item?.noiDung || '',
    loai:    item?.loai    || 'Thông báo',
    phamVi:  item?.phamVi  || 'Công khai',
    anhBia:  item?.anhBia  || '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const submit = async e => {
    e.preventDefault();
    if (!f.tieuDe.trim()) { setErr('Vui lòng nhập tiêu đề'); return; }
    setSaving(true); setErr('');
    try {
      if (item?.idThongBao) await axios.put(`${API}/${item.idThongBao}`, f, { headers: H() });
      else                   await axios.post(API, f, { headers: H() });
      onSaved();
    } catch(e) { setErr(e.response?.data?.message || 'Lỗi'); setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-[#004581] to-[#0066bb] px-6 py-4 flex justify-between items-center flex-shrink-0">
          <div>
            <h3 className="text-white font-bold text-lg">{item ? 'Chỉnh sửa thông báo' : 'Tạo thông báo mới'}</h3>
            <p className="text-blue-200 text-xs mt-0.5">Nội dung sẽ hiển thị trên trang chủ</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors p-1">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={submit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {err && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>{err}
          </div>}

          {/* Tiêu đề */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tiêu đề *</label>
            <input value={f.tieuDe} onChange={e => set('tieuDe', e.target.value)}
              placeholder="Nhập tiêu đề thông báo..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base font-semibold text-gray-900 focus:outline-none focus:border-[#004581] focus:ring-2 focus:ring-[#004581]/10 transition-all" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Loại</label>
              <select value={f.loai} onChange={e => set('loai', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#004581] text-gray-700">
                {LOAI.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Phạm vi</label>
              <select value={f.phamVi} onChange={e => set('phamVi', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#004581] text-gray-700">
                {PHAM_VI.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Ảnh bìa (URL)</label>
              <input value={f.anhBia} onChange={e => set('anhBia', e.target.value)} placeholder="https://..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#004581]" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Nội dung</label>
            <RichEditor value={f.noiDung} onChange={v => set('noiDung', v)} />
          </div>
        </form>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-white transition-all">Hủy</button>
          <button onClick={submit} disabled={saving}
            className="px-6 py-2.5 bg-gradient-to-r from-[#004581] to-[#0066bb] text-white rounded-xl text-sm font-bold hover:shadow-lg disabled:opacity-50 flex items-center gap-2 transition-all">
            <span className="material-symbols-outlined text-sm fill">save</span>
            {saving ? 'Đang lưu...' : (item ? 'Lưu thay đổi' : 'Đăng thông báo')}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── MAIN ── */
const AdminThongBao = () => {
  const [data, setData]     = useState([]);
  const [loading, setL]     = useState(true);
  const [search, setSearch] = useState('');
  const [filterLoai, setFL] = useState('');
  const [filterPV, setFPV]  = useState('');
  const [editor, setEditor] = useState(null);
  const toast = useToast();

  const fetchData = useCallback(async () => {
    setL(true);
    try {
      const p = new URLSearchParams();
      if (search)    p.append('search', search);
      if (filterLoai) p.append('loai', filterLoai);
      if (filterPV)   p.append('phamVi', filterPV);
      const r = await axios.get(`${API}?${p}`, { headers: H() });
      setData(r.data.data || []);
    } catch(e) { console.error(e); }
    finally { setL(false); }
  }, [search, filterLoai, filterPV]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const doDelete = async (id, title) => {
    const confirmed = await toast.confirm(`Xóa thông báo "${title}"?`);
    if (!confirmed) return;
    try {
      await axios.delete(`${API}/${id}`, { headers: H() });
      toast.success('Đã xóa thông báo thành công!');
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi khi xóa');
    }
  };

  const counts = {
    all: data.length,
    ck: data.filter(d => d.phamVi === 'Công khai').length,
    nb: data.filter(d => d.phamVi === 'Nội bộ').length,
  };

  return (
    <div className="flex flex-col gap-5" style={{ fontFamily:"'Inter',sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Thông báo & Tin tức</h2>
          <p className="text-sm text-gray-400 mt-0.5">Quản lý nội dung hiển thị trên trang chủ</p>
        </div>
        <button onClick={() => setEditor('new')}
          className="bg-gradient-to-r from-[#004581] to-[#0066bb] text-white font-bold px-5 py-2.5 rounded-xl hover:shadow-lg transition-all flex items-center gap-2 text-sm">
          <span className="material-symbols-outlined text-base fill">add_circle</span>Tạo thông báo mới
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Tất cả bài viết', value: counts.all, icon: 'article', bg: 'bg-[#d4e3ff]', ic: 'text-[#004581]' },
          { label: 'Công khai',       value: counts.ck,  icon: 'public',  bg: 'bg-green-100', ic: 'text-green-600' },
          { label: 'Nội bộ',          value: counts.nb,  icon: 'lock',    bg: 'bg-orange-100',ic: 'text-orange-600' },
        ].map(c => (
          <div key={c.label} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
            <div className={`w-12 h-12 rounded-xl ${c.bg} ${c.ic} flex items-center justify-center flex-shrink-0`}>
              <span className="material-symbols-outlined text-xl fill">{c.icon}</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{c.label}</p>
              <p className="text-3xl font-black text-gray-900">{c.value}</p>
            </div>
          </div>
        ))}
      </div>



      {/* Filters */}
      <div className="bg-white border border-gray-100 rounded-2xl p-3 flex flex-wrap gap-3 items-center shadow-sm">
        <div className="relative flex-1 min-w-52">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo tiêu đề..."
            className="w-full border border-gray-200 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-[#004581]" />
        </div>
        <select value={filterLoai} onChange={e => setFL(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none text-gray-600">
          <option value="">Tất cả loại</option>
          {LOAI.map(l => <option key={l}>{l}</option>)}
        </select>
        <select value={filterPV} onChange={e => setFPV(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none text-gray-600">
          <option value="">Tất cả phạm vi</option>
          {PHAM_VI.map(p => <option key={p}>{p}</option>)}
        </select>
        {(filterLoai || filterPV || search) && (
          <button onClick={() => { setSearch(''); setFL(''); setFPV(''); }}
            className="px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-500 hover:bg-gray-50 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">close</span>Xóa lọc
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/80">
              {['Tiêu đề','Loại','Phạm vi','Ngày tạo','Người đăng','Hành động'].map(h => (
                <th key={h} className="px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={6} className="py-16 text-center">
                <span className="material-symbols-outlined animate-spin text-5xl text-gray-200">refresh</span>
              </td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={6} className="py-16 text-center">
                <span className="material-symbols-outlined text-6xl text-gray-200 block mb-3">article</span>
                <p className="text-gray-400 font-semibold">Chưa có thông báo nào</p>
                <button onClick={() => setEditor('new')} className="mt-3 text-[#004581] text-sm hover:underline font-medium">Tạo thông báo đầu tiên →</button>
              </td></tr>
            ) : data.map(tb => (
              <tr key={tb.idThongBao} className="hover:bg-[#f8faff] transition-colors group">
                <td className="px-5 py-4 max-w-xs">
                  <div className="flex items-center gap-3">
                    {tb.anhBia
                      ? <img src={tb.anhBia} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-100 flex-shrink-0" onError={e => e.target.style.display='none'} />
                      : <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-gray-400 text-base">article</span>
                        </div>
                    }
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 group-hover:text-[#004581] transition-colors truncate">{tb.tieuDe}</p>
                      {tb.noiDung && <p className="text-xs text-gray-400 truncate mt-0.5"
                        dangerouslySetInnerHTML={{ __html: tb.noiDung.replace(/<[^>]+>/g,'').substring(0,60)+'...' }} />}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold ${LOAI_COLOR[tb.loai] || 'bg-gray-50 text-gray-500'}`}>{tb.loai}</span>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex px-2.5 py-1 rounded-full border text-xs font-semibold ${PHAM_VI_COLOR[tb.phamVi] || 'bg-gray-50 text-gray-500 border-gray-200'}`}>{tb.phamVi}</span>
                </td>
                <td className="px-5 py-4 text-gray-400 text-xs font-medium whitespace-nowrap">{fmtDate(tb.ngayTao)}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#004581] flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">{(tb.nguoiDang||'?')[0]}</span>
                    </div>
                    <span className="text-gray-600 text-xs font-medium">{tb.nguoiDang || '—'}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1 transition-opacity">
                    <button onClick={() => setEditor(tb)} title="Chỉnh sửa"
                      className="p-2 text-gray-400 hover:text-[#004581] hover:bg-blue-50 rounded-lg transition-all">
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button onClick={() => doDelete(tb.idThongBao, tb.tieuDe)} title="Xóa"
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editor && (
        <EditorModal
          item={editor === 'new' ? null : editor}
          onClose={() => setEditor(null)}
          onSaved={() => {
            setEditor(null);
            toast.success(editor === 'new' ? 'Đã tạo thông báo thành công!' : 'Đã cập nhật thành công!');
            fetchData();
          }}
        />
      )}
    </div>
  );
};

export default AdminThongBao;
