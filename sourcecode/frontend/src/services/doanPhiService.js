import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_URL = `${API_BASE_URL}/doan-phi`;

export const doanPhiService = {
  // Lấy danh sách đoàn phí của đoàn viên
  getMyFees: async (maDV) => {
    const response = await axios.get(`${API_URL}/my-fees?maDV=${maDV}`);
    return response.data;
  },

  // Thanh toán đoàn phí
  paymentFee: async (paymentData) => {
    const response = await axios.post(`${API_URL}/payment`, paymentData);
    return response.data;
  },

  // Lấy thông tin hóa đơn
  getInvoice: async (id) => {
    const response = await axios.get(`${API_URL}/invoice/${id}`);
    return response.data;
  }
};
