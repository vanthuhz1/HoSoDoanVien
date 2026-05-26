import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useToast } from '../common/Toast';

const API = 'http://localhost:5000/api/doan-khoa';
const H   = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const Bar = ({ val, total, color = 'bg-[#004581]' }) => {
  const pct = total > 0 ? Math.min(100, Math.round((val / total) * 100)) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-bold w-8 text-right ${pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-500'}`}>{pct}%</span>
    </div>
  );
};

const DKTienDo = () => {
  const [data, setData]   = useState([]);
  const [loading, setL]   = useState(true);
  const toast = useToast();

  const fetchData = useCallback(async () => {
    setL(true);
    try {
      const r = await axios.get(`${API}/tien-do`, { headers: H() });
      setData(r.data.data || []);
    } catch (e) { console.error(e); }
    finally { setL(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Tổng toàn khoa
  const totals = data.reduce((acc, cd) => ({
    phi:   { daNop: acc.phi.daNop + (cd.daNopPhi||0), total: acc.phi.total + (cd.tongPhi||0) },
    so:    { daNop: acc.so.daNop  + (cd.daNopSo||0),  total: acc.so.total  + (cd.tongSo||0) },
    sv:    acc.sv + (cd.tongDV||0),
  }), { phi: { daNop:0, total:0 }, so: { daNop:0, total:0 }, sv: 0 });

  const markSoDoan = async (maChiDoan, tenChiDoan) => {
    const confirmed = await toast.confirm(`Đánh dấu "${tenChiDoan}" đã nộp đủ sổ đoàn?`);
    if (!confirmed) return;
    toast.success(`Đã ghi nhận ${tenChiDoan} nộp đủ sổ đoàn`);
    // In real app: PUT /api/doan-khoa/so-doan/mark-complete
  };

  return (
    <div className="flex flex-col gap-5" style={{ fontFamily: "'Inter',sans-serif" }}>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Tiến độ Đoàn phí & Sổ đoàn</h2>
        <p className="text-sm text-gray-400 mt-0.5">Theo dõi tiến độ nộp theo từng chi đoàn</p>
      </div>



      {/* Tổng quan toàn khoa */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          { label: 'Đoàn viên trong khoa', val: totals.sv, icon: 'groups', bg: 'from-[#004581] to-[#0066bb]', sub: 'Tổng số' },
          { label: 'Đã nộp Đoàn phí',
            val: `${totals.phi.total > 0 ? Math.round(totals.phi.daNop / totals.phi.total * 100) : 0}%`,
            icon: 'payments', bg: 'from-emerald-500 to-teal-600', sub: `${totals.phi.daNop}/${totals.phi.total} người` },
          { label: 'Đã nộp Sổ đoàn',
            val: `${totals.so.total > 0 ? Math.round(totals.so.daNop / totals.so.total * 100) : 0}%`,
            icon: 'menu_book', bg: 'from-purple-500 to-indigo-600', sub: `${totals.so.daNop}/${totals.so.total} sổ` },
        ].map(c => (
          <div key={c.label} className={`bg-gradient-to-br ${c.bg} rounded-2xl p-5 text-white shadow-lg`}>
            <div className="flex justify-between items-start mb-3">
              <span className="material-symbols-outlined text-2xl fill opacity-90">{c.icon}</span>
              <span className="text-[11px] font-medium opacity-75 bg-white/20 px-2 py-0.5 rounded-full">{c.sub}</span>
            </div>
            <p className="text-3xl font-black">{c.val}</p>
            <p className="text-sm font-semibold opacity-80 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Bảng chi tiết từng chi đoàn */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#004581] fill text-base">table_chart</span>
            Chi tiết theo Chi đoàn
          </h3>
          <button onClick={fetchData} className="text-gray-400 hover:text-[#004581] transition-colors p-1 rounded-lg hover:bg-gray-50">
            <span className="material-symbols-outlined text-sm">refresh</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                {['Chi đoàn', 'Sĩ số', 'Đoàn phí (đợt hiện tại)', 'Sổ đoàn', 'Cảnh báo', 'Hành động'].map(h => (
                  <th key={h} className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="py-16 text-center">
                  <span className="material-symbols-outlined animate-spin text-5xl text-gray-200">refresh</span>
                </td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center text-gray-400">Không có dữ liệu</td></tr>
              ) : data.map(cd => {
                const phiPct = cd.tongPhi > 0 ? Math.round(cd.daNopPhi / cd.tongPhi * 100) : 0;
                const soPct  = cd.tongSo  > 0 ? Math.round(cd.daNopSo  / cd.tongSo  * 100) : 0;
                const ok     = phiPct >= 80 && soPct >= 80;
                const warn   = phiPct < 50  || soPct < 50;
                return (
                  <tr key={cd.maChiDoan} className={`hover:bg-blue-50/20 transition-colors ${warn ? 'bg-red-50/30' : ''}`}>
                    <td className="px-5 py-4">
                      <p className="font-bold text-gray-900">{cd.tenChiDoan}</p>
                      <p className="text-[11px] font-mono text-gray-400 mt-0.5">{cd.maChiDoan}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-lg font-black text-gray-800">{cd.tongDV || 0}</span>
                      <span className="text-xs text-gray-400 ml-1">SV</span>
                    </td>
                    <td className="px-5 py-4 min-w-[160px]">
                      <div className="mb-1 flex justify-between">
                        <span className="text-xs text-gray-500">{cd.daNopPhi}/{cd.tongPhi} người</span>
                        <span className={`text-xs font-black ${phiPct >= 80 ? 'text-emerald-600' : phiPct >= 50 ? 'text-amber-600' : 'text-red-500'}`}>{phiPct}%</span>
                      </div>
                      <Bar val={cd.daNopPhi} total={cd.tongPhi}
                        color={phiPct >= 80 ? 'bg-emerald-500' : phiPct >= 50 ? 'bg-amber-400' : 'bg-red-400'} />
                    </td>
                    <td className="px-5 py-4 min-w-[160px]">
                      <div className="mb-1 flex justify-between">
                        <span className="text-xs text-gray-500">{cd.daNopSo}/{cd.tongSo} sổ</span>
                        <span className={`text-xs font-black ${soPct >= 80 ? 'text-emerald-600' : soPct >= 50 ? 'text-amber-600' : 'text-red-500'}`}>{soPct}%</span>
                      </div>
                      <Bar val={cd.daNopSo} total={cd.tongSo}
                        color={soPct >= 80 ? 'bg-purple-500' : soPct >= 50 ? 'bg-amber-400' : 'bg-red-400'} />
                    </td>
                    <td className="px-5 py-4">
                      {ok ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Đủ
                        </span>
                      ) : warn ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 ring-1 ring-red-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />Nợ nhiều
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />Chưa đủ
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => markSoDoan(cd.maChiDoan, cd.tenChiDoan)}
                        disabled={soPct >= 100}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:border-purple-400 hover:text-purple-700 hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        {soPct >= 100 ? 'Đã đủ sổ' : 'Đánh dấu đủ sổ'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer tổng kết */}
        {!loading && data.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex flex-wrap gap-6 text-xs text-gray-500">
            <span><span className="font-bold text-gray-700">{data.filter(d => d.tongPhi > 0 && Math.round(d.daNopPhi / d.tongPhi * 100) >= 80).length}</span> / {data.length} chi đoàn hoàn thành đoàn phí</span>
            <span><span className="font-bold text-gray-700">{data.filter(d => d.tongSo > 0 && Math.round(d.daNopSo / d.tongSo * 100) >= 80).length}</span> / {data.length} chi đoàn hoàn thành sổ đoàn</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DKTienDo;
