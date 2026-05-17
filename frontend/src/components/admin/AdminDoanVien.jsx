import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  return dateString.split('T')[0]; // Biến "2000-04-27T17:00..." thành "2000-04-27" sạch sẽ
};
const API_URL = 'http://localhost:5001/api';
const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const BADGE = {
  'Đang sinh hoạt': 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  'Đã rút hồ sơ':  'bg-rose-50 text-rose-600 ring-1 ring-rose-200',
};
const DOT = {
  'Đang sinh hoạt': 'bg-emerald-500',
  'Đã rút hồ sơ':  'bg-rose-500',
};
const AVATAR_COLORS = [
  'from-violet-500 to-purple-600','from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500','from-orange-400 to-rose-500',
  'from-pink-500 to-fuchsia-600','from-amber-400 to-orange-500',
];
const avatarColor = (str='') => AVATAR_COLORS[str.charCodeAt(0) % AVATAR_COLORS.length];

/* ── INPUT HELPER ── */
const F = ({ label, name, type='text', required, form, setForm, children }) => (
  <div>
    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children || (
      <input type={type} value={form[name]||''} onChange={e=>setForm(p=>({...p,[name]:e.target.value}))}
        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#004581] focus:ring-2 focus:ring-[#004581]/10 bg-gray-50 focus:bg-white transition-all" />
    )}
  </div>
);

/* ── MODAL ── */
const Modal = ({ dv, onClose, onSaved, chiDoans }) => {
  const isEdit = !!dv;
  
  // 💡 TỰ ĐỘNG LÀM SẠCH NGÀY THÁNG TRƯỚC KHI ĐƯA VÀO FORM STATE
  const initialForm = dv 
    ? {
        ...dv,
        ngaySinh: formatDateForInput(dv.ngaySinh),
        ngayVaoDoan: formatDateForInput(dv.ngayVaoDoan)
      }
    : {
        maDV:'', hoTen:'', ngaySinh:'', gioiTinh:'Nam', danToc:'Kinh', tonGiao:'Không',
        SDT:'', maChiDoan:'', ngayVaoDoan:'', noiVaoDoan:'', trangThaiSH:'Đang sinh hoạt',
        chucVu:'Đoàn viên', cccd:'', queQuan:'', diaChiThuongTru:''
      };

  const [form, setForm] = useState(initialForm); // Gán dữ liệu sạch vào đây
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');


  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.maDV || !form.hoTen) { setError('Mã ĐV và Họ tên là bắt buộc'); return; }
    setSaving(true);
    try {
      if (isEdit) await axios.put(`${API_URL}/doan-vien/${form.maDV}`, form, { headers: getHeaders() });
      else        await axios.post(`${API_URL}/doan-vien`, form, { headers: getHeaders() });
      onSaved();
    } catch(err) { setError(err.response?.data?.message || 'Có lỗi xảy ra'); }
    finally { setSaving(false); }
  };

  const fp = { form, setForm };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden" onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-[#004581] to-[#0066bb] px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-white fill text-xl">person</span>
            </div>
            <div>
              <h3 className="text-white font-bold text-base">{isEdit ? 'Chỉnh sửa Đoàn viên' : 'Thêm Đoàn viên mới'}</h3>
              <p className="text-blue-200 text-xs mt-0.5">{isEdit ? `Mã: ${dv.maDV}` : 'Điền đầy đủ thông tin bên dưới'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors p-1">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200 flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>{error}
          </div>}

          <form onSubmit={handleSubmit}>
            {/* Section: Thông tin cơ bản */}
            <p className="text-[11px] font-bold text-[#004581] uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-4 h-px bg-[#004581]" />Thông tin cơ bản
            </p>
            <div className="grid grid-cols-2 gap-4 mb-5">
              <F label="Mã Đoàn viên" name="maDV" required {...fp}>
                <input disabled={isEdit} value={form.maDV||''} onChange={e=>setForm(p=>({...p,maDV:e.target.value}))}
                  className={`w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#004581] focus:ring-2 focus:ring-[#004581]/10 ${isEdit?'bg-gray-100 text-gray-500':'bg-gray-50 focus:bg-white'} transition-all`} />
              </F>
              <F label="Họ và tên" name="hoTen" required {...fp} />
              <F label="Ngày sinh" name="ngaySinh" type="date" {...fp} />
              <F label="Giới tính" name="gioiTinh" {...fp}>
                <select value={form.gioiTinh||'Nam'} onChange={e=>setForm(p=>({...p,gioiTinh:e.target.value}))}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#004581] bg-gray-50 focus:bg-white transition-all text-gray-800">
                  {['Nam','Nữ','Khác'].map(g=><option key={g}>{g}</option>)}
                </select>
              </F>
              <F label="CCCD" name="cccd" {...fp} />
              <F label="Số điện thoại" name="SDT" {...fp} />
              <F label="Dân tộc" name="danToc" {...fp} />
              <F label="Tôn giáo" name="tonGiao" {...fp} />
            </div>

            <p className="text-[11px] font-bold text-[#004581] uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-4 h-px bg-[#004581]" />Thông tin Đoàn
            </p>
            <div className="grid grid-cols-2 gap-4 mb-5">
              <F label="Chi đoàn" name="maChiDoan" {...fp}>
                <select value={form.maChiDoan||''} onChange={e=>setForm(p=>({...p,maChiDoan:e.target.value}))}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#004581] bg-gray-50 focus:bg-white transition-all text-gray-800">
                  <option value="">-- Chọn chi đoàn --</option>
                  {chiDoans.map(cd=><option key={cd.maChiDoan} value={cd.maChiDoan}>{cd.tenChiDoan}</option>)}
                </select>
              </F>
              <F label="Chức vụ" name="chucVu" {...fp}>
                <select value={form.chucVu||'Đoàn viên'} onChange={e=>setForm(p=>({...p,chucVu:e.target.value}))}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#004581] bg-gray-50 focus:bg-white transition-all text-gray-800">
                  {['Đoàn viên','Bí thư','Phó bí thư','Ủy viên BCH'].map(c=><option key={c}>{c}</option>)}
                </select>
              </F>
              <F label="Ngày vào Đoàn" name="ngayVaoDoan" type="date" {...fp} />
              <F label="Nơi vào Đoàn" name="noiVaoDoan" {...fp} />
              <F label="Trạng thái" name="trangThaiSH" {...fp}>
                <select value={form.trangThaiSH||'Đang sinh hoạt'} onChange={e=>setForm(p=>({...p,trangThaiSH:e.target.value}))}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#004581] bg-gray-50 focus:bg-white transition-all text-gray-800">
                  {['Đang sinh hoạt','Đã rút hồ sơ'].map(s=><option key={s}>{s}</option>)}
                </select>
              </F>
            </div>

            <p className="text-[11px] font-bold text-[#004581] uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-4 h-px bg-[#004581]" />Địa chỉ
            </p>
            <div className="grid grid-cols-1 gap-4">
              <F label="Quê quán" name="queQuan" {...fp} />
              <F label="Địa chỉ thường trú" name="diaChiThuongTru" {...fp} />
            </div>

            <div className="flex justify-end gap-3 pt-5 mt-2 border-t border-gray-100">
              <button type="button" onClick={onClose}
                className="px-5 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
                Hủy bỏ
              </button>
              <button type="submit" disabled={saving}
                className="px-6 py-2.5 bg-gradient-to-r from-[#004581] to-[#0066bb] text-white rounded-xl text-sm font-bold hover:shadow-lg disabled:opacity-50 flex items-center gap-2 transition-all">
                {saving && <span className="material-symbols-outlined text-sm animate-spin">refresh</span>}
                <span className="material-symbols-outlined text-sm fill">{isEdit?'save':'person_add'}</span>
                {saving ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Thêm mới'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const AdminDoanVien = () => {
  const [data, setData]         = useState([]);
  const [chiDoans, setChiDoans] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filterCD, setFilterCD] = useState('');
  const [filterTT, setFilterTT] = useState('');
  const [modal, setModal]       = useState(null);
  const [page, setPage]         = useState(1);
  const PER_PAGE = 10;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search)   params.append('search', search);
      if (filterCD) params.append('maChiDoan', filterCD);
      if (filterTT) params.append('trangThaiSH', filterTT);
      const [dvRes] = await Promise.all([
        axios.get(`${API_URL}/doan-vien?${params}`, { headers: getHeaders() }),
      ]);
      setData(dvRes.data.data || []);
      setPage(1);
    } catch(err) { console.error(err); }
    finally { setLoading(false); }
  }, [search, filterCD, filterTT]);

  useEffect(() => {
    axios.get(`${API_URL}/doan-vien`, { headers: getHeaders() }).then(r => {
      const cds = [...new Map((r.data.data||[]).filter(d=>d.maChiDoan).map(d=>[d.maChiDoan,{maChiDoan:d.maChiDoan,tenChiDoan:d.tenChiDoan||d.maChiDoan}])).values()];
      setChiDoans(cds);
    }).catch(()=>{});
    fetchData();
  }, [fetchData]);

  const totalPages = Math.ceil(data.length / PER_PAGE);
  const pageData   = data.slice((page-1)*PER_PAGE, page*PER_PAGE);
  const countActive = data.filter(d=>d.trangThaiSH==='Đang sinh hoạt').length;

  return (
    <div className="flex flex-col gap-5" style={{fontFamily:"'Inter',sans-serif"}}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Quản lý Đoàn viên</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            <span className="font-bold text-emerald-600">{countActive}</span> đang sinh hoạt ·{' '}
            <span className="font-bold text-gray-700">{data.length}</span> tổng số
          </p>
        </div>
        <button onClick={() => setModal('add')}
          className="bg-gradient-to-r from-[#004581] to-[#0066bb] text-white font-bold px-5 py-2.5 rounded-xl hover:shadow-lg transition-all flex items-center gap-2 text-sm">
          <span className="material-symbols-outlined text-base fill">person_add</span>Thêm Đoàn viên
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-wrap gap-3 shadow-sm items-center">
        <div className="relative flex-1 min-w-52">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
          <input className="w-full border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-[#004581] focus:ring-2 focus:ring-[#004581]/10 bg-gray-50 focus:bg-white transition-all"
            placeholder="Tìm tên, mã đoàn viên..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <select value={filterCD} onChange={e=>setFilterCD(e.target.value)}
          className="border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#004581] text-gray-600 bg-gray-50 focus:bg-white transition-all">
          <option value="">Tất cả chi đoàn</option>
          {chiDoans.map(cd=><option key={cd.maChiDoan} value={cd.maChiDoan}>{cd.tenChiDoan}</option>)}
        </select>
        <select value={filterTT} onChange={e=>setFilterTT(e.target.value)}
          className="border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#004581] text-gray-600 bg-gray-50 focus:bg-white transition-all">
          <option value="">Tất cả trạng thái</option>
          <option value="Đang sinh hoạt">Đang sinh hoạt</option>
          <option value="Đã rút hồ sơ">Đã rút hồ sơ</option>
        </select>
        {(filterCD||filterTT||search) && (
          <button onClick={()=>{setSearch('');setFilterCD('');setFilterTT('');}}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-xs text-gray-500 hover:bg-gray-50 flex items-center gap-1 transition-all">
            <span className="material-symbols-outlined text-sm">close</span>Xóa lọc
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-50/50">
                <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Mã ĐV</th>
                <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest min-w-48">Họ tên</th>
                <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Giới tính</th>
                <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Chi đoàn</th>
                <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Chức vụ</th>
                <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Ngày vào Đoàn</th>
                <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Trạng thái</th>
                <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={8} className="py-20 text-center">
                  <span className="material-symbols-outlined animate-spin text-5xl text-gray-200">refresh</span>
                </td></tr>
              ) : pageData.length === 0 ? (
                <tr><td colSpan={8} className="py-16 text-center">
                  <span className="material-symbols-outlined text-6xl text-gray-200 block mb-3">group</span>
                  <p className="text-gray-400 font-semibold">Không có đoàn viên nào</p>
                </td></tr>
              ) : pageData.map(dv => (
                <tr key={dv.maDV} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-[11px] text-gray-400 bg-gray-100 px-2 py-1 rounded-md">{dv.maDV}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatarColor(dv.hoTen)} flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm`}>
                        {dv.hoTen?.split(' ').pop()?.[0]||'?'}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 group-hover:text-[#004581] transition-colors">{dv.hoTen}</p>
                        {dv.SDT && <p className="text-[11px] text-gray-400">{dv.SDT}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${dv.gioiTinh==='Nam'?'bg-blue-50 text-blue-600':dv.gioiTinh==='Nữ'?'bg-pink-50 text-pink-600':'bg-gray-50 text-gray-500'}`}>
                      {dv.gioiTinh||'—'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600 font-medium">{dv.tenChiDoan||'—'}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${dv.chucVu==='Bí thư'?'bg-purple-50 text-purple-700':dv.chucVu==='Phó bí thư'?'bg-indigo-50 text-indigo-700':'bg-gray-50 text-gray-500'}`}>
                      {dv.chucVu||'—'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">
                    {dv.ngayVaoDoan ? new Date(dv.ngayVaoDoan).toLocaleDateString('vi-VN') : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${BADGE[dv.trangThaiSH]||'bg-gray-50 text-gray-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${DOT[dv.trangThaiSH]||'bg-gray-400'}`} />
                      {dv.trangThaiSH}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button onClick={()=>setModal(dv)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:border-[#004581] hover:text-[#004581] hover:bg-blue-50 transition-all">
                      <span className="material-symbols-outlined text-sm">edit</span>Sửa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <p className="text-xs text-gray-500">
              Trang <span className="font-bold text-gray-700">{page}</span>/{totalPages} ·{' '}
              <span className="font-bold text-gray-700">{data.length}</span> bản ghi
            </p>
            <div className="flex items-center gap-1">
              <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
                className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-400 hover:bg-white hover:border-gray-300 disabled:opacity-30 transition-all">
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              {Array.from({length:Math.min(5,totalPages)},(_,i)=>i+1).map(n=>(
                <button key={n} onClick={()=>setPage(n)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${page===n?'bg-[#004581] text-white shadow-md':'border border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300'}`}>
                  {n}
                </button>
              ))}
              <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
                className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-400 hover:bg-white hover:border-gray-300 disabled:opacity-30 transition-all">
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <Modal
          dv={modal==='add'?null:modal}
          chiDoans={chiDoans}
          onClose={()=>setModal(null)}
          onSaved={()=>{setModal(null);fetchData();}}
        />
      )}
    </div>
  );
};

export default AdminDoanVien;
