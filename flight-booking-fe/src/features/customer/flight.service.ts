import apiClient from '../../services/apiClient';

export const flightApi = {
  // Hàm tìm kiếm chuyến bay
  searchFlights: (origin: string, destination: string, date: string) => {
    return apiClient.get('/flights/search', {
      params: { origin, destination, date }
    });
  },

  // Hàm lấy chi tiết chuyến bay
  getFlightDetail: (id: string) => {
    return apiClient.get(`/flights/${id}`);
  }
};