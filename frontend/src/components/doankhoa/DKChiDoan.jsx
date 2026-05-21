import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000/api/doan-khoa';
const H   = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const CHUC_VU = ['Đoàn viên','Bí thư','Phó bí thư','Ủy viên BCH'];
const COLORS  = ['from-violet-500 to-purple-600','from-blue-500 to-cyan-500','from-emerald-500 to-teal-500','from-orange-400 to-rose-500','from-pink-500 to-fuchsia-600'];
const aColor  = s => COLORS[(s||'').charCodeAt(0)%COLORS.length];

const DKChiDoan = () => {
  // --- STATE CŨ GIỮ NGUYÊN ---
  const [data, setData]     = useState([]);
  const [chiDoans, setCD]   = useState([]);
  const [selCD, setSelCD]   = useState('');
  const [loading, setL]     = useState(true);
  const [editing, setEdit]  = useState(null); // { maDV, chucVu }
  const [msg, setMsg]       = useState('');

  // --- STATE MỚI CHO TABS ---
  const [activeTab, setActiveTab] = useState('chidoan'); // 'chidoan' hoặc 'doanvien'

  // --- STATE QUẢN LÝ MODAL & FORM CỦA CHI ĐOÀN ---
  const [showCDModal, setShowCDModal] = useState(false);
  const [isEditCDMode, setIsEditCDMode] = useState(false);
  const [cdFormData, setCDFormData] = useState({
    maChiDoan: '',
    tenChiDoan: '',
    nienKhoa: '',
    siSo: 0,
    trangThai: 'Hoạt động'
  });

  const fetchData = useCallback(async () => {
    setL(true);
    try {
      const r = await axios.get(`${API}/chi-doan${selCD?`?maChiDoan=${selCD}`:''}`, { headers: H() });
      setData(r.data.data||[]);
      if (r.data.chiDoans) setCD(r.data.chiDoans);
    } catch(e) { console.error(e); }
    finally { setL(false); }
  }, [selCD]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const saveChucVu = async () => {
    if (!editing) return;
    try {
      await axios.put(`${API}/chi-doan/${editing.maDV}/chuc-vu`, { chucVu: editing.chucVu }, { headers: H() });
      setMsg('✅ Đã cập nhật chức vụ'); setEdit(null); fetchData();
    } catch(e) { setMsg('❌ ' + (e.response?.data?.message||'Lỗi')); }
    setTimeout(() => setMsg(''), 3000);
  };

  // --- 3 HÀM LOGIC GỌI API CRUD CHI ĐOÀN ---
  const handleOpenAddCD = () => {
    setIsEditCDMode(false);
    setCDFormData({ maChiDoan: '', tenChiDoan: '', nienKhoa: '', siSo: 0, trangThai: 'Hoạt động' });
    setShowCDModal(true);
  };

  const handleOpenEditCD = (cd) => {
    setIsEditCDMode(true);
    setCDFormData({
      maChiDoan: cd.maChiDoan,
      tenChiDoan: cd.tenChiDoan,
      nienKhoa: cd.nienKhoa || '',
      siSo: cd.siSo || 0,
      trangThai: cd.trangThai || 'Hoạt động'
    });
    setShowCDModal(true);
  };

  const handleSaveChiDoan = async (e) => {
  e.preventDefault();
  try {
    const config = {
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    };

    if (isEditCDMode) {
      // Gọi PUT /api/doan-khoa/chi-doan/:id
      const r = await axios.put(`${API}/chi-doan/${cdFormData.maChiDoan}`, cdFormData, config);
      setMsg(`✅ ${r.data.message}`);
    } else {
      // Gọi POST /api/doan-khoa/chi-doan
      // API này khớp với router.post('/chi-doan', ...) trong doanKhoaRoutes.js
      const r = await axios.post(`${API}/chi-doan`, cdFormData, config);
      setMsg(`✅ ${r.data.message}`);
    }
    
    setShowCDModal(false);
    fetchData();
  } catch (e) {
    console.error("Lỗi chi tiết:", e.response?.data || e);
    setMsg('❌ ' + (e.response?.data?.message || 'Có lỗi xảy ra'));
  }
  };

  const handleLockOrDeleteCD = async (maChiDoan, siSo = 0, trangThai = 'Hoạt động') => {
  // 1. Chuẩn hóa dữ liệu để tránh lỗi khoảng trắng
  const state = (trangThai || '').toString().trim();
  const count = parseInt(siSo) || 0;
  
  if (state !== 'Đã khóa' && count > 0) {
    return alert('Lớp đang hoạt động và còn sinh viên! Vui lòng chuyển sinh viên sang lớp khác trước.');
  }

  // 3. Xác nhận xóa
  const confirmMsg = state === 'Đã khóa' 
    ? `Chi đoàn [${maChiDoan}] đã khóa. Bạn có chắc chắn muốn xóa vĩnh viễn không?`
    : `Bạn có chắc chắn muốn xóa Chi đoàn [${maChiDoan}] không?`;

  if (!window.confirm(confirmMsg)) return;

  try {
    const config = { headers: H() };
    // Gọi API xóa (sử dụng đường dẫn đầy đủ để tránh sai sót)
    const r = await axios.delete(`http://localhost:5000/api/doan-khoa/chi-doan/${maChiDoan}`, config);
    
    setMsg(`✅ ${r.data.message}`);
    fetchData(); // Tải lại bảng sau khi xóa thành công
  } catch (e) {
    console.error("Lỗi xóa:", e.response?.data || e);
    setMsg('❌ ' + (e.response?.data?.message || 'Có lỗi xảy ra khi xóa'));
  }
  setTimeout(() => setMsg(''), 4000);
};

  return (
    <div className="flex flex-col gap-5 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm" style={{fontFamily:"'Inter',sans-serif"}}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Quản lý Cấu trúc Khoa</h2>
          <p className="text-sm text-gray-400 mt-0.5"><span className="font-bold text-gray-700">{chiDoans.reduce((acc, curr) => acc + (curr.siSo || 0), 0)}</span> đoàn viên trong hệ thống</p>
        </div>
        
        {/* THÊM MỚI: NÚT THÊM CHI ĐOÀN */}
        <button 
          onClick={handleOpenAddCD}
          className="inline-flex items-center gap-1.5 bg-[#004581] hover:bg-blue-900 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-sm transition-all"
        >
          <span className="material-symbols-outlined text-sm">add_circle</span>
          Thêm Chi đoàn mới
        </button>
      </div>

      {msg && <div className={`p-3 rounded-xl text-sm font-semibold border flex items-center gap-2 ${msg.includes('✅')?'bg-emerald-50 text-emerald-700 border-emerald-200':'bg-red-50 text-red-700 border-red-200'}`}>{msg}</div>}

      {/* TABS CHUYỂN ĐỔI MƯỢT MÀ */}
      <div className="flex gap-4 border-b border-gray-200 mt-2">
        <button onClick={() => setActiveTab('chidoan')} className={`pb-3 px-4 font-semibold text-sm transition-all ${activeTab === 'chidoan' ? 'border-b-2 border-[#004581] text-[#004581]' : 'text-gray-400 hover:text-gray-600'}`}>
          📂 Danh sách Chi đoàn
        </button>
        <button onClick={() => setActiveTab('doanvien')} className={`pb-3 px-4 font-semibold text-sm transition-all ${activeTab === 'doanvien' ? 'border-b-2 border-[#004581] text-[#004581]' : 'text-gray-400 hover:text-gray-600'}`}>
          👥 Quản lý Đoàn viên
        </button>
      </div>

      {/* NỘI DUNG TABS */}
      {activeTab === 'chidoan' && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Mã CĐ</th>
                <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Tên Lớp / Chi đoàn</th>
                <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Niên khóa</th>
                <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">Sĩ số</th>
                <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={5} className="py-16 text-center"><span className="material-symbols-outlined animate-spin text-5xl text-gray-200">refresh</span></td></tr>
              ) : chiDoans.length === 0 ? (
                <tr><td colSpan={5} className="py-10 text-center text-gray-400 text-sm">Chưa có dữ liệu chi đoàn</td></tr>
              ) : chiDoans.map((cd) => (
                <tr key={cd.maChiDoan} className="hover:bg-blue-50/20 transition-colors">
                  <td className="px-5 py-4 font-bold text-blue-600">{cd.maChiDoan}</td>
                  <td className="px-5 py-4 font-medium text-gray-900">{cd.tenChiDoan} {cd.trangThai === 'Đã khóa' ? <span className="text-xs text-red-500 font-normal ml-1">(Đã khóa)</span> : ''}</td>
                  <td className="px-5 py-4 text-gray-600">{cd.nienKhoa || '—'}</td>
                  <td className="px-5 py-4 text-center"><span className="bg-gray-100 px-3 py-1 rounded-full font-bold text-gray-700">{cd.siSo || 0}</span></td>
                  <td className="px-5 py-4 text-center flex justify-center gap-2">
                    <button onClick={() => handleOpenEditCD(cd)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-amber-200 text-xs font-semibold text-amber-600 hover:bg-amber-50 transition-all">
                      <span className="material-symbols-outlined text-sm">edit</span>Sửa
                    </button>
                    <button 
                      onClick={() => handleLockOrDeleteCD(cd.maChiDoan, cd.siSo || 0, cd.trangThai)} 
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>Xóa
                    </button>   
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'doanvien' && (
        <>
          {/* Bộ lọc & Quản trị nhanh Chi đoàn (GIỮ NGUYÊN TỪ CODE CŨ) */}
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full">
              <select value={selCD} onChange={e=>setSelCD(e.target.value)}
                className="border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:border-[#004581] bg-white text-gray-700 transition-all min-w-[200px]">
                <option value="">Tất cả chi đoàn</option>
                {chiDoans.map(cd=><option key={cd.maChiDoan} value={cd.maChiDoan}>{cd.tenChiDoan}</option>)}
              </select>
              
              <p className="text-xs text-amber-600 bg-amber-50/50 px-3 py-2.5 rounded-xl border border-amber-200 flex-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">info</span>
                Chỉ có thể sửa chức vụ tại đây.
              </p>
            </div>
          </div>

          {/* Table Đoàn Viên (GIỮ NGUYÊN TỪ CODE CŨ) */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden mt-4">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  {['MSSV / Mã ĐV','Họ tên','Giới tính','Chi đoàn','Chức vụ','Trạng thái','Thao tác'].map(h=>(
                    <th key={h} className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={7} className="py-16 text-center"><span className="material-symbols-outlined animate-spin text-5xl text-gray-200">refresh</span></td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={7} className="py-10 text-center text-gray-400 text-sm">Không có dữ liệu sinh viên sinh hoạt trong chi đoàn này</td></tr>
                ) : data.map(dv => (
                  <tr key={dv.maDV} className="hover:bg-blue-50/20 transition-colors">
                    <td className="px-5 py-3.5"><span className="font-mono text-[11px] text-gray-400 bg-gray-100 px-2 py-1 rounded-md">{dv.maDV}</span></td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${aColor(dv.hoTen)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                          {dv.hoTen?.split(' ').pop()?.[0]||'?'}
                        </div>
                        <span className="font-bold text-gray-900">{dv.hoTen}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${dv.gioiTinh==='Nam'?'bg-blue-50 text-blue-600':dv.gioiTinh==='Nữ'?'bg-pink-50 text-pink-600':'bg-gray-50 text-gray-500'}`}>
                        {dv.gioiTinh||'—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{dv.tenChiDoan||'—'}</td>
                    <td className="px-5 py-3.5">
                      {editing?.maDV === dv.maDV ? (
                        <select value={editing.chucVu} onChange={e=>setEdit(p=>({...p,chucVu:e.target.value}))}
                          className="border border-[#004581] rounded-lg px-2 py-1 text-xs focus:outline-none bg-white font-semibold text-gray-700">
                          {CHUC_VU.map(c=><option key={c}>{c}</option>)}
                        </select>
                      ) : (
                        <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${dv.chucVu==='Bí thư'?'bg-purple-50 text-purple-700':dv.chucVu==='Phó bí thư'?'bg-indigo-50 text-indigo-700':'bg-gray-50 text-gray-500'}`}>
                          {dv.chucVu||'Đoàn viên'}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${dv.trangThaiSH==='Đang sinh hoạt'?'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200':'bg-red-50 text-red-600 ring-1 ring-red-200'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${dv.trangThaiSH==='Đang sinh hoạt'?'bg-emerald-500':'bg-red-500'}`} />
                        {dv.trangThaiSH}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {editing?.maDV === dv.maDV ? (
                        <div className="flex gap-1">
                          <button onClick={saveChucVu} className="px-2 py-1 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 shadow-sm">Lưu</button>
                          <button onClick={()=>setEdit(null)} className="px-2 py-1 border border-gray-200 rounded-lg text-xs text-gray-500 hover:bg-gray-50">Bỏ</button>
                        </div>
                      ) : (
                        <button onClick={()=>setEdit({maDV:dv.maDV, chucVu:dv.chucVu||'Đoàn viên'})}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:border-[#004581] hover:text-[#004581] hover:bg-blue-50 transition-all">
                          <span className="material-symbols-outlined text-sm">edit</span>Sửa CV
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* --- MODAL TẠO HOẶC CẬP NHẬT THÔNG TIN CHI ĐOÀN (GIỮ NGUYÊN) --- */}
      {showCDModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 transition-all">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-6 w-full max-w-md animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                {isEditCDMode ? `Sửa thông tin Chi đoàn: ${cdFormData.maChiDoan}` : 'Thêm Chi đoàn tân sinh viên mới'}
              </h3>
              <button 
                onClick={() => setShowCDModal(false)}
                className="text-gray-400 hover:text-gray-600 material-symbols-outlined"
              >
                close
              </button>
            </div>

            <form onSubmit={handleSaveChiDoan} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Mã Chi đoàn *</label>
                <input 
                  type="text" 
                  disabled={isEditCDMode}
                  value={cdFormData.maChiDoan}
                  onChange={e => setCDFormData(p => ({...p, maChiDoan: e.target.value}))}
                  placeholder="Ví dụ: 24T1"
                  required
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm font-medium focus:outline-none focus:border-[#004581] disabled:bg-gray-100 disabled:text-gray-400 transition-all uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Tên đầy đủ Chi đoàn *</label>
                <input 
                  type="text" 
                  value={cdFormData.tenChiDoan}
                  onChange={e => setCDFormData(p => ({...p, tenChiDoan: e.target.value}))}
                  placeholder="Ví dụ: Chi đoàn 24T1"
                  required
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm font-medium focus:outline-none focus:border-[#004581] transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Niên khóa</label>
                  <input 
                    type="text" 
                    value={cdFormData.nienKhoa}
                    onChange={e => setCDFormData(p => ({...p, nienKhoa: e.target.value}))}
                    placeholder="Ví dụ: 2024-2028"
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm font-medium focus:outline-none focus:border-[#004581] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Sĩ số</label>
                  <input 
                    type="number" 
                    value={cdFormData.siSo}
                    onChange={e => setCDFormData(p => ({...p, siSo: parseInt(e.target.value)||0}))}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm font-medium focus:outline-none focus:border-[#004581] transition-all bg-white"
                  />
                </div>
              </div>

              {isEditCDMode && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Trạng thái lớp</label>
                  <select 
                    value={cdFormData.trangThai}
                    onChange={e => setCDFormData(p => ({...p, trangThai: e.target.value}))}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm font-medium focus:outline-none focus:border-[#004581] bg-white transition-all"
                  >
                    <option value="Hoạt động">Đang hoạt động</option>
                    <option value="Đã khóa">Đã khóa (Tốt nghiệp/Lưu trữ)</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 mt-2">
                <button 
                  type="button" 
                  onClick={() => setShowCDModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-500 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-[#004581] hover:bg-blue-900 text-white rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DKChiDoan;