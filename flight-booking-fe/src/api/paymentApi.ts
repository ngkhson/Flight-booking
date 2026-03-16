import axiosClient from "./axiosClient"; // Sửa lại đường dẫn import nếu cần

export const paymentApi = {  
  verifyPaymentStatus: (pnrCode: string) => {
    return axiosClient.get(`/verify-status/${pnrCode}`);
  }
};