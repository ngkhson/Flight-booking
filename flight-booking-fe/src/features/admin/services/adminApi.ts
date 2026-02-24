import apiClient from '../../../services/apiClient';

// ─── Response Types ───────────────────────────────────────────────────────────

export interface DashboardStats {
    totalBookings: number;
    totalRevenue: number;       // VND
    flightsToday: number;
    newCustomers: number;
}

export interface Flight {
    id: string;
    flightNumber: string;
    origin: string;
    destination: string;
    departureTime: string;      // ISO-8601
    arrivalTime: string;        // ISO-8601
    status: 'SCHEDULED' | 'DELAYED' | 'CANCELLED' | 'COMPLETED';
    availableSeats: number;
    price: number;              // VND
}

export interface Booking {
    id: string;
    bookingCode: string;
    passengerName: string;
    flightNumber: string;
    route: string;
    status: 'CONFIRMED' | 'PENDING' | 'CANCELLED';
    totalAmount: number;        // VND
    createdAt: string;          // ISO-8601
}

export interface PaginatedResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    page: number;
    size: number;
}

// ─── Query Params ─────────────────────────────────────────────────────────────

export interface PaginationParams {
    page?: number;
    size?: number;
}

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * Lấy số liệu tổng quan: tổng vé, doanh thu, chuyến bay, khách hàng mới.
 * GET /admin/dashboard/stats
 */
export const getDashboardStats = (): Promise<DashboardStats> =>
    apiClient.get('/admin/dashboard/stats');

/**
 * Lấy danh sách chuyến bay (có phân trang).
 * GET /admin/flights?page=0&size=20
 */
export const getFlights = (
    params: PaginationParams = { page: 0, size: 20 },
): Promise<PaginatedResponse<Flight>> =>
    apiClient.get('/admin/flights', { params });

/**
 * Lấy danh sách đặt vé (có phân trang).
 * GET /admin/bookings?page=0&size=20
 */
export const getBookings = (
    params: PaginationParams = { page: 0, size: 20 },
): Promise<PaginatedResponse<Booking>> =>
    apiClient.get('/admin/bookings', { params });
