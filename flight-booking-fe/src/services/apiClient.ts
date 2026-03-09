import axios from 'axios';

// 1. Tạo instance (bản sao) của axios với cấu hình mặc định
const apiClient = axios.create({
  // Use VITE_API_BASE_URL from .env, fallback to localhost:8080/api if missing
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // Đợi 10 giây, nếu mạng lag quá thì báo lỗi
});

// 2. Cấu hình Interceptor (Bộ chặn) - Tự động gắn Token
apiClient.interceptors.request.use(
  (config) => {
    // Lấy token từ localStorage (nếu có)
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Gắn token vào Header
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. Cấu hình Response - Tự động xử lý lỗi
apiClient.interceptors.response.use(
  (response) => {
    return response.data; // Chỉ lấy phần data, bỏ qua mấy cái header rườm rà
  },
  (error) => {
    // Nếu lỗi 401 (Hết hạn token hoặc không hợp lệ) -> Đá về trang login
    if (error.response?.status === 401) {
      console.log('Hết phiên đăng nhập, vui lòng login lại!');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;