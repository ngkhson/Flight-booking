import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// Định nghĩa kiểu dữ liệu cho User
export interface UserInfo {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  roles: { id: number; name: string; description: string }[];
}

interface AuthState {
  user: UserInfo | null;
  isAuthenticated: boolean;
  loading: boolean;
}

// 1. LẤY DATA TỪ LOCALSTORAGE TRƯỚC KHI KHỞI TẠO REDUX
const token = localStorage.getItem('accessToken');
const userStr = localStorage.getItem('user');
const persistedUser = userStr ? JSON.parse(userStr) : null;

// Khởi tạo state bằng dữ liệu đã lưu thay vì null
const initialState: AuthState = {
  user: persistedUser,
  isAuthenticated: !!token,
  loading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Gọi hàm này khi Login thành công
    setCredentials: (state, action: PayloadAction<UserInfo>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      // LƯU NGAY XUỐNG Ổ CỨNG ĐỂ F5 KHÔNG MẤT
      localStorage.setItem('user', JSON.stringify(action.payload));
    },

    // Cập nhật những thông tin thay đổi (Merge data)
    updateUser: (state, action: PayloadAction<Partial<UserInfo>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        // CẬP NHẬT LUÔN XUỐNG Ổ CỨNG
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    },

    // Gọi hàm này khi Logout
    logoutUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      // DỌN RÁC KHI ĐĂNG XUẤT
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setCredentials, updateUser, logoutUser, setLoading } = authSlice.actions;
export default authSlice.reducer;