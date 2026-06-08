import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useToast } from '../common/Toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const ROLES = [
  { id: 1, label: 'Admin',      color: 'bg-red-50 text-red-700 border-red-200',     dot: 'bg-red-500',    icon: 'admin_panel_settings' },
  { id: 2, label: 'Đoàn khoa',  color: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500', icon: 'school' },
  { id: 3, label: 'Bí thư',     color: 'bg-blue-50 text-blue-700 border-blue-200',  dot: 'bg-blue-500',   icon: 'groups' },
  { id: 4, label: 'Đoàn viên',  color: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500', icon: 'person' },
];
const getRoleInfo = (id) => ROLES.find(r => r.id === parseInt(id)) || ROLES[3];

// Modal tạo tài khoản mới
const CreateModal = ({ onClose, onSaved }) => {
  const [form, setForm] = useState({ email: '', tenNguoiDung: '', matKhau: '123456', idVaiTro: 4, maDV: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.tenNguoiDung) { setError('Email và Tên hiển thị là bắt buộc'); return; }
    setSaving(true);
    try {
      await axios.post(`${API_URL}/tai-khoan`, form, { headers: getHeaders() });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Tạo tài khoản mới</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><span className="material-symbols-outlined">close</span></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">{error}</div>}
          {[
            { label: 'Email đăng nhập *', key: 'email', type: 'email' },
            { label: 'Tên hiển thị *',   key: 'tenNguoiDung' },
            { label: 'Mật khẩu',         key: 'matKhau', type: 'password' },
            { label: 'Mã Đoàn viên',     key: 'maDV' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">{f.label}</label>
              <input type={f.type || 'text'} value={form[f.key]} onChange={e => setForm(p => ({...p, [f.key]: e.target.value}))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#004581]" />
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Vai trò</label>
            <select value={form.idVaiTro} onChange={e => setForm(p => ({...p, idVaiTro: parseInt(e.target.value)}))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#004581]">
              {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Hủy</button>
            <button type="submit" disabled={saving}
              className="px-5 py-2 bg-[#004581] text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
              {saving && <span className="material-symbols-outlined text-sm animate-spin">refresh</span>}
              Tạo tài khoản
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal đổi vai trò
const RoleModal = ({ item, onClose, onSaved, toast }) => {
  const [roleId, setRoleId] = useState(item.IdVaiTro);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await axios.put(`${API_URL}/tai-khoan/${item.idUser}/vai-tro`, { idVaiTro: roleId }, { headers: getHeaders() });
      toast.success('Cập nhật vai trò thành công!');
      onSaved();
    } catch (err) { toast.error(err.response?.data?.message || 'Lỗi cập nhật'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Đổi vai trò</h3>
            <p className="text-xs text-gray-400 mt-0.5">{item.tenNguoiDung} · {item.email}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><span className="material-symbols-outlined">close</span></button>
        </div>
        <div className="p-5 space-y-3">
          {ROLES.map(r => (
            <button key={r.id} onClick={() => setRoleId(r.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${roleId === r.id ? 'border-[#004581] bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${r.color}`}>
                <span className="material-symbols-outlined text-base fill">{r.icon}</span>
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-800">{r.label}</p>
              </div>
              {roleId === r.id && <span className="material-symbols-outlined ml-auto text-[#004581] fill">check_circle</span>}
            </button>
          ))}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Hủy</button>
            <button onClick={handleSubmit} disabled={saving || roleId === item.IdVaiTro}
              className="px-5 py-2 bg-[#004581] text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
              {saving && <span className="material-symbols-outlined text-sm animate-spin">refresh</span>}
              Lưu thay đổi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminPhanQuyen = () => {
  const [data, setData]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [modal, setModal]       = useState(null);
  const [page, setPage]         = useState(1);
  const PER_PAGE = 10;
  const toast = useToast();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search)     params.append('search', search);
      if (filterRole) params.append('idVaiTro', filterRole);
      const res = await axios.get(`${API_URL}/tai-khoan?${params}`, { headers: getHeaders() });
      setData(res.data.data || []);
      setPage(1);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [search, filterRole]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleLock = async (user) => {
    const isLocked = user.trangThai === 0 || user.trangThai === '0';
    const newStatus = isLocked ? 1 : 0;
    const action = newStatus === 0 ? 'Khóa' : 'Mở khóa';
    const confirmed = await toast.confirm(`${action} tài khoản "${user.tenNguoiDung}"?`);
    if (!confirmed) return;
    try {
      await axios.put(`${API_URL}/tai-khoan/${user.idUser}/trang-thai`, { trangThai: newStatus }, { headers: getHeaders() });
      toast.success(`Đã ${action.toLowerCase()} tài khoản thành công!`);
      fetchData();
    } catch (err) { toast.error('Lỗi cập nhật'); }
  };

  const markAsGraduated = async (user) => {
    const confirmed = await toast.confirm(`Đánh dấu tốt nghiệp cho tài khoản "${user.tenNguoiDung}"?`);
    if (!confirmed) return;
    try {
      await axios.put(`${API_URL}/tai-khoan/${user.idUser}/trang-thai`, { trangThai: 2 }, { headers: getHeaders() });
      toast.success(`Đã cập nhật trạng thái tốt nghiệp thành công!`);
      fetchData();
    } catch (err) { toast.error('Lỗi cập nhật'); }
  };

  const totalPages = Math.ceil(data.length / PER_PAGE);
  const pageData   = data.slice((page-1)*PER_PAGE, page*PER_PAGE);

  const roleCounts = ROLES.map(r => ({ ...r, count: data.filter(u => parseInt(u.IdVaiTro) === r.id).length }));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-between items-end">
          <h2 className="text-2xl font-bold text-gray-900">Phân quyền &amp; Tài khoản</h2>
        <button onClick={() => setModal({ type: 'create' })} className="bg-[#004581] text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2 shadow">
          <span className="material-symbols-outlined text-base fill">person_add</span>Tạo tài khoản
        </button>
      </div>

      {/* Role stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {roleCounts.map(r => (
          <div key={r.id} onClick={() => setFilterRole(filterRole === String(r.id) ? '' : String(r.id))}
            className={`bg-white border-2 rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:shadow-sm transition-all ${filterRole === String(r.id) ? 'border-[#004581]' : 'border-gray-200'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${r.color}`}>
              <span className="material-symbols-outlined text-base fill">{r.icon}</span>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">{r.label}</p>
              <p className="text-2xl font-bold text-gray-900">{r.count}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
          <input className="w-full border border-gray-200 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-[#004581]"
            placeholder="Tìm email, tên..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#004581] text-gray-600">
          <option value="">Tất cả vai trò</option>
          {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>
        <button onClick={fetchData} className="px-4 py-2 bg-[#004581] text-white rounded-lg text-sm font-semibold hover:bg-blue-700">Tìm</button>
        {(search || filterRole) && <button onClick={() => { setSearch(''); setFilterRole(''); }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50">Xóa lọc</button>}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
              <tr>
                <th className="p-4">Email</th>
                <th className="p-4 min-w-[150px]">Tên hiển thị</th>
                <th className="p-4">Vai trò</th>
                <th className="p-4">Đoàn viên LK</th>
                <th className="p-4">Ngày tạo</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="p-10 text-center"><span className="material-symbols-outlined animate-spin text-4xl text-gray-300">refresh</span></td></tr>
              ) : pageData.length === 0 ? (
                <tr><td colSpan={7} className="p-10 text-center text-gray-400">Không có dữ liệu</td></tr>
              ) : pageData.map(user => {
                const role = getRoleInfo(user.IdVaiTro);
                const isLocked = user.trangThai === 0 || user.trangThai === '0';
                return (
                  <tr key={user.idUser} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <p className="text-gray-800 font-medium">{user.email}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#004581] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {user.tenNguoiDung?.[0] || '?'}
                        </div>
                        <span className="font-semibold text-gray-800">{user.tenNguoiDung}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-semibold ${role.color}`}>
                        <span className="material-symbols-outlined text-xs fill">{role.icon}</span>
                        {role.label}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500">
                      {user.hoTen ? <div><p className="text-xs font-medium text-gray-700">{user.hoTen}</p><p className="text-xs text-gray-400">{user.maDV}</p></div> : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="p-4 text-gray-400 text-xs">{user.ngayTao ? new Date(user.ngayTao).toLocaleDateString('vi-VN') : '—'}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-semibold ${
                        isLocked 
                          ? 'bg-red-50 text-red-600 border-red-200' 
                          : (user.trangThai === 2 || user.trangThai === '2')
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-green-50 text-green-700 border-green-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          isLocked 
                            ? 'bg-red-500' 
                            : (user.trangThai === 2 || user.trangThai === '2')
                              ? 'bg-purple-500'
                              : 'bg-green-500'
                        }`}></span>
                        {isLocked 
                          ? 'Đã khóa' 
                          : (user.trangThai === 2 || user.trangThai === '2')
                            ? 'Đã tốt nghiệp'
                            : 'Hoạt động'
                        }
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setModal({ type: 'role', item: user })}
                          className="text-gray-400 hover:text-[#004581] p-1 transition-colors" title="Đổi vai trò">
                          <span className="material-symbols-outlined text-sm">manage_accounts</span>
                        </button>
                        {user.trangThai !== 2 && user.trangThai !== '2' && (
                          <button onClick={() => markAsGraduated(user)}
                            className="text-gray-400 hover:text-purple-600 p-1 transition-colors"
                            title="Đánh dấu tốt nghiệp">
                            <span className="material-symbols-outlined text-sm">school</span>
                          </button>
                        )}
                        <button onClick={() => toggleLock(user)}
                          className={`p-1 transition-colors ${isLocked ? 'text-green-500 hover:text-green-700' : 'text-gray-400 hover:text-red-500'}`}
                          title={isLocked ? 'Mở khóa' : 'Khóa tài khoản'}>
                          <span className="material-symbols-outlined text-sm">{isLocked ? 'lock_open' : 'lock'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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

      {modal?.type === 'create' && <CreateModal onClose={() => setModal(null)} onSaved={() => { setModal(null); fetchData(); }} />}
      {modal?.type === 'role'   && <RoleModal item={modal.item} onClose={() => setModal(null)} onSaved={() => { setModal(null); fetchData(); }} toast={toast} />}
    </div>
  );
};

export default AdminPhanQuyen;
