import axios from 'axios';

const API_URL = 'http://localhost:5000/api/activities';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const activityService = {
  // Lấy danh sách hoạt động cho trang chủ (có thể gọi với hoặc không có token)
  getHomeActivities: async (filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.date) params.append('date', filters.date);
    if (filters.maxQty) params.append('maxQty', filters.maxQty);
    if (filters.diemRenLuyen) params.append('diemRenLuyen', filters.diemRenLuyen);

    const response = await axios.get(`${API_URL}/home?${params.toString()}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Lấy chi tiết 1 hoạt động theo ID
  getActivityById: async (idHD) => {
    const response = await axios.get(`${API_URL}/${idHD}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Lấy lịch sử hoạt động của cá nhân
  getMyActivities: async () => {
    const response = await axios.get(`${API_URL}/my-activities`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Đăng ký tham gia hoạt động
  registerActivity: async (idHD) => {
    const response = await axios.post(`${API_URL}/${idHD}/register`, {}, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Hủy đăng ký hoạt động
  unregisterActivity: async (idHD) => {
    const response = await axios.delete(`${API_URL}/${idHD}/unregister`, {
      headers: getAuthHeaders()
    });
    return response.data;
  }
};
