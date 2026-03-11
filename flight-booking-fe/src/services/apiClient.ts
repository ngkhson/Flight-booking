import axios from 'axios';

/**
 * 1. Tạo instance (bản sao) của axios với cấu hình mặc định
 */
const apiClient = axios.create({
  // Sử dụng VITE_API_BASE_URL từ file .env, mặc định là localhost:8080 nếu thiếu
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // Đợi tối đa 10 giây cho mỗi yêu cầu
});

/**
 * 2. Cấu hình Request Interceptor (Bộ chặn gửi đi)
 * Tự động gắn Token vào Header cho mọi yêu cầu nếu người dùng đã đăng nhập
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Gắn JWT Token theo chuẩn Bearer
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * 3. Cấu hình Response Interceptor (Bộ chặn phản hồi về)
 * Tự động xử lý bóc tách dữ liệu và quản lý lỗi tập trung
 */
apiClient.interceptors.response.use(
  (response) => {
    /**
     * Bóc tách dữ liệu: Trả về trực tiếp response.data.
     * Vì Backend của bạn dùng cấu trúc ApiResponse { code, message, result },
     * việc trả về response.data giúp bạn truy cập trực tiếp các trường này ở tầng UI.
     */
    return response.data; 
  },
  (error) => {
    const status = error.response?.status;
    
    // Log lỗi chi tiết để debug dễ hơn
    const errorMessage = error.response?.data?.message || 'Đã xảy ra lỗi không xác định!';
    console.error(`[API Error] Status: ${status} - Message: ${errorMessage}`);

    if (status === 401) {
      // Lỗi 401: Hết hạn phiên làm việc hoặc chưa đăng nhập
      console.warn('Hết phiên đăng nhập, đang chuyển hướng về trang Login...');
      localStorage.removeItem('token');
      window.location.href = '/login';
    } 
    else if (status === 403) {
      // Lỗi 403: Đăng nhập rồi nhưng không có quyền truy cập vào tài nguyên này
      console.error('Bạn không có quyền truy cập vào chức năng này!');
    } 
    else if (status === 500) {
      // Lỗi 500: Server phía Backend gặp sự cố
      console.error('Lỗi hệ thống phía Backend, vui lòng thử lại sau.');
    }

    return Promise.reject(error);
  }
);

export default apiClient;