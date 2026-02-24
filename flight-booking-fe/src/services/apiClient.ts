import axios from 'axios';

// 1. Tạo instance (bản sao) của axios với cấu hình mặc định
const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api', // Đường dẫn API của Backend (Spring Boot)
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // Đợi 10 giây, nếu mạng lag quá thì báo lỗi
});

// 2. Cấu hình Interceptor (Bộ chặn) - Tự động gắn Token
apiClient.interceptors.request.use(
  (config) => {
    // Lấy token từ localStorage — cùng key với ProtectedRoute ('token')
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token hết hạn hoặc không đủ quyền → xoá session và về trang login
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;