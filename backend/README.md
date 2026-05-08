# Backend - Hệ thống Quản lý Đoàn viên

## Cài đặt

```bash
cd backend
npm install
```

## Cấu hình

1. Copy file `.env.example` thành `.env`
2. Cập nhật thông tin kết nối MySQL trong file `.env`
3. Import database từ file `database.sql`:
   ```bash
   mysql -u root -p < database.sql
   ```

## Chạy ứng dụng

```bash
# Development mode với nodemon
npm run dev

# Production mode
npm start
```

## API Endpoints

- `GET /` - Thông tin API
- `GET /api/health` - Health check
- `GET /api/doan-vien` - Lấy danh sách Đoàn viên
- `GET /api/doan-vien/:id` - Lấy thông tin Đoàn viên theo ID

## Cấu trúc thư mục

```
backend/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   └── doanVienController.js
│   ├── routes/
│   │   ├── index.js
│   │   └── doanVienRoutes.js
│   └── server.js
├── .env
├── .env.example
├── .gitignore
├── database.sql
└── package.json
```
