// // File: src/api/bookingApi.ts
// import axiosClient from './axiosClient';

// export const bookingApi = {
//     // Lấy danh sách tất cả các lượt đặt vé (Cần token, dùng GET)
//     getAllBookings: () => {
//         const url = '/bookings';
//         return axiosClient.get(url); 
//         // Không cần truyền token thủ công ở đây nữa!
//     },

//     // Tạo một booking mới (Cần token, dùng POST)
//     createBooking: (bookingData: any) => {
//         const url = '/bookings';
//         return axiosClient.post(url, bookingData);
//     },
    
//     // Lấy thông tin chuyến bay chi tiết (Ví dụ mở rộng)
//     getBookingDetails: (id: number) => {
//         const url = `/bookings/${id}`;
//         return axiosClient.get(url);
//     }
// };

// src/api/bookingApi.ts
import axiosClient from "./axiosClient";

export const bookingApi = {
  // Lấy danh sách vé (Backend yêu cầu Token)
  getAllBookings: () => {
    return axiosClient.get("/bookings");
  },

  // Tạo mới một lượt đặt vé
  createBooking: (bookingData: any) => {
    return axiosClient.post("/bookings", bookingData);
  },

  // Hủy vé theo ID
  deleteBooking: (id: string | number) => {
    return axiosClient.delete(`/bookings/${id}`);
  }
};