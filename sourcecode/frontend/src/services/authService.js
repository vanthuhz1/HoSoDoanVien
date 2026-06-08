import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const authAPI = axios.create({
  baseURL: `${API_BASE_URL}/auth`,
  headers: { 'Content-Type': 'application/json' },
});

// Tự động gắn token vào header
authAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

export const authService = {
  /**
   * Đăng nhập bằng EMAIL + mật khẩu
   * @param {string} email
   * @param {string} matKhau
   */
  login: async (email, matKhau) => {
    const response = await authAPI.post('/login', { email, matKhau });
    return response.data;
  },

  /** Gửi OTP về email để đặt lại mật khẩu */
  forgotPassword: async (email) => {
    const response = await authAPI.post('/forgot-password', { email });
    return response.data;
  },

  /** Đặt lại mật khẩu bằng OTP (truyền email thật từ response bước 1) */
  resetPassword: async (email, otp, newPassword, confirmPassword) => {
    const response = await authAPI.post('/reset-password', { email, otp, newPassword, confirmPassword });
    return response.data;
  },

  /** Kiểm tra token còn hạn không */
  verifyToken: async () => {
    const response = await authAPI.get('/verify');
    return response.data;
  },

  /** Đăng xuất */
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
  },

  /** Lấy user hiện tại từ localStorage */
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  /** Lấy role (số) */
  getRole: () => {
    const user = authService.getCurrentUser();
    return user ? parseInt(user.role) : null;
  },

  /** Kiểm tra đã đăng nhập chưa */
  isAuthenticated: () => !!localStorage.getItem('token'),
};

export default authService;
