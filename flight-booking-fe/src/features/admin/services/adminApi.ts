import axiosClient from '../../../api/axiosClient';

// =====================================================================
// 1. INTERFACES - ĐỊNH NGHĨA KIỂU DỮ LIỆU
// =====================================================================

export interface IFlightClass {
    id?: string;
    className: string;
    basePrice: number;
    availableSeats: number;
}

export interface IFlight {
    id: string;
    flightNumber: string;
    airlineName?: string;
    origin: any;
    destination: any;
    departureTime: string;
    arrivalTime: string;
    status: string;
    classes: IFlightClass[];
}

export interface FlightPayload {
    flightNumber: string;
    airlineCode?: string;
    aircraftCode?: string;
    origin: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
    availableSeats?: number;
    price?: number;
    status: string;
}

export interface IDashboardSummary {
    totalRevenue: number;
    totalBookings: number;
    totalTicketsIssued: number;
    totalCancelledBookings: number;
}

export interface ITopRoute {
    route: string;
    ticketCount: number;
    percentage: number;
}

export interface IRevenueChart {
    reportDate: string;
    bookingCount: number;
    revenue: number;
}

// =====================================================================
// 2. API QUẢN LÝ CHUYẾN BAY (FLIGHTS)
// =====================================================================

// Mặc định page: 0 theo chuẩn Spring Data JPA thông thường
export const getFlights = async (params?: any): Promise<any> => {
    return await axiosClient.get('/v1/admin/flights', {
        params: { page: 0, size: 100, ...params }
    });
};

export const createFlight = async (payload: FlightPayload): Promise<any> => {
    return await axiosClient.post('/v1/admin/flights', payload);
};

export const updateFlight = async (id: string, payload: Partial<FlightPayload>): Promise<any> => {
    return await axiosClient.patch(`/v1/admin/flights/${id}`, payload);
};

export const deleteFlight = async (id: string): Promise<any> => {
    // Chuyển sang CANCELLED thay vì xoá cứng
    return await axiosClient.patch(`/v1/admin/flights/${id}`, { status: 'CANCELLED' });
};

export const updateFlightPrice = async (flightClassId: string, pricePayload: any) => {
    return await axiosClient.put(`/v1/admin/flights/prices/${flightClassId}`, pricePayload);
};

export const syncFlights = async () => {
    return await axiosClient.post('/v1/admin/flights/sync-now');
};

// =====================================================================
// 3. API QUẢN LÝ ĐẶT VÉ (BOOKINGS)
// =====================================================================

// ĐÃ SỬA: Xoá /v1 và đặt page: 1 theo AdminBookingController.java của bạn
export const getBookings = async (params?: any) => {
    return await axiosClient.get('/admin/bookings', {
        params: { page: 1, size: 100, ...params }
    });
};

export const updateBookingStatus = async (id: string, status: string) => {
    return await axiosClient.patch(`/admin/bookings/${id}`, { status });
};

// =====================================================================
// 4. API DASHBOARD (THỐNG KÊ & BIỂU ĐỒ)
// =====================================================================

export const getDashboardSummary = async (params?: { startDate?: string, endDate?: string }) => {
    return await axiosClient.get('/v1/admin/dashboard/summary', { params });
};

export const getTopRoutes = async (params?: { startDate?: string, endDate?: string }) => {
    return await axiosClient.get('/v1/admin/dashboard/charts/top-routes', { params });
};

export const getRevenueChart = async (params?: { startDate?: string, endDate?: string }) => {
    return await axiosClient.get('/v1/admin/dashboard/charts/revenue', { params });
};

// =====================================================================
// 5. API QUẢN LÝ NGƯỜI DÙNG & PHÂN QUYỀN
// =====================================================================

export const getUsers = async (params?: any) => {
    return await axiosClient.get('/users', { params });
};

export const createUser = async (payload: any) => {
    return await axiosClient.post('/users', payload);
};

export const updateUser = async (userId: string, payload: any) => {
    return await axiosClient.put(`/users/${userId}`, payload);
};

export const deleteUser = async (userId: string) => {
    return await axiosClient.delete(`/users/${userId}`);
};

export const getRoles = async () => {
    return await axiosClient.get('/roles');
};