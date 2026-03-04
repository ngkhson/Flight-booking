import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// Cấu trúc dữ liệu chúng ta sẽ lưu giữ trong suốt 3 bước
export interface BookingState {
  selectedFlightId: string | null;
  passengers: any[]; // Bài sau sẽ định nghĩa type chuẩn
  addons: any[];
  totalAmount: number;
  currentStep: number;
}

const initialState: BookingState = {
  selectedFlightId: null,
  passengers: [],
  addons: [],
  totalAmount: 0,
  currentStep: 1, // Bắt đầu ở bước 1
};

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    // Hành động: Chọn chuyến bay (Từ trang Search)
    selectFlight: (state, action: PayloadAction<string>) => {
      state.selectedFlightId = action.payload;
    },
    // Hành động: Lưu thông tin khách hàng (Sau bước 1)
    savePassengers: (state, action: PayloadAction<any[]>) => {
      state.passengers = action.payload;
      state.currentStep = 2; // Tự động chuyển sang bước 2
    },
    
    // ---> THÊM HÀM NÀY: Lưu dịch vụ và nhảy sang Bước 3
    saveAddons: (state, action: PayloadAction<any[]>) => {
      state.addons = action.payload;
      state.currentStep = 3; 
    },
    // <---

    // Hành động: Quay lại bước trước
    prevStep: (state) => {
      if (state.currentStep > 1) state.currentStep -= 1;
    },
    // Hành động: Xóa sạch dữ liệu khi đặt vé xong
    clearBooking: () => initialState,
  },
});

export const { selectFlight, savePassengers, saveAddons, prevStep, clearBooking } = bookingSlice.actions;
export default bookingSlice.reducer;

