import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const TRANG_THAI = ['Đang giữ', 'Đã nộp', 'Thất lạc', 'Đã rút'];
const BADGE = {
  'Đang giữ':  'bg-green-50 text-green-700 border-green-200',
  'Đã nộp':    'bg-blue-50 text-blue-700 border-blue-200',
  'Thất lạc':  'bg-red-50 text-red-600 border-red-200',
  'Đã rút':    'bg-gray-100 text-gray-500 border-gray-200',
};
const DOT = {
  'Đang giữ': 'bg-green-500', 'Đã nộp': 'bg-blue-500',
  'Thất lạc': 'bg-red-500',   'Đã rút': 'bg-gray-400',
};

// Modal cập nhật trạng thái
const StatusModal = ({ item, onClose, onSaved }) => {
  const [trangThai, setTrangThai] = useState(item.trangThai);
  const [lyDo, setLyDo]           = useState(item.lyDoRut || '');
  const [ngayRut, setNgayRut]     = useState(item.ngayRutSo || '');
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(`${API_URL}/so-doan/${item.maSoDoan}/trang-thai`,
        { trangThai, lyDoRut: lyDo, ngayRutSo: ngayRut || null },
        { headers: getHeaders() }
      );
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Cập nhật trạng thái</h3>
            <p className="text-xs text-gray-400 mt-0.5">Sổ: {item.maSoDoan} · {item.hoTen}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><span className="material-symbols-outlined">close</span></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">{error}</div>}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Trạng thái</label>
            <select value={trangThai} onChange={e => setTrangThai(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#004581]">
              {TRANG_THAI.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          {(trangThai === 'Đã rút' || trangThai === 'Thất lạc') && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Lý do</label>
                <textarea value={lyDo} onChange={e => setLyDo(e.target.value)} rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#004581] resize-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Ngày rút sổ</label>
                <input type="date" value={ngayRut} onChange={e => setNgayRut(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#004581]" />
              </div>
            </>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Hủy</button>
            <button type="submit" disabled={saving}
              className="px-5 py-2 bg-[#004581] text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
              {saving && <span className="material-symbols-outlined text-sm animate-spin">refresh</span>}
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminSoDoan = () => {
  const [data, setData]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filterTT, setFilterTT] = useState('');
  const [modal, setModal]       = useState(null);
  const [page, setPage]         = useState(1);
  const PER_PAGE = 10;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search)   params.append('search', search);
      if (filterTT) params.append('trangThai', filterTT);
      const res = await axios.get(`${API_URL}/so-doan?${params}`, { headers: getHeaders() });
      setData(res.data.data || []);
      setPage(1);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [search, filterTT]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalPages = Math.ceil(data.length / PER_PAGE);
  const pageData   = data.slice((page-1)*PER_PAGE, page*PER_PAGE);

  const stats = TRANG_THAI.map(tt => ({
    label: tt,
    count: data.filter(d => d.trangThai === tt).length,
    cls: BADGE[tt], dot: DOT[tt]
  }));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-between items-end">
        <h2 className="text-2xl font-bold text-gray-900">Quản lý Sổ Đoàn</h2>
      </div>

      {/* Stat mini cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 hover:shadow-sm transition-shadow cursor-pointer" onClick={() => setFilterTT(filterTT === s.label ? '' : s.label)}>
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${s.dot}`}></div>
            <div>
              <p className="text-xs text-gray-500 font-medium">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900">{s.count}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
          <input className="w-full border border-gray-200 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-[#004581]"
            placeholder="Tìm tên, mã sổ, mã ĐV..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={filterTT} onChange={e => setFilterTT(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#004581] text-gray-600">
          <option value="">Tất cả trạng thái</option>
          {TRANG_THAI.map(t => <option key={t}>{t}</option>)}
        </select>
        <button onClick={fetchData} className="px-4 py-2 bg-[#004581] text-white rounded-lg text-sm font-semibold hover:bg-blue-700">Lọc</button>
        {filterTT && <button onClick={() => setFilterTT('')} className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50">Xóa lọc</button>}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
              <tr>
                <th className="p-4">Mã Sổ</th>
                <th className="p-4 min-w-[160px]">Đoàn viên</th>
                <th className="p-4">Chi đoàn</th>
                <th className="p-4">Nơi cấp</th>
                <th className="p-4">Ngày cấp</th>
                <th className="p-4">Ngày rút</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="p-10 text-center"><span className="material-symbols-outlined animate-spin text-4xl text-gray-300">refresh</span></td></tr>
              ) : pageData.length === 0 ? (
                <tr><td colSpan={8} className="p-10 text-center text-gray-400">Không có dữ liệu</td></tr>
              ) : pageData.map(sd => (
                <tr key={sd.maSoDoan} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-mono text-xs text-gray-400">{sd.maSoDoan}</td>
                  <td className="p-4">
                    <p className="font-semibold text-gray-800">{sd.hoTen}</p>
                    <p className="text-xs text-gray-400">{sd.maDV}</p>
                  </td>
                  <td className="p-4 text-gray-500">{sd.tenChiDoan || '—'}</td>
                  <td className="p-4 text-gray-500">{sd.noiCap || '—'}</td>
                  <td className="p-4 text-gray-500">{sd.ngayCap ? new Date(sd.ngayCap).toLocaleDateString('vi-VN') : '—'}</td>
                  <td className="p-4 text-gray-500">{sd.ngayRutSo ? new Date(sd.ngayRutSo).toLocaleDateString('vi-VN') : '—'}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-semibold ${BADGE[sd.trangThai] || 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${DOT[sd.trangThai] || 'bg-gray-400'}`}></span>
                      {sd.trangThai}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => setModal(sd)} className="text-gray-400 hover:text-[#004581] p-1" title="Cập nhật trạng thái">
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">Trang {page}/{totalPages} · {data.length} bản ghi</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} className="p-1.5 border border-gray-200 rounded text-gray-400 hover:bg-gray-100 disabled:opacity-30">
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              {Array.from({length: Math.min(5,totalPages)}, (_,i)=>i+1).map(n => (
                <button key={n} onClick={() => setPage(n)} className={`w-8 h-8 rounded text-xs font-semibold border ${page===n ? 'bg-[#004581] text-white border-[#004581]' : 'border-gray-200 text-gray-600 hover:bg-gray-100'}`}>{n}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages} className="p-1.5 border border-gray-200 rounded text-gray-400 hover:bg-gray-100 disabled:opacity-30">
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {modal && <StatusModal item={modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); fetchData(); }} />}
    </div>
  );
};

export default AdminSoDoan;
