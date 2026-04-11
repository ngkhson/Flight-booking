import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// Định nghĩa cấu trúc thông tin chuyến bay đã chọn chi tiết
export interface SelectedFlightInfo {
  flightId: string;
  flightCode?: string;
  selectedClassName: string;
  finalPrice: number;
  classId: string;
}

export interface BookingState {
  selectedFlight: SelectedFlightInfo | null; // Lưu cả Object thay vì chỉ string ID
  passengers: any[];
  addons: any[];
  totalAmount: number;
  currentStep: number;
  searchConfigs: {
    origin?: string;       
    destination?: string;
    adults: number;
    children: number;
    infants: number;
    date?: string;
    returnDate?: string;
  };
  contactInfo: any | null; // Lưu thông tin liên hệ
  bookingResult: {
    bookingId: string;
    pnrCode: string;
    totalAmount: number;
  } | null;
}

const initialState: BookingState = {
  selectedFlight: null,
  passengers: [],
  addons: [],
  totalAmount: 0,
  currentStep: 1,
  searchConfigs: { origin: '', destination: '', adults: 1, children: 0, infants: 0 },
  contactInfo: null,
  bookingResult: null,
};

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    // Action chấp nhận Object SelectedFlightInfo
    selectFlight: (state, action: PayloadAction<SelectedFlightInfo>) => {
      state.selectedFlight = action.payload;

      // Tính tổng số lượng khách từ searchConfigs
      const { adults, children, infants } = state.searchConfigs;

      // Logic tính tiền chuẩn:
      // Người lớn: 100% giá
      // Trẻ em: thường 75% - 100% (ở đây mình ví dụ 100% như người lớn cho đơn giản)
      // Em bé: thường 10% hoặc phí cố định (ở đây ví dụ 10%)
      const basePrice = action.payload.finalPrice;
      const totalPaxPrice = (basePrice * adults) + (basePrice * 0.75 * children) + (basePrice * 0.1 * infants);

      state.totalAmount = Math.floor(totalPaxPrice * 1.1); 
      
      // Chuyển sang bước 1 (Nhập thông tin)
      state.currentStep = 1;
      // Reset lại dịch vụ nếu có
      state.addons = [];
    },
    savePassengers: (state, action: PayloadAction<any[]>) => {
      state.passengers = action.payload;

      const basePrice = state.selectedFlight?.finalPrice || 0;

      // Ví dụ logic tính tiền:
      const adultTotal = basePrice * state.searchConfigs.adults;
      const childTotal = (basePrice * 0.75) * state.searchConfigs.children; // Trẻ em 75%
      const infantTotal = (basePrice * 0.1) * state.searchConfigs.infants; // Em bé 10%

      state.totalAmount = Math.floor((adultTotal + childTotal + infantTotal) * 1.1);
      state.currentStep = 2;
    },
    saveAddons: (state, action: PayloadAction<any[]>) => {
      state.addons = action.payload;

      // Tính tổng tiền từ tất cả các loại dịch vụ (Baggage + Meal)
      const addonsTotal = action.payload.reduce((sum, item) => sum + (item.service?.price || 0), 0);

      const basePrice = state.selectedFlight?.finalPrice || 0;
      const ticketTotal = (basePrice * state.searchConfigs.adults) +
        (basePrice * 0.75 * state.searchConfigs.children) +
        (basePrice * 0.1 * state.searchConfigs.infants);

      state.totalAmount = Math.floor(ticketTotal * 1.1 + addonsTotal);
      // state.currentStep = 3;
    },
    setTotalAmount: (state, action: PayloadAction<number>) => {
      state.totalAmount = action.payload;
    },
    prevStep: (state) => {
      if (state.currentStep > 1) state.currentStep -= 1;
    },
    clearBooking: () => initialState,
    saveContactInfo: (state, action: PayloadAction<any>) => {
      state.contactInfo = action.payload;
    },
    setSearchConfigs: (state, action: PayloadAction<{ origin?: string, destination?: string, adults: number, children: number, infants: number, date?: string, returnDate?: string }>) => {
      state.searchConfigs = action.payload;
    },
    setBookingResult: (state, action: PayloadAction<{bookingId: string,pnrCode: string, totalAmount: number}>) => {
      state.bookingResult = action.payload;
    },
    nextStep: (state) => {
      state.currentStep += 1;
    },
    resetStep: (state) => {
      state.currentStep = 1;
    },
  },
});

export const {
  selectFlight,
  savePassengers,
  saveAddons,
  prevStep,
  clearBooking,
  setTotalAmount,
  saveContactInfo,
  setSearchConfigs,
  setBookingResult, 
  nextStep,
  resetStep
} = bookingSlice.actions;

export default bookingSlice.reducer;