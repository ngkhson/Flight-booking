import axios from 'axios';

// 1. Khởi tạo một instance của Axios với cấu hình mặc định

const axiosClient = axios.create({

  baseURL: import.meta.env.VITE_API_BASE_URL,

  headers: {

    'Content-Type': 'application/json',

  },

  timeout: 10000, // Quá 10 giây mà BE không trả lời thì báo lỗi TimeOut

});



// 2. CAN THIỆP TRƯỚC KHI GỬI REQUEST (Request Interceptor)

axiosClient.interceptors.request.use(

  (config) => {

    // Lấy Token từ LocalStorage (sau khi đăng nhập xong sẽ lưu vào đây)

    const token = localStorage.getItem('accessToken');

   

    // Nếu có token thì nhét nó vào Header của request

    if (token) {

      config.headers.Authorization = `Bearer ${token}`;

    }

   

    return config;

  },

  (error) => {

    return Promise.reject(error);

  }

);



// 3. CAN THIỆP SAU KHI NHẬN RESPONSE TỪ BE (Response Interceptor)

axiosClient.interceptors.response.use(
  (response) => {
    if (response && response.data) {
      return response.data;
    }
    return response;
  },
  (error) => {
    const { response } = error;
    
    // Kiểm tra nếu lỗi 401 và KHÔNG PHẢI đang ở trang login
    if (response && response.status === 401) {
      const isLoginRequest = response.config.url.includes('/auth/login');

      if (!isLoginRequest) {
        localStorage.removeItem('accessToken');
        
        // Nếu không phải đang ở trang login thì đá hết về /login
        if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);



export default axiosClient;