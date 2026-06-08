# HƯỚNG DẪN DEPLOY ĐỒ ÁN LÊN INTERNET (DÀNH CHO SINH VIÊN)

Tài liệu này hướng dẫn chi tiết cách đưa dự án **Hệ thống Quản lý Đoàn viên** (gồm Frontend React, Backend Express và Database MySQL) lên các dịch vụ cloud **hoàn toàn miễn phí** (hoặc chi phí tối thiểu), rất phù hợp cho việc chạy thử nghiệm, báo cáo, và bảo vệ đồ án môn học.

---

## 🛠️ Mô hình Deployment đề xuất

Mô hình tốt nhất, chạy ổn định và miễn phí 100% hiện nay cho Stack này là:
1. **Frontend (React - Vite)**: Deploy lên **Vercel** (miễn phí, tốc độ tải trang cực nhanh, tự động đồng bộ qua GitHub).
2. **Backend (Node.js - Express)**: Deploy lên **Render** (miễn phí dịch vụ Web Service).
3. **Database (MySQL)**: Deploy lên **Aiven.io** (cung cấp MySQL Free Plan 5GB lưu trữ, 1GB RAM - rất ổn định, không bị "ngủ").

```
                 +-----------------------+
                 |    Client Browser     |
                 +-----------+-----------+
                             |
         Truy cập Web        | Gọi API (HTTPS)
       (Vercel Domain)       v (Render Domain)
    +------------------------+------------------------+
    |   Frontend (Vercel)    |    Backend (Render)    |
    +------------------------+-----------+------------+
                                         |
                                         | Kết nối Database
                                         v (Aiven Cloud)
                             +------------------------+
                             |    Database (Aiven)    |
                             +------------------------+
```

---

## ⚠️ Các điểm cần chuẩn bị & Sửa lỗi code trước khi Deploy

### 1. Cấu hình lại URL của Backend ở Frontend (Rất quan trọng)
Hiện tại, trong các file của Frontend, URL API đang bị code cứng (hardcode) là `http://localhost:5000/api/...`. Khi deploy lên mạng, frontend sẽ không thể gọi đến localhost của máy người dùng được.

**Cách khắc phục:**
Sử dụng biến môi trường (Environment Variable) của Vite. Tạo hoặc sửa đổi URL trong các file:
*   [authService.js](file:///d:/Thu/CNTT/HK%202025/HK225/DoAnPhanMem_Web/sourcecode/frontend/src/services/authService.js)
*   [activityService.js](file:///d:/Thu/CNTT/HK%202025/HK225/DoAnPhanMem_Web/sourcecode/frontend/src/services/activityService.js)
*   [doanPhiService.js](file:///d:/Thu/CNTT/HK%202025/HK225/DoAnPhanMem_Web/sourcecode/frontend/src/services/doanPhiService.js)
*   [doanVienService.js](file:///d:/Thu/CNTT/HK%202025/HK225/DoAnPhanMem_Web/sourcecode/frontend/src/services/doanVienService.js)
*   [thongBaoService.js](file:///d:/Thu/CNTT/HK%202025/HK225/DoAnPhanMem_Web/sourcecode/frontend/src/services/thongBaoService.js)

Thay vì viết:
```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```
Hãy viết:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
```
Khi chạy máy cá nhân (Local), nó sẽ tự động nhận `http://localhost:5000/api`. Khi deploy lên Vercel, bạn chỉ cần cấu hình biến `VITE_API_URL` trỏ tới link Backend Render của bạn.

### 2. Xử lý lỗi Refresh trang bị 404 trên Vercel
Vì React Router sử dụng cơ chế định tuyến phía Client (Client-side routing). Khi bạn refresh trang ở đường dẫn ví dụ `/admin`, Vercel sẽ tìm file `admin/index.html` hoặc `admin.html` và báo lỗi **404 Not Found**.

**Cách khắc phục:**
Tạo 1 file tên là `vercel.json` nằm tại thư mục gốc của **Frontend** (`sourcecode/frontend/vercel.json`) với nội dung:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 3. Vấn đề mất ảnh Upload khi server Restart (Lưu ý quan trọng khi bảo vệ)
Trong file `server.js` backend, bạn đang dùng thư mục `uploads` cục bộ để chứa các file ảnh minh chứng/avatar:
```javascript
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
```
Vì Render và các Cloud Hosting miễn phí sử dụng hệ thống tệp tạm thời (**Ephemeral Filesystem**), mỗi khi backend không có hoạt động hoặc cập nhật code (server tự khởi động lại), toàn bộ ảnh trong thư mục `uploads` sẽ bị **XÓA**.
*   **Giải pháp cho sinh viên báo cáo:** Trong lúc thuyết trình, hãy upload lại ảnh demo trước buổi báo cáo.
*   **Giải pháp lâu dài:** Nên tích hợp dịch vụ lưu trữ đám mây bên thứ ba như **Cloudinary** (có gói free rất lớn) hoặc **Imgur API** thay vì lưu trực tiếp trên ổ cứng server.

---

## 🏃 Quy trình từng bước thực hiện

### Bước 1: Deploy Database lên Aiven.io
1.  Truy cập [aiven.io](https://aiven.io) và đăng ký tài khoản (dùng Github hoặc Google).
2.  Chọn **Create service**.
3.  Chọn **MySQL** làm cơ sở dữ liệu.
4.  Tại mục **Service plan**, kéo xuống chọn gói **Free** (gói $0/month).
5.  Chọn Region gần Việt Nam nhất (thường là **Singapore - ap-southeast-1** hoặc **Hong Kong**).
6.  Đặt tên service (ví dụ: `quan-ly-doan-vien-db`) và bấm **Create service**.
7.  Đợi khoảng 3-5 phút cho cơ sở dữ liệu khởi tạo xong (trạng thái chuyển sang *Running*).
8.  Lấy thông tin kết nối từ giao diện của Aiven (Connection Details):
    *   `Host`
    *   `Port`
    *   `User` (thường là `avnadmin`)
    *   `Password`
    *   `DatabaseName` (mặc định ban đầu có thể là `defaultdb`, bạn có thể tạo database mới tên `QUAN_LY_DOAN_VIEN` trong Aiven hoặc dùng luôn `defaultdb`).
9.  Sử dụng phần mềm quản lý DB ở máy bạn (DBeaver, MySQL Workbench, Navicat) kết nối tới DB Aiven này bằng các thông số trên và import file SQL [sqldoanphanmemscrip.sql](file:///d:/Thu/CNTT/HK%202025/HK225/DoAnPhanMem_Web/sourcecode/sqldoanphanmemscrip.sql) để tạo bảng dữ liệu.

### Bước 2: Deploy Backend lên Render
1.  Đẩy toàn bộ mã nguồn dự án của bạn lên một **GitHub Repository** cá nhân (để ở chế độ Private hoặc Public đều được).
2.  Truy cập [render.com](https://render.com) và đăng nhập bằng tài khoản GitHub.
3.  Bấm **New** -> Chọn **Web Service**.
4.  Kết nối với tài khoản GitHub của bạn và chọn repository chứa dự án.
5.  Cấu hình thông tin Deploy cho Backend:
    *   **Name**: `quan-ly-doan-vien-backend`
    *   **Region**: Chọn vùng gần VN (Singapore hoặc Oregon).
    *   **Branch**: Chọn branch chính của bạn (ví dụ `main` hoặc `master`).
    *   **Root Directory**: Điền `sourcecode/backend` (vì code backend của bạn nằm trong thư mục con này).
    *   **Runtime**: `Node`
    *   **Build Command**: `npm install`
    *   **Start Command**: `npm start` (hoặc `node src/server.js`)
    *   **Instance Type**: Chọn **Free** ($0/month).
6.  Kéo xuống phần **Advanced** -> Chọn **Add Environment Variable** để thêm các cấu hình biến môi trường tương tự file `.env` local của bạn:
    *   `PORT` = `10000` (Render tự cấu hình port này, bạn có thể để trống hoặc set 10000)
    *   `NODE_ENV` = `production`
    *   `DB_HOST` = `<Điền Host từ Aiven>`
    *   `DB_PORT` = `<Điền Port từ Aiven>`
    *   `DB_USER` = `<Điền User từ Aiven, ví dụ: avnadmin>`
    *   `DB_PASSWORD` = `<Điền Password từ Aiven>`
    *   `DB_DATABASE` = `<Tên Database trên Aiven, ví dụ: defaultdb hoặc QUAN_LY_DOAN_VIEN>`
    *   `JWT_SECRET` = `<Chuỗi bí mật tùy chọn, vd: doan_vien_secret_key_2026>`
    *   `JWT_EXPIRES_IN` = `1d`
    *   `EMAIL_HOST` = `smtp.gmail.com`
    *   `EMAIL_PORT` = `587`
    *   `EMAIL_USER` = `<Email của bạn dùng để gửi OTP>`
    *   `EMAIL_PASSWORD` = `<Mật khẩu ứng dụng - App Password của Gmail>`
7.  Bấm **Create Web Service** và đợi Render tải code về build.
8.  Khi hoàn tất, Render sẽ cấp cho bạn một đường dẫn dạng: `https://quan-ly-doan-vien-backend.onrender.com`. Hãy copy link này.

### Bước 3: Deploy Frontend lên Vercel
1.  Truy cập [vercel.com](https://vercel.com) và đăng nhập bằng GitHub.
2.  Bấm **Add New** -> Chọn **Project**.
3.  Import repository của bạn từ GitHub.
4.  Cấu hình thông tin Deploy cho Frontend:
    *   **Framework Preset**: Chọn **Vite** (hoặc Vercel sẽ tự động phát hiện).
    *   **Root Directory**: Chọn thư mục `sourcecode/frontend` (bấm Edit rồi chọn đúng thư mục).
    *   **Build Command**: `npm run build`
    *   **Output Directory**: `dist` (Vercel tự cấu hình).
5.  Mở mục **Environment Variables** (Biến môi trường) và thêm biến:
    *   **Key**: `VITE_API_URL`
    *   **Value**: `<Đường dẫn backend Render bạn vừa copy ở Bước 2>` (Lưu ý có thêm phần `/api` ở cuối, ví dụ: `https://quan-ly-doan-vien-backend.onrender.com/api`).
6.  Bấm **Deploy**.
7.  Đợi khoảng 1-2 phút, Vercel sẽ hoàn thành build và cấp cho bạn một đường dẫn chính thức (ví dụ: `https://quan-ly-doan-vien-frontend.vercel.app`). Bạn đã có thể truy cập trang web!

---

## ⚡ Các mẹo và lỗi thường gặp cho Sinh viên

1.  **Lỗi Cold Start (Khởi động chậm) trên Render:**
    Vì dùng bản miễn phí (Free Tier) của Render, nếu trong vòng 15 phút không có ai truy cập vào Web, Backend sẽ chuyển sang trạng thái "Ngủ" (Sleep).
    *   *Hiện tượng:* Lần đầu tiên bạn mở web trên Vercel sau một khoảng thời gian dài, web sẽ load rất lâu (khoảng 30s - 1 phút) hoặc báo lỗi kết nối.
    *   *Cách khắc phục khi đi bảo vệ:* Khoảng **5-10 phút trước khi vào phòng hội đồng bảo vệ**, hãy truy cập trước vào website để "đánh thức" backend hoạt động sẵn. Hoặc dùng các công cụ cronjob miễn phí (như UptimeRobot) để ping vào link backend cứ mỗi 10 phút một lần để giữ nó luôn thức.
2.  **Lỗi CORS (Cross-Origin Resource Sharing):**
    Vì backend của bạn đã cài đặt `app.use(cors())` mở hoàn toàn, nên bạn sẽ không gặp lỗi CORS khi kết nối từ Vercel tới Render.
3.  **Lỗi Bảo mật kết nối (HTTPS):**
    Vì Vercel và Render đều bắt buộc sử dụng HTTPS (kết nối bảo mật), các request gọi giữa 2 dịch vụ đều được mã hóa an toàn. Tránh việc gọi API dùng `http://` thay vì `https://`.

Chúc bạn deploy thành công và đạt kết quả cao trong kỳ báo cáo đồ án!
