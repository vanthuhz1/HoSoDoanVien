import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_URL = `${API_BASE_URL}/thong-bao`;

export const thongBaoService = {
  // Lấy danh sách thông báo (có thể lọc theo phạm vi)
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.loai) params.append('loai', filters.loai);
    if (filters.phamVi) params.append('phamVi', filters.phamVi);
    if (filters.search) params.append('search', filters.search);

    const response = await axios.get(`${API_URL}?${params.toString()}`);
    return response.data;
  },

  // Lấy chi tiết 1 thông báo
  getOne: async (id) => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  }
};
