import axios from 'axios';

// 1. Khởi tạo instance
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
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
    const { response, config } = error;

    // Xử lý lỗi 401 (Unauthorized)
    if (response && response.status === 401) {
      // Nếu là lỗi từ chính request login thì không redirect (để hiện lỗi sai pass tại chỗ)
      const isLoginRequest = config.url?.includes('/auth/login');

      if (!isLoginRequest) {
        console.error("Phiên đăng nhập hết hạn!");

        // Xóa sạch token cũ
        localStorage.removeItem('accessToken');

        // Lấy đường dẫn hiện tại để quyết định hướng đá về
        const currentPath = window.location.pathname;

        // Tránh loop: Chỉ redirect nếu không phải đang ở sẵn trang login
        if (!currentPath.includes('/login')) {
          if (currentPath.startsWith('/admin')) {
            window.location.href = '/admin/login';
          } else {
            window.location.href = '/login';
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;