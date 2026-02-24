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

/**
 * Cập nhật role tài khoản người dùng.
 * PATCH /admin/users/:userId/role
 */
export const updateUserRole = (
    userId: string,
    role: IUser['role'],
): Promise<IUser> =>
    apiClient.patch(`/admin/users/${userId}/role`, { role });



// ═══════════════════════════════════════════════════════════════════════════════
// ─── Section 2: Flight & Booking CRUD helpers (used by management pages) ──────
// ═══════════════════════════════════════════════════════════════════════════════

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

/** Payload for creating / updating a flight via the admin API. */
export interface FlightPayload {
    flightNumber: string;
    airline: string;
    origin: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
    availableSeats: number;
    price: number;
    status: IFlight['status'];
}

export const createFlight = (payload: FlightPayload): Promise<IFlight> =>
    apiClient.post('/admin/flights', payload);

export const updateFlight = (id: string, payload: FlightPayload): Promise<IFlight> =>
    apiClient.put(`/admin/flights/${id}`, payload);

export const deleteFlight = (id: string): Promise<void> =>
    apiClient.delete(`/admin/flights/${id}`);

export const updateBookingStatus = (
    id: string,
    status: IBooking['status'],
): Promise<IBooking> =>
    apiClient.patch(`/admin/bookings/${id}/status`, { status });

/** @internal Convenience alias — prefer IFlight directly. */
export type Flight = IFlight;
