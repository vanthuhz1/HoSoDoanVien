import { useState, useEffect, useRef, useMemo } from 'react';
import Header from '../components/layout/Header';
import Navigation from '../components/layout/Navigation';
import Footer from '../components/layout/Footer';
import { doanPhiService } from '../services/doanPhiService';
import { authService } from '../services/authService';
import { useToast } from '../components/common/Toast';
import Loading from '../components/common/Loading';

const DoanPhiPage = () => {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [invoiceData, setInvoiceData] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 phút đếm ngược
  const invoiceRef = useRef();
  const toast = useToast();

  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    fetchFees();
  }, []);

  // Thiết lập kiểm tra trạng thái thanh toán tự động (Auto-polling) mỗi 3 giây khi mở modal thanh toán
  useEffect(() => {
    let intervalId;
    if (showPaymentModal && selectedFee) {
      intervalId = setInterval(async () => {
        try {
          const res = await doanPhiService.checkPaymentStatus(selectedFee._idDoanPhi);
          if (res.success && res.status === 'Đã nộp') {
            clearInterval(intervalId);
            toast.success('Thanh toán đoàn phí thành công!');
            setShowPaymentModal(false);
            
            // Cập nhật lại danh sách đoàn phí ở trang chủ
            await fetchFees();
            
            // Tự động mở hóa đơn đã thanh toán thành công
            const invoiceRes = await doanPhiService.getInvoice(selectedFee._idDoanPhi);
            setInvoiceData(invoiceRes.data);
            setShowInvoiceModal(true);
          }
        } catch (error) {
          console.error('Error auto-checking payment status:', error);
        }
      }, 3000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [showPaymentModal, selectedFee]);

  // Thiết lập đếm ngược 5 phút (300 giây) cho đợt chuyển khoản
  useEffect(() => {
    let timerId;
    if (showPaymentModal && timeLeft > 0) {
      timerId = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (showPaymentModal && timeLeft === 0) {
      // Hết thời gian 5 phút, tự động thất bại
      toast.error('Giao dịch hết hạn! Thanh toán thất bại.');
      setShowPaymentModal(false);
      fetchFees(); // Refresh danh sách đoàn phí
    }

    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [showPaymentModal, timeLeft]);

  const fetchFees = async () => {
    try {
      setLoading(true);
      const maDV = currentUser?.maDV || currentUser?.tenNguoiDung;
      if (!maDV) return;
      const response = await doanPhiService.getMyFees(maDV);
      setFees(response.data || []);
    } catch (error) {
      console.error('Error fetching fees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = (fee) => {
    setSelectedFee(fee);
    setPaymentMethod('');
    setTimeLeft(300); // 5 phút đếm ngược
    setShowPaymentModal(true);
  };

  const handleSubmitPayment = () => {
    if (!paymentMethod) {
      toast.warning('Vui lòng chọn phương thức thanh toán');
      return;
    }
    setShowPaymentModal(false);
    toast.info(`Vui lòng liên hệ Ban Chấp hành để được hướng dẫn nộp đoàn phí qua ${paymentMethod}.`);
  };

  const handleViewInvoice = async (fee) => {
    try {
      const res = await doanPhiService.getInvoice(fee._idDoanPhi);
      setInvoiceData(res.data);
    } catch {
      setInvoiceData({ ...fee, hoTen: currentUser?.hoTen || currentUser?.tenNguoiDung });
    }
    setShowInvoiceModal(true);
  };

  const handlePrintInvoice = () => {
    const content = invoiceRef.current?.innerHTML;
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>Hóa đơn đoàn phí</title>
      <style>body{font-family:Times New Roman,serif;padding:48px;color:#000;max-width:680px;margin:auto}
      h1,h2{text-align:center}table{width:100%;border-collapse:collapse;margin-top:16px}
      td,th{border:1px solid #333;padding:10px 14px}th{background:#f0f0f0}
      .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee}
      .label{color:#666;font-size:13px}.value{font-weight:bold;font-size:14px}</style>
    </head><body>${content}</body></html>`);
    w.document.close();
    w.print();
  };

  const formatCurrency = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);
  const formatDate = (ds) => { if (!ds) return '—'; return new Date(ds).toLocaleDateString('vi-VN'); };
  const formatDateTime = (ds) => { if (!ds) return '—'; return new Date(ds).toLocaleString('vi-VN'); };

  const paidFees   = fees.filter(f => f.trangThai === 'Đã nộp');
  const unpaidFees = fees.filter(f => f.trangThai !== 'Đã nộp');

  const totalPaid   = useMemo(() => paidFees.reduce((s, f) => s + (parseFloat(f.soTien) || 0), 0), [paidFees]);
  const totalUnpaid = useMemo(() => unpaidFees.reduce((s, f) => s + (parseFloat(f.soTien) || 0), 0), [unpaidFees]);

  const memoText = selectedFee ? `DP${selectedFee._idDoanPhi} ${currentUser?.maDV || ''} ${selectedFee.namHoc.replace('-', '')}` : '';
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const timePercent = (timeLeft / 300) * 100;

  return (
    <div className="bg-[#f8fafc] text-gray-900 min-h-screen flex flex-col font-sans">
      <Header />
      <Navigation />

      <main className="flex-grow py-10 px-4 sm:px-6 lg:px-[100px]">
        <div className="max-w-6xl mx-auto">

          {/* ── Page Title ── */}
          <div className="mb-8">
            <h1 className="text-3xl font-black text-[#004581] uppercase tracking-tight flex items-center gap-3 mb-1">
              <span className="material-symbols-outlined text-4xl">payments</span>
              Quản Lý Đoàn Phí
            </h1>
            <p className="text-gray-500 text-sm font-medium">Theo dõi tình trạng và lịch sử đóng đoàn phí hàng năm</p>
          </div>

          {/* ── Stats Row ── */}
          {!loading && fees.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
              {[
                { icon: 'receipt_long', label: 'Tổng kỳ đoàn phí', value: `${fees.length} kỳ`, color: 'blue' },
                { icon: 'check_circle', label: `${paidFees.length} kỳ đã nộp`, value: formatCurrency(totalPaid), color: 'emerald' },
                { icon: 'pending', label: `${unpaidFees.length} kỳ chưa nộp`, value: formatCurrency(totalUnpaid), color: 'orange' },
              ].map(({ icon, label, value, color }) => (
                <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                    ${color === 'blue' ? 'bg-blue-50 text-[#004581]' : color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                    <span className="material-symbols-outlined text-2xl">{icon}</span>
                  </div>
                  <div>
                    <p className={`text-xl font-black ${color === 'emerald' ? 'text-emerald-700' : color === 'orange' ? 'text-orange-600' : 'text-gray-900'}`}>{value}</p>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Content ── */}
          {loading ? (
            <Loading variant="fullscreen" text="Đang tải dữ liệu đoàn phí..." />
          ) : fees.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-16 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <span className="material-symbols-outlined text-5xl text-gray-300">receipt_long</span>
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">Chưa có dữ liệu đoàn phí</h3>
              <p className="text-gray-400">Bạn chưa có kỳ đoàn phí nào được ghi nhận trong hệ thống.</p>
            </div>
          ) : (
            /* ── Main Table ── */
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-8 py-5 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                <span className="material-symbols-outlined text-[#004581]">table_rows</span>
                <h2 className="text-lg font-extrabold text-gray-800">Danh sách đoàn phí</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/30">
                      <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Kỳ đoàn phí</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Hạn nộp</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Số tiền</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Trạng thái</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Thanh toán</th>
                      <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {fees.map(fee => {
                      const isPaid = fee.trangThai === 'Đã nộp';
                      const isOverdue = !isPaid && new Date(fee.NgayHetHan) < new Date();
                      return (
                        <tr key={fee._idDoanPhi} className="hover:bg-gray-50/60 transition-colors group">
                          <td className="px-8 py-5">
                            <p className="text-sm font-extrabold text-gray-900">Đoàn phí {fee.namHoc}</p>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <span className="text-sm text-gray-600">{formatDate(fee.NgayHetHan)}</span>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <span className="text-sm font-bold text-[#004581]">{formatCurrency(fee.soTien)}</span>
                          </td>
                          <td className="px-6 py-5 text-center">
                            {isPaid ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Đã nộp
                              </span>
                            ) : isOverdue ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200">
                                <span className="material-symbols-outlined text-[13px]">warning</span>Quá hạn
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-600 border border-orange-200">
                                <span className="animate-pulse w-1.5 h-1.5 rounded-full bg-orange-500"></span>Chưa nộp
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-5 text-center">
                            {isPaid ? (
                              <div className="text-xs text-gray-500 space-y-0.5">
                                <p>{fee.phuongThucThanhToan || '—'}</p>
                                <p className="text-gray-400">{formatDate(fee.ThoiGianThanhToan)}</p>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-8 py-5 text-right">
                            {isPaid ? (
                              <button
                                onClick={() => handleViewInvoice(fee)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border-2 border-[#004581] text-[#004581] hover:bg-[#004581] hover:text-white transition-all"
                              >
                                <span className="material-symbols-outlined text-[16px]">receipt</span>
                                Hóa đơn
                              </button>
                            ) : (
                              <button
                                onClick={() => handlePayment(fee)}
                                disabled={fee.trangThaiMuc !== 'Đang mở thu'}
                                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm
                                  ${fee.trangThaiMuc !== 'Đang mở thu' ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-80' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}
                                `}
                                title={fee.trangThaiMuc !== 'Đang mở thu' ? 'Đợt thu này không mở (đã đóng hoặc chưa bắt đầu)' : ''}
                              >
                                <span className="material-symbols-outlined text-[16px]">payment</span>
                                Thanh toán
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="px-8 py-4 border-t border-gray-100 bg-gray-50/30 text-xs text-gray-400">
                Hiển thị {fees.length} kỳ đoàn phí
              </div>
            </div>
          )}
        </div>
      </main>

      {/* =================== PAYMENT MODAL =================== */}
      {showPaymentModal && selectedFee && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowPaymentModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden border border-gray-100" onClick={e => e.stopPropagation()}>
            
            {/* Header */}
            <div className="bg-gradient-to-r from-[#004581] to-[#0066cc] text-white px-8 py-5 relative">
              <div className="flex justify-between items-center pr-8">
                <div>
                  <h3 className="text-xl font-black flex items-center gap-2">
                    <span className="material-symbols-outlined text-2xl">qr_code_2</span>
                    Thanh Toán Trực Tuyến
                  </h3>
                  <p className="text-blue-100 text-xs mt-0.5">Quét mã QR để chuyển khoản đoàn phí nhanh</p>
                </div>
                {/* Countdown Badge */}
                <div className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black border transition-all ${
                  timeLeft <= 60 
                    ? 'bg-red-500 text-white border-red-400 animate-pulse' 
                    : 'bg-white/10 text-white border-white/20'
                }`}>
                  <span className="material-symbols-outlined text-[18px]">timer</span>
                  <span>{formattedTime}</span>
                </div>
              </div>
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="absolute top-5 right-6 text-white/80 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Progress bar thời gian giảm dần */}
            <div className="w-full bg-gray-100 h-1.5">
              <div 
                className={`h-full transition-all duration-1000 ${timeLeft <= 60 ? 'bg-red-500' : 'bg-[#0066cc]'}`} 
                style={{ width: `${timePercent}%` }}
              ></div>
            </div>

            {/* Body */}
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                
                {/* Cột trái: QR Code */}
                <div className="md:col-span-5 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-100 pb-6 md:pb-0 md:pr-8">
                  <div className="relative p-4 bg-white rounded-2xl border-2 border-dashed border-blue-400/80 shadow-md">
                    <img 
                      src={`https://img.vietqr.io/image/MB-0931992872-compact2.png?amount=${selectedFee.soTien}&addInfo=${encodeURIComponent(memoText)}`} 
                      alt="VietQR MB Bank" 
                      className="w-full max-w-[200px] aspect-square object-contain mx-auto"
                    />
                  </div>
                  <span className="mt-4 px-3.5 py-1.5 bg-blue-50 text-blue-700 text-[10px] font-black rounded-full uppercase tracking-wider text-center border border-blue-100 shadow-sm">
                    Mở App Ngân Hàng Quét QR
                  </span>
                </div>

                {/* Cột phải: Thông tin */}
                <div className="md:col-span-7 flex flex-col justify-between space-y-4">
                  
                  {/* Người nộp */}
                  <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100/80 text-xs space-y-2.5">
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-bold uppercase">Người nộp:</span>
                      <span className="font-extrabold text-gray-800">{currentUser?.hoTen || currentUser?.tenNguoiDung}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-bold uppercase">Mã đoàn viên (MSSV):</span>
                      <span className="font-extrabold text-gray-800">{currentUser?.maDV || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-bold uppercase">Kỳ đoàn phí:</span>
                      <span className="font-extrabold text-gray-800">Năm học {selectedFee.namHoc}</span>
                    </div>
                  </div>

                  {/* Chi tiết chuyển khoản thủ công */}
                  <div className="space-y-3 bg-gray-50/50 p-5 rounded-2xl border border-gray-100 text-xs">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                      <span className="text-gray-400 font-bold uppercase">Ngân hàng</span>
                      <span className="font-bold text-gray-800">MB Bank (Ngân hàng Quân Đội)</span>
                    </div>

                    <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                      <span className="text-gray-400 font-bold uppercase">Số tài khoản</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-gray-800 text-sm">0931992872</span>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText('0931992872');
                            toast.success('Đã sao chép số tài khoản');
                          }}
                          className="text-blue-600 hover:text-blue-800 flex items-center p-0.5 hover:bg-blue-50 rounded"
                          title="Sao chép số tài khoản"
                        >
                          <span className="material-symbols-outlined text-[14px]">content_copy</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                      <span className="text-gray-400 font-bold uppercase">Số tiền</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-gray-800 text-sm">{formatCurrency(selectedFee.soTien)}</span>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(selectedFee.soTien.toString());
                            toast.success('Đã sao chép số tiền');
                          }}
                          className="text-blue-600 hover:text-blue-800 flex items-center p-0.5 hover:bg-blue-50 rounded"
                          title="Sao chép số tiền"
                        >
                          <span className="material-symbols-outlined text-[14px]">content_copy</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-yellow-50/80 p-3 rounded-xl border border-yellow-200">
                      <span className="text-yellow-800 font-bold uppercase">Nội dung chuyển khoản (Memo)</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-red-600 text-[13px]">{memoText}</span>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(memoText);
                            toast.success('Đã sao chép nội dung chuyển khoản');
                          }}
                          className="text-red-600 hover:text-red-800 flex items-center p-0.5 hover:bg-red-50 rounded"
                          title="Sao chép nội dung"
                        >
                          <span className="material-symbols-outlined text-[14px]">content_copy</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Trạng thái và Hành động */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-2xl border border-emerald-100">
                      <svg className="animate-spin h-4 w-4 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Hệ thống đang quét giao dịch tự động mỗi 3 giây...</span>
                    </div>

                    <button 
                      onClick={() => setShowPaymentModal(false)} 
                      className="w-full py-3.5 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors text-sm text-center"
                    >
                      Hủy giao dịch & Trở lại
                    </button>
                  </div>

                </div>
              </div>

              <p className="text-[10px] text-gray-400 mt-6 leading-relaxed text-center border-t border-gray-50 pt-4">
                * Vui lòng chuyển khoản đúng số tài khoản, số tiền và <strong>nội dung chuyển khoản chính xác</strong> như hướng dẫn ở trên để hệ thống tự động ghi nhận thanh toán.
              </p>
            </div>

          </div>
        </div>
      )}

      {/* =================== INVOICE MODAL =================== */}
      {showInvoiceModal && invoiceData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowInvoiceModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
              <h3 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#004581]">receipt</span>
                Hóa Đơn Đoàn Phí
              </h3>
              <button onClick={() => setShowInvoiceModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div ref={invoiceRef} className="p-7 space-y-5">
              <div className="text-center border-b pb-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Trường Đại học Sư phạm Kỹ thuật</p>
                <p className="text-xs text-gray-400 mb-3">Đoàn TNCS Hồ Chí Minh</p>
                <h2 className="text-2xl font-black text-[#004581]">HÓA ĐƠN ĐOÀN PHÍ</h2>
                <p className="text-sm text-gray-500 mt-1">Năm học: <strong>{invoiceData.namHoc}</strong></p>
              </div>

              <div className="space-y-3">
                {[
                  ['Đoàn viên', invoiceData.hoTen || currentUser?.hoTen],
                  ['Mã đoàn viên', invoiceData.maDV],
                  ['Chi đoàn', invoiceData.tenChiDoan || '—'],
                  ['Khoa', invoiceData.tenKhoa || '—'],
                ].map(([label, val]) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</span>
                    <span className="text-sm font-semibold text-gray-900">{val || '—'}</span>
                  </div>
                ))}
              </div>

              <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100 space-y-3">
                {[
                  ['Số tiền', formatCurrency(invoiceData.soTien)],
                  ['Phương thức TT', invoiceData.phuongThucThanhToan || '—'],
                  ['Thời gian TT', formatDateTime(invoiceData.ThoiGianThanhToan)],
                ].map(([label, val]) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</span>
                    <span className="text-sm font-bold text-emerald-700">{val}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                <span className="material-symbols-outlined text-emerald-500">verified</span>
                <p className="text-sm font-bold text-emerald-700">Đã thanh toán thành công</p>
              </div>
            </div>

            <div className="flex gap-3 px-7 pb-7">
              <button onClick={() => setShowInvoiceModal(false)} className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors">
                Đóng
              </button>
              <button onClick={handlePrintInvoice} className="flex-1 bg-[#004581] hover:bg-blue-800 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[20px]">print</span>
                In / Tải PDF
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default DoanPhiPage;
