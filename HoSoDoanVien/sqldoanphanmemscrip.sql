-- ============================================================
--  QUẢN LÝ HỒ SƠ ĐOÀN VIÊN – ĐOÀN TRƯỜNG ĐHSPKT
--  Phiên bản cập nhật: email chuyển sang TaiKhoan, đăng nhập bằng email
-- ============================================================

-- ============================================================
-- BƯỚC 1: XÓA DATABASE CŨ VÀ TẠO LẠI
-- ============================================================
DROP DATABASE IF EXISTS QUAN_LY_DOAN_VIEN;

CREATE DATABASE QUAN_LY_DOAN_VIEN
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE QUAN_LY_DOAN_VIEN;

-- ============================================================
-- BƯỚC 2: TẠO CÁC BẢNG
-- ============================================================

-- 1. BẢNG KHOA
CREATE TABLE Khoa (
    maKhoa  VARCHAR(15)  PRIMARY KEY,
    tenKhoa VARCHAR(100) NOT NULL
);

-- 2. BẢNG CHI ĐOÀN
CREATE TABLE ChiDoan (
    maChiDoan  VARCHAR(15)  PRIMARY KEY,
    tenChiDoan VARCHAR(100) NOT NULL,
    nienKhoa   VARCHAR(20),
    siSo       INT          DEFAULT 0,
    maKhoa     VARCHAR(15),
    FOREIGN KEY (maKhoa) REFERENCES Khoa(maKhoa) ON DELETE SET NULL
);

-- 3. BẢNG ĐOÀN VIÊN
CREATE TABLE DoanVien (
    maDV             VARCHAR(15)  PRIMARY KEY,
    hoTen            VARCHAR(100) NOT NULL,
    ngaySinh         DATE,
    gioiTinh         VARCHAR(10),
    danToc           VARCHAR(50),           -- thêm mới
    tonGiao          VARCHAR(50),           -- thêm mới
    cccd             VARCHAR(20)  UNIQUE,   -- thêm mới
    queQuan          VARCHAR(200),          -- thêm mới
    diaChiThuongTru  VARCHAR(200),          -- thêm mới
    SDT              VARCHAR(15),
    anhDaiDien       VARCHAR(255),          -- thêm mới (URL ảnh)
    chucVu           VARCHAR(50),
    maChiDoan        VARCHAR(15),
    ngayVaoDoan      DATE,
    noiVaoDoan       VARCHAR(100),
    ngayChuyenDen    DATE,
    trangThaiSH      ENUM('Đang sinh hoạt', 'Đã tốt nghiệp', 'Đã rút hồ sơ'),
    FOREIGN KEY (maChiDoan) REFERENCES ChiDoan(maChiDoan) ON DELETE SET NULL
);

-- 4. BẢNG SỔ ĐOÀN
CREATE TABLE SoDoan (
    maSoDoan  VARCHAR(15)  PRIMARY KEY,
    maDV      VARCHAR(15)  NOT NULL,
    ngayCap   DATE,
    noiCap    VARCHAR(100),
    trangThai VARCHAR(50),                  -- 'Đang giữ' | 'Đã nộp' | 'Thất lạc' | 'Đã rút'
    ngayRutSo DATE         NULL,
    lyDoRut   VARCHAR(200) NULL,            -- thêm mới: lý do khi rút sổ
    FOREIGN KEY (maDV) REFERENCES DoanVien(maDV) ON DELETE CASCADE
);
-- 5. BẢNG TIỂU SỬ
CREATE TABLE TieuSu (
    _id_tieusu   INT  AUTO_INCREMENT PRIMARY KEY,
    maDV         VARCHAR(15)  NOT NULL,
    tuThoiGian   DATE,
    denThoiGian  DATE,
    donViCongTac TEXT,
    chucVu       VARCHAR(200),
    FOREIGN KEY (maDV) REFERENCES DoanVien(maDV) ON DELETE CASCADE
);

-- 6. BẢNG VAI TRÒ
CREATE TABLE VaiTro (
    idVaiTro  INT AUTO_INCREMENT PRIMARY KEY,
    tenVaiTro VARCHAR(50)  NOT NULL,
    moTa      VARCHAR(200)
);

-- 7. BẢNG TÀI KHOẢN
-- Đăng nhập bằng: email + matKhau
CREATE TABLE TaiKhoan (
    idUser        INT          AUTO_INCREMENT PRIMARY KEY,
    maDV          VARCHAR(15)  NULL,
    email         VARCHAR(100) NOT NULL UNIQUE,  -- dùng để đăng nhập
    tenNguoiDung  VARCHAR(100) NOT NULL,         -- tên hiển thị
    matKhau       VARCHAR(255) NOT NULL,
    trangThai     TINYINT(1)   DEFAULT 1,
    ngayTao       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    IdVaiTro      INT          NOT NULL,
    FOREIGN KEY (maDV)     REFERENCES DoanVien(maDV) ON DELETE CASCADE,
    FOREIGN KEY (IdVaiTro) REFERENCES VaiTro(idVaiTro)
);

-- 8. BẢNG NHẬT KÝ HỆ THỐNG
CREATE TABLE NhatKiHeThong (
    _id_logNKHD  INT  AUTO_INCREMENT PRIMARY KEY,
    nguoiThucHien INT,
    hanhDong      VARCHAR(100),
    doiTuong      VARCHAR(100),
    noiDung       TEXT,
    thoiGian      DATETIME DEFAULT CURRENT_TIMESTAMP,
    chucNang      VARCHAR(100),
    FOREIGN KEY (nguoiThucHien) REFERENCES TaiKhoan(idUser) ON DELETE SET NULL
);

-- 9. BẢNG THÔNG BÁO 
CREATE TABLE ThongBao (
    idThongBao INT          AUTO_INCREMENT PRIMARY KEY,
    tieuDe     VARCHAR(255) NOT NULL,
    noiDung    TEXT,
    loai       VARCHAR(50)  NOT NULL,   -- 'Tin tức' | 'Thông báo'
    phamVi     VARCHAR(50)  NOT NULL,   -- 'Công khai' | 'Nội bộ'
    anhBia     VARCHAR(255) NULL,
    nguoiTao   INT          NULL,
    ngayTao    DATETIME     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (nguoiTao) REFERENCES TaiKhoan(idUser) ON DELETE SET NULL
);

-- 10. BẢNG HOẠT ĐỘNG ĐOÀN
CREATE TABLE HoatDongDoan (
    idHD         VARCHAR(20)  PRIMARY KEY DEFAULT '0',
    tenHD        VARCHAR(200) NOT NULL,
    moTa         TEXT,
    ngayToChuc   DATETIME,
    diaDiem      VARCHAR(200),
    soLuongMAX   INT,
    soLuongDaDK  INT          DEFAULT 0,
    diemHoatDong INT          DEFAULT 0,
    trangThaiHD  ENUM('Chờ duyệt', 'Sắp diễn ra', 'Đang mở', 'Đang diễn ra', 'Đã kết thúc', 'Từ chối', 'Bị từ chối'),
    donViToChuc  VARCHAR(50),
    maKhoa       VARCHAR(15)  NULL,
    Linkdinhkem  TEXT,
    MaQR_HienTai VARCHAR(255) NULL,
    lyDoTuChoi   TEXT         NULL,
    FOREIGN KEY (maKhoa) REFERENCES Khoa(maKhoa) ON DELETE SET NULL
);

-- Trigger tự động tăng mã idHD theo cấu trúc HD001, HD002...
DELIMITER //
CREATE TRIGGER trg_auto_idHD
BEFORE INSERT ON HoatDongDoan
FOR EACH ROW
BEGIN
    DECLARE next_id INT;
    IF NEW.idHD = '0' OR NEW.idHD IS NULL THEN
        SELECT IFNULL(MAX(CAST(SUBSTRING(idHD, 3) AS UNSIGNED)), 0) + 1 INTO next_id FROM HoatDongDoan WHERE idHD LIKE 'HD%';
        SET NEW.idHD = CONCAT('HD', LPAD(next_id, 3, '0'));
    END IF;
END; //
DELIMITER ;

-- 11. BẢNG DANH SÁCH ĐĂNG KÝ
CREATE TABLE DanhSachDangKy (
    maDV              VARCHAR(15) NOT NULL,
    idHD              VARCHAR(20) NOT NULL,
    ngayDangKy        DATETIME    DEFAULT CURRENT_TIMESTAMP,
    ThoiGianCheckIn   DATETIME    NULL,
    trangThaiThamGia  ENUM('Đã Đăng Ký', 'Đã tham gia', 'Vắng mặt') DEFAULT 'Đã Đăng Ký',
    trangThaiCongDiem ENUM('Chưa cộng', 'Đã tích lũy') DEFAULT 'Chưa cộng',
    PRIMARY KEY (maDV, idHD),
    FOREIGN KEY (maDV) REFERENCES DoanVien(maDV) ON DELETE CASCADE,
    FOREIGN KEY (idHD) REFERENCES HoatDongDoan(idHD) ON DELETE CASCADE
);

-- 12. BẢNG KHIẾU NẠI (giữ nguyên tên theo yêu cầu)
CREATE TABLE KhieuNai (
    MaKhieuNai   INT          AUTO_INCREMENT PRIMARY KEY,
    maDV         VARCHAR(15)  NOT NULL,
    idHD         VARCHAR(20)  NOT NULL,
    NguoiXuLy   INT          NULL,
    LinkMinhChung VARCHAR(255) NOT NULL,
    TrangThai    VARCHAR(50)  DEFAULT 'Chờ xử lý',   -- 'Chờ xử lý' | 'Đã xử lý' | 'Từ chối'
    loaiKhieuNai ENUM('Vắng mặt', 'Sai vai trò') DEFAULT 'Vắng mặt',
    diemCongThem INT          DEFAULT 0,
    NgayTao      DATETIME     DEFAULT CURRENT_TIMESTAMP,
    GhiChu       VARCHAR(500),
    FOREIGN KEY (maDV)       REFERENCES DoanVien(maDV),
    FOREIGN KEY (idHD)       REFERENCES HoatDongDoan(idHD),
    FOREIGN KEY (NguoiXuLy) REFERENCES TaiKhoan(idUser)
);

-- 13. BẢNG DANH MỤC ĐOÀN PHÍ
CREATE TABLE DanhMucDoanPhi (
    _idMucDoanPhi INT          AUTO_INCREMENT PRIMARY KEY,
    namHoc        VARCHAR(20)  NOT NULL,
    soTien        INT          NOT NULL,
    trangThai     VARCHAR(100)            -- 'Đang mở thu' | 'Đã đóng lại' | 'Chưa mở'
);

-- 14. BẢNG ĐOÀN PHÍ
CREATE TABLE DoanPhi (
    _idDoanPhi          INT          AUTO_INCREMENT PRIMARY KEY,
    _idMucDoanPhi       INT          NOT NULL,
    maDV                VARCHAR(15)  NOT NULL,
    trangThai           VARCHAR(100) DEFAULT 'Chưa nộp',  -- 'Chưa nộp' | 'Đã nộp'
    NgayHetHan          DATE,
    phuongThucThanhToan VARCHAR(50)  NULL,
    maGiaoDich          VARCHAR(100) NULL,
    ThoiGianThanhToan   DATETIME     NULL,
    FOREIGN KEY (_idMucDoanPhi) REFERENCES DanhMucDoanPhi(_idMucDoanPhi) ON DELETE CASCADE,
    FOREIGN KEY (maDV)          REFERENCES DoanVien(maDV) ON DELETE CASCADE
);





-- ============================================================
-- BƯỚC 3: CHÈN DỮ LIỆU MẪU (TỰ ĐỘNG SINH)
-- ============================================================

-- 1. KHOA (5)
INSERT INTO Khoa (maKhoa, tenKhoa) VALUES
('CNTT', 'Công nghệ Thông tin'),
('KT', 'Kinh tế'),
('NN', 'Ngoại ngữ'),
('CK', 'Cơ khí'),
('DT', 'Điện - Điện tử');

-- 2. CHI ĐOÀN (10)
INSERT INTO ChiDoan (maChiDoan, tenChiDoan, nienKhoa, siSo, maKhoa) VALUES
('22T1', 'Chi đoàn 22T1', '2022-2026', 50, 'CNTT'),
('22T2', 'Chi đoàn 22T2', '2022-2026', 50, 'CNTT'),
('21K1', 'Chi đoàn 21K1', '2021-2025', 50, 'KT'),
('21K2', 'Chi đoàn 21K2', '2021-2025', 50, 'KT'),
('23N1', 'Chi đoàn 23N1', '2023-2027', 50, 'NN'),
('23N2', 'Chi đoàn 23N2', '2023-2027', 50, 'NN'),
('22C1', 'Chi đoàn 22C1', '2022-2026', 50, 'CK'),
('22C2', 'Chi đoàn 22C2', '2022-2026', 50, 'CK'),
('20D1', 'Chi đoàn 20D1', '2020-2024', 50, 'DT'),
('20D2', 'Chi đoàn 20D2', '2020-2024', 50, 'DT');

-- 3. ĐOÀN VIÊN (50)
INSERT INTO DoanVien (maDV, hoTen, ngaySinh, gioiTinh, danToc, tonGiao, cccd, queQuan, diaChiThuongTru, SDT, chucVu, maChiDoan, ngayVaoDoan, noiVaoDoan, trangThaiSH) VALUES
('2011500001', 'Bùi Minh Hải', '1996-08-20', 'Nữ', 'Kinh', 'Không', '048422307270', 'Bình Định', '141 Trần Phú, Sơn Trà, Đà Nẵng', '0914976419', 'Bí thư Liên chi đoàn', '22T1', '2013-09-25', 'THPT Lê Quý Đôn', 'Đang sinh hoạt'),
('2011500002', 'Bùi Thu Hùng', '1999-09-04', 'Nam', 'Kinh', 'Không', '048881603827', 'Quảng Ngãi', '18 Điện Biên Phủ, Cẩm Lệ, Đà Nẵng', '0989757417', 'Bí thư Liên chi đoàn', '21K1', '2011-11-01', 'THPT Cẩm Lệ', 'Đang sinh hoạt'),
('2011500003', 'Hoàng Thị An', '1998-06-27', 'Nữ', 'Kinh', 'Không', '048548687819', 'Kon Tum', '126 Hùng Vương, Cẩm Lệ, Đà Nẵng', '0988170667', 'Bí thư Liên chi đoàn', '23N1', '2011-11-09', 'THPT Thái Phiên', 'Đang sinh hoạt'),
('2011500004', 'Vũ Ngọc Dung', '1997-11-12', 'Nữ', 'Kinh', 'Không', '048283700447', 'Đà Nẵng', '176 Hùng Vương, Hải Châu, Đà Nẵng', '0931177123', 'Bí thư Liên chi đoàn', '22C1', '2012-01-05', 'THPT Ông Ích Khiêm', 'Đang sinh hoạt'),
('2011500005', 'Phạm Ngọc Minh', '1998-10-23', 'Nữ', 'Kinh', 'Không', '048795898324', 'Kon Tum', '28 Trần Phú, Liên Chiểu, Đà Nẵng', '0984255770', 'Bí thư Liên chi đoàn', '20D1', '2010-03-29', 'THPT Nguyễn Trãi', 'Đang sinh hoạt'),
('2211500006', 'Đỗ Thanh Quân', '2003-09-06', 'Nữ', 'Kinh', 'Không', '048664761942', 'Quảng Nam', '48 Phan Đình Phùng, Hải Châu, Đà Nẵng', '0933897080', 'Bí thư', '22T2', '2017-12-02', 'THPT Cẩm Lệ', 'Đang sinh hoạt'),
('2211500007', 'Bùi Minh Tùng', '2002-05-17', 'Nam', 'Kinh', 'Không', '048060338354', 'Quảng Ngãi', '192 Hoàng Diệu, Cẩm Lệ, Đà Nẵng', '0934056496', 'Bí thư', '21K2', '2018-04-25', 'THPT Ông Ích Khiêm', 'Đang sinh hoạt'),
('2211500008', 'Lê Hữu Khoa', '2003-06-02', 'Nam', 'Kinh', 'Không', '048806879617', 'Huế', '60 Hoàng Diệu, Sơn Trà, Đà Nẵng', '0954491026', 'Bí thư', '23N2', '2017-11-14', 'THPT Hòa Vang', 'Đang sinh hoạt'),
('2211500009', 'Bùi Bảo Bình', '2002-04-27', 'Nam', 'Kinh', 'Không', '048371719574', 'Kon Tum', '165 Điện Biên Phủ, Ngũ Hành Sơn, Đà Nẵng', '0953076123', 'Bí thư', '22C2', '2017-11-15', 'THPT Lê Quý Đôn', 'Đang sinh hoạt'),
('2211500010', 'Trần Minh Hà', '2003-03-09', 'Nữ', 'Kinh', 'Không', '048257670139', 'Bình Định', '117 Nguyễn Tri Phương, Thanh Khê, Đà Nẵng', '0926325925', 'Bí thư', '20D2', '2017-02-18', 'THPT Phan Châu Trinh', 'Đang sinh hoạt'),
('2311500011', 'Hoàng Văn Hà', '2004-08-11', 'Nam', 'Kinh', 'Không', '048999443478', 'Kon Tum', '132 Lý Thường Kiệt, Hải Châu, Đà Nẵng', '0980411463', 'Đoàn viên', '20D2', '2019-04-11', 'THPT Ngô Quyền', 'Đang sinh hoạt'),
('2311500012', 'Phạm Hoàng Cường', '2004-08-24', 'Nữ', 'Kinh', 'Không', '048822359606', 'Gia Lai', '85 Điện Biên Phủ, Cẩm Lệ, Đà Nẵng', '0955537217', 'Đoàn viên', '23N1', '2018-05-13', 'THPT Hoàng Hoa Thám', 'Đang sinh hoạt'),
('2311500013', 'Hồ Thị Dung', '2004-10-12', 'Nữ', 'Kinh', 'Không', '048799923200', 'Quảng Nam', '31 Hoàng Diệu, Hải Châu, Đà Nẵng', '0919633322', 'Đoàn viên', '20D1', '2018-04-02', 'THPT Cẩm Lệ', 'Đang sinh hoạt'),
('2311500014', 'Đặng Đức Dung', '2004-01-01', 'Nữ', 'Kinh', 'Không', '048004626662', 'Huế', '102 Điện Biên Phủ, Cẩm Lệ, Đà Nẵng', '0970327324', 'Đoàn viên', '23N1', '2020-05-06', 'THPT Trần Phú', 'Đang sinh hoạt'),
('2311500015', 'Vũ Hoàng Phong', '2004-09-19', 'Nữ', 'Kinh', 'Không', '048002520077', 'Kon Tum', '197 Trần Phú, Cẩm Lệ, Đà Nẵng', '0961221768', 'Đoàn viên', '21K2', '2020-12-20', 'THPT Ông Ích Khiêm', 'Đang sinh hoạt'),
('2311500016', 'Trần Thu Trang', '2004-09-29', 'Nữ', 'Kinh', 'Không', '048335115516', 'Phú Yên', '183 Hùng Vương, Hải Châu, Đà Nẵng', '0923418497', 'Đoàn viên', '22C1', '2019-03-09', 'THPT Trần Phú', 'Đang sinh hoạt'),
('2311500017', 'Bùi Xuân Hà', '2004-08-28', 'Nam', 'Kinh', 'Không', '048101523689', 'Huế', '106 Hoàng Diệu, Hải Châu, Đà Nẵng', '0955103835', 'Đoàn viên', '21K1', '2018-03-14', 'THPT Ông Ích Khiêm', 'Đang sinh hoạt'),
('2311500018', 'Phạm Thị Dung', '2003-09-12', 'Nam', 'Kinh', 'Không', '048725881145', 'Quảng Nam', '95 Trần Phú, Liên Chiểu, Đà Nẵng', '0911075002', 'Đoàn viên', '20D1', '2019-10-30', 'THPT Phan Châu Trinh', 'Đang sinh hoạt'),
('2311500019', 'Lê Bảo Hà', '2004-09-21', 'Nữ', 'Kinh', 'Không', '048883789906', 'Huế', '196 Hoàng Diệu, Cẩm Lệ, Đà Nẵng', '0900697691', 'Đoàn viên', '21K2', '2018-09-05', 'THPT Ngô Quyền', 'Đang sinh hoạt'),
('2311500020', 'Ngô Văn Duy', '2003-08-04', 'Nam', 'Kinh', 'Không', '048925508537', 'Huế', '130 Hoàng Diệu, Thanh Khê, Đà Nẵng', '0969607241', 'Đoàn viên', '21K1', '2020-05-13', 'THPT Thái Phiên', 'Đang sinh hoạt'),
('2311500021', 'Phạm Xuân Tuấn', '2004-04-20', 'Nữ', 'Kinh', 'Không', '048863367343', 'Phú Yên', '144 Điện Biên Phủ, Cẩm Lệ, Đà Nẵng', '0945097773', 'Đoàn viên', '20D1', '2019-10-17', 'THPT Phan Châu Trinh', 'Đang sinh hoạt'),
('2311500022', 'Nguyễn Bảo Bình', '2004-02-27', 'Nam', 'Kinh', 'Không', '048476444856', 'Khánh Hòa', '15 Hải Phòng, Sơn Trà, Đà Nẵng', '0986178999', 'Đoàn viên', '22C1', '2019-09-15', 'THPT Ngô Quyền', 'Đang sinh hoạt'),
('2311500023', 'Hồ Đức An', '2004-11-03', 'Nữ', 'Kinh', 'Không', '048371500433', 'Gia Lai', '180 Hùng Vương, Ngũ Hành Sơn, Đà Nẵng', '0922190034', 'Đoàn viên', '23N2', '2019-02-28', 'THPT Ông Ích Khiêm', 'Đang sinh hoạt'),
('2311500024', 'Ngô Bảo An', '2003-08-03', 'Nữ', 'Kinh', 'Không', '048865178341', 'Đắk Lắk', '123 Lê Duẩn, Ngũ Hành Sơn, Đà Nẵng', '0993207079', 'Đoàn viên', '22C1', '2018-02-08', 'THPT Thái Phiên', 'Đang sinh hoạt'),
('2311500025', 'Nguyễn Thị Linh', '2003-07-17', 'Nữ', 'Kinh', 'Không', '048355888187', 'Khánh Hòa', '52 Nguyễn Trãi, Ngũ Hành Sơn, Đà Nẵng', '0965458204', 'Đoàn viên', '23N2', '2019-05-07', 'THPT Ngô Quyền', 'Đang sinh hoạt'),
('2311500026', 'Hồ Thanh Hà', '2004-12-28', 'Nữ', 'Kinh', 'Không', '048360510458', 'Đà Nẵng', '53 Hải Phòng, Cẩm Lệ, Đà Nẵng', '0969396264', 'Đoàn viên', '22C2', '2020-10-24', 'THPT Nguyễn Trãi', 'Đang sinh hoạt'),
('2311500027', 'Phạm Thanh Trang', '2004-09-30', 'Nam', 'Kinh', 'Không', '048521172721', 'Phú Yên', '80 Điện Biên Phủ, Thanh Khê, Đà Nẵng', '0985650015', 'Đoàn viên', '23N1', '2018-09-19', 'THPT Thái Phiên', 'Đang sinh hoạt'),
('2311500028', 'Bùi Minh Bình', '2003-02-26', 'Nữ', 'Kinh', 'Không', '048400400641', 'Bình Định', '197 Nguyễn Trãi, Sơn Trà, Đà Nẵng', '0993529387', 'Đoàn viên', '20D2', '2018-02-06', 'THPT Ngô Quyền', 'Đang sinh hoạt'),
('2311500029', 'Lê Xuân Trang', '2004-04-29', 'Nữ', 'Kinh', 'Không', '048822037756', 'Bình Định', '14 Phan Đình Phùng, Thanh Khê, Đà Nẵng', '0935135114', 'Đoàn viên', '22T1', '2018-04-12', 'THPT Phan Châu Trinh', 'Đang sinh hoạt'),
('2311500030', 'Vũ Xuân Minh', '2004-02-22', 'Nam', 'Kinh', 'Không', '048408214134', 'Huế', '56 Điện Biên Phủ, Thanh Khê, Đà Nẵng', '0943950769', 'Đoàn viên', '23N2', '2019-10-22', 'THPT Ngô Quyền', 'Đang sinh hoạt'),
('2311500031', 'Dương Hoàng Tuấn', '2003-11-01', 'Nữ', 'Kinh', 'Không', '048566228101', 'Kon Tum', '37 Hoàng Diệu, Cẩm Lệ, Đà Nẵng', '0937889575', 'Đoàn viên', '22C1', '2018-05-13', 'THPT Cẩm Lệ', 'Đang sinh hoạt'),
('2311500032', 'Phạm Thị Hùng', '2004-06-19', 'Nữ', 'Kinh', 'Không', '048324519971', 'Đắk Lắk', '98 Nguyễn Tri Phương, Liên Chiểu, Đà Nẵng', '0946156781', 'Đoàn viên', '23N1', '2018-12-23', 'THPT Hoàng Hoa Thám', 'Đang sinh hoạt'),
('2311500033', 'Hoàng Thanh Tùng', '2004-05-26', 'Nam', 'Kinh', 'Không', '048664858674', 'Gia Lai', '50 Điện Biên Phủ, Ngũ Hành Sơn, Đà Nẵng', '0905997462', 'Đoàn viên', '20D1', '2018-02-09', 'THPT Trần Phú', 'Đang sinh hoạt'),
('2311500034', 'Hoàng Hải Quân', '2004-01-12', 'Nam', 'Kinh', 'Không', '048718377316', 'Bình Định', '72 Nguyễn Trãi, Hải Châu, Đà Nẵng', '0973461766', 'Đoàn viên', '23N2', '2018-10-26', 'THPT Ông Ích Khiêm', 'Đang sinh hoạt'),
('2311500035', 'Nguyễn Hữu Trang', '2003-04-13', 'Nữ', 'Kinh', 'Không', '048018378266', 'Quảng Nam', '104 Nguyễn Trãi, Hải Châu, Đà Nẵng', '0909602308', 'Đoàn viên', '22C1', '2019-03-15', 'THPT Cẩm Lệ', 'Đang sinh hoạt'),
('2311500036', 'Đặng Bảo Khoa', '2004-04-07', 'Nữ', 'Kinh', 'Không', '048579718868', 'Khánh Hòa', '71 Hoàng Diệu, Hải Châu, Đà Nẵng', '0918420688', 'Đoàn viên', '23N2', '2019-03-05', 'THPT Thái Phiên', 'Đang sinh hoạt'),
('2311500037', 'Đỗ Thu Cường', '2004-08-05', 'Nữ', 'Kinh', 'Không', '048275792206', 'Gia Lai', '74 Trần Phú, Ngũ Hành Sơn, Đà Nẵng', '0946189971', 'Đoàn viên', '21K1', '2019-06-12', 'THPT Hoàng Hoa Thám', 'Đang sinh hoạt'),
('2311500038', 'Ngô Ngọc Khoa', '2003-08-01', 'Nữ', 'Kinh', 'Không', '048322260830', 'Phú Yên', '16 Phan Đình Phùng, Thanh Khê, Đà Nẵng', '0903444721', 'Đoàn viên', '22T1', '2020-05-21', 'THPT Ngô Quyền', 'Đang sinh hoạt'),
('2311500039', 'Hoàng Bảo Trang', '2003-04-07', 'Nữ', 'Kinh', 'Không', '048071481730', 'Khánh Hòa', '134 Nguyễn Trãi, Thanh Khê, Đà Nẵng', '0918511345', 'Đoàn viên', '22T1', '2019-03-16', 'THPT Ngô Quyền', 'Đang sinh hoạt'),
('2311500040', 'Đỗ Thị Minh', '2003-03-25', 'Nam', 'Kinh', 'Không', '048489543898', 'Đắk Lắk', '144 Trần Phú, Cẩm Lệ, Đà Nẵng', '0981044751', 'Đoàn viên', '23N1', '2019-06-04', 'THPT Phan Châu Trinh', 'Đang sinh hoạt'),
('2311500041', 'Ngô Hoàng Lan', '2004-06-16', 'Nữ', 'Kinh', 'Không', '048365720226', 'Huế', '65 Nguyễn Tri Phương, Cẩm Lệ, Đà Nẵng', '0983513528', 'Đoàn viên', '21K2', '2018-08-14', 'THPT Lê Quý Đôn', 'Đang sinh hoạt'),
('2311500042', 'Ngô Xuân Hùng', '2004-01-17', 'Nam', 'Kinh', 'Không', '048681934803', 'Kon Tum', '2 Phan Đình Phùng, Hải Châu, Đà Nẵng', '0998748798', 'Đoàn viên', '21K2', '2019-01-30', 'THPT Hoàng Hoa Thám', 'Đang sinh hoạt'),
('2311500043', 'Hồ Hữu Trang', '2004-11-15', 'Nữ', 'Kinh', 'Không', '048997558167', 'Quảng Ngãi', '52 Hải Phòng, Sơn Trà, Đà Nẵng', '0972447228', 'Đoàn viên', '22T1', '2019-06-14', 'THPT Hoàng Hoa Thám', 'Đang sinh hoạt'),
('2311500044', 'Phạm Minh Nga', '2004-07-26', 'Nam', 'Kinh', 'Không', '048315551218', 'Huế', '196 Nguyễn Tri Phương, Cẩm Lệ, Đà Nẵng', '0907899135', 'Đoàn viên', '20D1', '2018-07-06', 'THPT Nguyễn Trãi', 'Đang sinh hoạt'),
('2311500045', 'Phạm Hoàng Nga', '2003-06-22', 'Nam', 'Kinh', 'Không', '048918849030', 'Bình Định', '166 Nguyễn Tri Phương, Hải Châu, Đà Nẵng', '0931495272', 'Đoàn viên', '22T2', '2019-10-24', 'THPT Hoàng Hoa Thám', 'Đang sinh hoạt'),
('2311500046', 'Dương Hữu Lan', '2004-09-12', 'Nam', 'Kinh', 'Không', '048090922515', 'Phú Yên', '194 Lý Thường Kiệt, Sơn Trà, Đà Nẵng', '0939021522', 'Đoàn viên', '20D2', '2018-12-08', 'THPT Ông Ích Khiêm', 'Đang sinh hoạt'),
('2311500047', 'Bùi Minh Hùng', '2004-08-20', 'Nữ', 'Kinh', 'Không', '048525144147', 'Kon Tum', '90 Lý Thường Kiệt, Cẩm Lệ, Đà Nẵng', '0936291053', 'Đoàn viên', '23N1', '2020-12-24', 'THPT Phan Châu Trinh', 'Đang sinh hoạt'),
('2311500048', 'Hoàng Minh Dung', '2004-11-07', 'Nữ', 'Kinh', 'Không', '048572498239', 'Bình Định', '33 Lý Thường Kiệt, Thanh Khê, Đà Nẵng', '0919604820', 'Đoàn viên', '22C1', '2018-06-19', 'THPT Hoàng Hoa Thám', 'Đang sinh hoạt'),
('2311500049', 'Đỗ Ngọc Bình', '2004-10-16', 'Nam', 'Kinh', 'Không', '048255377418', 'Quảng Nam', '79 Hùng Vương, Cẩm Lệ, Đà Nẵng', '0998948344', 'Đoàn viên', '23N2', '2018-04-21', 'THPT Thái Phiên', 'Đã tốt nghiệp'),
('2311500050', 'Trần Đức Cường', '2003-10-09', 'Nam', 'Kinh', 'Không', '048149625158', 'Đắk Lắk', '39 Trần Phú, Liên Chiểu, Đà Nẵng', '0989074723', 'Đoàn viên', '20D1', '2018-03-13', 'THPT Ông Ích Khiêm', 'Đã rút hồ sơ');


-- 4. VAI TRÒ
INSERT IGNORE INTO VaiTro (idVaiTro, tenVaiTro, moTa) VALUES
(1, 'Admin', 'Quản trị toàn hệ thống – Ban Thường vụ Đoàn trường'),
(2, 'Đoàn khoa', 'Quản lý các Chi đoàn và hoạt động thuộc Khoa'),
(3, 'Bí thư', 'Quản lý trực tiếp Chi đoàn lớp'),
(4, 'Đoàn viên', 'Đoàn viên sinh hoạt bình thường');

-- 5. TÀI KHOẢN (51)
INSERT INTO TaiKhoan (maDV, email, tenNguoiDung, matKhau, IdVaiTro) VALUES
(NULL, 'admin@ute.udn.vn', 'Admin Hệ Thống', '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu', 1),
('2011500001', '2011500001@sv.ute.udn.vn', 'Bùi Minh Hải', '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu', 2),
('2011500002', '2011500002@sv.ute.udn.vn', 'Bùi Thu Hùng', '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu', 2),
('2011500003', '2011500003@sv.ute.udn.vn', 'Hoàng Thị An', '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu', 2),
('2011500004', '2011500004@sv.ute.udn.vn', 'Vũ Ngọc Dung', '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu', 2),
('2011500005', '2011500005@sv.ute.udn.vn', 'Phạm Ngọc Minh', '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu', 2),
('2211500006', '2211500006@sv.ute.udn.vn', 'Đỗ Thanh Quân', '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu', 3),
('2211500007', '2211500007@sv.ute.udn.vn', 'Bùi Minh Tùng', '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu', 3),
('2211500008', '2211500008@sv.ute.udn.vn', 'Lê Hữu Khoa', '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu', 3),
('2211500009', '2211500009@sv.ute.udn.vn', 'Bùi Bảo Bình', '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu', 3),
('2211500010', '2211500010@sv.ute.udn.vn', 'Trần Minh Hà', '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu', 3),
('2311500011', '2311500011@sv.ute.udn.vn', 'Hoàng Văn Hà', '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu', 4),
('2311500012', '2311500012@sv.ute.udn.vn', 'Phạm Hoàng Cường', '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu', 4),
('2311500013', '2311500013@sv.ute.udn.vn', 'Hồ Thị Dung', '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu', 4),
('2311500014', '2311500014@sv.ute.udn.vn', 'Đặng Đức Dung', '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu', 4),
('2311500015', '2311500015@sv.ute.udn.vn', 'Vũ Hoàng Phong', '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu', 4),
('2311500016', '2311500016@sv.ute.udn.vn', 'Trần Thu Trang', '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu', 4),
('2311500017', '2311500017@sv.ute.udn.vn', 'Bùi Xuân Hà', '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu', 4),
('2311500018', '2311500018@sv.ute.udn.vn', 'Phạm Thị Dung', '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu', 4),
('2311500019', '2311500019@sv.ute.udn.vn', 'Lê Bảo Hà', '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu', 4),
('2311500020', '2311500020@sv.ute.udn.vn', 'Ngô Văn Duy', '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu', 4),
('2311500021', '2311500021@sv.ute.udn.vn', 'Phạm Xuân Tuấn', '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu', 4),
('2311500022', '2311500022@sv.ute.udn.vn', 'Nguyễn Bảo Bình', '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu', 4),
('2311500023', '2311500023@sv.ute.udn.vn', 'Hồ Đức An', '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu', 4),
('2311500024', '2311500024@sv.ute.udn.vn', 'Ngô Bảo An', '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu', 4),
('2311500025', '2311500025@sv.ute.udn.vn', 'Nguyễn Thị Linh', '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu', 4),
('2311500026', '2311500026@sv.ute.udn.vn', 'Hồ Thanh Hà', '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu', 4),
('2311500027', '2311500027@sv.ute.udn.vn', 'Phạm Thanh Trang', '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu', 4),
('2311500028', '2311500028@sv.ute.udn.vn', 'Bùi Minh Bình', '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu', 4),
('2311500029', '2311500029@sv.ute.udn.vn', 'Lê Xuân Trang', '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu', 4),
('2311500030', '2311500030@sv.ute.udn.vn', 'Vũ Xuân Minh', '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu', 4),
('2311500031', '2311500031@sv.ute.udn.vn', 'Dương Hoàng Tuấn', '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu', 4),
('2311500032', '2311500032@sv.ute.udn.vn', 'Phạm Thị Hùng', '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu', 4),
('2311500033', '2311500033@sv.ute.udn.vn', 'Hoàng Thanh Tùng', '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu', 4),
('2311500034', '2311500034@sv.ute.udn.vn', 'Hoàng Hải Quân', '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu', 4),
('2311500035', '2311500035@sv.ute.udn.vn', 'Nguyễn Hữu Trang', '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu', 4),
('2311500036', '2311500036@sv.ute.udn.vn', 'Đặng Bảo Khoa', '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu', 4),
('2311500037', '2311500037@sv.ute.udn.vn', 'Đỗ Thu Cường', '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu', 4),
('2311500038', '2311500038@sv.ute.udn.vn', 'Ngô Ngọc Khoa', '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu', 4),
('2311500039', '2311500039@sv.ute.udn.vn', 'Hoàng Bảo Trang', '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu', 4),
('2311500040', '2311500040@sv.ute.udn.vn', 'Đỗ Thị Minh', '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu', 4),
('2311500041', '2311500041@sv.ute.udn.vn', 'Ngô Hoàng Lan', '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu', 4),
('2311500042', '2311500042@sv.ute.udn.vn', 'Ngô Xuân Hùng', '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu', 4),
('2311500043', '2311500043@sv.ute.udn.vn', 'Hồ Hữu Trang', '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu', 4),
('2311500044', '2311500044@sv.ute.udn.vn', 'Phạm Minh Nga', '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu', 4),
('2311500045', '2311500045@sv.ute.udn.vn', 'Phạm Hoàng Nga', '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu', 4),
('2311500046', '2311500046@sv.ute.udn.vn', 'Dương Hữu Lan', '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu', 4),
('2311500047', '2311500047@sv.ute.udn.vn', 'Bùi Minh Hùng', '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu', 4),
('2311500048', '2311500048@sv.ute.udn.vn', 'Hoàng Minh Dung', '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu', 4),
('2311500049', '2311500049@sv.ute.udn.vn', 'Đỗ Ngọc Bình', '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu', 4),
('2311500050', '2311500050@sv.ute.udn.vn', 'Trần Đức Cường', '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu', 4);

-- 6. THÔNG BÁO (50)
INSERT INTO ThongBao (tieuDe, noiDung, loai, phamVi, nguoiTao) VALUES
('Thông báo mở link đăng ký tham gia Chiến dịch Mùa hè xanh', 'Đề nghị các đồng chí Bí thư Chi đoàn đôn đốc đoàn viên thực hiện nghiêm túc. Chi tiết chương trình và kế hoạch cụ thể xem tại văn bản đính kèm.', 'Tin tức', 'Công khai', 4),
('Kế hoạch tổ chức Đại hội Chi đoàn các cấp', 'Đề nghị các đồng chí Bí thư Chi đoàn đôn đốc đoàn viên thực hiện nghiêm túc. Chi tiết chương trình và kế hoạch cụ thể xem tại văn bản đính kèm.', 'Thông báo', 'Công khai', 1),
('Triệu tập cán bộ Đoàn tham gia khóa tập huấn kỹ năng', 'Đề nghị các đồng chí Bí thư Chi đoàn đôn đốc đoàn viên thực hiện nghiêm túc. Chi tiết chương trình và kế hoạch cụ thể xem tại văn bản đính kèm.', 'Thông báo', 'Nội bộ', 1),
('Danh sách đoàn viên chưa nộp Sổ đoàn', 'Đề nghị các đồng chí Bí thư Chi đoàn đôn đốc đoàn viên thực hiện nghiêm túc. Chi tiết chương trình và kế hoạch cụ thể xem tại văn bản đính kèm.', 'Thông báo', 'Nội bộ', 4),
('Thông báo mở link đăng ký tham gia Chiến dịch Mùa hè xanh', 'Đề nghị các đồng chí Bí thư Chi đoàn đôn đốc đoàn viên thực hiện nghiêm túc. Chi tiết chương trình và kế hoạch cụ thể xem tại văn bản đính kèm.', 'Tin tức', 'Công khai', 3),
('Kết quả đánh giá phân loại Đoàn viên năm học trước', 'Đề nghị các đồng chí Bí thư Chi đoàn đôn đốc đoàn viên thực hiện nghiêm túc. Chi tiết chương trình và kế hoạch cụ thể xem tại văn bản đính kèm.', 'Thông báo', 'Công khai', 4),
('Kết quả đánh giá phân loại Đoàn viên năm học trước', 'Đề nghị các đồng chí Bí thư Chi đoàn đôn đốc đoàn viên thực hiện nghiêm túc. Chi tiết chương trình và kế hoạch cụ thể xem tại văn bản đính kèm.', 'Thông báo', 'Công khai', 3),
('Mời tham dự Lễ kỷ niệm ngày thành lập Đoàn 26/3', 'Đề nghị các đồng chí Bí thư Chi đoàn đôn đốc đoàn viên thực hiện nghiêm túc. Chi tiết chương trình và kế hoạch cụ thể xem tại văn bản đính kèm.', 'Thông báo', 'Công khai', 4),
('Danh sách đoàn viên chưa nộp Sổ đoàn', 'Đề nghị các đồng chí Bí thư Chi đoàn đôn đốc đoàn viên thực hiện nghiêm túc. Chi tiết chương trình và kế hoạch cụ thể xem tại văn bản đính kèm.', 'Thông báo', 'Công khai', 3),
('Danh sách đoàn viên chưa nộp Sổ đoàn', 'Đề nghị các đồng chí Bí thư Chi đoàn đôn đốc đoàn viên thực hiện nghiêm túc. Chi tiết chương trình và kế hoạch cụ thể xem tại văn bản đính kèm.', 'Tin tức', 'Nội bộ', 4),
('Triệu tập cán bộ Đoàn tham gia khóa tập huấn kỹ năng', 'Đề nghị các đồng chí Bí thư Chi đoàn đôn đốc đoàn viên thực hiện nghiêm túc. Chi tiết chương trình và kế hoạch cụ thể xem tại văn bản đính kèm.', 'Tin tức', 'Công khai', 2),
('Danh sách đoàn viên chưa nộp Sổ đoàn', 'Đề nghị các đồng chí Bí thư Chi đoàn đôn đốc đoàn viên thực hiện nghiêm túc. Chi tiết chương trình và kế hoạch cụ thể xem tại văn bản đính kèm.', 'Thông báo', 'Công khai', 5),
('Kết quả đánh giá phân loại Đoàn viên năm học trước', 'Đề nghị các đồng chí Bí thư Chi đoàn đôn đốc đoàn viên thực hiện nghiêm túc. Chi tiết chương trình và kế hoạch cụ thể xem tại văn bản đính kèm.', 'Thông báo', 'Nội bộ', 2),
('Kế hoạch tổ chức Đại hội Chi đoàn các cấp', 'Đề nghị các đồng chí Bí thư Chi đoàn đôn đốc đoàn viên thực hiện nghiêm túc. Chi tiết chương trình và kế hoạch cụ thể xem tại văn bản đính kèm.', 'Tin tức', 'Công khai', 4),
('Danh sách đoàn viên chưa nộp Sổ đoàn', 'Đề nghị các đồng chí Bí thư Chi đoàn đôn đốc đoàn viên thực hiện nghiêm túc. Chi tiết chương trình và kế hoạch cụ thể xem tại văn bản đính kèm.', 'Tin tức', 'Nội bộ', 3),
('Kết quả đánh giá phân loại Đoàn viên năm học trước', 'Đề nghị các đồng chí Bí thư Chi đoàn đôn đốc đoàn viên thực hiện nghiêm túc. Chi tiết chương trình và kế hoạch cụ thể xem tại văn bản đính kèm.', 'Tin tức', 'Nội bộ', 5),
('Triệu tập cán bộ Đoàn tham gia khóa tập huấn kỹ năng', 'Đề nghị các đồng chí Bí thư Chi đoàn đôn đốc đoàn viên thực hiện nghiêm túc. Chi tiết chương trình và kế hoạch cụ thể xem tại văn bản đính kèm.', 'Thông báo', 'Nội bộ', 2),
('Triệu tập cán bộ Đoàn tham gia khóa tập huấn kỹ năng', 'Đề nghị các đồng chí Bí thư Chi đoàn đôn đốc đoàn viên thực hiện nghiêm túc. Chi tiết chương trình và kế hoạch cụ thể xem tại văn bản đính kèm.', 'Thông báo', 'Nội bộ', 3),
('Kế hoạch tổ chức Đại hội Chi đoàn các cấp', 'Đề nghị các đồng chí Bí thư Chi đoàn đôn đốc đoàn viên thực hiện nghiêm túc. Chi tiết chương trình và kế hoạch cụ thể xem tại văn bản đính kèm.', 'Thông báo', 'Công khai', 3),
('Danh sách đoàn viên chưa nộp Sổ đoàn', 'Đề nghị các đồng chí Bí thư Chi đoàn đôn đốc đoàn viên thực hiện nghiêm túc. Chi tiết chương trình và kế hoạch cụ thể xem tại văn bản đính kèm.', 'Tin tức', 'Công khai', 1),
('Mời tham dự Lễ kỷ niệm ngày thành lập Đoàn 26/3', 'Đề nghị các đồng chí Bí thư Chi đoàn đôn đốc đoàn viên thực hiện nghiêm túc. Chi tiết chương trình và kế hoạch cụ thể xem tại văn bản đính kèm.', 'Tin tức', 'Công khai', 2),
('Danh sách đoàn viên chưa nộp Sổ đoàn', 'Đề nghị các đồng chí Bí thư Chi đoàn đôn đốc đoàn viên thực hiện nghiêm túc. Chi tiết chương trình và kế hoạch cụ thể xem tại văn bản đính kèm.', 'Thông báo', 'Công khai', 2),
('Mời tham dự Lễ kỷ niệm ngày thành lập Đoàn 26/3', 'Đề nghị các đồng chí Bí thư Chi đoàn đôn đốc đoàn viên thực hiện nghiêm túc. Chi tiết chương trình và kế hoạch cụ thể xem tại văn bản đính kèm.', 'Tin tức', 'Nội bộ', 3),
('Kết quả đánh giá phân loại Đoàn viên năm học trước', 'Đề nghị các đồng chí Bí thư Chi đoàn đôn đốc đoàn viên thực hiện nghiêm túc. Chi tiết chương trình và kế hoạch cụ thể xem tại văn bản đính kèm.', 'Thông báo', 'Công khai', 2),
('Kế hoạch tổ chức Đại hội Chi đoàn các cấp', 'Đề nghị các đồng chí Bí thư Chi đoàn đôn đốc đoàn viên thực hiện nghiêm túc. Chi tiết chương trình và kế hoạch cụ thể xem tại văn bản đính kèm.', 'Thông báo', 'Nội bộ', 2),
('Thông báo mở link đăng ký tham gia Chiến dịch Mùa hè xanh', 'Đề nghị các đồng chí Bí thư Chi đoàn đôn đốc đoàn viên thực hiện nghiêm túc. Chi tiết chương trình và kế hoạch cụ thể xem tại văn bản đính kèm.', 'Tin tức', 'Công khai', 1),
('Triệu tập cán bộ Đoàn tham gia khóa tập huấn kỹ năng', 'Đề nghị các đồng chí Bí thư Chi đoàn đôn đốc đoàn viên thực hiện nghiêm túc. Chi tiết chương trình và kế hoạch cụ thể xem tại văn bản đính kèm.', 'Thông báo', 'Nội bộ', 5),
('Mời tham dự Lễ kỷ niệm ngày thành lập Đoàn 26/3', 'Đề nghị các đồng chí Bí thư Chi đoàn đôn đốc đoàn viên thực hiện nghiêm túc. Chi tiết chương trình và kế hoạch cụ thể xem tại văn bản đính kèm.', 'Tin tức', 'Công khai', 5),
('Thông báo mở link đăng ký tham gia Chiến dịch Mùa hè xanh', 'Đề nghị các đồng chí Bí thư Chi đoàn đôn đốc đoàn viên thực hiện nghiêm túc. Chi tiết chương trình và kế hoạch cụ thể xem tại văn bản đính kèm.', 'Thông báo', 'Công khai', 4),
('Mời tham dự Lễ kỷ niệm ngày thành lập Đoàn 26/3', 'Đề nghị các đồng chí Bí thư Chi đoàn đôn đốc đoàn viên thực hiện nghiêm túc. Chi tiết chương trình và kế hoạch cụ thể xem tại văn bản đính kèm.', 'Thông báo', 'Nội bộ', 4),
('Triệu tập cán bộ Đoàn tham gia khóa tập huấn kỹ năng', 'Đề nghị các đồng chí Bí thư Chi đoàn đôn đốc đoàn viên thực hiện nghiêm túc. Chi tiết chương trình và kế hoạch cụ thể xem tại văn bản đính kèm.', 'Thông báo', 'Nội bộ', 2),
('Mời tham dự Lễ kỷ niệm ngày thành lập Đoàn 26/3', 'Đề nghị các đồng chí Bí thư Chi đoàn đôn đốc đoàn viên thực hiện nghiêm túc. Chi tiết chương trình và kế hoạch cụ thể xem tại văn bản đính kèm.', 'Thông báo', 'Nội bộ', 1),
('Mời tham dự Lễ kỷ niệm ngày thành lập Đoàn 26/3', 'Đề nghị các đồng chí Bí thư Chi đoàn đôn đốc đoàn viên thực hiện nghiêm túc. Chi tiết chương trình và kế hoạch cụ thể xem tại văn bản đính kèm.', 'Tin tức', 'Nội bộ', 1),
('Kế hoạch tổ chức Đại hội Chi đoàn các cấp', 'Đề nghị các đồng chí Bí thư Chi đoàn đôn đốc đoàn viên thực hiện nghiêm túc. Chi tiết chương trình và kế hoạch cụ thể xem tại văn bản đính kèm.', 'Thông báo', 'Công khai', 5),
('Danh sách đoàn viên chưa nộp Sổ đoàn', 'Đề nghị các đồng chí Bí thư Chi đoàn đôn đốc đoàn viên thực hiện nghiêm túc. Chi tiết chương trình và kế hoạch cụ thể xem tại văn bản đính kèm.', 'Tin tức', 'Nội bộ', 4),
('Triệu tập cán bộ Đoàn tham gia khóa tập huấn kỹ năng', 'Đề nghị các đồng chí Bí thư Chi đoàn đôn đốc đoàn viên thực hiện nghiêm túc. Chi tiết chương trình và kế hoạch cụ thể xem tại văn bản đính kèm.', 'Thông báo', 'Nội bộ', 2),
('Kết quả đánh giá phân loại Đoàn viên năm học trước', 'Đề nghị các đồng chí Bí thư Chi đoàn đôn đốc đoàn viên thực hiện nghiêm túc. Chi tiết chương trình và kế hoạch cụ thể xem tại văn bản đính kèm.', 'Tin tức', 'Công khai', 5),
('Kế hoạch tổ chức Đại hội Chi đoàn các cấp', 'Đề nghị các đồng chí Bí thư Chi đoàn đôn đốc đoàn viên thực hiện nghiêm túc. Chi tiết chương trình và kế hoạch cụ thể xem tại văn bản đính kèm.', 'Thông báo', 'Công khai', 1),
('Mời tham dự Lễ kỷ niệm ngày thành lập Đoàn 26/3', 'Đề nghị các đồng chí Bí thư Chi đoàn đôn đốc đoàn viên thực hiện nghiêm túc. Chi tiết chương trình và kế hoạch cụ thể xem tại văn bản đính kèm.', 'Tin tức', 'Nội bộ', 4),
('Kế hoạch tổ chức Đại hội Chi đoàn các cấp', 'Đề nghị các đồng chí Bí thư Chi đoàn đôn đốc đoàn viên thực hiện nghiêm túc. Chi tiết chương trình và kế hoạch cụ thể xem tại văn bản đính kèm.', 'Tin tức', 'Công khai', 3),
('Danh sách đoàn viên chưa nộp Sổ đoàn', 'Đề nghị các đồng chí Bí thư Chi đoàn đôn đốc đoàn viên thực hiện nghiêm túc. Chi tiết chương trình và kế hoạch cụ thể xem tại văn bản đính kèm.', 'Tin tức', 'Công khai', 5),
('Thông báo mở link đăng ký tham gia Chiến dịch Mùa hè xanh', 'Đề nghị các đồng chí Bí thư Chi đoàn đôn đốc đoàn viên thực hiện nghiêm túc. Chi tiết chương trình và kế hoạch cụ thể xem tại văn bản đính kèm.', 'Thông báo', 'Công khai', 4),
('Triệu tập cán bộ Đoàn tham gia khóa tập huấn kỹ năng', 'Đề nghị các đồng chí Bí thư Chi đoàn đôn đốc đoàn viên thực hiện nghiêm túc. Chi tiết chương trình và kế hoạch cụ thể xem tại văn bản đính kèm.', 'Thông báo', 'Nội bộ', 1),
('Kế hoạch tổ chức Đại hội Chi đoàn các cấp', 'Đề nghị các đồng chí Bí thư Chi đoàn đôn đốc đoàn viên thực hiện nghiêm túc. Chi tiết chương trình và kế hoạch cụ thể xem tại văn bản đính kèm.', 'Tin tức', 'Công khai', 3),
('Thông báo mở link đăng ký tham gia Chiến dịch Mùa hè xanh', 'Đề nghị các đồng chí Bí thư Chi đoàn đôn đốc đoàn viên thực hiện nghiêm túc. Chi tiết chương trình và kế hoạch cụ thể xem tại văn bản đính kèm.', 'Tin tức', 'Công khai', 2),
('Thông báo mở link đăng ký tham gia Chiến dịch Mùa hè xanh', 'Đề nghị các đồng chí Bí thư Chi đoàn đôn đốc đoàn viên thực hiện nghiêm túc. Chi tiết chương trình và kế hoạch cụ thể xem tại văn bản đính kèm.', 'Thông báo', 'Công khai', 4),
('Kết quả đánh giá phân loại Đoàn viên năm học trước', 'Đề nghị các đồng chí Bí thư Chi đoàn đôn đốc đoàn viên thực hiện nghiêm túc. Chi tiết chương trình và kế hoạch cụ thể xem tại văn bản đính kèm.', 'Thông báo', 'Nội bộ', 1),
('Kết quả đánh giá phân loại Đoàn viên năm học trước', 'Đề nghị các đồng chí Bí thư Chi đoàn đôn đốc đoàn viên thực hiện nghiêm túc. Chi tiết chương trình và kế hoạch cụ thể xem tại văn bản đính kèm.', 'Thông báo', 'Nội bộ', 5),
('Thông báo mở link đăng ký tham gia Chiến dịch Mùa hè xanh', 'Đề nghị các đồng chí Bí thư Chi đoàn đôn đốc đoàn viên thực hiện nghiêm túc. Chi tiết chương trình và kế hoạch cụ thể xem tại văn bản đính kèm.', 'Tin tức', 'Nội bộ', 1),
('Kế hoạch tổ chức Đại hội Chi đoàn các cấp', 'Đề nghị các đồng chí Bí thư Chi đoàn đôn đốc đoàn viên thực hiện nghiêm túc. Chi tiết chương trình và kế hoạch cụ thể xem tại văn bản đính kèm.', 'Thông báo', 'Công khai', 5);

-- 7. DANH MỤC ĐOÀN PHÍ (5)
INSERT INTO DanhMucDoanPhi (namHoc, soTien, trangThai) VALUES
('2020-2021', 120000, 'Đã đóng lại'),
('2021-2022', 120000, 'Đã đóng lại'),
('2022-2023', 120000, 'Đã đóng lại'),
('2023-2024', 120000, 'Đang mở thu'),
('2024-2025', 150000, 'Chưa mở');

-- 8. ĐOÀN PHÍ (50)
INSERT INTO DoanPhi (_idMucDoanPhi, maDV, trangThai, NgayHetHan) VALUES
(2, '2011500001', 'Chưa nộp', '2022-05-31'),
(2, '2011500002', 'Chưa nộp', '2022-05-31'),
(4, '2011500003', 'Chưa nộp', '2024-05-31'),
(3, '2011500004', 'Đã nộp', '2023-05-31'),
(4, '2011500005', 'Đã nộp', '2024-05-31'),
(3, '2211500006', 'Đã nộp', '2023-05-31'),
(1, '2211500007', 'Đã nộp', '2021-05-31'),
(4, '2211500008', 'Chưa nộp', '2024-05-31'),
(2, '2211500009', 'Đã nộp', '2022-05-31'),
(1, '2211500010', 'Chưa nộp', '2021-05-31'),
(1, '2311500011', 'Đã nộp', '2021-05-31'),
(2, '2311500012', 'Đã nộp', '2022-05-31'),
(4, '2311500013', 'Đã nộp', '2024-05-31'),
(1, '2311500014', 'Đã nộp', '2021-05-31'),
(1, '2311500015', 'Chưa nộp', '2021-05-31'),
(4, '2311500016', 'Chưa nộp', '2024-05-31'),
(3, '2311500017', 'Đã nộp', '2023-05-31'),
(2, '2311500018', 'Chưa nộp', '2022-05-31'),
(1, '2311500019', 'Chưa nộp', '2021-05-31'),
(3, '2311500020', 'Đã nộp', '2023-05-31'),
(4, '2311500021', 'Đã nộp', '2024-05-31'),
(4, '2311500022', 'Đã nộp', '2024-05-31'),
(4, '2311500023', 'Chưa nộp', '2024-05-31'),
(4, '2311500024', 'Chưa nộp', '2024-05-31'),
(1, '2311500025', 'Chưa nộp', '2021-05-31'),
(4, '2311500026', 'Chưa nộp', '2024-05-31'),
(1, '2311500027', 'Chưa nộp', '2021-05-31'),
(1, '2311500028', 'Chưa nộp', '2021-05-31'),
(3, '2311500029', 'Chưa nộp', '2023-05-31'),
(2, '2311500030', 'Chưa nộp', '2022-05-31'),
(3, '2311500031', 'Chưa nộp', '2023-05-31'),
(1, '2311500032', 'Đã nộp', '2021-05-31'),
(1, '2311500033', 'Chưa nộp', '2021-05-31'),
(4, '2311500034', 'Chưa nộp', '2024-05-31'),
(4, '2311500035', 'Chưa nộp', '2024-05-31'),
(1, '2311500036', 'Đã nộp', '2021-05-31'),
(1, '2311500037', 'Chưa nộp', '2021-05-31'),
(2, '2311500038', 'Đã nộp', '2022-05-31'),
(3, '2311500039', 'Chưa nộp', '2023-05-31'),
(2, '2311500040', 'Đã nộp', '2022-05-31'),
(1, '2311500041', 'Chưa nộp', '2021-05-31'),
(4, '2311500042', 'Đã nộp', '2024-05-31'),
(1, '2311500043', 'Chưa nộp', '2021-05-31'),
(2, '2311500044', 'Chưa nộp', '2022-05-31'),
(1, '2311500045', 'Chưa nộp', '2021-05-31'),
(2, '2311500046', 'Chưa nộp', '2022-05-31'),
(2, '2311500047', 'Đã nộp', '2022-05-31'),
(3, '2311500048', 'Chưa nộp', '2023-05-31'),
(2, '2311500049', 'Đã nộp', '2022-05-31'),
(1, '2311500050', 'Chưa nộp', '2021-05-31');

-- 9. HOẠT ĐỘNG ĐOÀN (6)
INSERT INTO HoatDongDoan (idHD, tenHD, moTa, ngayToChuc, diaDiem, soLuongMAX, diemHoatDong, trangThaiHD, donViToChuc, maKhoa) VALUES
('HD005', 'Cuộc thi Olympic Tin học lần 1', 'Đoàn trường/khoa tổ chức Cuộc thi Olympic Tin học lần 1 nhằm nâng cao phong trào thi đua và kỹ năng cho sinh viên. Đề nghị các đoàn viên đăng ký tích cực.', '2025-07-10 08:00:00', 'Hội trường C', 109, 8, 'Chờ duyệt', 'Đoàn khoa', 'CNTT'),
('HD007', 'Hiến máu tình nguyện đợt 1', 'Đoàn trường/khoa tổ chức Hiến máu tình nguyện đợt 1 nhằm nâng cao phong trào thi đua và kỹ năng cho sinh viên. Đề nghị các đoàn viên đăng ký tích cực.', '2026-02-03 08:00:00', 'Hội trường C', 126, 19, 'Chờ duyệt', 'Đoàn khoa', 'CNTT'),
('HD019', 'Cuộc thi Olympic Tin học', 'Đoàn trường/khoa tổ chức Cuộc thi Olympic Tin học nhằm nâng cao phong trào thi đua và kỹ năng cho sinh viên. Đề nghị các đoàn viên đăng ký tích cực.', '2026-05-06 08:00:00', 'Hội trường B', 120, 17, 'Đã kết thúc', 'Đoàn trường', NULL),
('HD026', 'Cuộc thi hùng biện Tiếng Anh lần 5', 'Đoàn trường/khoa tổ chức Cuộc thi hùng biện Tiếng Anh lần 5 nhằm nâng cao phong trào thi đua và kỹ năng cho sinh viên. Đề nghị các đoàn viên đăng ký tích cực.', '2025-04-13 08:00:00', 'Hội trường B', 115, 8, 'Từ chối', 'Đoàn khoa', 'CK'),
('HD027', 'Cuộc thi Sinh viên NCKH lần 2', 'Đoàn trường/khoa tổ chức Cuộc thi Sinh viên NCKH lần 2 nhằm nâng cao phong trào thi đua và kỹ năng cho sinh viên. Đề nghị các đoàn viên đăng ký tích cực.', '2025-11-05 08:00:00', 'Hội trường E', 145, 11, 'Chờ duyệt', 'Đoàn trường', NULL),
('HD034', 'Ngày hội giao lưu văn hóa quốc tế', 'Đoàn trường/khoa tổ chức Ngày hội giao lưu văn hóa quốc tế nhằm nâng cao phong trào thi đua và kỹ năng cho sinh viên. Đề nghị các đoàn viên đăng ký tích cực.', '2026-12-25 08:00:00', 'Hội trường E', 127, 5, 'Đang mở', 'Đoàn khoa', 'CNTT'),
('HD035', 'Hoạt động test Khoa CNTT đang mở (Hôm nay)', 'Mô tả test', '2026-05-16 08:00:00', 'Hội trường A', 100, 10, 'Đang mở', 'Đoàn khoa', 'CNTT'),
('HD036', 'Hoạt động test Đoàn trường đang mở (Hôm nay)', 'Mô tả test', '2026-05-16 09:00:00', 'Hội trường B', 100, 10, 'Đang mở', 'Đoàn trường', NULL),
('HD037', 'Hoạt động test Khoa KT đang mở (Hôm nay)', 'Mô tả test', '2026-05-16 10:00:00', 'Hội trường C', 100, 10, 'Đang mở', 'Đoàn khoa', 'KT'),
('HD038', 'Hoạt động test Khoa CNTT đang diễn ra (Hôm nay)', 'Mô tả test', '2026-05-16 11:00:00', 'Hội trường D', 100, 10, 'Đang diễn ra', 'Đoàn khoa', 'CNTT'),
('HD039', 'Hoạt động test khiếu nại 1 (Bị vắng mặt)', 'Hoạt động đã kết thúc trong vòng 7 ngày', '2026-05-14 08:00:00', 'Hội trường A', 100, 5, 'Đã kết thúc', 'Đoàn khoa', 'CNTT'),
('HD040', 'Hoạt động test khiếu nại 2 (Đã tham gia)', 'Hoạt động đã kết thúc trong vòng 7 ngày', '2026-05-15 09:00:00', 'Hội trường B', 100, 5, 'Đã kết thúc', 'Đoàn trường', NULL);

-- 10. DANH SÁCH ĐĂNG KÝ (50)
INSERT IGNORE INTO DanhSachDangKy (maDV, idHD, trangThaiThamGia, trangThaiCongDiem) VALUES
('2311500048', 'HD034', 'Đã Đăng Ký', 'Chưa cộng'),
('2311500050', 'HD039', 'Vắng mặt', 'Chưa cộng'),
('2311500050', 'HD040', 'Đã tham gia', 'Đã tích lũy'),
('2311500011', 'HD034', 'Đã tham gia', 'Đã tích lũy'),
('2311500011', 'HD039', 'Đã tham gia', 'Đã tích lũy');


-- 11. SỔ ĐOÀN (50)
INSERT INTO SoDoan (maSoDoan, maDV, ngayCap, noiCap, trangThai) VALUES
('SD0001', '2011500001', '2013-09-25', 'THPT Lê Quý Đôn', 'Đã nộp'),
('SD0002', '2011500002', '2011-11-01', 'THPT Cẩm Lệ', 'Đã rút'),
('SD0003', '2011500003', '2011-11-09', 'THPT Thái Phiên', 'Thất lạc'),
('SD0004', '2011500004', '2012-01-05', 'THPT Ông Ích Khiêm', 'Đã rút'),
('SD0005', '2011500005', '2010-03-29', 'THPT Nguyễn Trãi', 'Đang giữ'),
('SD0006', '2211500006', '2017-12-02', 'THPT Cẩm Lệ', 'Đã rút'),
('SD0007', '2211500007', '2018-04-25', 'THPT Ông Ích Khiêm', 'Đã rút'),
('SD0008', '2211500008', '2017-11-14', 'THPT Hòa Vang', 'Đang giữ'),
('SD0009', '2211500009', '2017-11-15', 'THPT Lê Quý Đôn', 'Đang giữ'),
('SD0010', '2211500010', '2017-02-18', 'THPT Phan Châu Trinh', 'Thất lạc'),
('SD0011', '2311500011', '2019-04-11', 'THPT Ngô Quyền', 'Đang giữ'),
('SD0012', '2311500012', '2018-05-13', 'THPT Hoàng Hoa Thám', 'Đã rút'),
('SD0013', '2311500013', '2018-04-02', 'THPT Cẩm Lệ', 'Đang giữ'),
('SD0014', '2311500014', '2020-05-06', 'THPT Trần Phú', 'Đang giữ'),
('SD0015', '2311500015', '2020-12-20', 'THPT Ông Ích Khiêm', 'Đã rút'),
('SD0016', '2311500016', '2019-03-09', 'THPT Trần Phú', 'Đã rút'),
('SD0017', '2311500017', '2018-03-14', 'THPT Ông Ích Khiêm', 'Đang giữ'),
('SD0018', '2311500018', '2019-10-30', 'THPT Phan Châu Trinh', 'Đã nộp'),
('SD0019', '2311500019', '2018-09-05', 'THPT Ngô Quyền', 'Đang giữ'),
('SD0020', '2311500020', '2020-05-13', 'THPT Thái Phiên', 'Thất lạc'),
('SD0021', '2311500021', '2019-10-17', 'THPT Phan Châu Trinh', 'Thất lạc'),
('SD0022', '2311500022', '2019-09-15', 'THPT Ngô Quyền', 'Thất lạc'),
('SD0023', '2311500023', '2019-02-28', 'THPT Ông Ích Khiêm', 'Đã nộp'),
('SD0024', '2311500024', '2018-02-08', 'THPT Thái Phiên', 'Đã nộp'),
('SD0025', '2311500025', '2019-05-07', 'THPT Ngô Quyền', 'Đang giữ'),
('SD0026', '2311500026', '2020-10-24', 'THPT Nguyễn Trãi', 'Đã rút'),
('SD0027', '2311500027', '2018-09-19', 'THPT Thái Phiên', 'Thất lạc'),
('SD0028', '2311500028', '2018-02-06', 'THPT Ngô Quyền', 'Thất lạc'),
('SD0029', '2311500029', '2018-04-12', 'THPT Phan Châu Trinh', 'Đang giữ'),
('SD0030', '2311500030', '2019-10-22', 'THPT Ngô Quyền', 'Đã nộp'),
('SD0031', '2311500031', '2018-05-13', 'THPT Cẩm Lệ', 'Đã rút'),
('SD0032', '2311500032', '2018-12-23', 'THPT Hoàng Hoa Thám', 'Đã nộp'),
('SD0033', '2311500033', '2018-02-09', 'THPT Trần Phú', 'Đã rút'),
('SD0034', '2311500034', '2018-10-26', 'THPT Ông Ích Khiêm', 'Thất lạc'),
('SD0035', '2311500035', '2019-03-15', 'THPT Cẩm Lệ', 'Thất lạc'),
('SD0036', '2311500036', '2019-03-05', 'THPT Thái Phiên', 'Đang giữ'),
('SD0037', '2311500037', '2019-06-12', 'THPT Hoàng Hoa Thám', 'Đang giữ'),
('SD0038', '2311500038', '2020-05-21', 'THPT Ngô Quyền', 'Đã nộp'),
('SD0039', '2311500039', '2019-03-16', 'THPT Ngô Quyền', 'Thất lạc'),
('SD0040', '2311500040', '2019-06-04', 'THPT Phan Châu Trinh', 'Đã rút'),
('SD0041', '2311500041', '2018-08-14', 'THPT Lê Quý Đôn', 'Đã rút'),
('SD0042', '2311500042', '2019-01-30', 'THPT Hoàng Hoa Thám', 'Đang giữ'),
('SD0043', '2311500043', '2019-06-14', 'THPT Hoàng Hoa Thám', 'Đang giữ'),
('SD0044', '2311500044', '2018-07-06', 'THPT Nguyễn Trãi', 'Thất lạc'),
('SD0045', '2311500045', '2019-10-24', 'THPT Hoàng Hoa Thám', 'Đang giữ'),
('SD0046', '2311500046', '2018-12-08', 'THPT Ông Ích Khiêm', 'Đã nộp'),
('SD0047', '2311500047', '2020-12-24', 'THPT Phan Châu Trinh', 'Đã rút'),
('SD0048', '2311500048', '2018-06-19', 'THPT Hoàng Hoa Thám', 'Đã nộp'),
('SD0049', '2311500049', '2018-04-21', 'THPT Thái Phiên', 'Thất lạc'),
('SD0050', '2311500050', '2018-03-13', 'THPT Ông Ích Khiêm', 'Đang giữ');

-- 12. TIỂU SỬ (50)
INSERT INTO TieuSu (maDV, tuThoiGian, denThoiGian, donViCongTac, chucVu) VALUES
('2011500001', '2013-09-25', NULL, 'Trường Đại học SPKT', 'Bí thư Liên chi đoàn'),
('2011500002', '2011-11-01', NULL, 'Trường Đại học SPKT', 'Bí thư Liên chi đoàn'),
('2011500003', '2011-11-09', NULL, 'Trường Đại học SPKT', 'Bí thư Liên chi đoàn'),
('2011500004', '2012-01-05', NULL, 'Trường Đại học SPKT', 'Bí thư Liên chi đoàn'),
('2011500005', '2010-03-29', NULL, 'Trường Đại học SPKT', 'Bí thư Liên chi đoàn'),
('2211500006', '2017-12-02', NULL, 'Trường Đại học SPKT', 'Bí thư'),
('2211500007', '2018-04-25', NULL, 'Trường Đại học SPKT', 'Bí thư'),
('2211500008', '2017-11-14', NULL, 'Trường Đại học SPKT', 'Bí thư'),
('2211500009', '2017-11-15', NULL, 'Trường Đại học SPKT', 'Bí thư'),
('2211500010', '2017-02-18', NULL, 'Trường Đại học SPKT', 'Bí thư'),
('2311500011', '2019-04-11', NULL, 'Trường Đại học SPKT', 'Đoàn viên'),
('2311500012', '2018-05-13', NULL, 'Trường Đại học SPKT', 'Đoàn viên'),
('2311500013', '2018-04-02', NULL, 'Trường Đại học SPKT', 'Đoàn viên'),
('2311500014', '2020-05-06', NULL, 'Trường Đại học SPKT', 'Đoàn viên'),
('2311500015', '2020-12-20', NULL, 'Trường Đại học SPKT', 'Đoàn viên'),
('2311500016', '2019-03-09', NULL, 'Trường Đại học SPKT', 'Đoàn viên'),
('2311500017', '2018-03-14', NULL, 'Trường Đại học SPKT', 'Đoàn viên'),
('2311500018', '2019-10-30', NULL, 'Trường Đại học SPKT', 'Đoàn viên'),
('2311500019', '2018-09-05', NULL, 'Trường Đại học SPKT', 'Đoàn viên'),
('2311500020', '2020-05-13', NULL, 'Trường Đại học SPKT', 'Đoàn viên'),
('2311500021', '2019-10-17', NULL, 'Trường Đại học SPKT', 'Đoàn viên'),
('2311500022', '2019-09-15', NULL, 'Trường Đại học SPKT', 'Đoàn viên'),
('2311500023', '2019-02-28', NULL, 'Trường Đại học SPKT', 'Đoàn viên'),
('2311500024', '2018-02-08', NULL, 'Trường Đại học SPKT', 'Đoàn viên'),
('2311500025', '2019-05-07', NULL, 'Trường Đại học SPKT', 'Đoàn viên'),
('2311500026', '2020-10-24', NULL, 'Trường Đại học SPKT', 'Đoàn viên'),
('2311500027', '2018-09-19', NULL, 'Trường Đại học SPKT', 'Đoàn viên'),
('2311500028', '2018-02-06', NULL, 'Trường Đại học SPKT', 'Đoàn viên'),
('2311500029', '2018-04-12', NULL, 'Trường Đại học SPKT', 'Đoàn viên'),
('2311500030', '2019-10-22', NULL, 'Trường Đại học SPKT', 'Đoàn viên'),
('2311500031', '2018-05-13', NULL, 'Trường Đại học SPKT', 'Đoàn viên'),
('2311500032', '2018-12-23', NULL, 'Trường Đại học SPKT', 'Đoàn viên'),
('2311500033', '2018-02-09', NULL, 'Trường Đại học SPKT', 'Đoàn viên'),
('2311500034', '2018-10-26', NULL, 'Trường Đại học SPKT', 'Đoàn viên'),
('2311500035', '2019-03-15', NULL, 'Trường Đại học SPKT', 'Đoàn viên'),
('2311500036', '2019-03-05', NULL, 'Trường Đại học SPKT', 'Đoàn viên'),
('2311500037', '2019-06-12', NULL, 'Trường Đại học SPKT', 'Đoàn viên'),
('2311500038', '2020-05-21', NULL, 'Trường Đại học SPKT', 'Đoàn viên'),
('2311500039', '2019-03-16', NULL, 'Trường Đại học SPKT', 'Đoàn viên'),
('2311500040', '2019-06-04', NULL, 'Trường Đại học SPKT', 'Đoàn viên'),
('2311500041', '2018-08-14', NULL, 'Trường Đại học SPKT', 'Đoàn viên'),
('2311500042', '2019-01-30', NULL, 'Trường Đại học SPKT', 'Đoàn viên'),
('2311500043', '2019-06-14', NULL, 'Trường Đại học SPKT', 'Đoàn viên'),
('2311500044', '2018-07-06', NULL, 'Trường Đại học SPKT', 'Đoàn viên'),
('2311500045', '2019-10-24', NULL, 'Trường Đại học SPKT', 'Đoàn viên'),
('2311500046', '2018-12-08', NULL, 'Trường Đại học SPKT', 'Đoàn viên'),
('2311500047', '2020-12-24', NULL, 'Trường Đại học SPKT', 'Đoàn viên'),
('2311500048', '2018-06-19', NULL, 'Trường Đại học SPKT', 'Đoàn viên'),
('2311500049', '2018-04-21', NULL, 'Trường Đại học SPKT', 'Đoàn viên'),
('2311500050', '2018-03-13', NULL, 'Trường Đại học SPKT', 'Đoàn viên');

-- 13. KHIẾU NẠI (5)

-- ============================================================
-- BƯỚC 4: TẠO EVENT TỰ ĐỘNG CẬP NHẬT TRẠNG THÁI HOẠT ĐỘNG
-- ============================================================
SET GLOBAL event_scheduler = ON;

DELIMITER //
CREATE EVENT IF NOT EXISTS evt_update_hoat_dong_dang_dien_ra
ON SCHEDULE EVERY 1 MINUTE
DO
BEGIN
    UPDATE HoatDongDoan 
    SET trangThaiHD = 'Đang diễn ra' 
    WHERE trangThaiHD = 'Đang mở' AND DATE(ngayToChuc) = CURDATE();
END //
DELIMITER ;
-- ============================================================
-- THÊM TRIGGER NÀY VÀO ĐỂ TỪ NAY VỀ SAU CỨ ĐỔI TRẠNG THÁI LÀ TỰ KHÓA TÀI KHOẢN
DELIMITER //
CREATE TRIGGER trg_KhoaTaiKhoan_TuDong
AFTER UPDATE ON DoanVien
FOR EACH ROW
BEGIN
    IF NEW.trangThaiSH IN ('Đã rút hồ sơ', 'Đã tốt nghiệp') THEN
        UPDATE TaiKhoan SET trangThai = 0 WHERE maDV = NEW.maDV;
    END IF;
END //
DELIMITER ;
-- ============================================================


