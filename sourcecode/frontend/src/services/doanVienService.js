import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_URL = `${API_BASE_URL}/doan-vien`;

// Hàm tự động lấy token đính kèm Header
const getAuthConfig = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

export const doanVienService = {
  // 1. Lấy thông tin chi tiết hồ sơ cá nhân
  getProfile: async (maDV) => {
    try {
      const response = await axios.get(`${API_URL}/${maDV}`, getAuthConfig());
      return response.data;
    } catch (error) {
      console.error('Lỗi khi gọi API lấy hồ sơ:', error);
      return error.response?.data || { success: false, message: 'Không thể kết nối đến hệ thống' };
    }
  },

  // 2. Cập nhật thông tin hồ sơ cá nhân
  // Mẹo: Nếu backend dùng route khác, bạn có thể chỉnh sửa chuỗi URL ở dòng dưới này (ví dụ: `${API_URL}/update/${maDV}`)
  updateProfile: async (maDV, formData) => {
    try {
      const response = await axios.put(`${API_URL}/${maDV}`, formData, getAuthConfig());
      return response.data;
    } catch (error) {
      console.error('Lỗi khi gọi API cập nhật hồ sơ:', error);
      return error.response?.data || { success: false, message: 'Không thể cập nhật thông tin' };
    }
  },

  // 3. Tải lên tệp tin hình ảnh làm ảnh đại diện
  uploadAvatar: async (file) => {
    try {
      const data = new FormData();
      data.append('avatar', file);
      const config = getAuthConfig();
      config.headers['Content-Type'] = 'multipart/form-data';
      const response = await axios.post(`${API_URL}/avatar`, data, config);
      return response.data;
    } catch (error) {
      console.error('Lỗi khi tải ảnh đại diện:', error);
      return error.response?.data || { success: false, message: 'Quá trình tải hình ảnh thất bại' };
    }
  }
};