import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useToast } from '../common/Toast';

const API = 'http://localhost:5000/api/doan-phi';
const H = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });
const fmt = (n) => n?.toLocaleString('vi-VN') + 'đ';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';

const TT_COLOR = {
  'Đang mở thu': 'bg-green-50 text-green-700 border-green-200',
  'Đã đóng lại': 'bg-gray-100 text-gray-500 border-gray-200',
  'Chưa mở':     'bg-yellow-50 text-yellow-700 border-yellow-200',
  'Đã nộp':      'bg-blue-50 text-blue-700 border-blue-200',
  'Chưa nộp':    'bg-red-50 text-red-600 border-red-200',
};
const Badge = ({ tt }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-semibold ${TT_COLOR[tt] || 'bg-gray-50 text-gray-500 border-gray-200'}`}>
    {tt}
  </span>
);

// ── MODAL TẠO MỨC PHÍ ──
const TaoMucPhiModal = ({ onClose, onSaved }) => {
  const [form, setForm] = useState({ namHoc: '', soTien: '' });
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setErr('');
    try {
      await axios.post(`${API}/danh-muc`, form, { headers: H() });
      onSaved();
    } catch (e) { setErr(e.response?.data?.message || 'Lỗi'); }
    finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-gray-900">Tạo mức phí mới</h3>
          <button onClick={onClose}><span className="material-symbols-outlined text-gray-400">close</span></button>
        </div>
        {err && <div className="mb-3 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{err}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Năm học (vd: 2025-2026)</label>
            <input value={form.namHoc} onChange={e => setForm(p => ({...p, namHoc: e.target.value}))} placeholder="2025-2026"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#004581]" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Số tiền (VNĐ)</label>
            <input type="number" value={form.soTien} onChange={e => setForm(p => ({...p, soTien: e.target.value}))} placeholder="120000"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#004581]" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Hủy</button>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-[#004581] text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Đang lưu...' : 'Tạo mức phí'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── VIEW: DANH SÁCH CHI ĐOÀN + XÁC NHẬN THU ──
const ChiDoanView = ({ mucPhi, onBack }) => {
  const [tienDo, setTienDo] = useState([]);
  const [selected, setSelected] = useState(null);
  const [dvList, setDvList]     = useState([]);
  const [loading, setLoading]   = useState(true);

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
    const r = await axios.get(`${API}/chi-doan/${cd.maChiDoan}?idMucDoanPhi=${mucPhi._idMucDoanPhi}`, { headers: H() });
    setDvList(r.data.data || []);
  };

  const inPhieu = (dv) => {
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>Biên lai đoàn phí</title>
    <style>body{font-family:Arial;padding:40px;max-width:500px;margin:auto}h2{text-align:center;color:#004581}table{width:100%;border-collapse:collapse}td{padding:8px;border-bottom:1px solid #eee}.sig{margin-top:60px;text-align:right}</style></head>
    <body><h2>BIÊN LAI ĐOÀN PHÍ</h2><h3 style="text-align:center">Năm học ${mucPhi.namHoc}</h3>
    <table><tr><td><b>Họ tên:</b></td><td>${dv.hoTen}</td></tr>
    <tr><td><b>Mã ĐV:</b></td><td>${dv.maDV}</td></tr>
    <tr><td><b>Số tiền:</b></td><td>${fmt(mucPhi.soTien)}</td></tr>
    <tr><td><b>Phương thức:</b></td><td>${dv.phuongThucThanhToan || '—'}</td></tr>
    <tr><td><b>Ngày nộp:</b></td><td>${fmtDate(dv.ThoiGianThanhToan)}</td></tr>
    <tr><td><b>Trạng thái:</b></td><td><b style="color:green">ĐÃ NỘP</b></td></tr></table>
    <div class="sig"><p>Người thu</p><br/><p>........................</p></div>
    </body></html>`);
    w.document.close(); w.print();
  };

  if (selected) return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-[#004581] text-sm hover:underline">
          <span className="material-symbols-outlined text-base">arrow_back</span> Quay lại
        </button>
        <h3 className="text-xl font-bold text-gray-900">{selected.tenChiDoan}</h3>
        <Badge tt={mucPhi.trangThai} />
      </div>
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
            <tr>
              <th className="p-4">Họ tên</th>
              <th className="p-4">Mã ĐV</th>
              <th className="p-4">Trạng thái</th>
              <th className="p-4">Ngày nộp</th>
              <th className="p-4">Phương thức</th>
              <th className="p-4 text-right">Phiếu</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {dvList.map(dv => (
              <tr key={dv.maDV} className={`transition-colors ${dv.trangThai === 'Đã nộp' ? 'bg-green-50/30' : 'hover:bg-gray-50'}`}>
                <td className="p-4 font-semibold text-gray-800">{dv.hoTen}</td>
                <td className="p-4 font-mono text-xs text-gray-400">{dv.maDV}</td>
                <td className="p-4"><Badge tt={dv.trangThai || 'Chưa nộp'} /></td>
                <td className="p-4 text-gray-500 text-xs">{fmtDate(dv.ThoiGianThanhToan)}</td>
                <td className="p-4 text-gray-500 text-xs">{dv.phuongThucThanhToan || '—'}</td>
                <td className="p-4 text-right">
                  {dv.trangThai === 'Đã nộp' && (
                    <button onClick={() => inPhieu(dv)} title="In phiếu thu" className="text-gray-400 hover:text-[#004581] p-1">
                      <span className="material-symbols-outlined text-sm">print</span>
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1 text-[#004581] text-sm hover:underline">
          <span className="material-symbols-outlined text-base">arrow_back</span> Quay lại
        </button>
        <h3 className="text-xl font-bold text-gray-900">Tiến độ – {mucPhi.namHoc}</h3>
        <Badge tt={mucPhi.trangThai} />
      </div>
      {loading ? <div className="text-center py-10"><span className="material-symbols-outlined animate-spin text-4xl text-gray-300">refresh</span></div> : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
              <tr>
                <th className="p-4">Chi đoàn</th>
                <th className="p-4">Khoa</th>
                <th className="p-4">Tổng SV</th>
                <th className="p-4">Đã nộp</th>
                <th className="p-4 min-w-[160px]">Tiến độ</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tienDo.map(cd => {
                const pct = cd.tongSV > 0 ? Math.round((cd.daNop / cd.tongSV) * 100) : 0;
                return (
                  <tr key={cd.maChiDoan} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-semibold text-gray-800">{cd.tenChiDoan}</td>
                    <td className="p-4 text-gray-500">{cd.tenKhoa || '—'}</td>
                    <td className="p-4 text-gray-600">{cd.tongSV}</td>
                    <td className="p-4 text-gray-600">{cd.daNop}/{cd.tongSV}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div className={`h-2 rounded-full transition-all ${pct === 100 ? 'bg-green-500' : pct > 50 ? 'bg-blue-500' : 'bg-orange-400'}`}
                            style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-bold text-gray-600 w-10 text-right">{pct}%</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => openChiDoan(cd)} className="px-3 py-1.5 border border-[#004581] text-[#004581] rounded-lg text-xs font-semibold hover:bg-blue-50 flex items-center gap-1 ml-auto">
                        <span className="material-symbols-outlined text-sm">visibility</span>Xem DS
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!tienDo.length && <tr><td colSpan={6} className="p-8 text-center text-gray-400">Chưa có dữ liệu</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ── MAIN COMPONENT ──
const AdminDoanPhi = () => {
  const [danhMuc, setDanhMuc]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
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

  if (activeMuc) return <ChiDoanView mucPhi={activeMuc} onBack={() => setActiveMuc(null)} />;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Quản lý Đoàn phí</h2>
        <button onClick={() => setModal(true)} className="bg-[#004581] text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2 shadow">
          <span className="material-symbols-outlined text-base fill">add</span>Tạo mức phí
        </button>
      </div>

      {/* Thống kê nhanh */}
      {thongKe && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Tổng SV', value: thongKe.tong, icon: 'group', bg: 'bg-blue-50', ic: 'text-blue-600' },
            { label: 'Đã nộp',  value: thongKe.daNop, icon: 'check_circle', bg: 'bg-green-50', ic: 'text-green-600' },
            { label: 'Chưa nộp', value: thongKe.chuaNop, icon: 'cancel', bg: 'bg-red-50', ic: 'text-red-600' },
            { label: 'Đã thu được', value: fmt(thongKe.tongThuDuoc), icon: 'payments', bg: 'bg-[#d4e3ff]', ic: 'text-[#004581]' },
          ].map(c => (
            <div key={c.label} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${c.bg} ${c.ic} flex items-center justify-center flex-shrink-0`}>
                <span className="material-symbols-outlined text-lg">{c.icon}</span>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{c.label}</p>
                <p className="text-xl font-bold text-gray-900">{c.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Danh sách đợt thu */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-base font-bold text-gray-800">Danh sách các đợt thu</h3>
        </div>
        {loading ? (
          <div className="p-10 text-center"><span className="material-symbols-outlined animate-spin text-4xl text-gray-300">refresh</span></div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
              <tr>
                <th className="p-4">Năm học</th>
                <th className="p-4">Số tiền</th>
                <th className="p-4">Tổng SV</th>
                <th className="p-4">Đã nộp</th>
                <th className="p-4">Chưa nộp</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {danhMuc.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-400">Chưa có đợt thu nào. Nhấn "Tạo mức phí" để bắt đầu.</td></tr>
              ) : danhMuc.map(dm => (
                <tr key={dm._idMucDoanPhi} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-bold text-gray-800">{dm.namHoc}</td>
                  <td className="p-4 text-gray-700 font-semibold">{fmt(dm.soTien)}</td>
                  <td className="p-4 text-gray-600">{dm.tongSV || 0}</td>
                  <td className="p-4 text-green-600 font-semibold">{dm.daNop || 0}</td>
                  <td className="p-4 text-red-500">{dm.chuaNop || 0}</td>
                  <td className="p-4"><Badge tt={dm.trangThai} /></td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      {dm.trangThai !== 'Đang mở thu' && (
                        <button onClick={() => doKichHoat(dm)} disabled={acting === dm._idMucDoanPhi}
                          className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 disabled:opacity-50 flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">play_arrow</span>Mở thu
                        </button>
                      )}
                      {dm.trangThai === 'Đang mở thu' && (
                        <>
                          <button onClick={() => { setActiveMuc(dm); loadThongKe(dm); }}
                            className="px-3 py-1.5 border border-[#004581] text-[#004581] rounded-lg text-xs font-semibold hover:bg-blue-50 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">bar_chart</span>Tiến độ
                          </button>
                          <button onClick={() => doDong(dm)} disabled={acting === dm._idMucDoanPhi}
                            className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">stop</span>Đóng
                          </button>
                        </>
                      )}
                      {dm.trangThai === 'Đã đóng lại' && (
                        <button onClick={() => { setActiveMuc(dm); loadThongKe(dm); }}
                          className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-50 flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">visibility</span>Xem
                        </button>
                      )}
                      <button onClick={() => loadThongKe(dm)} title="Thống kê" className="text-gray-400 hover:text-[#004581] p-1">
                        <span className="material-symbols-outlined text-sm">analytics</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && <TaoMucPhiModal onClose={() => setModal(false)} onSaved={() => { setModal(false); fetchDanhMuc(); }} />}
    </div>
  );
};

export default AdminDoanPhi;
