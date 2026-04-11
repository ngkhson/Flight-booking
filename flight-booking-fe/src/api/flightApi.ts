import axiosClient from "./axiosClient";

export const flightApi = {
  searchFlights: (params: { 
    origin: string; 
    destination: string; 
    date: string; 
    passengers: number 
  }) => axiosClient.post("/flights/search", params), // Dùng POST theo request body bạn đưa
  getAllFlights: (page: number = 1, size: number = 12) => {
    // Gọi API của Backend, sắp xếp theo ngày bay (departureTime) tăng dần
    return axiosClient.get(`/v1/admin/flights?page=${page}&size=${size}&sortBy=departureTime&sortDir=asc`);
  },
};