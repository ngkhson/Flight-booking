import axios from 'axios';

// 1. Khởi tạo instance
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

// 2. Request Interceptor: Tự động gắn Token
axiosClient.interceptors.request.use(
  (config) => {
    // Đảm bảo dùng đúng key 'accessToken'
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 3. Response Interceptor: Xử lý kết quả và lỗi tập trung
axiosClient.interceptors.response.use(
  (response) => {
    // Trả về data trực tiếp nếu có
    return response.data ? response.data : response;
  },
  (error) => {
    const { response } = error;

    // Xử lý lỗi 401 (Unauthorized)
    if (response && response.status === 401) {
      // Nếu API gọi đến là api/auth/login thì KHÔNG chuyển hướng
      // (Bạn kiểm tra URL của request lỗi)
      const isLoginRequest = response.config.url.includes('/auth/login');

      if (!isLoginRequest) {
        console.error("Token hết hạn hoặc chưa đăng nhập!");
        localStorage.removeItem('accessToken');

        // Chỉ chuyển hướng nếu không phải đang ở trang login để tránh lặp vô tận/reload
        if (!window.location.pathname.includes('/login')) {
          console.error("Token hết hạn hoặc chưa đăng nhập!");
          localStorage.removeItem('accessToken');

          // Phân luồng: Admin bị đá về /admin/login, Khách bị đá về /login
          // if (window.location.pathname.startsWith('/admin')) {
          //   window.location.href = '/admin/login';
          // } else {
          //   window.location.href = '/login';
          // }
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;