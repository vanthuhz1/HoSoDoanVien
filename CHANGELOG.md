# Changelog - Hệ thống Quản lý Đoàn viên

## [2026-05-12] - Trang Chi tiết Hoạt động

### ✨ Tính năng mới

#### Backend
- **API lấy chi tiết hoạt động** (`GET /api/activities/:id`)
  - Lấy thông tin đầy đủ của 1 hoạt động theo ID
  - Hỗ trợ gọi với hoặc không có token
  - Trả về field `daDangKy` nếu user đã đăng nhập
  - Trả về 404 nếu không tìm thấy hoạt động

#### Frontend
- **Trang chi tiết hoạt động** (`/activity/:id`)
  - Hiển thị đầy đủ thông tin hoạt động:
    - Tên hoạt động
    - Mô tả chi tiết
    - Thời gian tổ chức (ngày giờ)
    - Địa điểm
    - Đơn vị tổ chức
    - Điểm hoạt động
    - Trạng thái hoạt động
    - Lưu ý / Link đính kèm
    - Tiến độ đăng ký (progress bar)
  
  - **Các trạng thái button:**
    - "Đăng ký tham gia" (màu xanh lá) - chưa đăng ký, còn chỗ
    - "Hủy đăng ký" (màu đỏ) - đã đăng ký
    - "Đã đủ số lượng" (disabled) - hết chỗ
    - "Hoạt động không mở đăng ký" (disabled) - không phải trạng thái "Đang mở"
    - "Đăng nhập để đăng ký" - chưa đăng nhập
    - "Không có quyền" - Admin/Đoàn khoa

  - **Tính năng:**
    - Đăng ký/hủy đăng ký trực tiếp từ trang chi tiết
    - Hiển thị badge "Bạn đã đăng ký hoạt động này" nếu đã đăng ký
    - Nút "Quay lại trang chủ"
    - Loading state khi đang tải dữ liệu
    - Error handling khi không tìm thấy hoạt động

- **Cập nhật HomePage**
  - Chỉ hiển thị nút "Xem chi tiết" trên mỗi card
  - Hiển thị badge "Bạn đã đăng ký hoạt động này" nếu đã đăng ký
  - Click vào nút sẽ chuyển đến trang chi tiết
  - Loại bỏ các nút đăng ký/hủy đăng ký khỏi HomePage

### 🔧 Cải tiến

- **activityController.js**
  - Thêm function `getActivityById()` để lấy chi tiết 1 hoạt động
  - Sử dụng lại logic kiểm tra `daDangKy` giống như `getHomeActivities()`

- **activityRoutes.js**
  - Thêm route `GET /:id` với optional authentication
  - Đặt route này trước các route khác để tránh conflict

- **activityService.js**
  - Thêm function `getActivityById(idHD)` để gọi API

- **App.jsx**
  - Thêm route `/activity/:id` cho trang chi tiết (public route)

### 🎨 UI/UX Improvements

- **Trang chi tiết:**
  - Header gradient với màu xanh dương chủ đạo
  - Badge trạng thái và điểm nổi bật ở góc phải
  - Layout rõ ràng với các section riêng biệt
  - Icons Material Symbols cho từng thông tin
  - Progress bar với màu động theo % đăng ký
  - Button lớn, dễ nhấn với icon và text rõ ràng
  - Responsive design cho mobile

- **HomePage:**
  - Đơn giản hóa card, chỉ 1 nút "Xem chi tiết"
  - Badge nhỏ gọn hiển thị trạng thái đã đăng ký
  - Giảm độ phức tạp, tăng tốc độ load

### 📚 Documentation

- Cập nhật CHANGELOG.md với tính năng mới

### 🚀 Deployment

**Cách cập nhật:**

1. Pull code mới
2. Restart backend:
   ```bash
   cd backend
   npm start
   ```
3. Restart frontend:
   ```bash
   cd frontend
   npm run dev
   ```

**Không cần:**
- ❌ Chạy migration (không có thay đổi schema)
- ❌ Cài thêm package (không có dependency mới)
- ❌ Cập nhật database (không có thay đổi dữ liệu)

### 📝 Breaking Changes

Không có breaking changes.

### ⚠️ Known Issues

Không có issues đã biết.

---

## [2026-05-12] - Chức năng Đăng ký Hoạt động

### ✨ Tính năng mới

#### Backend
- **API đăng ký hoạt động** (`POST /api/activities/:id/register`)
  - Chỉ cho phép Role 3 (Bí thư) và Role 4 (Đoàn viên)
  - Kiểm tra hoạt động có đang mở không
  - Kiểm tra số lượng đã đủ chưa
  - Kiểm tra user đã đăng ký chưa
  - Tự động cập nhật `soLuongDaDK`

- **API hủy đăng ký** (`DELETE /api/activities/:id/unregister`)
  - Chỉ cho phép hủy khi trạng thái là "Đã Đăng Ký"
  - Tự động giảm `soLuongDaDK`

- **Cập nhật API lấy danh sách hoạt động** (`GET /api/activities/home`)
  - Chỉ hiển thị hoạt động có `trangThaiHD = 'Đang mở'`
  - Thêm field `daDangKy` (true/false) nếu user đã đăng nhập
  - Hỗ trợ gọi với hoặc không có token

#### Frontend
- **Hiển thị trạng thái đăng ký trên HomePage**
  - Button "Đăng ký ngay" (màu xanh dương) - chưa đăng ký
  - Button "Đã đăng ký" (màu xanh lá, icon check) - đã đăng ký
  - Button "Hủy đăng ký" (màu đỏ) - hiển thị khi đã đăng ký
  - Button "Đã đủ số lượng" (màu xám, disabled) - hết chỗ
  - Button "Đăng nhập để đăng ký" - chưa đăng nhập
  - Button "Không có quyền" - Admin/Đoàn khoa

- **Xử lý đăng ký/hủy đăng ký**
  - Kiểm tra quyền trước khi đăng ký
  - Hiển thị confirm dialog
  - Tự động reload danh sách sau khi thành công
  - Hiển thị thông báo lỗi nếu thất bại

#### Database
- **Thêm 8 hoạt động mẫu** với trạng thái "Đang mở"
  - Chiến dịch Mùa hè xanh 2026
  - Hiến máu nhân đạo
  - Ngày hội Việc làm 2026
  - Workshop: Kỹ năng lập trình Web
  - Giải bóng đá Sinh viên 2026
  - Tọa đàm: Khởi nghiệp cho sinh viên
  - Chương trình "Tiếp sức mùa thi"
  - Cuộc thi "Ý tưởng sáng tạo"

#### Scripts
- **updateAllPasswords.js** - Cập nhật mật khẩu tất cả tài khoản thành "123456"
- **addSampleActivities.js** - Thêm hoạt động mẫu vào database

### 🔧 Cải tiến

- **activityController.js**
  - Refactor logic kiểm tra quyền
  - Thêm validation đầy đủ
  - Cải thiện error messages

- **activityRoutes.js**
  - Thêm middleware phân quyền cho từng route
  - Hỗ trợ optional authentication cho `/home`

- **activityService.js**
  - Thêm helper function `getAuthHeaders()`
  - Chuẩn hóa cách gọi API

### 🐛 Bug Fixes

- **Fix lỗi đăng nhập**: Mật khẩu trong database chỉ là placeholder, không phải hash thật
  - Tạo script `updateAllPasswords.js` để hash đúng mật khẩu
  - Cập nhật tất cả 51 tài khoản

- **Fix foreign key constraint**: Không thể xóa hoạt động do ràng buộc với bảng KhieuNai
  - Thêm `SET FOREIGN_KEY_CHECKS = 0` trước khi xóa
  - Xóa theo thứ tự: KhieuNai → DanhSachDangKy → HoatDongDoan

### 📚 Documentation

- **FEATURE_REGISTER_ACTIVITY.md** - Tài liệu chi tiết chức năng đăng ký
- **TEST_REGISTER.md** - Hướng dẫn test đầy đủ với 10 test cases
- **CHANGELOG.md** - Lịch sử thay đổi

### 🔐 Security

- **Phân quyền chặt chẽ**
  - Admin (Role 1): Không thể đăng ký
  - Đoàn khoa (Role 2): Không thể đăng ký
  - Bí thư (Role 3): Có thể đăng ký ✅
  - Đoàn viên (Role 4): Có thể đăng ký ✅

- **Validation đầy đủ**
  - Kiểm tra token hợp lệ
  - Kiểm tra role
  - Kiểm tra trạng thái hoạt động
  - Kiểm tra số lượng
  - Kiểm tra trùng đăng ký

### 📊 Database Changes

```sql
-- Không có thay đổi schema
-- Chỉ thêm dữ liệu mẫu vào bảng HoatDongDoan
```

### 🚀 Deployment

**Cách cập nhật:**

1. Pull code mới
2. Chạy script cập nhật mật khẩu:
   ```bash
   cd backend
   node scripts/updateAllPasswords.js
   ```
3. Chạy script thêm hoạt động mẫu:
   ```bash
   node scripts/addSampleActivities.js
   ```
4. Restart backend và frontend

**Không cần:**
- ❌ Chạy migration (không có thay đổi schema)
- ❌ Cài thêm package (không có dependency mới)

### 📝 Breaking Changes

Không có breaking changes.

### ⚠️ Known Issues

Không có issues đã biết.

---

## [2026-05-12] - Setup ban đầu

### ✨ Tính năng có sẵn

#### Authentication
- Đăng nhập bằng email + mật khẩu
- Quên mật khẩu (OTP qua email)
- Đặt lại mật khẩu
- JWT token authentication
- Role-based redirect

#### Trang chủ
- Hiển thị danh sách hoạt động
- Search và filter
- Activity cards với progress bar
- Thông báo công khai

#### UI Components
- Header, Navigation, Footer, Breadcrumb
- Protected Routes
- Responsive design

#### Database
- 14 bảng chính
- 51 tài khoản mẫu
- 5 khoa, 10 chi đoàn, 50 đoàn viên

---

## 🎯 Roadmap

### Phase 1: Core Features (Hoàn thành ✅)
- [x] Authentication
- [x] Trang chủ
- [x] Đăng ký hoạt động

### Phase 2: Activity Management (Đang phát triển 🚧)
- [ ] Trang "Hoạt động của tôi"
- [ ] Upload minh chứng tham gia
- [ ] Điểm danh QR Code
- [ ] Admin duyệt minh chứng

### Phase 3: Advanced Features (Kế hoạch 📋)
- [ ] Dashboard thống kê
- [ ] Xuất báo cáo Excel
- [ ] Gửi email thông báo
- [ ] Quản lý đoàn phí
- [ ] Quản lý sổ đoàn

### Phase 4: Optimization (Tương lai 🔮)
- [ ] Caching với Redis
- [ ] Real-time notifications
- [ ] Mobile app
- [ ] API documentation (Swagger)

---

## 📞 Contact

Nếu có vấn đề hoặc câu hỏi, vui lòng liên hệ:
- Email: admin@ute.udn.vn
- GitHub Issues: [Link to repo]

---

## 📄 License

Copyright © 2026 Đoàn Trường ĐHSPKT
