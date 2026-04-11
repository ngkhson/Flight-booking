import apiClient from '../../services/apiClient';

export const flightApi = {
  // Hàm tìm kiếm chuyến bay
  searchFlights: (params: { origin: string; destination: string; date: string; passengers?: number }) => {
    return apiClient.get('/flights/search', {
      params
    });
  },

  // Hàm lấy chi tiết chuyến bay
  getFlightDetail: (id: string) => {
    return apiClient.get(`/flights/${id}`);
  }
};