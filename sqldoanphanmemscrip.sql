-- Tạo Database hỗ trợ Tiếng Việt (utf8mb4)
CREATE DATABASE IF NOT EXISTS QUAN_LY_DOAN_VIEN 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE QUAN_LY_DOAN_VIEN;

-- 1. BẢNG KHOA
CREATE TABLE Khoa (
    maKhoa VARCHAR(15) PRIMARY KEY,
    tenKhoa VARCHAR(100) NOT NULL
);

-- 2. BẢNG CHI ĐOÀN
CREATE TABLE ChiDoan (
    maChiDoan VARCHAR(15) PRIMARY KEY,
    tenChiDoan VARCHAR(100) NOT NULL,
    nienKhoa VARCHAR(20),
    siSo INT DEFAULT 0,
    maKhoa VARCHAR(15),
    FOREIGN KEY (maKhoa) REFERENCES Khoa(maKhoa) ON DELETE SET NULL
);

-- 3. BẢNG ĐOÀN VIÊN
CREATE TABLE DoanVien (
    maDV VARCHAR(15) PRIMARY KEY,
    hoTen VARCHAR(100) NOT NULL,
    ngaySinh DATE,
    gioiTinh VARCHAR(10),
    SDT VARCHAR(15),
    Email VARCHAR(100),
    chucVu VARCHAR(50),
    maChiDoan VARCHAR(15),
    ngayVaoDoan DATE,
    noiVaoDoan VARCHAR(100),
    ngayChuyenDen DATE,
    trangThaiSH VARCHAR(50),
    FOREIGN KEY (maChiDoan) REFERENCES ChiDoan(maChiDoan) ON DELETE SET NULL
);

-- 4. BẢNG SỔ ĐOÀN
CREATE TABLE SoDoan (
    maSoDoan VARCHAR(15) PRIMARY KEY,
    maDV VARCHAR(15) NOT NULL,
    ngayCap DATE,
    noiCap VARCHAR(100),
    trangThai VARCHAR(50),
    ngayRutSo DATE NULL,
    FOREIGN KEY (maDV) REFERENCES DoanVien(maDV) ON DELETE CASCADE
);

-- 5. BẢNG TIỂU SỬ
CREATE TABLE TieuSu (
    _id_tieusu INT AUTO_INCREMENT PRIMARY KEY,
    maDV VARCHAR(15) NOT NULL,
    tuThoiGian DATE,
    denThoiGian DATE,
    donViCongTac TEXT,
    chucVu VARCHAR(200),
    FOREIGN KEY (maDV) REFERENCES DoanVien(maDV) ON DELETE CASCADE
);

-- 6. BẢNG VAI TRÒ
CREATE TABLE VaiTro (
    idVaiTro INT AUTO_INCREMENT PRIMARY KEY,
    tenVaiTro VARCHAR(50) NOT NULL,
    moTa VARCHAR(200)
);

-- 7. BẢNG TÀI KHOẢN
CREATE TABLE TaiKhoan (
    idUser INT AUTO_INCREMENT PRIMARY KEY,
    maDV VARCHAR(15) NULL,
    tenNguoiDung VARCHAR(100) NOT NULL UNIQUE,
    matKhau VARCHAR(255) NOT NULL,
    trangThai TINYINT(1) DEFAULT 1,
    ngayTao DATETIME DEFAULT CURRENT_TIMESTAMP,
    IdVaiTro INT NOT NULL,
    FOREIGN KEY (maDV) REFERENCES DoanVien(maDV) ON DELETE CASCADE,
    FOREIGN KEY (IdVaiTro) REFERENCES VaiTro(idVaiTro)
);

-- 8. BẢNG NHẬT KÝ HỆ THỐNG
CREATE TABLE NhatKiHeThong (
    _id_logNKHD INT AUTO_INCREMENT PRIMARY KEY,
    nguoiThucHien INT,
    hanhDong VARCHAR(100),
    doiTuong VARCHAR(100),
    noiDung TEXT,
    thoiGian DATETIME DEFAULT CURRENT_TIMESTAMP,
    chucNang VARCHAR(100),
    FOREIGN KEY (nguoiThucHien) REFERENCES TaiKhoan(idUser) ON DELETE SET NULL
);

-- 9. BẢNG HOẠT ĐỘNG ĐOÀN
CREATE TABLE HoatDongDoan (
    idHD VARCHAR(20) PRIMARY KEY,
    tenHD VARCHAR(200) NOT NULL,
    moTa TEXT,
    ngayToChuc DATETIME,
    diaDiem VARCHAR(200),
    soLuongMAX INT,
    soLuongDaDK INT DEFAULT 0,
    diemHoatDong INT DEFAULT 0,
    trangThaiHD VARCHAR(50),
    donViToChuc VARCHAR(50),
    maKhoa VARCHAR(15) NULL,
    Linkdinhkem TEXT,
    MaQR_HienTai VARCHAR(255) NULL,
    FOREIGN KEY (maKhoa) REFERENCES Khoa(maKhoa) ON DELETE SET NULL
);

-- 10. BẢNG DANH SÁCH ĐĂNG KÝ
CREATE TABLE DanhSachDangKy (
    maDV VARCHAR(15) NOT NULL,
    idHD VARCHAR(20) NOT NULL,
    ngayDangKy DATETIME DEFAULT CURRENT_TIMESTAMP,
    ThoiGianCheckIn DATETIME NULL,
    trangThaiThamGia VARCHAR(50) DEFAULT 'Đăng ký',
    trangThaiCongDiem VARCHAR(50) DEFAULT 'Chưa cộng',
    PRIMARY KEY (maDV, idHD),
    FOREIGN KEY (maDV) REFERENCES DoanVien(maDV) ON DELETE CASCADE,
    FOREIGN KEY (idHD) REFERENCES HoatDongDoan(idHD) ON DELETE CASCADE
);

-- 11. BẢNG KHIẾU NẠI
CREATE TABLE KhieuNai (
    MaKhieuNai INT AUTO_INCREMENT PRIMARY KEY,
    maDV VARCHAR(15) NOT NULL,
    idHD VARCHAR(20) NOT NULL,
    NguoiXuLy INT NULL,
    LinkMinhChung VARCHAR(255) NOT NULL,
    TrangThai VARCHAR(50) DEFAULT 'Chờ xử lý',
    NgayTao DATETIME DEFAULT CURRENT_TIMESTAMP,
    GhiChu VARCHAR(500),
    FOREIGN KEY (maDV) REFERENCES DoanVien(maDV),
    FOREIGN KEY (idHD) REFERENCES HoatDongDoan(idHD),
    FOREIGN KEY (NguoiXuLy) REFERENCES TaiKhoan(idUser)
);

-- 12. BẢNG DANH MỤC ĐOÀN PHÍ
CREATE TABLE DanhMucDoanPhi (
    _idMucDoanPhi INT AUTO_INCREMENT PRIMARY KEY,
    namHoc VARCHAR(20) NOT NULL,
    soTien INT NOT NULL,
    trangThai VARCHAR(100)
);

-- 13. BẢNG ĐOÀN PHÍ
CREATE TABLE DoanPhi (
    _idDoanPhi INT AUTO_INCREMENT PRIMARY KEY,
    _idMucDoanPhi INT NOT NULL,
    maDV VARCHAR(15) NOT NULL,
    trangThai VARCHAR(100) DEFAULT 'Chưa nộp',
    NgayHetHan DATE,
    phuongThucThanhToan VARCHAR(50) NULL,
    maGiaoDich VARCHAR(100) NULL,
    ThoiGianThanhToan DATETIME NULL,
    FOREIGN KEY (_idMucDoanPhi) REFERENCES DanhMucDoanPhi(_idMucDoanPhi) ON DELETE CASCADE,
    FOREIGN KEY (maDV) REFERENCES DoanVien(maDV) ON DELETE CASCADE
);
USE QUAN_LY_DOAN_VIEN;

-- 1. Bảng Khoa
INSERT INTO Khoa (maKhoa, tenKhoa) VALUES
('CNTT', 'Công nghệ Thông tin'),
('KT', 'Kinh tế'),
('NN', 'Ngoại ngữ'),
('CK', 'Cơ khí'),
('DT', 'Điện - Điện tử');

-- 2. Bảng Chi Đoàn
INSERT INTO ChiDoan (maChiDoan, tenChiDoan, nienKhoa, siSo, maKhoa) VALUES
('22T1', 'Chi đoàn 22T1', '2022-2026', 40, 'CNTT'),
('22T2', 'Chi đoàn 22T2', '2022-2026', 42, 'CNTT'),
('21K1', 'Chi đoàn 21K1', '2021-2025', 35, 'KT'),
('23N1', 'Chi đoàn 23N1', '2023-2027', 30, 'NN'),
('22C1', 'Chi đoàn 22C1', '2022-2026', 45, 'CK');

-- 3. Bảng Đoàn Viên (Sử dụng mã 14 số như sếp yêu cầu)
INSERT INTO DoanVien (maDV, hoTen, ngaySinh, gioiTinh, SDT, Email, chucVu, maChiDoan, trangThaiSH) VALUES
('23115053122241', 'Nguyễn Văn An', '2004-05-15', 'Nam', '0901234567', 'an.nv@ute.vn', 'Bí thư', '22T1', 'Đang sinh hoạt'),
('23115053122242', 'Trần Thị Bình', '2004-08-20', 'Nữ', '0912345678', 'binh.tt@ute.vn', 'Đoàn viên', '22T1', 'Đang sinh hoạt'),
('23115053122243', 'Lê Hoàng Cường', '2003-12-10', 'Nam', '0923456789', 'cuong.lh@ute.vn', 'Đoàn viên', '21K1', 'Đang sinh hoạt'),
('23115053122244', 'Phạm Mai Dung', '2005-02-28', 'Nữ', '0934567890', 'dung.pm@ute.vn', 'Bí thư', '23N1', 'Đang sinh hoạt'),
('23115053122245', 'Vũ Đức Duy', '2004-11-05', 'Nam', '0945678901', 'duy.vd@ute.vn', 'Đoàn viên', '22C1', 'Đã rút hồ sơ');

-- 4. Bảng Vai Trò
INSERT INTO VaiTro (tenVaiTro, moTa) VALUES
('Admin', 'Quản trị viên hệ thống'),
('Bí thư', 'Bí thư chi đoàn lớp'),
('Đoàn viên', 'Đoàn viên bình thường'),
('Phó Bí thư', 'Phó bí thư chi đoàn'),
('Cán bộ Khoa', 'Quản lý cấp Khoa');

-- 5. Bảng Tài Khoản (Mật khẩu mặc định: 123456)
INSERT INTO TaiKhoan (maDV, tenNguoiDung, matKhau, IdVaiTro) VALUES
(NULL, 'admin', '$2a$10$7X9O7x7X9O7x7X9O7x7X9O7x7X9O7x7X9O7x7X9O7x7X9O7x7X9O7', 1),
('23115053122241', '23115053122241', '$2a$10$7X9O7x7X9O7x7X9O7x7X9O7x7X9O7x7X9O7x7X9O7x7X9O7x7X9O7', 2),
('23115053122242', '23115053122242', '$2a$10$7X9O7x7X9O7x7X9O7x7X9O7x7X9O7x7X9O7x7X9O7x7X9O7x7X9O7', 3),
('23115053122244', '23115053122244', '$2a$10$7X9O7x7X9O7x7X9O7x7X9O7x7X9O7x7X9O7x7X9O7x7X9O7x7X9O7', 2),
('23115053122245', '23115053122245', '$2a$10$7X9O7x7X9O7x7X9O7x7X9O7x7X9O7x7X9O7x7X9O7x7X9O7x7X9O7', 3);

-- 6. Bảng Danh Mục Đoàn Phí
INSERT INTO DanhMucDoanPhi (namHoc, soTien, trangThai) VALUES
('2022-2023', 120000, 'Đã đóng lại'),
('2023-2024', 120000, 'Đã đóng lại'),
('2024-2025', 120000, 'Đang mở thu'),
('2025-2026', 150000, 'Chưa mở'),
('Kỳ Hè 2024', 50000, 'Đang mở thu');

-- 7. Bảng Đoàn Phí
INSERT INTO DoanPhi (_idMucDoanPhi, maDV, trangThai, NgayHetHan) VALUES
(3, '23115053122241', 'Đã nộp', '2024-12-31'),
(3, '23115053122242', 'Chưa nộp', '2024-12-31'),
(3, '23115053122243', 'Đã nộp', '2024-12-31'),
(3, '23115053122244', 'Chưa nộp', '2024-12-31'),
(3, '23115053122245', 'Đã nộp', '2024-12-31');

-- 8. Bảng Hoạt Động Đoàn
INSERT INTO HoatDongDoan (idHD, tenHD, ngayToChuc, soLuongMAX, diemHoatDong, trangThaiHD, maKhoa) VALUES
('HD01', 'Chiến dịch Mùa hè xanh 2024', '2024-07-15 08:00:00', 100, 15, 'Đã kết thúc', 'CNTT'),
('HD02', 'Hiến máu tình nguyện đợt 1', '2024-10-20 07:30:00', 200, 10, 'Sắp diễn ra', NULL),
('HD03', 'Cuộc thi Olympic Tin học', '2024-11-05 08:00:00', 50, 20, 'Sắp diễn ra', 'CNTT'),
('HD04', 'Dọn rác bãi biển Thanh Khê', '2024-09-02 06:00:00', 150, 10, 'Đã kết thúc', 'CK'),
('HD05', 'Hội diễn văn nghệ chào Tân sinh viên', '2024-11-20 19:00:00', 300, 5, 'Sắp diễn ra', 'NN');

-- 9. Bảng Danh Sách Đăng Ký
INSERT INTO DanhSachDangKy (maDV, idHD, trangThaiThamGia, trangThaiCongDiem) VALUES
('23115053122241', 'HD01', 'Đã tham gia', 'Đã cộng'),
('23115053122242', 'HD01', 'Vắng mặt', 'Chưa cộng'),
('23115053122241', 'HD02', 'Đăng ký', 'Chưa cộng'),
('23115053122243', 'HD04', 'Đã tham gia', 'Đã cộng'),
('23115053122244', 'HD05', 'Đăng ký', 'Chưa cộng');

-- 10. Bảng Sổ Đoàn
INSERT INTO SoDoan (maSoDoan, maDV, ngayCap, noiCap, trangThai) VALUES
('SD001', '23115053122241', '2019-03-26', 'THPT Lê Quý Đôn', 'Đang giữ'),
('SD002', '23115053122242', '2019-03-26', 'THPT Phan Châu Trinh', 'Đang giữ'),
('SD003', '23115053122243', '2018-03-26', 'THPT Hòa Vang', 'Thất lạc'),
('SD004', '23115053122244', '2020-03-26', 'THPT Hoàng Hoa Thám', 'Đang giữ'),
('SD005', '23115053122245', '2019-03-26', 'THPT Thái Phiên', 'Đang giữ');

-- 11. Bảng Tiểu Sử
INSERT INTO TieuSu (maDV, tuThoiGian, denThoiGian, donViCongTac, chucVu) VALUES
('23115053122241', '2019-09-05', '2022-05-25', 'THPT Lê Quý Đôn', 'Bí thư chi đoàn'),
('23115053122242', '2019-09-05', '2022-05-25', 'THPT Phan Châu Trinh', 'Đoàn viên'),
('23115053122243', '2018-09-05', '2021-05-25', 'THPT Hòa Vang', 'Ủy viên'),
('23115053122244', '2020-09-05', '2023-05-25', 'THPT Hoàng Hoa Thám', 'Bí thư chi đoàn'),
('23115053122241', '2022-09-05', '2026-05-25', 'Đại học SPKT', 'Bí thư chi đoàn 22T1');

-- 12. Bảng Khiếu Nại
INSERT INTO KhieuNai (maDV, idHD, LinkMinhChung, TrangThai, GhiChu) VALUES
('23115053122242', 'HD01', 'https://drive.google.com/anh1.jpg', 'Đã xử lý', 'Cộng bù điểm do lỗi quét QR'),
('23115053122243', 'HD02', 'https://drive.google.com/anh2.jpg', 'Chờ xử lý', 'Đã hiến máu nhưng chưa cập nhật'),
('23115053122244', 'HD04', 'https://drive.google.com/anh3.jpg', 'Chờ xử lý', 'Chưa cộng điểm dọn rác'),
('23115053122241', 'HD05', 'https://drive.google.com/anh4.jpg', 'Từ chối', 'Minh chứng không hợp lệ'),
('23115053122245', 'HD03', 'https://drive.google.com/anh5.jpg', 'Đã xử lý', 'Đã điều chỉnh lại điểm');

