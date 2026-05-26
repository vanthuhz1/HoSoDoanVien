# Frontend - Hệ thống Quản lý Đoàn viên

## Công nghệ sử dụng

- React 18
- Vite
- React Router DOM
- Axios
- HTML5 QR Code

## Cài đặt

```bash
cd frontend
npm install
```

## Chạy ứng dụng

```bash
# Development mode (chạy ở port 3000)


# Build production
npm run build

# Preview production build
npm run preview
```

## Cấu trúc thư mục

```
frontend/
├── src/
│   ├── services/
│   │   └── api.js
│   ├── App.jsx
│   ├── App.css
│   ├── main.jsx
│   └── index.css
├── index.html
├── vite.config.js
└── package.json
```

## Lưu ý

- Ứng dụng chạy ở port 3000
- Backend API chạy ở port 5000
- Đảm bảo backend đang chạy trước khi sử dụng frontend
