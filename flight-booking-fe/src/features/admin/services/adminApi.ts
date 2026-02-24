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

// ─── Payload Types (form input) ───────────────────────────────────────────────

export interface FlightPayload {
    flightNumber: string;
    origin: string;
    destination: string;
    departureTime: string;   // datetime-local string
    arrivalTime: string;     // datetime-local string
    availableSeats: number;
    price: number;
    status: Flight['status'];
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
 * Thêm chuyến bay mới.
 * POST /admin/flights
 */
export const createFlight = (payload: FlightPayload): Promise<Flight> =>
    apiClient.post('/admin/flights', payload);

/**
 * Cập nhật thông tin chuyến bay.
 * PUT /admin/flights/:id
 */
export const updateFlight = (id: string, payload: FlightPayload): Promise<Flight> =>
    apiClient.put(`/admin/flights/${id}`, payload);

/**
 * Xoá chuyến bay.
 * DELETE /admin/flights/:id
 */
export const deleteFlight = (id: string): Promise<void> =>
    apiClient.delete(`/admin/flights/${id}`);

/**
 * Lấy danh sách đặt vé (có phân trang).
 * GET /admin/bookings?page=0&size=20
 */
export const getBookings = (
    params: PaginationParams = { page: 0, size: 20 },
): Promise<PaginatedResponse<Booking>> =>
    apiClient.get('/admin/bookings', { params });

/**
 * Cập nhật trạng thái đơn đặt vé.
 * PATCH /admin/bookings/:id/status
 */
export const updateBookingStatus = (
    id: string,
    status: Booking['status'],
): Promise<Booking> =>
    apiClient.patch(`/admin/bookings/${id}/status`, { status });
