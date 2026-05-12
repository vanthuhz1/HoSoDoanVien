import axios from 'axios';

const API_URL = 'http://localhost:5000/api/doan-vien';

export const doanVienService = {
  getProfile: async (maDV) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/${maDV}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  uploadAvatar: async (file) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await axios.post(`${API_URL}/avatar`, formData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};
