import { configureStore } from '@reduxjs/toolkit';
import bookingReducer from './bookingSlice';
import authReducer from './authSlice';

export const store = configureStore({
  reducer: {
    booking: bookingReducer,
    auth: authReducer,
  },
});

// Định nghĩa các Type dùng cho toàn dự án
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;