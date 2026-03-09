import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// Định nghĩa cấu trúc thông tin chuyến bay đã chọn chi tiết
export interface SelectedFlightInfo {
  flightId: string;
  selectedClassName: string;
  finalPrice: number;
}

export interface BookingState {
  selectedFlight: SelectedFlightInfo | null; // Lưu cả Object thay vì chỉ string ID
  passengers: any[];
  addons: any[];
  totalAmount: number;
  currentStep: number;
  searchConfigs: {
    adults: number;
    children: number;
    infants: number;
  };
  contactInfo: any | null; // Lưu thông tin liên hệ
}

const initialState: BookingState = {
  selectedFlight: null,
  passengers: [],
  addons: [],
  totalAmount: 0,
  currentStep: 1,
  searchConfigs: { adults: 1, children: 0, infants: 0 },
  contactInfo: null,
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

      state.totalAmount = totalPaxPrice;
    },
    savePassengers: (state, action: PayloadAction<any[]>) => {
      state.passengers = action.payload;

      const basePrice = state.selectedFlight?.finalPrice || 0;

      // Ví dụ logic tính tiền:
      const adultTotal = basePrice * state.searchConfigs.adults;
      const childTotal = (basePrice * 0.75) * state.searchConfigs.children; // Trẻ em 75%
      const infantTotal = (basePrice * 0.1) * state.searchConfigs.infants; // Em bé 10%

      state.totalAmount = adultTotal + childTotal + infantTotal;
      state.currentStep = 2;
    },
    saveAddons: (state, action: PayloadAction<any[]>) => {
      state.addons = action.payload;

      // 1. Tính tiền vé gốc
      const basePrice = state.selectedFlight?.finalPrice || 0;
      const ticketTotal = (basePrice * state.searchConfigs.adults) +
        (basePrice * state.searchConfigs.children) +
        (basePrice * 0.1 * state.searchConfigs.infants);

      // 2. Tính tiền hành lý từ payload
      const baggageTotal = action.payload.reduce((sum, item) => sum + (item.baggage?.price || 0), 0);

      // 3. Cập nhật tổng tiền cuối cùng
      state.totalAmount = ticketTotal + baggageTotal;

      state.currentStep = 3; // Chuyển sang thanh toán
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
    setSearchConfigs: (state, action: PayloadAction<{ adults: number, children: number, infants: number }>) => {
      state.searchConfigs = action.payload;
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
  setSearchConfigs
} = bookingSlice.actions;

export default bookingSlice.reducer;