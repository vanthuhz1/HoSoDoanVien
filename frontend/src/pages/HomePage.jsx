import Header from '../components/layout/Header';
import Navigation from '../components/layout/Navigation';
import Breadcrumb from '../components/layout/Breadcrumb';
import Footer from '../components/layout/Footer';

const HomePage = () => {
  const breadcrumbItems = [
    { label: 'Trang chủ' }
  ];

  return (
    <div className="bg-gray-50 text-gray-900 min-h-screen flex flex-col">
      <Header />
      <Navigation />
      <Breadcrumb items={breadcrumbItems} />
      
      <main className="flex-grow bg-gray-100 py-12 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl border border-gray-300 shadow-md p-8">
            <h1 className="text-3xl font-bold text-[#004581] mb-6">
              CHÀO MỪNG ĐÉN VỚI HỆ THỐNG QUẢN LÝ CHUYÊN TRÁCH ĐOÀN - HỘI
            </h1>
            
            <div className="prose max-w-none text-gray-600">
              <p className="text-lg mb-4">
                Hệ thống quản lý chuyên trách Đoàn - Hội là công cụ chính thức giúp tối ưu hóa 
                công tác quản lý và đánh giá hoạt động phong trào.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="material-symbols-outlined text-[#004581] text-3xl fill">groups</span>
                    <h3 className="text-xl font-semibold text-[#004581]">Dành cho Đoàn viên</h3>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[#004581] text-lg">check_circle</span>
                      <span>Theo dõi điểm rèn luyện</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[#004581] text-lg">check_circle</span>
                      <span>Đăng ký hoạt động trực tuyến</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[#004581] text-lg">check_circle</span>
                      <span>Quản lý hồ sơ cá nhân</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="material-symbols-outlined text-[#004581] text-3xl fill">admin_panel_settings</span>
                    <h3 className="text-xl font-semibold text-[#004581]">Dành cho Cán bộ</h3>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[#004581] text-lg">check_circle</span>
                      <span>Quản lý chi đoàn/chi hội</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[#004581] text-lg">check_circle</span>
                      <span>Trích xuất báo cáo tự động</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[#004581] text-lg">check_circle</span>
                      <span>Phê duyệt minh chứng trực tuyến</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;
