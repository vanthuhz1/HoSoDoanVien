import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const authAPI = axios.create({
  baseURL: `${API_BASE_URL}/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor để thêm token vào header
authAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth Service
export const authService = {
  // Login
  login: async (tenNguoiDung, matKhau) => {
    const response = await authAPI.post('/login', { tenNguoiDung, matKhau });
    return response.data;
  },

  // Forgot Password
  forgotPassword: async (emailOrUsername) => {
    const response = await authAPI.post('/forgot-password', { emailOrUsername });
    return response.data;
  },

  // Reset Password
  resetPassword: async (email, otp, newPassword, confirmPassword) => {
    const response = await authAPI.post('/reset-password', {
      email,
      otp,
      newPassword,
      confirmPassword,
    });
    return response.data;
  },

  // Verify Token
  verifyToken: async () => {
    const response = await authAPI.get('/verify');
    return response.data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
  },

  // Get current user from localStorage
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Get role
  getRole: () => {
    return localStorage.getItem('role');
  },

  // Check if authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
};

export default authService;
