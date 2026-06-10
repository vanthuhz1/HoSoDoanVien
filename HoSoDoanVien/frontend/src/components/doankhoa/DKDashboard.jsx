import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  PieChart, Pie,
  BarChart as HBarChart,
} from 'recharts';

const API = 'http://localhost:5001/api/doan-khoa';
const H   = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

/* ── Tooltips ── */
const BarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-2xl px-4 py-3">
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-xl font-black text-[#004581]">{payload[0].value}<span className="text-xs font-normal text-gray-400 ml-1">lượt</span></p>
    </div>
  );
};
const HBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-2xl px-4 py-3">
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-xl font-black text-emerald-600">{payload[0].value}<span className="text-xs font-normal text-gray-400 ml-1">lượt</span></p>
    </div>
  );
};

/* ── Gradient bar shape ── */
const GradientBar = (props) => {
  const { x, y, width, height } = props;
  if (!height || height <= 0) return null;
  const id = `g${x}${y}`;
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      <rect x={x} y={y} width={width} height={height} fill={`url(#${id})`} rx={5} ry={5} />
    </g>
  );
};

/* ── Stat Card (white, icon accent) ── */
const StatCard = ({ icon, label, value, sub, iconBg, iconColor, accent }) => (
  <div className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow`}>
    {/* accent top bar */}
    <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl ${accent}`} />
    <div className="flex items-start justify-between mt-1">
      <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
        <span className={`material-symbols-outlined text-xl fill ${iconColor}`}>{icon}</span>
      </div>
      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${iconBg} ${iconColor}`}>{sub}</span>
    </div>
    <div className="mt-4">
      <p className="text-3xl font-black text-gray-900 tracking-tight">{value}</p>
      <p className="text-sm font-medium text-gray-400 mt-0.5">{label}</p>
    </div>
  </div>
);

/* ── Donut Card (white) ── */
const DonutCard = ({ title, done, total, color, label2 }) => {
  const pct  = total > 0 ? Math.round((done / total) * 100) : 0;
  const data = [
    { name: 'Đã nộp',    value: done || 0 },
    { name: 'Chưa nộp',  value: Math.max(0, (total||0) - (done||0)) },
  ];
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{done}/{total} hoàn thành</p>
        </div>
        <span className={`text-sm font-black px-3 py-1 rounded-full ${pct>=80?'bg-emerald-50 text-emerald-600':pct>=50?'bg-amber-50 text-amber-600':'bg-red-50 text-red-500'}`}>
          {pct}%
        </span>
      </div>

      <div className="flex-1 flex items-center justify-center" style={{ minHeight: 160 }}>
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%"
              innerRadius={50} outerRadius={72}
              startAngle={90} endAngle={-270}
              dataKey="value" paddingAngle={3} labelLine={false}>
              <Cell fill={color} />
              <Cell fill="#f1f5f9" />
            </Pie>
            {/* Center text via foreignObject */}
            <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle"
              style={{ fontSize: 24, fontWeight: 900, fill: '#111827', fontFamily:'Inter' }}>
              {pct}%
            </text>
            <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle"
              style={{ fontSize: 10, fill: '#9ca3af', fontFamily:'Inter' }}>
              {pct >= 80 ? 'Hoàn thành tốt' : 'Đang tiến hành'}
            </text>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="pt-3 border-t border-gray-50 grid grid-cols-2 gap-2">
        {[
          { label:'Đã nộp',   val: done,                   c: color  },
          { label:'Chưa nộp', val: Math.max(0,total-done), c:'#e2e8f0' },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.c }} />
            <span className="text-xs text-gray-500">{s.label}: <span className="font-bold text-gray-800">{s.val}</span></span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Main ── */
const DKDashboard = () => {
  const [dash,  setDash]  = useState(null);
  const [chart, setChart] = useState(null);
  const [loading, setL]   = useState(true);

  useEffect(() => {
    const cfg = { headers: H() };
    Promise.all([
      axios.get(`${API}/dashboard`,  cfg),
      axios.get(`${API}/chart-data`, cfg),
    ])
      .then(([d, c]) => { setDash(d.data.data); setChart(c.data.data); })
      .catch(console.error)
      .finally(() => setL(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-72">
      <div className="flex flex-col items-center gap-3">
        <span className="material-symbols-outlined animate-spin text-5xl text-blue-200">refresh</span>
        <p className="text-sm text-gray-400 font-medium">Đang tải dữ liệu...</p>
      </div>
    </div>
  );
  if (!dash) return (
    <div className="flex items-center justify-center h-64 text-center">
      <div>
        <span className="material-symbols-outlined text-6xl text-gray-200 block mb-3">cloud_off</span>
        <p className="text-sm text-gray-400">Không tải được dữ liệu</p>
      </div>
    </div>
  );

  const phiPct      = dash.doanPhi?.total  > 0 ? Math.round(dash.doanPhi.daNop  / dash.doanPhi.total  * 100) : 0;
  const totalThamGia = (chart?.byMonth||[]).reduce((s,m)=>s+m.soLuot, 0);
  const allTodo      = [
    ...(dash.tuChoiHD||[]).map(h=>({...h,type:'reject'})),
    ...(dash.choDuyetHD||[]).map(h=>({...h,type:'pending'})),
  ];

  return (
    <div className="flex flex-col gap-5" style={{fontFamily:"'Inter',sans-serif"}}>

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Bảng điều khiển</h2>
          <p className="text-sm text-gray-400 mt-0.5">{dash.tenKhoa} · {new Date().getFullYear()}</p>
        </div>
        <div className="bg-white border border-gray-100 shadow-sm rounded-xl px-4 py-2 text-right">
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">Cập nhật lúc</p>
          <p className="text-sm font-bold text-gray-700">{new Date().toLocaleTimeString('vi-VN')}</p>
        </div>
      </div>

      {/* ── ROW 1: STAT CARDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon="groups"        label="Tổng đoàn viên"    value={dash.doanVien?.total||0}
          sub={`${dash.doanVien?.active||0} đang SH`}
          iconBg="bg-blue-50" iconColor="text-blue-600" accent="bg-gradient-to-r from-blue-500 to-cyan-400" />
        <StatCard icon="event"         label="Hoạt động đang mở" value={chart?.hdDangMo||0}
          sub="Đang diễn ra"
          iconBg="bg-violet-50" iconColor="text-violet-600" accent="bg-gradient-to-r from-violet-500 to-purple-400" />
        <StatCard icon="payments"      label="Tỷ lệ đóng phí"    value={`${phiPct}%`}
          sub={`${dash.doanPhi?.daNop||0}/${dash.doanPhi?.total||0} người`}
          iconBg="bg-emerald-50" iconColor="text-emerald-600" accent="bg-gradient-to-r from-emerald-500 to-teal-400" />
      </div>

      {/* ── ROW 2: DONUT + TODO ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <DonutCard title="Tiến độ Đoàn phí"
            done={parseInt(dash.doanPhi?.daNop)||0} total={parseInt(dash.doanPhi?.total)||0}
            color="#3b82f6" />
          <DonutCard title="Tiến độ Sổ đoàn"
            done={parseInt(dash.soDoan?.daNop)||0} total={parseInt(dash.soDoan?.total)||0}
            color="#8b5cf6" />
        </div>

        {/* Todo list */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              Việc cần làm
            </h3>
            {allTodo.length > 0 && (
              <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                {allTodo.length}
              </span>
            )}
          </div>

          {allTodo.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-4">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-3 border border-emerald-100">
                <span className="material-symbols-outlined text-3xl text-emerald-400 fill">check_circle</span>
              </div>
              <p className="text-sm font-semibold text-gray-600">Không có việc tồn đọng</p>
              <p className="text-xs text-gray-400 mt-1">Mọi thứ đang ổn!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 overflow-y-auto flex-1">
              {allTodo.map((hd, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${
                  hd.type==='reject'
                    ? 'bg-red-50/50 border-red-100 hover:border-red-200'
                    : 'bg-amber-50/50 border-amber-100 hover:border-amber-200'
                } transition-colors`}>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    hd.type==='reject' ? 'bg-red-100' : 'bg-amber-100'
                  }`}>
                    <span className={`material-symbols-outlined text-sm fill ${
                      hd.type==='reject' ? 'text-red-500' : 'text-amber-600'
                    }`}>{hd.type==='reject'?'cancel':'pending'}</span>
                  </div>
                  <div className="min-w-0">
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${
                      hd.type==='reject' ? 'text-red-400' : 'text-amber-500'
                    }`}>{hd.type==='reject' ? 'Bị từ chối' : 'Chờ duyệt'}</p>
                    <p className="text-xs text-gray-700 font-semibold mt-0.5 truncate">{hd.tenHD}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── ROW 3: BAR CHART ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-gray-900">Mức độ sôi nổi phong trào</h3>
            <p className="text-xs text-gray-400 mt-0.5">Lượt tham gia hoạt động theo tháng — {new Date().getFullYear()}</p>
          </div>
          <div className="text-right bg-blue-50 border border-blue-100 rounded-xl px-4 py-2">
            <p className="text-2xl font-black text-blue-600">{totalThamGia}</p>
            <p className="text-[11px] text-blue-400 font-semibold">Tổng lượt tham gia</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={chart?.byMonth||[]} margin={{top:5,right:10,left:-18,bottom:0}} barCategoryGap="35%">
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="thang"
              tick={{fontSize:11,fill:'#9ca3af',fontFamily:'Inter',fontWeight:600}}
              axisLine={false} tickLine={false} />
            <YAxis
              tick={{fontSize:11,fill:'#9ca3af',fontFamily:'Inter'}}
              axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<BarTooltip />} cursor={{fill:'#eff6ff',radius:6}} />
            <Bar dataKey="soLuot" shape={<GradientBar />} radius={[6,6,0,0]} maxBarSize={38} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── ROW 4: H-BAR + SUMMARY ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Horizontal bar */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="mb-5">
            <h3 className="text-base font-bold text-gray-900">Top Chi đoàn năng nổ nhất</h3>
            <p className="text-xs text-gray-400 mt-0.5">Xếp hạng theo lượt tham gia hoạt động</p>
          </div>
          {(chart?.top5||[]).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <span className="material-symbols-outlined text-5xl text-gray-200 block mb-3">leaderboard</span>
              <p className="text-sm text-gray-400">Chưa có dữ liệu tham gia</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(180,(chart?.top5||[]).length*54)}>
              <HBarChart data={chart?.top5||[]} layout="vertical"
                margin={{top:0,right:30,left:10,bottom:0}} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number"
                  tick={{fontSize:11,fill:'#9ca3af',fontFamily:'Inter'}}
                  axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="tenChiDoan" width={88}
                  tick={{fontSize:11,fill:'#374151',fontFamily:'Inter',fontWeight:600}}
                  axisLine={false} tickLine={false} />
                <Tooltip content={<HBarTooltip />} cursor={{fill:'#f0fdf4'}} />
                <Bar dataKey="luotThamGia" radius={[0,6,6,0]} maxBarSize={26}>
                  {(chart?.top5||[]).map((_,i) => (
                    <Cell key={i} fill={['#10b981','#34d399','#6ee7b7','#a7f3d0','#d1fae5'][i]||'#6ee7b7'} />
                  ))}
                </Bar>
              </HBarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
            Tóm tắt nhanh
          </h3>

          {[
            {icon:'group',         label:'Đoàn viên đang SH',    val:dash.doanVien?.active||0, total:dash.doanVien?.total||0, barColor:'bg-blue-500',    iconBg:'bg-blue-50',    iconC:'text-blue-500' },
            {icon:'payments',      label:'Đã nộp đoàn phí',      val:dash.doanPhi?.daNop||0,   total:dash.doanPhi?.total||0,  barColor:'bg-violet-500',  iconBg:'bg-violet-50',  iconC:'text-violet-500'},
            {icon:'menu_book',     label:'Đã nộp sổ đoàn',       val:dash.soDoan?.daNop||0,    total:dash.soDoan?.total||0,   barColor:'bg-purple-500',  iconBg:'bg-purple-50',  iconC:'text-purple-500'},
            {icon:'event_available',label:'Hoạt động đang mở',   val:chart?.hdDangMo||0,       total:null,                    barColor:'bg-emerald-500', iconBg:'bg-emerald-50', iconC:'text-emerald-500'},
          ].map(s => {
            const pct = s.total ? Math.min(100, Math.round(s.val/s.total*100)) : null;
            return (
              <div key={s.label} className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${s.iconBg} flex items-center justify-center flex-shrink-0 border border-gray-100`}>
                  <span className={`material-symbols-outlined text-base fill ${s.iconC}`}>{s.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-xs text-gray-500 truncate">{s.label}</span>
                    <span className="text-xs font-black text-gray-800 ml-2 flex-shrink-0">
                      {s.total !== null ? `${s.val}/${s.total}` : s.val}
                    </span>
                  </div>
                  {pct !== null && (
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${s.barColor} transition-all duration-700`} style={{width:`${pct}%`}} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {(dash.chiDoanNo||[]).length > 0 && (
            <div className="mt-1 pt-4 border-t border-gray-100">
              <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm fill">warning</span>
                Chi đoàn nợ phí
              </p>
              {dash.chiDoanNo.slice(0,3).map((cd,i) => (
                <div key={cd.maChiDoan} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-4 h-4 rounded-full text-[9px] font-black text-white flex items-center justify-center flex-shrink-0 ${i===0?'bg-red-500':i===1?'bg-orange-400':'bg-amber-400'}`}>{i+1}</span>
                    <span className="text-xs text-gray-600 truncate">{cd.tenChiDoan}</span>
                  </div>
                  <span className="text-xs font-black text-rose-500 ml-2 flex-shrink-0">{cd.chuaNop} nợ</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DKDashboard;
