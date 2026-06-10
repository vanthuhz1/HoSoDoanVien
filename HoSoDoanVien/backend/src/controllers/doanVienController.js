const { getConnection } = require('../config/database');

// GET /api/doan-vien – Tất cả đoàn viên (Admin / Đoàn khoa)
// GET /api/doan-vien – Tất cả đoàn viên kèm bộ lọc nâng cao (Tìm kiếm, Chi đoàn, Trạng thái)
const getAllDoanVien = async (req, res) => {
  try {
    // 💡 Hứng các tham số lọc được gửi từ Frontend qua URL query params
    const { search, maChiDoan, trangThaiSH } = req.query;
    const pool = await getConnection();

    // 1. Khởi tạo câu lệnh truy vấn gốc
    let sql = `
      SELECT
        dv.*,
        cd.tenChiDoan,
        k.tenKhoa
      FROM DoanVien dv
      LEFT JOIN ChiDoan cd ON dv.maChiDoan = cd.maChiDoan
      LEFT JOIN Khoa    k  ON cd.maKhoa    = k.maKhoa
    `;

    // 2. Tự động xây dựng điều kiện lọc động dựa trên những gì Admin chọn
    let conditions = [];
    let queryParams = [];

    // Nếu gõ ô tìm kiếm (Tìm theo Họ tên hoặc Mã đoàn viên)
    if (search && search.trim() !== '') {
      conditions.push(`(dv.hoTen LIKE ? OR dv.maDV LIKE ?)`);
      queryParams.push(`%${search.trim()}%`);
      queryParams.push(`%${search.trim()}%`);
    }

    // Nếu chọn bộ lọc Chi đoàn
    if (maChiDoan && maChiDoan.trim() !== '') {
      conditions.push(`dv.maChiDoan = ?`);
      queryParams.push(maChiDoan.trim());
    }

    // Nếu chọn bộ lọc Trạng thái sinh hoạt
    if (trangThaiSH && trangThaiSH.trim() !== '') {
      conditions.push(`dv.trangThaiSH = ?`);
      queryParams.push(trangThaiSH.trim());
    }

    // Nếu có ít nhất 1 điều kiện, nối chữ WHERE vào câu lệnh SQL
    if (conditions.length > 0) {
      sql += ` WHERE ` + conditions.join(' AND ');
    }

    // Sắp xếp theo thứ tự bảng chữ cái tên đoàn viên
    sql += ` ORDER BY dv.hoTen`;

    // 3. Thực thi câu lệnh SQL với mảng tham số an toàn (tránh lỗi SQL Injection)
    const [rows] = await pool.query(sql, queryParams);
    
    return res.json({ success: true, data: rows, total: rows.length });
  } catch (error) {
    console.error('Lỗi lấy danh sách đoàn viên:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách Đoàn viên',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
// GET /api/doan-vien/:id – Theo maDV
const getDoanVienById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();
    const [rows] = await pool.query(`
      SELECT
        dv.*,
        cd.tenChiDoan,
        k.tenKhoa,
        tk.email
      FROM DoanVien dv
      LEFT JOIN ChiDoan  cd ON dv.maChiDoan = cd.maChiDoan
      LEFT JOIN Khoa     k  ON cd.maKhoa    = k.maKhoa
      LEFT JOIN TaiKhoan tk ON dv.maDV       = tk.maDV
      WHERE dv.maDV = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy Đoàn viên' });
    }
    return res.json({ success: true, data: rows[0] });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin Đoàn viên',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// GET /api/doan-vien/chi-doan/:maChiDoan – Đoàn viên theo chi đoàn
const getDoanVienByChiDoan = async (req, res) => {
  try {
    const { maChiDoan } = req.params;
    const pool = await getConnection();
    const [rows] = await pool.query(`
      SELECT dv.*, cd.tenChiDoan
      FROM DoanVien dv
      LEFT JOIN ChiDoan cd ON dv.maChiDoan = cd.maChiDoan
      WHERE dv.maChiDoan = ?
      ORDER BY dv.hoTen
    `, [maChiDoan]);

    return res.json({ success: true, data: rows, total: rows.length });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách Đoàn viên theo Chi đoàn',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// POST /api/doan-vien/avatar - Upload avatar
const uploadAvatar = async (req, res) => {
  try {
    const { maDV } = req.user;
    if (!maDV) {
      return res.status(400).json({ success: false, message: 'Người dùng không có mã đoàn viên' });
    }
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn ảnh để tải lên' });
    }

    const imagePath = `/uploads/${req.file.filename}`;
    
    const pool = await getConnection();
    await pool.query('UPDATE DoanVien SET anhDaiDien = ? WHERE maDV = ?', [imagePath, maDV]);

    return res.json({ 
      success: true, 
      message: 'Cập nhật ảnh đại diện thành công',
      data: { anhDaiDien: imagePath }
    });
  } catch (error) {
    console.error('Lỗi khi upload avatar:', error);
    return res.status(500).json({ success: false, message: 'Lỗi khi tải ảnh lên' });
  }
};
// POST /api/doan-vien – Thêm mới Đoàn viên + Tự động tạo tài khoản & Sổ đoàn (Đã chuẩn hóa cột)
const createDoanVien = async (req, res) => {
  try {
    const data = req.body; 

    // --- 1. KIỂM TRA DỮ LIỆU BẮT BUỘC (Tránh lỗi 500 do thiếu dữ liệu) ---
    // Sửa lại đúng tên biến: maDV và hoTen
    if (!data.maDV || String(data.maDV).trim() === "" || !data.hoTen || String(data.hoTen).trim() === "") {
        return res.status(400).json({ 
            success: false, 
            message: 'Lỗi: Mã đoàn viên và Họ tên không được để trống!' 
        });
    }

    // --- 2. KIỂM TRA LOGIC NGÀY THÁNG ---
const today = new Date();
today.setHours(0, 0, 0, 0);

// Kiểm tra Ngày sinh (nếu có nhập)
if (data.ngaySinh && String(data.ngaySinh).trim() !== "") {
    const birthDate = new Date(data.ngaySinh);
    if (!isNaN(birthDate.getTime()) && birthDate >= today) {
        return res.status(400).json({ success: false, message: 'Lỗi: Ngày sinh phải là một ngày trong quá khứ!' });
    }
}

// Kiểm tra Ngày vào Đoàn (nếu có nhập)
if (data.ngayVaoDoan && String(data.ngayVaoDoan).trim() !== "") {
    const joinDate = new Date(data.ngayVaoDoan);
    
    // Kiểm tra Ngày vào Đoàn không được ở tương lai
    if (!isNaN(joinDate.getTime()) && joinDate > today) {
        return res.status(400).json({ success: false, message: 'Lỗi: Ngày vào Đoàn không thể ở tương lai!' });
    }

    // Chỉ tính tuổi nếu có đủ Ngày sinh và Ngày vào Đoàn
    if (data.ngaySinh && String(data.ngaySinh).trim() !== "") {
        const birthDate = new Date(data.ngaySinh);
        
        if (!isNaN(birthDate.getTime()) && !isNaN(joinDate.getTime())) {
            // Kiểm tra Ngày vào Đoàn phải sau Ngày sinh
            if (joinDate < birthDate) {
                return res.status(400).json({ success: false, message: 'Lỗi: Ngày vào Đoàn không thể diễn ra trước Ngày sinh!' });
            }

            // TÍNH TUỔI CHÍNH XÁC ĐẾN TỪNG NGÀY
            let exactAge = joinDate.getFullYear() - birthDate.getFullYear();
            const monthDiff = joinDate.getMonth() - birthDate.getMonth();
            const dayDiff = joinDate.getDate() - birthDate.getDate();

            // Nếu chưa đến tháng sinh, hoặc đã đến tháng sinh nhưng chưa đến ngày sinh thì chưa đủ tuổi
            if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
                exactAge--;
            }

            if (exactAge < 15) {
                return res.status(400).json({ success: false, message: `Lỗi: Đoàn viên chưa đủ 15 tuổi tại thời điểm vào Đoàn (Tuổi thực: ${exactAge})!` });
            }
        }
    }
}
// 3. CÁC LỆNH INSERT INTO DATABASE PHÍA DƯỚI GIỮ NGUYÊN...
    const pool = await getConnection();
    
   
    
    // THÊM DÒNG NÀY ĐỂ DEBUG:
    console.log("Dữ liệu nhận được từ Postman: ", data);

    // --- 1. KIỂM TRA DỮ LIỆU BẮT BUỘC ---
    if (!data.maDV || String(data.maDV).trim() === "" || !data.hoTen || String(data.hoTen).trim() === "") {
        return res.status(400).json({
          success: false, 
            message: 'Lỗi: Mã đoàn viên và Họ tên không được để trống!' 
        });
    }
        

    // XỬ LÝ AN TOÀN: Ép chuỗi rỗng về null
    const ngaySinh = data.ngaySinh && data.ngaySinh.trim() !== '' ? data.ngaySinh : null;
    const ngayVaoDoan = data.ngayVaoDoan && data.ngayVaoDoan.trim() !== '' ? data.ngayVaoDoan : null;
    const maChiDoan = data.maChiDoan && data.maChiDoan.trim() !== '' ? data.maChiDoan : null;

    // 2. Chèn thông tin hồ sơ vào bảng DoanVien
    await pool.query(`
      INSERT INTO DoanVien 
        (maDV, hoTen, ngaySinh, gioiTinh, danToc, tonGiao, cccd, queQuan, diaChiThuongTru, SDT, chucVu, maChiDoan, ngayVaoDoan, noiVaoDoan, trangThaiSH)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.maDV, data.hoTen, ngaySinh, data.gioiTinh, data.danToc, data.tonGiao, 
      data.cccd || null, data.queQuan, data.diaChiThuongTru, data.SDT || null, data.chucVu, maChiDoan, 
      ngayVaoDoan, data.noiVaoDoan, data.trangThaiSH || 'Đang sinh hoạt'
    ]);

    // 3. TỰ ĐỘNG ĐỒNG BỘ: Tạo tài khoản (Khớp chuẩn xác tên cột IdVaiTro của bạn)
    const userEmail = `${data.maDV.toLowerCase()}@sv.ute.udn.vn`;
    const hashedPassword = '$2b$10$A3q1X4EuGqcKJGAj/q6Mj.t1EsxIXIlxJQrrKUNc4eXJmhZRb6qLu'; // Mật khẩu 123456
    const idVaiTroMacDinh = 4; // 4 tương ứng với quyền 'Đoàn viên' trong bảng VaiTro của bạn

    await pool.query(`
      INSERT INTO TaiKhoan (maDV, email, tenNguoiDung, matKhau, IdVaiTro)
      VALUES (?, ?, ?, ?, ?)
    `, [data.maDV, userEmail, data.hoTen, hashedPassword, idVaiTroMacDinh]);

    // 4. TỰ ĐỘNG ĐỒNG BỘ: Tạo Sổ Đoàn (Khớp chuẩn xác tên cột maSoDoan và trangThai của bạn)
    const maSoDoanTuDong = `SD${data.maDV}`; // Tạo mã sổ đoàn tạm thời không trùng
    await pool.query(`
      INSERT INTO SoDoan (maSoDoan, maDV, ngayCap, noiCap, trangThai)
      VALUES (?, ?, ?, ?, 'Đã nộp')
    `, [maSoDoanTuDong, data.maDV, ngayVaoDoan, data.noiVaoDoan || 'THPT']);

    return res.status(201).json({ success: true, message: 'Thêm đoàn viên và khởi tạo tài khoản đồng bộ thành công!' });
  } catch (error) {
    console.error('Lỗi Backend Thêm mới:', error);
    return res.status(500).json({ success: false, message: 'Lỗi khi thêm đoàn viên', error: error.message });
  }
};

// PUT /api/doan-vien/:id – Cập nhật thông tin Đoàn viên (Bản chuẩn hóa tránh lỗi 500)
const updateDoanVien = async (req, res) => {
  try {
    const { id } = req.params; 
    const data = req.body;
    const pool = await getConnection();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // --- 1. KIỂM TRA LOGIC NGÀY THÁNG (Bổ sung đầy đủ) ---
    
    // Kiểm tra Ngày sinh (Nếu có nhập)
    if (data.ngaySinh && String(data.ngaySinh).trim() !== "") {
        const birthDate = new Date(data.ngaySinh);
        if (!isNaN(birthDate.getTime()) && birthDate >= today) {
            return res.status(400).json({ success: false, message: 'Lỗi: Ngày sinh phải là ngày trong quá khứ!' });
        }
    }

    // Kiểm tra Ngày vào Đoàn (Nếu có nhập)
    if (data.ngayVaoDoan && String(data.ngayVaoDoan).trim() !== "") {
        const joinDate = new Date(data.ngayVaoDoan);
        if (!isNaN(joinDate.getTime()) && joinDate > today) {
            return res.status(400).json({ success: false, message: 'Lỗi: Ngày vào Đoàn không thể ở tương lai!' });
        }
        
        // Nếu có cả ngày sinh và ngày vào đoàn thì mới check tuổi
        if (data.ngaySinh && String(data.ngaySinh).trim() !== "") {
            const birthDate = new Date(data.ngaySinh);
            if (!isNaN(birthDate.getTime())) {
                if (joinDate < birthDate) {
                    return res.status(400).json({ success: false, message: 'Lỗi: Ngày vào Đoàn không thể trước Ngày sinh!' });
                }

                let exactAge = joinDate.getFullYear() - birthDate.getFullYear();
                const monthDiff = joinDate.getMonth() - birthDate.getMonth();
                const dayDiff = joinDate.getDate() - birthDate.getDate();
                if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) exactAge--;

                if (exactAge < 15) {
                    return res.status(400).json({ success: false, message: `Lỗi: Đoàn viên chưa đủ 15 tuổi (Tuổi thực: ${exactAge})!` });
                }
            }
        }
    }


    // 2. CHUẨN HÓA DỮ LIỆU
    const ngaySinh = (data.ngaySinh && data.ngaySinh.trim() !== '') ? data.ngaySinh : null;
    const ngayVaoDoan = (data.ngayVaoDoan && data.ngayVaoDoan.trim() !== '') ? data.ngayVaoDoan : null;
    const maChiDoan = (data.maChiDoan && data.maChiDoan.trim() !== '' && data.maChiDoan !== '-- Chọn chi đoàn --') ? data.maChiDoan : null;
    
    const ts = data.trangThaiSH ? data.trangThaiSH.toString().trim().toLowerCase() : '';
    let trangThaiSHClean = 'Đang sinh hoạt';
    if (ts.includes('rút')) trangThaiSHClean = 'Đã rút hồ sơ';
    else if (ts.includes('nghiệp')) trangThaiSHClean = 'Đã tốt nghiệp';

    // 3. CẬP NHẬT DATABASE
    const [result] = await pool.query(`
      UPDATE DoanVien SET 
        hoTen = ?, ngaySinh = ?, gioiTinh = ?, danToc = ?, tonGiao = ?, 
        cccd = ?, queQuan = ?, diaChiThuongTru = ?, SDT = ?, chucVu = ?, 
        maChiDoan = ?, ngayVaoDoan = ?, noiVaoDoan = ?, trangThaiSH = ?
      WHERE maDV = ?
    `, [
      data.hoTen, ngaySinh, data.gioiTinh, data.danToc || 'Kinh', data.tonGiao || 'Không', 
      data.cccd || null, data.queQuan || null, data.diaChiThuongTru || null, data.SDT || null, 
      data.chucVu || 'Đoàn viên', maChiDoan, ngayVaoDoan, data.noiVaoDoan || null, 
      trangThaiSHClean, id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đoàn viên để cập nhật!' });
    }

    return res.json({ success: true, message: 'Cập nhật thông tin thành công!' });

  } catch (error) {
    console.error('Lỗi Backend:', error);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống!', error: error.message });
  }
};
module.exports = { 
  getAllDoanVien, 
  getDoanVienById, 
  getDoanVienByChiDoan, 
  uploadAvatar,
  createDoanVien, 
  updateDoanVien  
};