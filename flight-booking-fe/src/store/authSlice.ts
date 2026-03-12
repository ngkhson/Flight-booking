import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// Định nghĩa kiểu dữ liệu cho User dựa trên mẫu response BE của bạn
interface UserInfo {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  roles: { id: number; name: string; description: string }[];
}

interface AuthState {
  user: UserInfo | null;
  isAuthenticated: boolean;
  loading: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: !!localStorage.getItem('accessToken'), // Khởi tạo dựa trên token hiện có
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
    },

    // 👇 HÀM MỚI: Chỉ cập nhật những thông tin thay đổi (Merge data)
    updateUser: (state, action: PayloadAction<Partial<UserInfo>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },

    // Gọi hàm này khi Logout
    logoutUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem('accessToken');
    },
    // Dùng để cập nhật trạng thái loading nếu cần
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setCredentials, updateUser, logoutUser, setLoading } = authSlice.actions;
export default authSlice.reducer;