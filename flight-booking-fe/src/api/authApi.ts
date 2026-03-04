import axiosClient from './axiosClient';

// Gom tất cả các lệnh gọi API liên quan đến Authentication vào một Object
export const authApi = {
  // Hàm đăng nhập: Gửi email và password lên BE
  login: (data: any) => {
    const url = '/auth/login';
    return axiosClient.post(url, data);
  },

  // Hàm đăng ký
  register: (data: any) => {
    const url = '/auth/register';
    return axiosClient.post(url, data);
  },
  
  // Hàm lấy thông tin user hiện tại (Dùng token)
  getProfile: () => {
    const url = '/auth/me';
    return axiosClient.get(url);
  }
};