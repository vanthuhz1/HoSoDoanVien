import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useToast } from '../common/Toast';

const API = 'http://localhost:5000/api/doan-khoa';
const H   = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });
const fmtDate = d => d ? new Date(d).toLocaleDateString('vi-VN') : '—';

const STATUS_MAP = {
  'Chờ duyệt':   { cls:'bg-amber-50 text-amber-700 ring-1 ring-amber-200',   dot:'bg-amber-500' },
  'Đang mở':     { cls:'bg-blue-50 text-blue-700 ring-1 ring-blue-200',       dot:'bg-blue-500' },
  'Đang diễn ra':{ cls:'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', dot:'bg-emerald-500' },
  'Đã kết thúc': { cls:'bg-gray-100 text-gray-500',                            dot:'bg-gray-400' },
  'Bị từ chối':  { cls:'bg-red-50 text-red-600 ring-1 ring-red-200',           dot:'bg-red-500' },
};

const Badge = ({ tt }) => {
  const s = STATUS_MAP[tt] || { cls:'bg-gray-100 text-gray-500', dot:'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${s.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{tt}
    </span>
  );
};

const FI = ({ label, name, type='text', placeholder='', value, onChange }) => (
  <div>
    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{label}</label>
    <input type={type} value={value||''} onChange={e=>onChange(name,e.target.value)} placeholder={placeholder}
      className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#004581] focus:ring-2 focus:ring-[#004581]/10 bg-gray-50 focus:bg-white transition-all" />
  </div>
);

const DKHoatDong = () => {
  const toast = useToast();
  
  const [tab, setTab]       = useState('list');
  const [data, setData]     = useState([]);
  const [loading, setL]     = useState(true);
  const [msg, setMsg]       = useState('');
  const [form, setForm]     = useState({
    tenHD:'', moTa:'', ngayToChuc:'', diaDiem:'', soLuongMAX:50, diemHoatDong:0, Linkdinhkem:''
  });
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSub] = useState(false);

  const fetchData = useCallback(async () => {
    setL(true);
    try { 
      const r = await axios.get(`${API}/hoat-dong`, { headers: H() }); 
      setData(r.data.data||[]); 
    }
    catch(e) { 
      toast.error('Lỗi khi tải dữ liệu: ' + (e.response?.data?.message || e.message));
    } 
    finally { setL(false); }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const submit = async e => {
    e.preventDefault();
    if (!form.tenHD || !form.ngayToChuc) { 
      toast.warning('Vui lòng điền đủ tên và ngày'); 
      return; 
    }
    if (new Date(form.ngayToChuc) < new Date()) { 
      toast.error('Ngày tổ chức không được ở trong quá khứ'); 
      return; 
    }
    setSub(true);
    try {
      if (editingId) {
        await axios.put(`${API}/hoat-dong/${editingId}`, form, { headers: H() });
        toast.success('Đã cập nhật hoạt động thành công!');
      } else {
        await axios.post(`${API}/hoat-dong`, form, { headers: H() });
        toast.success('Đã gửi đề xuất lên Đoàn trường thành công!');
      }
      setForm({ tenHD:'', moTa:'', ngayToChuc:'', diaDiem:'', soLuongMAX:50, diemHoatDong:0, Linkdinhkem:'' });
      setEditingId(null);
      setTab('list'); 
      fetchData();
    } catch(e) { 
      toast.error(e.response?.data?.message || 'Có lỗi xảy ra');
    }
    finally { setSub(false); }
  };

  const handleEdit = (hd) => {
    const formattedDate = hd.ngayToChuc ? new Date(new Date(hd.ngayToChuc).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0,16) : '';
    setForm({
      tenHD: hd.tenHD,
      moTa: hd.moTa || '',
      ngayToChuc: formattedDate,
      diaDiem: hd.diaDiem || '',
      soLuongMAX: hd.soLuongMAX || 50,
      diemHoatDong: hd.diemHoatDong || 0,
      Linkdinhkem: hd.Linkdinhkem || ''
    });
    setEditingId(hd.idHD);
    setTab('form');
  };

  const handleDelete = async (idHD) => {
    const confirmed = await toast.confirm('Bạn có chắc chắn muốn xóa hoạt động này?');
    if (!confirmed) return;
    
    try {
      await axios.delete(`${API}/hoat-dong/${idHD}`, { headers: H() });
      toast.success('Đã xóa hoạt động thành công!');
      fetchData();
    } catch(e) {
      toast.error(e.response?.data?.message || 'Lỗi xóa hoạt động');
    }
  };

  const set = (k,v) => setForm(p => ({...p,[k]:v}));


  return (
    <div className="flex flex-col gap-5" style={{fontFamily:"'Inter',sans-serif"}}>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Hoạt động Khoa</h2>
          <p className="text-sm text-gray-400 mt-0.5">Đề xuất và theo dõi hoạt động của khoa</p>
        </div>
        <button onClick={() => setTab(tab==='list'?'form':'list')}
          className="bg-gradient-to-r from-[#004581] to-[#0066bb] text-white font-bold px-5 py-2.5 rounded-xl hover:shadow-lg transition-all flex items-center gap-2 text-sm">
          <span className="material-symbols-outlined text-base fill">{tab==='list'?'add_circle':'list'}</span>
          {tab==='list' ? 'Đề xuất mới' : 'Danh sách'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[{k:'list',l:'Danh sách',i:'format_list_bulleted'},{k:'form',l:editingId ? 'Cập nhật hoạt động' : 'Đề xuất hoạt động',i:editingId?'edit':'add_circle'}].map(t=>(
          <button key={t.k} onClick={()=>{
            if (t.k === 'list' && tab !== 'list') {
              setEditingId(null);
              setForm({ tenHD:'', moTa:'', ngayToChuc:'', diaDiem:'', soLuongMAX:50, diemHoatDong:0, Linkdinhkem:'' });
            }
            setTab(t.k);
          }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab===t.k ? 'bg-white text-[#004581] shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <span className="material-symbols-outlined text-base">{t.i}</span>{t.l}
          </button>
        ))}
      </div>

      {msg && (
        <div className={`p-3 rounded-xl text-sm font-semibold border flex items-center gap-2 ${msg.includes('✅')?'bg-emerald-50 text-emerald-700 border-emerald-200':'bg-red-50 text-red-700 border-red-200'}`}>
          {msg}
        </div>
      )}

      {tab === 'list' && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left table-auto">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-left">Tên hoạt động</th>
                <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-left">Ngày</th>
                <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-left">Địa điểm</th>
                <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">SL tối đa</th>
                <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">SL ĐK</th>
                <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-left">Trạng thái</th>
                <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-left">Link</th>
                <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center w-[90px] min-w-[90px]">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={8} className="py-16 text-center"><span className="material-symbols-outlined animate-spin text-5xl text-gray-200">refresh</span></td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={8} className="py-16 text-center">
                  <span className="material-symbols-outlined text-6xl text-gray-200 block mb-3">event_busy</span>
                  <p className="text-gray-400">Chưa có hoạt động nào. <button onClick={()=>setTab('form')} className="text-[#004581] underline">Đề xuất ngay →</button></p>
                </td></tr>
              ) : data.map(hd => (
                <tr key={hd.idHD} className="hover:bg-blue-50/20 transition-colors">
                  <td className="px-4 py-3 font-bold text-gray-900 max-w-xs">
                    <p className="truncate">{hd.tenHD}</p>
                    <p className="text-[11px] text-gray-400 font-mono mt-0.5">{hd.idHD}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{fmtDate(hd.ngayToChuc)}</td>
                  <td className="px-4 py-3 text-gray-500 text-sm max-w-[140px] truncate">{hd.diaDiem||'—'}</td>
                  <td className="px-4 py-3 text-center font-semibold text-gray-700">{hd.soLuongMAX}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-sm font-black ${(hd.soDaDangKy||0)>=hd.soLuongMAX?'text-red-500':'text-emerald-600'}`}>
                      {hd.soDaDangKy||0}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap"><Badge tt={hd.trangThaiHD} /></td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {hd.Linkdinhkem ? (
                      <a href={hd.Linkdinhkem} target="_blank" rel="noreferrer"
                        className="text-[#004581] text-xs hover:underline flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">link</span>Xem
                      </a>
                    ) : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center w-[90px] min-w-[90px]">
                    <div className="flex items-center justify-center gap-1.5 w-[90px] min-w-[90px] mx-auto">
                      {hd.trangThaiHD === 'Chờ duyệt' && (
                        <>
                          <button onClick={() => handleEdit(hd)} 
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-all active:scale-95 flex-shrink-0" 
                            title="Chỉnh sửa đề xuất">
                            <span className="material-symbols-outlined text-base font-semibold">edit</span>
                          </button>
                          <button onClick={() => handleDelete(hd.idHD)} 
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-all active:scale-95 flex-shrink-0" 
                            title="Xóa đề xuất">
                            <span className="material-symbols-outlined text-base font-semibold">delete</span>
                          </button>
                        </>
                      )}
                      {hd.trangThaiHD === 'Bị từ chối' && hd.lyDoTuChoi && (
                        <button onClick={() => alert(`Lý do từ chối: ${hd.lyDoTuChoi}`)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 transition-all active:scale-95 flex-shrink-0"
                          title="Xem lý do từ chối từ Ban Thường vụ">
                          <span className="material-symbols-outlined text-base font-semibold">info</span>
                        </button>
                      )}
                      {hd.trangThaiHD !== 'Chờ duyệt' && hd.trangThaiHD !== 'Bị từ chối' && (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'form' && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-[#d4e3ff] flex items-center justify-center">
              <span className="material-symbols-outlined text-[#004581] fill">{editingId ? 'edit' : 'add_circle'}</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{editingId ? 'Cập nhật Hoạt động' : 'Đề xuất Hoạt động mới'}</h3>
              <p className="text-xs text-gray-400 mt-0.5">Sau khi gửi, Admin sẽ xem xét và phê duyệt</p>
            </div>
          </div>

          <form onSubmit={submit} className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><FI label="Tên hoạt động *" name="tenHD" placeholder="VD: Hội thảo kỹ năng mềm 2025" value={form.tenHD} onChange={set} /></div>
            <FI label="Ngày tổ chức *" name="ngayToChuc" type="datetime-local" value={form.ngayToChuc} onChange={set} />
            <FI label="Địa điểm" name="diaDiem" placeholder="VD: Hội trường A" value={form.diaDiem} onChange={set} />
            <FI label="Số lượng tối đa" name="soLuongMAX" type="number" value={form.soLuongMAX} onChange={set} />
            <FI label="Điểm hoạt động" name="diemHoatDong" type="number" value={form.diemHoatDong} onChange={set} />
            <div className="col-span-2"><FI label="Link đính kèm (minh chứng/kế hoạch)" name="Linkdinhkem" placeholder="https://drive.google.com/..." value={form.Linkdinhkem} onChange={set} /></div>
            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Mô tả</label>
              <textarea value={form.moTa||''} onChange={e=>set('moTa',e.target.value)} rows={3}
                placeholder="Mô tả chi tiết hoạt động..."
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#004581] bg-gray-50 focus:bg-white transition-all resize-none" />
            </div>
            <div className="col-span-2 flex justify-end gap-3 pt-2">
              <button type="button" onClick={()=>setTab('list')}
                className="px-5 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">Hủy</button>
              <button type="submit" disabled={submitting}
                className="px-6 py-2.5 bg-gradient-to-r from-[#004581] to-[#0066bb] text-white rounded-xl text-sm font-bold hover:shadow-lg disabled:opacity-50 flex items-center gap-2 transition-all">
                <span className="material-symbols-outlined text-sm fill">{editingId ? 'save' : 'send'}</span>
                {submitting ? 'Đang xử lý...' : (editingId ? 'Lưu thay đổi' : 'Gửi Đoàn trường duyệt')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default DKHoatDong;
