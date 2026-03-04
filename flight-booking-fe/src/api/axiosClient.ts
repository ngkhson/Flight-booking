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

    // BE thường trả về cục data nằm trong response.data. Bóc luôn ở đây cho lẹ.

    if (response && response.data) {

      return response.data;

    }

    return response;

  },

  (error) => {

    // Xử lý lỗi tập trung ở đây (Ví dụ: Token hết hạn 401 thì văng ra log in lại)

    if (error.response && error.response.status === 401) {

      console.error("Token hết hạn hoặc chưa đăng nhập!");

      localStorage.removeItem('accessToken');

      window.location.href = '/login';

    }

    return Promise.reject(error);

  }

);



export default axiosClient;