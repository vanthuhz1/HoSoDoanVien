import { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';

// ─── Context ──────────────────────────────────────────────────────────────────
const ToastContext = createContext(null);

let _addToast = null;

// Hook để dùng trong bất kỳ component nào
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
};

// Hàm toàn cục (dùng ngoài component nếu cần)
export const toast = {
  success: (msg) => _addToast?.({ type: 'success', message: msg }),
  error:   (msg) => _addToast?.({ type: 'error',   message: msg }),
  warning: (msg) => _addToast?.({ type: 'warning', message: msg }),
  info:    (msg) => _addToast?.({ type: 'info',    message: msg }),
};

// ─── Single Toast Item ─────────────────────────────────────────────────────────
const ICONS = {
  success: 'check_circle',
  error:   'cancel',
  warning: 'warning',
  info:    'info',
};

const STYLES = {
  success: {
    bar:   'bg-emerald-500',
    icon:  'text-emerald-500',
    badge: 'bg-emerald-50 border-emerald-200',
  },
  error: {
    bar:   'bg-red-500',
    icon:  'text-red-500',
    badge: 'bg-red-50 border-red-200',
  },
  warning: {
    bar:   'bg-amber-400',
    icon:  'text-amber-500',
    badge: 'bg-amber-50 border-amber-200',
  },
  info: {
    bar:   'bg-blue-500',
    icon:  'text-blue-500',
    badge: 'bg-blue-50 border-blue-200',
  },
};

const DURATION = 4000;

const ToastItem = ({ id, type, message, onRemove }) => {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  const startRef = useRef(null);
  const rafRef   = useRef(null);

  useEffect(() => {
    // Slide in
    requestAnimationFrame(() => setVisible(true));

    startRef.current = performance.now();

    const tick = (now) => {
      const elapsed = now - startRef.current;
      const pct = Math.max(0, 100 - (elapsed / DURATION) * 100);
      setProgress(pct);
      if (elapsed < DURATION) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        handleClose();
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onRemove(id), 300);
  };

  const s = STYLES[type] || STYLES.info;

  return (
    <div
      className={`
        relative flex items-start gap-3 bg-white rounded-xl shadow-xl border border-gray-100
        w-80 overflow-hidden
        transition-all duration-300 ease-out
        ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}
      `}
      style={{ minHeight: '64px' }}
    >
      {/* Progress bar */}
      <div
        className={`absolute bottom-0 left-0 h-[3px] ${s.bar} transition-none rounded-b-xl`}
        style={{ width: `${progress}%` }}
      />

      {/* Icon */}
      <div className={`flex-shrink-0 mt-4 ml-4`}>
        <span className={`material-symbols-outlined text-2xl ${s.icon}`}>
          {ICONS[type]}
        </span>
      </div>

      {/* Message */}
      <div className="flex-1 py-4 pr-2">
        <p className="text-sm font-semibold text-gray-800 leading-snug">{message}</p>
      </div>

      {/* Close button */}
      <button
        onClick={handleClose}
        className="flex-shrink-0 mt-3 mr-2 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">close</span>
      </button>
    </div>
  );
};

// ─── Dialog xác nhận (thay thế window.confirm) ────────────────────────────────
const ConfirmDialog = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center">
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
    <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-[340px] animate-[fadeInUp_0.2s_ease-out]">
      <div className="flex items-start gap-4 mb-5">
        <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-amber-500 text-2xl">help</span>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed pt-1.5">{message}</p>
      </div>
      <div className="flex gap-3 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Không
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
        >
          Xác nhận
        </button>
      </div>
    </div>
  </div>
);

// ─── Provider ─────────────────────────────────────────────────────────────────
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [confirm, setConfirm] = useState(null); // { message, resolve }

  const addToast = useCallback(({ type, message }) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Expose toàn cục
  _addToast = addToast;

  // showConfirm trả về Promise<boolean>
  const showConfirm = useCallback((message) => {
    return new Promise(resolve => {
      setConfirm({ message, resolve });
    });
  }, []);

  const handleConfirm = () => {
    confirm?.resolve(true);
    setConfirm(null);
  };

  const handleCancel = () => {
    confirm?.resolve(false);
    setConfirm(null);
  };

  const ctx = {
    success: (msg) => addToast({ type: 'success', message: msg }),
    error:   (msg) => addToast({ type: 'error',   message: msg }),
    warning: (msg) => addToast({ type: 'warning', message: msg }),
    info:    (msg) => addToast({ type: 'info',    message: msg }),
    confirm: showConfirm,
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}

      {/* Toast container – góc dưới phải */}
      <div className="fixed bottom-6 right-6 z-[9998] flex flex-col gap-3 items-end">
        {toasts.map(t => (
          <ToastItem key={t.id} {...t} onRemove={removeToast} />
        ))}
      </div>

      {/* Confirm dialog */}
      {confirm && (
        <ConfirmDialog
          message={confirm.message}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ToastContext.Provider>
  );
};

export default ToastProvider;
