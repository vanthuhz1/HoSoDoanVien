import { useState, useEffect, useRef } from 'react';
import Header from '../components/layout/Header';
import Navigation from '../components/layout/Navigation';
import Footer from '../components/layout/Footer';
import { authService } from '../services/authService';
import { doanVienService } from '../services/doanVienService';
import { useToast } from '../components/common/Toast';

const DoanVienPage = () => {
  const currentUser = authService.getCurrentUser();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef(null);
  const toast = useToast();

  useEffect(() => {
    if (currentUser?.maDV) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [currentUser?.maDV]);

  const fetchProfile = async () => {
    try {
      const res = await doanVienService.getProfile(currentUser.maDV);
      if (res.success) {
        setProfile(res.data);
      }
    } catch (error) {
      console.error('Lỗi khi tải thông tin:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.warning('Vui lòng chọn file hình ảnh');
      return;
    }

    try {
      setUploading(true);
      const res = await doanVienService.uploadAvatar(file);
      if (res.success) {
        setProfile(prev => ({ ...prev, anhDaiDien: res.data.anhDaiDien }));
        toast.success('Cập nhật ảnh đại diện thành công!');
      }
    } catch (error) {
      console.error('Lỗi upload avatar:', error);
      toast.error('Có lỗi xảy ra khi tải ảnh lên');
    } finally {
      setUploading(false);
    }
  };

  const downloadQR = async () => {
    if (!profile?.maDV) return;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${profile.maDV}`;
    
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `QR_${profile.maDV}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      toast.success('Tải mã QR thành công!');
    } catch (error) {
      console.error('Lỗi khi tải mã QR:', error);
      toast.error('Không thể tải mã QR lúc này');
    }
  };

  const formatDate = (ds) => {
    if (!ds) return '—';
    return new Date(ds).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="bg-[#f8fafc] min-h-screen flex flex-col font-sans">
        <Header />
        <Navigation />
        <div className="flex-grow flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-[#004581] text-4xl animate-spin">refresh</span>
            <p className="text-gray-500 font-medium">Đang tải hồ sơ...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-[#f8fafc] min-h-screen flex flex-col font-sans">
        <Header />
        <Navigation />
        <main className="flex-grow flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center max-w-md">
            <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">person_off</span>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Không tìm thấy hồ sơ</h2>
            <p className="text-gray-500">Tài khoản này chưa được liên kết với hồ sơ Đoàn viên nào.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const avatarUrl = profile.anhDaiDien 
    ? `http://localhost:5000${profile.anhDaiDien}` 
    : 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';

  return (
    <div className="bg-[#f8fafc] text-gray-900 min-h-screen flex flex-col font-sans">
      <Header />
      <Navigation />

      <main className="flex-grow py-10 px-4 sm:px-6 lg:px-[100px] w-full mx-auto relative z-20">
        <div className="max-w-6xl mx-auto">
          
          {/* Header Area */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-black text-[#004581] uppercase tracking-tight mb-2 flex items-center gap-3">
                <span className="material-symbols-outlined text-4xl">badge</span>
                Hồ Sơ Cá Nhân
              </h1>
              <p className="text-gray-500 text-sm font-medium">
                Quản lý thông tin định danh và lịch sử hoạt động Đoàn
              </p>
            </div>
            
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${
                isEditing 
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200' 
                  : 'bg-[#004581] text-white hover:bg-blue-800 hover:shadow-md'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isEditing ? 'close' : 'edit_document'}
              </span>
              {isEditing ? 'Hủy Chỉnh Sửa' : 'Chỉnh Sửa Thông Tin'}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: Avatar & QR Code */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              
              {/* Avatar Section */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-blue-50/50 to-transparent"></div>
                
                <div className="relative group cursor-pointer mb-6 z-10">
                  <div className={`w-40 h-40 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gray-50 ring-4 ring-blue-50 ${uploading ? 'opacity-50' : ''}`}>
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  
                  <div 
                    className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <span className="material-symbols-outlined text-white text-3xl mb-1 transform group-hover:scale-110 transition-transform">photo_camera</span>
                    <span className="text-white text-xs font-bold tracking-wide">THAY ĐỔI</span>
                  </div>
                  
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                  
                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                      <div className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
                        <span className="material-symbols-outlined text-[#004581] animate-spin">refresh</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="z-10 w-full">
                  <h2 className="text-2xl font-extrabold text-gray-900 mb-1">{profile.hoTen}</h2>
                  <p className="text-[#004581] font-bold tracking-wider text-sm mb-4">{profile.maDV}</p>
                  
                  <div className="flex flex-wrap justify-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold uppercase tracking-wide">
                      <span className="material-symbols-outlined text-[14px]">shield</span>
                      {profile.chucVu || 'Đoàn viên'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold uppercase tracking-wide">
                      <span className="material-symbols-outlined text-[14px]">groups</span>
                      Chi Đoàn {profile.maChiDoan || '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* QR Code Section */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-2xl">qr_code_scanner</span>
                </div>
                <h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-widest mb-6">Mã Định Danh</h3>
                
                <div className="p-3 bg-white border-2 border-dashed border-gray-200 rounded-2xl mb-6 group hover:border-[#004581] transition-colors">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${profile.maDV}`} 
                    alt="QR Code" 
                    className="w-[160px] h-[160px] rounded-lg group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                
                <button 
                  onClick={downloadQR}
                  className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 transition-all px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wider"
                >
                  <span className="material-symbols-outlined text-[20px]">download</span>
                  Tải Mã Về Máy
                </button>
              </div>

            </div>

            {/* RIGHT COLUMN: Information Grid */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              {/* Cảnh báo Edit Mode */}
              {isEditing && (
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-start gap-3">
                  <span className="material-symbols-outlined text-orange-500">info</span>
                  <div>
                    <h4 className="text-sm font-bold text-orange-800">Chế độ chỉnh sửa</h4>
                    <p className="text-xs text-orange-600 mt-1">
                      Tính năng cập nhật thông tin đang trong quá trình hoàn thiện. Hiện tại bạn có thể xem các trường dữ liệu ở dạng biểu mẫu. 
                    </p>
                  </div>
                </div>
              )}

              {/* Section 1: Thông tin chung */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md">
                <div className="px-8 py-5 border-b border-gray-50 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <span className="material-symbols-outlined">person</span>
                  </div>
                  <h3 className="text-lg font-extrabold text-gray-900">Thông Tin Cá Nhân</h3>
                </div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 bg-gray-50/30">
                  <InfoField label="Họ và tên" value={profile.hoTen} icon="badge" isEditing={isEditing} />
                  <InfoField label="Ngày sinh" value={formatDate(profile.ngaySinh)} icon="cake" isEditing={isEditing} type="date" rawValue={profile.ngaySinh?.split('T')[0]} />
                  <InfoField label="Giới tính" value={profile.gioiTinh} icon="wc" isEditing={isEditing} />
                  <InfoField label="Số CCCD" value={profile.cccd} icon="id_card" isEditing={isEditing} />
                  <InfoField label="Dân tộc" value={profile.danToc} icon="public" isEditing={isEditing} />
                  <InfoField label="Tôn giáo" value={profile.tonGiao || 'Không'} icon="church" isEditing={isEditing} />
                </div>
              </div>

              {/* Section 2: Liên hệ */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md">
                <div className="px-8 py-5 border-b border-gray-50 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <span className="material-symbols-outlined">contact_mail</span>
                  </div>
                  <h3 className="text-lg font-extrabold text-gray-900">Thông Tin Liên Hệ</h3>
                </div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 bg-gray-50/30">
                  <div className="md:col-span-2">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">mail</span>
                      Thư điện tử (Bắt buộc)
                    </p>
                    <input 
                      type="text" 
                      value={profile.email || '—'} 
                      readOnly 
                      className="w-full text-sm font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-4 py-3 rounded-xl cursor-not-allowed outline-none focus:ring-0"
                    />
                    <p className="text-[10px] text-red-400 mt-2 font-medium">* Email dùng để đăng nhập nên không thể thay đổi</p>
                  </div>
                  <InfoField label="Số điện thoại" value={profile.SDT} icon="call" isEditing={isEditing} />
                  <div className="hidden md:block"></div>
                  <div className="md:col-span-2">
                    <InfoField label="Quê quán" value={profile.queQuan} icon="home_pin" isEditing={isEditing} />
                  </div>
                  <div className="md:col-span-2">
                    <InfoField label="Địa chỉ thường trú" value={profile.diaChiThuongTru} icon="location_on" isEditing={isEditing} />
                  </div>
                </div>
              </div>

              {/* Section 3: Đoàn vụ */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md">
                <div className="px-8 py-5 border-b border-gray-50 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <span className="material-symbols-outlined">assignment_ind</span>
                  </div>
                  <h3 className="text-lg font-extrabold text-gray-900">Thông Tin Đoàn Vụ</h3>
                </div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 bg-gray-50/30">
                  <div className="md:col-span-2 flex flex-col md:flex-row gap-6 p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
                    <div className="flex-1">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Mã Đoàn Viên</p>
                      <p className="text-lg font-black text-[#004581]">{profile.maDV || '—'}</p>
                    </div>
                    <div className="flex-1 border-t md:border-t-0 md:border-l border-blue-200 pt-4 md:pt-0 md:pl-6">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Trạng thái sổ Đoàn</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="relative flex h-3 w-3">
                          {profile.trangThaiSH === 'Đang sinh hoạt' && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          )}
                          <span className={`relative inline-flex rounded-full h-3 w-3 ${profile.trangThaiSH === 'Đang sinh hoạt' ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                        </span>
                        <span className="text-sm font-bold text-gray-900">{profile.trangThaiSH || '—'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <InfoField label="Ngày vào Đoàn" value={formatDate(profile.ngayVaoDoan)} icon="event" isEditing={false} type="date" rawValue={profile.ngayVaoDoan?.split('T')[0]} />
                  <InfoField label="Nơi vào Đoàn" value={profile.noiVaoDoan} icon="account_balance" isEditing={false} />
                  <InfoField label="Ngày chuyển đến" value={formatDate(profile.ngayChuyenDen)} icon="flight_land" isEditing={false} type="date" rawValue={profile.ngayChuyenDen?.split('T')[0]} />
                  <InfoField label="Chi Đoàn trực thuộc" value={profile.tenChiDoan || profile.maChiDoan} icon="groups" isEditing={false} />
                </div>
              </div>

              {/* Nút lưu (Chỉ hiện khi edit) */}
              {isEditing && (
                <div className="flex justify-end gap-3 mt-4">
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-3 rounded-xl font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    Hủy Bỏ
                  </button>
                  <button 
                    className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition-all"
                  >
                    <span className="material-symbols-outlined text-[20px]">save</span>
                    Lưu Thay Đổi
                  </button>
                </div>
              )}

            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

// Component phụ trợ hiển thị Field
const InfoField = ({ label, value, icon, isEditing, type = 'text', rawValue = '' }) => {
  return (
    <div>
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
        <span className="material-symbols-outlined text-[16px]">{icon}</span>
        {label}
      </p>
      {isEditing ? (
        <input 
          type={type} 
          defaultValue={type === 'date' ? rawValue : (value === '—' ? '' : value)} 
          className="w-full text-sm font-semibold text-gray-900 bg-white border border-gray-300 focus:border-[#004581] focus:ring-2 focus:ring-blue-100 px-4 py-2.5 rounded-xl outline-none transition-all"
          placeholder={`Nhập ${label.toLowerCase()}...`}
        />
      ) : (
        <p className="text-[15px] font-semibold text-gray-900 border-b border-transparent pb-1">
          {value || '—'}
        </p>
      )}
    </div>
  );
};

export default DoanVienPage;
