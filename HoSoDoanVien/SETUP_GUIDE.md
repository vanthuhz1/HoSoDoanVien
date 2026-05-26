# Hệ thống Quản lý Đoàn viên - Đoàn Trường ĐHSPKT

## 📋 Tổng quan

Hệ thống quản lý hồ sơ đoàn viên, hoạt động đoàn, đoàn phí và sổ đoàn cho Đoàn Trường Đại học Sư phạm Kỹ thuật Đà Nẵng.

### Công nghệ
- **Backend**: Node.js + Express + MySQL
- **Frontend**: React 18 + Vite + TailwindCSS
- **Authentication**: JWT + bcrypt
- **Email**: Nodemailer

---

## 🚀 Cài đặt nhanh

### 1. Clone repository
```bash
git clone [repository-url]
cd DoAnPhanMem_Web
```

### 2. Cài đặt Backend
```bash
cd backend
npm install
```

Tạo file `.env`:
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=Nhoxthu23092005@
DB_DATABASE=QUAN_LY_DOAN_VIEN

JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_2024
JWT_EXPIRES_IN=1d

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@doanvien.edu.vn
```

### 3. Cài đặt Frontend
```bash
cd frontend
npm install
```

### 4. Setup Database
```bash
# Import database
mysql -u root -p < sqldoanphanmemscrip.sql

# Cập nhật mật khẩu (tất cả thành 123456)
cd backend
node scripts/updateAllPasswords.js

# Thêm hoạt động mẫu
node scripts/addSampleActivities.js
```

### 5. Chạy ứng dụng

**Terminal 1 - Backend:**
```bash
cd backend
npm start
# Chạy tại http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Chạy tại http://localhost:3000
```

---

## 👥 Tài khoản Test

Tất cả tài khoản có mật khẩu: **123456**

### Admin
- Email: `admin@ute.udn.vn`
- Role: Quản trị toàn hệ thống

### Đoàn khoa (5 tài khoản)
- `2011500001@sv.ute.udn.vn` - Bùi Minh Hải
- `2011500002@sv.ute.udn.vn` - Bùi Thu Hùng
- `2011500003@sv.ute.udn.vn` - Hoàng Thị An
- `2011500004@sv.ute.udn.vn` - Vũ Ngọc Dung
- `2011500005@sv.ute.udn.vn` - Phạm Ngọc Minh

### Bí thư (5 tài khoản)
- `2211500006@sv.ute.udn.vn` - Đỗ Thanh Quân
- `2211500007@sv.ute.udn.vn` - Bùi Minh Tùng
- `2211500008@sv.ute.udn.vn` - Lê Hữu Khoa
- `2211500009@sv.ute.udn.vn` - Bùi Bảo Bình
- `2211500010@sv.ute.udn.vn` - Trần Minh Hà

### Đoàn viên (40 tài khoản)
- Từ `2311500011@sv.ute.udn.vn` đến `2311500050@sv.ute.udn.vn`

---

## ✨ Tính năng

### ✅ Đã hoàn thành

#### 1. Authentication
- [x] Đăng nhập bằng email + mật khẩu
- [x] Quên mật khẩu (OTP qua email)
- [x] Đặt lại mật khẩu
- [x] JWT token authentication
- [x] Role-based redirect

#### 2. Trang chủ
- [x] Hiển thị danh sách hoạt động đang mở
- [x] Search và filter
- [x] Activity cards với progress bar
- [x] Thông báo công khai
- [x] Pagination

#### 3. Đăng ký hoạt động (MỚI 🎉)
- [x] Đăng ký tham gia hoạt động
- [x] Hủy đăng ký
- [x] Kiểm tra số lượng
- [x] Kiểm tra trùng đăng ký
- [x] Phân quyền (chỉ Bí thư và Đoàn viên)
- [x] Hiển thị trạng thái đăng ký

### 🚧 Đang phát triển

- [ ] Trang "Hoạt động của tôi"
- [ ] Upload minh chứng tham gia
- [ ] Điểm danh QR Code
- [ ] Admin duyệt minh chứng
- [ ] Dashboard thống kê

### 📋 Kế hoạch

- [ ] Quản lý đoàn phí
- [ ] Quản lý sổ đoàn
- [ ] Xuất báo cáo Excel
- [ ] Gửi email thông báo
- [ ] Mobile app

---

## 📁 Cấu trúc dự án

```
DoAnPhanMem_Web/
├── backend/
│   ├── src/
│   │   ├── config/          # Database config
│   │   ├── controllers/     # Business logic
│   │   ├── middleware/      # Auth middleware
│   │   ├── routes/          # API routes
│   │   ├── utils/           # Email service
│   │   └── server.js        # Entry point
│   ├── scripts/             # Utility scripts
│   │   ├── updateAllPasswords.js
│   │   └── addSampleActivities.js
│   ├── .env                 # Environment variables
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── admin/
│   │   │   ├── doankhoa/
│   │   │   ├── layout/
│   │   │   └── common/
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
│
├── sqldoanphanmemscrip.sql  # Database schema
├── SETUP_GUIDE.md           # Hướng dẫn setup
├── FEATURE_REGISTER_ACTIVITY.md  # Tài liệu chức năng đăng ký
├── TEST_REGISTER.md         # Hướng dẫn test
└── CHANGELOG.md             # Lịch sử thay đổi
```

---

## 🎯 Vai trò (Roles)

| ID | Vai trò | Quyền hạn | Redirect |
|----|---------|-----------|----------|
| 1  | Admin | Quản trị toàn hệ thống | `/admin` |
| 2  | Đoàn khoa | Quản lý Chi đoàn và hoạt động thuộc Khoa | `/doan-khoa` |
| 3  | Bí thư | Quản lý trực tiếp Chi đoàn lớp, **có thể đăng ký hoạt động** | `/` |
| 4  | Đoàn viên | Sinh hoạt bình thường, **có thể đăng ký hoạt động** | `/` |

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/forgot-password` - Quên mật khẩu
- `POST /api/auth/reset-password` - Đặt lại mật khẩu
- `GET /api/auth/verify` - Xác thực token

### Activities
- `GET /api/activities/home` - Lấy DS hoạt động đang mở (public)
- `GET /api/activities/my-activities` - Lịch sử đăng ký (auth)
- `POST /api/activities/:id/register` - Đăng ký hoạt động (role 3, 4)
- `DELETE /api/activities/:id/unregister` - Hủy đăng ký (role 3, 4)
- `GET /api/activities/all` - Tất cả hoạt động (admin)
- `POST /api/activities` - Tạo hoạt động (admin)

### Đoàn viên
- `GET /api/doan-vien` - Danh sách đoàn viên
- `GET /api/doan-vien/:id` - Chi tiết đoàn viên

### Đoàn phí
- `GET /api/doan-phi/my-fees` - Đoàn phí của tôi
- `POST /api/doan-phi/payment` - Thanh toán đoàn phí

### Thông báo
- `GET /api/thong-bao` - Danh sách thông báo
- `POST /api/thong-bao` - Tạo thông báo (admin)

---

## 🗄️ Database

### Bảng chính (14 bảng)

1. **Khoa** - Các khoa trong trường
2. **ChiDoan** - Chi đoàn lớp
3. **DoanVien** - Thông tin đoàn viên
4. **TaiKhoan** - Tài khoản đăng nhập
5. **VaiTro** - Vai trò/quyền hạn
6. **HoatDongDoan** - Hoạt động đoàn
7. **DanhSachDangKy** - Đăng ký tham gia hoạt động
8. **DoanPhi** - Đoàn phí
9. **DanhMucDoanPhi** - Danh mục đoàn phí
10. **SoDoan** - Sổ đoàn
11. **TieuSu** - Tiểu sử đoàn viên
12. **ThongBao** - Thông báo
13. **KhieuNai** - Khiếu nại
14. **NhatKiHeThong** - Nhật ký hệ thống

---

## 📚 Tài liệu

- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Hướng dẫn cài đặt chi tiết
- [FEATURE_REGISTER_ACTIVITY.md](./FEATURE_REGISTER_ACTIVITY.md) - Tài liệu chức năng đăng ký hoạt động
- [TEST_REGISTER.md](./TEST_REGISTER.md) - Hướng dẫn test với 10 test cases
- [CHANGELOG.md](./CHANGELOG.md) - Lịch sử thay đổi

---

## 🧪 Testing

### Chạy test thủ công

```bash
# 1. Cập nhật mật khẩu
cd backend
node scripts/updateAllPasswords.js

# 2. Thêm hoạt động mẫu
node scripts/addSampleActivities.js

# 3. Khởi động backend
npm start

# 4. Khởi động frontend (terminal mới)
cd ../frontend
npm run dev

# 5. Test trên browser
# - Đăng nhập: 2311500011@sv.ute.udn.vn / 123456
# - Đăng ký hoạt động "Hiến máu nhân đạo"
# - Kiểm tra button chuyển sang "Đã đăng ký"
```

Xem chi tiết: [TEST_REGISTER.md](./TEST_REGISTER.md)

---

## 🐛 Troubleshooting

### Backend không kết nối được database
```bash
# Kiểm tra MySQL đang chạy
mysql -u root -p

# Kiểm tra thông tin trong .env
cat backend/.env
```

### Frontend không gọi được API
```bash
# Kiểm tra backend đang chạy
curl http://localhost:5000/api/health

# Kiểm tra CORS
# Đã có app.use(cors()) trong server.js
```

### Lỗi "Email hoặc mật khẩu không đúng"
```bash
# Chạy script cập nhật mật khẩu
cd backend
node scripts/updateAllPasswords.js
```

---

## 📞 Liên hệ

- Email: admin@ute.udn.vn
- GitHub: [Repository URL]

---

## 📄 License

Copyright © 2026 Đoàn Trường ĐHSPKT

---

## 🎉 Cập nhật mới nhất

### [2026-05-12] Chức năng Đăng ký Hoạt động

✨ **Tính năng mới:**
- Đăng ký tham gia hoạt động (Role 3, 4)
- Hủy đăng ký
- Hiển thị trạng thái đăng ký real-time
- Kiểm tra số lượng và quyền hạn

🔧 **Cải tiến:**
- Chỉ hiển thị hoạt động "Đang mở" trên trang chủ
- UI/UX button theo trạng thái
- Validation đầy đủ

🐛 **Bug fixes:**
- Fix lỗi đăng nhập (mật khẩu không đúng)
- Fix foreign key constraint khi xóa hoạt động

📚 **Tài liệu:**
- Thêm FEATURE_REGISTER_ACTIVITY.md
- Thêm TEST_REGISTER.md
- Thêm CHANGELOG.md

Xem chi tiết: [CHANGELOG.md](./CHANGELOG.md)

## Cấu trúc Vai trò (Roles)

Hệ thống có 5 vai trò:

| ID | Vai trò | Redirect sau login |
|----|---------|-------------------|
| 1  | Admin | `/admin` |
| 2  | Bí thư chi đoàn | `/` (Home - Danh sách hoạt động) |
| 3  | Đoàn viên | `/` (Home - Danh sách hoạt động) |
| 4  | Phó Bí thư | `/` (Home - Danh sách hoạt động) |
| 5  | Cán bộ Khoa (Bí thư khoa) | `/khoa` |

## Tài khoản Test (từ database)

```
Username: 23115053122241
Password: 123456
Role: Bí thư chi đoàn (ID: 2)

Username: 23115053122242
Password: 123456
Role: Đoàn viên (ID: 3)

Username: admin
Password: 123456
Role: Admin (ID: 1)
```

## Cài đặt

### 1. Backend Setup

```bash
cd backend
npm install
```

Tạo file `.env`:
```env
PORT=5000
NODE_ENV=development

# MySQL Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=Nhoxthu23092005@
DB_DATABASE=QUAN_LY_DOAN_VIEN

# JWT
JWT_SECRET=your-secret-key-here-change-in-production
JWT_EXPIRES_IN=1d

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
```

Chạy backend:
```bash
npm start
```

Backend sẽ chạy tại: `http://localhost:5000`

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Chạy frontend:
```bash
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/forgot-password` - Quên mật khẩu (gửi OTP)
- `POST /api/auth/reset-password` - Đặt lại mật khẩu

### Activities
- `GET /api/activities/home` - Lấy danh sách hoạt động
  - Query params: `?search=...&date=...&maxQty=...`

## Tính năng đã hoàn thành

✅ **Authentication**
- Đăng nhập với role-based redirect
- Quên mật khẩu (OTP qua email)
- Đặt lại mật khẩu

✅ **Trang Home**
- Hiển thị danh sách hoạt động
- Search và filter (tên, ngày, số lượng)
- Activity cards với đầy đủ thông tin
- Button động (Đăng ký / Đã khóa)
- Hiển thị lưu ý (warning box)

✅ **UI Components**
- Header (chung cho tất cả trang)
- Navigation (responsive, active state)
- Breadcrumb
- Footer

## Lưu ý

1. **Database**: Đảm bảo MySQL đang chạy và đã import file `sqldoanphanmemscrip.sql`
2. **Email**: Cần cấu hình email trong `.env` để chức năng quên mật khẩu hoạt động
3. **Password**: Mật khẩu trong database đã được hash bằng bcrypt
4. **CORS**: Backend đã cấu hình CORS cho phép frontend gọi API

## Troubleshooting

### Backend không kết nối được database
- Kiểm tra MySQL đang chạy
- Kiểm tra thông tin trong `.env`
- Kiểm tra user `root` có quyền truy cập

### Frontend không gọi được API
- Kiểm tra backend đang chạy tại port 5000
- Kiểm tra CORS đã được cấu hình
- Mở Developer Console (F12) để xem lỗi chi tiết

### Lỗi "address already in use"
- Port đã được sử dụng
- Dừng process cũ hoặc đổi port trong `.env`
## Lưu ý
1. Bảng Đoàn Viên (DoanVien)
Cột: trangThaiSH (Trạng thái sinh hoạt)

Các giá trị:

Đang sinh hoạt

Đã rút hồ sơ (Dùng khi sinh viên chuyển trường hoặc ra trường)

Đình chỉ (Nếu có vi phạm kỷ luật)

2. Bảng Tài Khoản (TaiKhoan)
Cột: trangThai (Nên dùng kiểu số TINYINT để check cho nhanh)

Các giá trị:

1 (Đang hoạt động)

0 (Bị khóa / Vô hiệu hóa - Dùng khi không cho phép user đó đăng nhập nữa)

3. Bảng Danh Mục Đoàn Phí (DanhMucDoanPhi - Các đợt thu)
Cột: trangThai

Các giá trị:

Chưa mở (Admin mới tạo nháp, chưa tới ngày thu)

Đang mở thu (Sinh viên và Bí thư có thể bắt đầu nộp tiền/tích Đã nộp)

Đã đóng lại (Hết hạn thu, chốt sổ, không cho thao tác nữa)

4. Bảng Đoàn Phí (DoanPhi - Từng cá nhân nộp tiền)
Cột: trangThai

Các giá trị:

Chưa nộp (Mặc định khi Admin tạo đợt thu mới)

Đã nộp (Bí thư tích vào khi đã nhận tiền)

5. Bảng Hoạt Động Đoàn (HoatDongDoan)
Cột: trangThaiHD

Các giá trị:

Sắp diễn ra (Cho phép sinh viên bấm nút Đăng ký)

Đang diễn ra (Khóa nút đăng ký, chuẩn bị quét QR điểm danh)

Đã kết thúc (Hoàn tất, chuyển sang bước cộng điểm)

Hủy bỏ (Hoạt động bị hủy do thời tiết/lý do khách quan)

6. Bảng Danh Sách Đăng Ký (DanhSachDangKy - Điểm danh)
Bảng này có 2 cột trạng thái để quản lý chặt chẽ:

Cột 1: trangThaiThamGia

Đăng ký (Mới đăng ký trên web, chưa diễn ra)

Đã tham gia (Quét QR hoặc điểm danh thành công)

Vắng mặt (Đăng ký nhưng không đi)

Cột 2: trangThaiCongDiem

Chưa cộng

Đã cộng (Admin đã chốt danh sách và cộng điểm rèn luyện)

7. Bảng Sổ Đoàn (SoDoan)
Cột: trangThai

Các giá trị:

Đang giữ (Bí thư/Đoàn khoa đang lưu trữ trong tủ hồ sơ)

Thất lạc (Bị mất, cần làm lại)

Đã trả (Sinh viên ra trường và đã nhận lại sổ)

8. Bảng Khiếu Nại (KhieuNai)
Cột: TrangThai

Các giá trị:

Chờ xử lý (Sinh viên mới gửi đơn)

Đang xem xét (Cán bộ đang đi check lại minh chứng)

Đã xử lý (Chấp nhận khiếu nại và đã khắc phục)

Từ chối (Minh chứng sai, không chấp nhận)