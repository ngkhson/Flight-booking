// Tách biệt rõ ràng Value (axios) và Type (AxiosError, ...)
import axios, { type AxiosError, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
// Khởi tạo instance với Base URL từ biến môi trường
// Nếu chưa có file .env, nó sẽ fallback về localhost:8080 của BE
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // Timeout 10s, không để request treo vô thời hạn
});

// 1. REQUEST INTERCEPTOR: Đính kèm Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    
    // Nếu có token, tự động đính vào header
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// 2. RESPONSE INTERCEPTOR: Xử lý lỗi toàn cục
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Bóc tách data ngay tại đây để các Service (như flight.service.ts của FE1) code ngắn gọn hơn
    return response.data;
  },
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;
      
      // Xử lý 401 Unauthorized (Token hết hạn hoặc không hợp lệ)
      if (status === 401) {
        console.warn('[Axios] 401 Unauthorized - Token expired. Redirecting to login...');
        
        // Clear toàn bộ thông tin auth cũ
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userRole');
        
        // Force redirect về trang login của Admin (hoặc Customer tùy logic sau này)
        // Dùng window.location để tránh phụ thuộc React Router ở tầng Service
        window.location.href = '/admin/login'; 
      }
      
      // Xử lý 403 Forbidden (Không có quyền truy cập resource)
      if (status === 403) {
        console.error('[Axios] 403 Forbidden - Access Denied.');
        // Tương lai có thể dispatch event để hiện Toast notification ở đây
      }
    } else if (error.request) {
      // Lỗi không nhận được phản hồi từ server (Server down hoặc sai URL)
      console.error('[Axios] Network Error - No response received from server.');
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;