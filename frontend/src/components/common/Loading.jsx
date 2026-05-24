/**
 * Loading.jsx – Bộ loading đẹp, chuyên nghiệp cho toàn hệ thống
 *
 * Cách dùng:
 *   <Loading />                      – Spinner mặc định (toàn màn hình)
 *   <Loading variant="inline" />     – Spinner nhỏ nội tuyến
 *   <Loading variant="table" rows={5}/> – Skeleton dạng bảng
 *   <Loading variant="card" count={4}/> – Skeleton dạng card
 *   <Loading variant="overlay" />    – Overlay mờ + spinner
 */

const Loading = ({ variant = 'fullscreen', rows = 5, count = 4, text = 'Đang tải dữ liệu...' }) => {

  /* ── INLINE SPINNER ── */
  if (variant === 'inline') return (
    <span className="inline-flex items-center gap-2 text-sm text-gray-400">
      <svg className="w-4 h-4 animate-spin text-[#004581]" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
      </svg>
      {text}
    </span>
  );

  /* ── OVERLAY ── */
  if (variant === 'overlay') return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
      <Spinner size="lg" />
    </div>
  );

  /* ── TABLE SKELETON ── */
  if (variant === 'table') return (
    <div className="animate-pulse w-full">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-gray-50">
          <div className="w-8 h-8 rounded-xl bg-gray-200 flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 bg-gray-200 rounded-full" style={{ width: `${55 + (i % 3) * 12}%` }} />
            <div className="h-2.5 bg-gray-100 rounded-full" style={{ width: `${30 + (i % 2) * 15}%` }} />
          </div>
          <div className="w-16 h-6 bg-gray-200 rounded-full" />
          <div className="w-20 h-6 bg-gray-100 rounded-full" />
          <div className="w-8 h-8 bg-gray-100 rounded-xl" />
        </div>
      ))}
    </div>
  );

  /* ── CARD SKELETON ── */
  if (variant === 'card') return (
    <div className={`grid grid-cols-2 lg:grid-cols-${Math.min(count, 4)} gap-4 animate-pulse`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gray-200 flex-shrink-0" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-2.5 bg-gray-200 rounded-full w-3/4" />
            <div className="h-7 bg-gray-300 rounded-xl w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );

  /* ── FULLSCREEN (mặc định) ── */
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      {/* Logo / brand icon spinning */}
      <div className="relative">
        {/* Outer ring */}
        <svg className="w-16 h-16 animate-spin" style={{ animationDuration: '1.2s' }} viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="28" fill="none" stroke="#e5e7eb" strokeWidth="5" />
          <circle cx="32" cy="32" r="28" fill="none" stroke="url(#grad)" strokeWidth="5"
            strokeLinecap="round" strokeDasharray="60 120" />
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#004581" />
              <stop offset="100%" stopColor="#0066bb" />
            </linearGradient>
          </defs>
        </svg>
        {/* Inner pulsing dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#004581] to-[#0066bb] animate-pulse shadow-lg shadow-blue-200" />
        </div>
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-semibold text-gray-600">{text}</p>
        <div className="flex items-center gap-1 justify-center">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#004581]/40 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
};

/* ── SPINNER HELPER (dùng nội bộ) ── */
const Spinner = ({ size = 'md' }) => {
  const sz = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' }[size];
  return (
    <svg className={`${sz} animate-spin text-[#004581]`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-80" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
    </svg>
  );
};

export { Spinner };
export default Loading;
