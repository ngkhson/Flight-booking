import axiosClient from "./axiosClient";

export const flightApi = {
  searchFlights: (params: { 
    origin: string; 
    destination: string; 
    date: string; 
    passengers: number 
  }) => axiosClient.post("/flights/search", params), // Dùng POST theo request body bạn đưa
};