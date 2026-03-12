// src/api/userApi.ts
import axiosClient from "./axiosClient";

export const userApi = {
  register: (data: any) => {
    // Trỏ đến http://localhost:8080/api/users (baseURL đã có /api chưa bạn kiểm tra lại nhé)
    return axiosClient.post("/users", data);
  },
  getMyInfo: () => {
    return axiosClient.get("/users/my-infor"); // Thay bằng endpoint thật của bạn
  },
  updateProfile: (data: { fullName: string; phone: string }) => 
    axiosClient.put("/users/my-infor", data), // Kiểm tra lại endpoint của BE nhé
    
  changePassword: (data: any) => 
    axiosClient.patch("/users/change-password", data),
};