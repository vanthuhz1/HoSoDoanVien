import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = 'http://localhost:5001/api/doan-khoa';
const H   = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const CHUC_VU = ['Đoàn viên','Bí thư','Phó bí thư','Ủy viên BCH'];
const COLORS  = ['from-violet-500 to-purple-600','from-blue-500 to-cyan-500','from-emerald-500 to-teal-500','from-orange-400 to-rose-500','from-pink-500 to-fuchsia-600'];
const aColor  = s => COLORS[(s||'').charCodeAt(0)%COLORS.length];

const DKChiDoan = () => {
  const [data, setData]     = useState([]);
  const [chiDoans, setCD]   = useState([]);
  const [selCD, setSelCD]   = useState('');
  const [loading, setL]     = useState(true);
  const [editing, setEdit]  = useState(null); // { maDV, chucVu }
  const [msg, setMsg]       = useState('');

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

  return (
    <div className="flex flex-col gap-5" style={{fontFamily:"'Inter',sans-serif"}}>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Chi đoàn & Đoàn viên</h2>
          <p className="text-sm text-gray-400 mt-0.5"><span className="font-bold text-gray-700">{data.length}</span> đoàn viên trong khoa</p>
        </div>
      </div>

      {msg && <div className={`p-3 rounded-xl text-sm font-semibold border flex items-center gap-2 ${msg.includes('✅')?'bg-emerald-50 text-emerald-700 border-emerald-200':'bg-red-50 text-red-700 border-red-200'}`}>{msg}</div>}

      {/* Bộ lọc */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-wrap gap-3">
        <select value={selCD} onChange={e=>setSelCD(e.target.value)}
          className="border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#004581] bg-gray-50 text-gray-700 transition-all">
          <option value="">Tất cả chi đoàn</option>
          {chiDoans.map(cd=><option key={cd.maChiDoan} value={cd.maChiDoan}>{cd.tenChiDoan}</option>)}
        </select>
        <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2.5 rounded-xl border border-amber-200 flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">info</span>
          Chỉ có thể sửa chức vụ — không xóa đoàn viên
        </p>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
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
                      className="border border-[#004581] rounded-lg px-2 py-1 text-xs focus:outline-none bg-white">
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
                      <button onClick={saveChucVu} className="px-2 py-1 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600">Lưu</button>
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
    </div>
  );
};

export default DKChiDoan;
