import apiClient from '../../../services/apiClient';

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Section 1: New I-prefixed Interfaces (API Integration layer) ─────────────
// ═══════════════════════════════════════════════════════════════════════════════

export interface IDashboardStats {
    totalFlights: number;
    totalRevenue: number;   // VND
    totalUsers: number;
    totalBookings: number;
    flightsToday: number;
    newCustomers: number;
}

export interface IFlight {
    id: string;
    flightNumber: string;
    airline: string;
    origin: string;
    destination: string;
    departureTime: string;   // ISO-8601
    arrivalTime: string;   // ISO-8601
    status: 'SCHEDULED' | 'DELAYED' | 'CANCELLED' | 'COMPLETED';
    price: number;   // VND
    availableSeats: number;
}

export interface IBooking {
    id: string;
    pnr: string;   // Passenger Name Record / booking code
    customerName: string;
    flightId: string;
    flightNumber: string;
    route: string;
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
    totalAmount: number;   // VND
    createdAt: string;   // ISO-8601
}

export interface IUser {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'ACCOUNTANT' | 'AGENT' | 'CUSTOMER';
    status: 'ACTIVE' | 'LOCKED';
    createdAt: string;
}

// ─── Shared pagination wrapper ────────────────────────────────────────────────

export interface IPage<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    page: number;
    size: number;
}

// ─── API Functions (new integration layer) ────────────────────────────────────

/**
 * Lấy số liệu tổng quan dashboard.
 * GET /admin/dashboard/stats
 */
export const getDashboardStats = (): Promise<IDashboardStats> =>
    apiClient.get('/admin/dashboard/stats');

/**
 * Lấy danh sách chuyến bay (có phân trang).
 * GET /admin/flights?page=0&size=20
 */
export const getFlights = (
    params: { page?: number; size?: number } = { page: 0, size: 20 },
): Promise<IPage<IFlight>> =>
    apiClient.get('/admin/flights', { params });

/**
 * Lấy danh sách đặt vé (có phân trang).
 * GET /admin/bookings?page=0&size=20
 */
export const getBookings = (
    params: { page?: number; size?: number } = { page: 0, size: 20 },
): Promise<IPage<IBooking>> =>
    apiClient.get('/admin/bookings', { params });

/**
 * Lấy danh sách người dùng (có phân trang).
 * GET /admin/users?page=0&size=20
 */
export const getUsers = (
    params: { page?: number; size?: number } = { page: 0, size: 20 },
): Promise<IPage<IUser>> =>
    apiClient.get('/admin/users', { params });

/**
 * Cập nhật trạng thái tài khoản người dùng (ACTIVE / LOCKED).
 * PATCH /admin/users/:userId/status
 */
export const updateUserStatus = (
    userId: string,
    status: IUser['status'],
): Promise<IUser> =>
    apiClient.patch(`/admin/users/${userId}/status`, { status });

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Section 2: Legacy exports (kept for backward-compat with existing pages) ─
// ═══════════════════════════════════════════════════════════════════════════════

/** @deprecated Dùng IDashboardStats thay thế */
export type DashboardStats = Pick<IDashboardStats,
    'totalRevenue' | 'totalBookings' | 'flightsToday' | 'newCustomers'
>;

/** @deprecated Dùng IFlight thay thế */
export type Flight = IFlight;

/** @deprecated Dùng IBooking thay thế */
export interface Booking {
    id: string;
    bookingCode: string;   // maps to IBooking.pnr
    passengerName: string;   // maps to IBooking.customerName
    flightNumber: string;
    route: string;
    status: 'CONFIRMED' | 'PENDING' | 'CANCELLED';
    totalAmount: number;
    createdAt: string;
}

export interface PaginatedResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    page: number;
    size: number;
}

export interface PaginationParams {
    page?: number;
    size?: number;
}

export interface FlightPayload {
    flightNumber: string;
    origin: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
    availableSeats: number;
    price: number;
    status: Flight['status'];
}

/** @deprecated Dùng getDashboardStats (trả về IDashboardStats) thay thế */
export const getLegacyDashboardStats = (): Promise<DashboardStats> =>
    apiClient.get('/admin/dashboard/stats');

export const createFlight = (payload: FlightPayload): Promise<Flight> =>
    apiClient.post('/admin/flights', payload);

export const updateFlight = (id: string, payload: FlightPayload): Promise<Flight> =>
    apiClient.put(`/admin/flights/${id}`, payload);

export const deleteFlight = (id: string): Promise<void> =>
    apiClient.delete(`/admin/flights/${id}`);

export const updateBookingStatus = (
    id: string,
    status: Booking['status'],
): Promise<Booking> =>
    apiClient.patch(`/admin/bookings/${id}/status`, { status });
