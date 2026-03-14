import axiosClient from '../../../api/axiosClient';

// =====================================================================
// INTERFACE - ĐỊNH NGHĨA KIỂU DỮ LIỆU CHO GIAO DIỆN
// =====================================================================
export interface IFlightClass {
    id?: string;
    className: string;
    basePrice: number;
    availableSeats: number;
}

export interface IFlight {
    id?: string;
    flightNumber: string;
    airlineName?: string;
    origin: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
    status: string;
    classes: IFlightClass[];
}

export interface FlightPayload {
    flightNumber: string;
    origin: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
    availableSeats: number;
    price: number;
    status: string;
}

// =====================================================================
// GỌI API THỰC TẾ XUỐNG SPRING BOOT
// =====================================================================

export const getFlights = async (params?: any): Promise<any> => {
    return await axiosClient.get('/v1/admin/flights', { params });
};

export const createFlight = async (payload: FlightPayload): Promise<any> => {
    return await axiosClient.post('/v1/admin/flights', payload);
};

export const updateFlight = async (id: string, payload: Partial<FlightPayload>): Promise<any> => {
    return await axiosClient.patch(`/v1/admin/flights/${id}`, payload);
};

export const deleteFlight = async (id: string): Promise<any> => {
    // Thay đổi trạng thái thành CANCELLED thay vì xoá hẳn khỏi DB
    return await axiosClient.patch(`/v1/admin/flights/${id}`, { status: 'CANCELLED' });
};

export const updateFlightPrice = async (flightClassId: string, pricePayload: any) => {
    return await axiosClient.put(`/v1/admin/flights/prices/${flightClassId}`, pricePayload);
};

export const getFlightStatistics = async () => {
    return await axiosClient.get('/v1/admin/flights/statistics');
};

export const syncFlights = async () => {
    return await axiosClient.post('/v1/admin/flights/sync-now');
};

// =====================================================================
// KHÔI PHỤC CÁC API KHÁC CỦA ADMIN (DASHBOARD, BOOKING, USER, ROLE)
// =====================================================================

// ─── API cho AdminDashboard ──────────────────────────────────────────
export const getDashboardStats = async () => {
    try {
        return await axiosClient.get('/v1/admin/flights/statistics');
    } catch (error) {
        console.error("Lỗi lấy dữ liệu Dashboard:", error);
        return { totalFlights: 0, activeFlights: 0, pendingBookings: 0, totalRevenue: 0 };
    }
};

// ─── API cho BookingManagement ───────────────────────────────────────
export const getBookings = async (params?: any) => {
    return await axiosClient.get('/admin/bookings', { params });
};

// Đề phòng trường hợp file của bạn gọi là updateBooking
export const updateBooking = async (id: string, payload: any) => {
    return await axiosClient.patch(`/admin/bookings/${id}`, payload);
};

// Đề phòng trường hợp file của bạn gọi là updateBookingStatus
export const updateBookingStatus = async (id: string, status: string) => {
    return await axiosClient.patch(`/admin/bookings/${id}`, { status });
};

// ─── API cho UserManagement ──────────────────────────────────────────
export const getUsers = async (params?: any) => {
    return await axiosClient.get('/users', { params });
};

// Bổ sung thêm hàm tạo User (chắc chắn form Thêm User sẽ cần)
export const createUser = async (payload: any) => {
    return await axiosClient.post('/users', payload);
};

// [ĐÃ SỬA TÊN] Đổi thành updateUser để khớp chính xác với UserManagement.tsx
export const updateUser = async (userId: string, payload: any) => {
    return await axiosClient.put(`/users/${userId}`, payload);
};

export const deleteUser = async (userId: string) => {
    return await axiosClient.delete(`/users/${userId}`);
};

// ─── API cho RoleManagement (Lấy danh sách Role cho Dropdown) ────────
export const getRoles = async () => {
    return await axiosClient.get('/roles');
};
// =====================================================================
// API CHO ADMIN DASHBOARD (Thống kê & Biểu đồ)
// =====================================================================

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

export const getDashboardSummary = async (startDate?: string, endDate?: string) => {
    return await axiosClient.get('/v1/admin/dashboard/summary', { params: { startDate, endDate } });
};

export const getTopRoutes = async (startDate?: string, endDate?: string) => {
    return await axiosClient.get('/v1/admin/dashboard/charts/top-routes', { params: { startDate, endDate } });
};

export const getRevenueChart = async (startDate?: string, endDate?: string) => {
    return await axiosClient.get('/v1/admin/dashboard/charts/revenue', { params: { startDate, endDate } });
};