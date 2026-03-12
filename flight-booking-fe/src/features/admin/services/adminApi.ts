import apiClient from '../../../services/apiClient';
import axiosClient from '@/api/axiosClient';

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Common: Backend ApiResponse<T> Wrapper ──────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
//
// The Spring Boot backend wraps ALL responses in:
//   { code: number, message?: string, result: T }
//
// Since apiClient interceptor already does `return response.data`, every
// apiClient call returns the ApiResponse object — NOT the inner T.
// Each API function below unwraps `.result` so callers get the clean type.

interface IApiResponse<T> {
    code: number;
    message?: string;
    result: T;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Section 1: Interfaces matching EXACT Backend DTO field names ────────────
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
// ⚠️  NO backend endpoint exists for dashboard stats yet.
//     This interface is kept as a placeholder for when the BE implements it.

export interface IDashboardStats {
    totalFlights: number;
    totalRevenue: number;   // VND
    totalUsers: number;
    totalBookings: number;
    flightsToday: number;
    newCustomers: number;
    todayRevenue: number;
    activeFlights: number;
    pendingBookings: number;
    totalTicketsSold: number;
}

// ─── Flight (matches FlightSearchResponseDTO) ─────────────────────────────────

export interface IFlightClass {
    id: string;
    className: string;
    basePrice: number;
    availableSeats: number;
}

export interface IFlight {
    flightNumber: string;
    airlineName: string;        // BE: "airlineName" (not "airline")
    origin: string;
    destination: string;
    departureTime: string;      // ISO-8601
    arrivalTime: string;        // ISO-8601
    status: string;             // SCHEDULED | DELAYED | CANCELLED | COMPLETED etc.
    classes: IFlightClass[];    // BE returns class breakdown, not single price/seats
}

// ─── Flight Update (matches FlightUpdateRequestDTO / FlightUpdateResponseDTO) ─

export interface IFlightUpdateRequest {
    departureTime?: string;     // ISO-8601
    arrivalTime?: string;       // ISO-8601
    status?: string;            // SCHEDULED | DELAYED | CANCELLED
}

export interface IFlightUpdateResponse {
    id: string;
    status: string;
    departureTime: string;
    arrivalTime: string;
    updatedAt: string;
}

// ─── Booking (matches AdminBookingSummaryResponse) ────────────────────────────

export interface IBooking {
    id: string;
    pnrCode: string;            // BE: "pnrCode" (not "pnr")
    status: 'PENDING' | 'AWAITING_PAYMENT' | 'PAID' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED';
    totalAmount: number;        // BigDecimal serialized as number
    createdAt: string;          // ISO-8601
    flightNumber: string;
    origin: string;             // BE sends origin airport code
    destination: string;        // BE sends destination airport code
    departureTime: string;      // ISO-8601
    contactName: string;        // BE: "contactName" (not "customerName")
    contactPhone: string;
    contactEmail: string;
}

// ─── User (matches UserResponse) ──────────────────────────────────────────────

export interface IRole {
    id: number;
    name: string;
    description: string;
}

export interface IUser {
    id: string;
    email: string;
    fullName: string;           // BE: "fullName" (not "name")
    phone: string;
    roles: IRole[];             // BE: Set<Role> serialized as array of { id, name, description }
}

// ─── Shared pagination wrapper (matches BE PageResponse<T>) ──────────────────

export interface IPage<T> {
    currentPage: number;        // BE: "currentPage" (not "page")
    pageSize: number;           // BE: "pageSize" (not "size")
    totalPages: number;
    totalElements: number;
    content: T[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Section 2: API Functions — routes match EXACT Backend controllers ───────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Dashboard stats.
 * ⚠️  NO backend endpoint exists yet — will fail with 404.
 *     Kept as placeholder. The BE team needs to create this endpoint.
 */
export const getDashboardStats = async (): Promise<IDashboardStats> => {
    // const res: IApiResponse<IDashboardStats> = await apiClient.get('/admin/dashboard/stats');
    // return res.result;

    // ✅ TRẢ VỀ MOCK DATA LUÔN ĐỂ VẼ BIỂU ĐỒ
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                totalFlights: 156,
                totalRevenue: 2450000000,
                totalUsers: 1250,
                totalBookings: 845,
                flightsToday: 24,
                newCustomers: 15,
                todayRevenue: 125000000,
                activeFlights: 12,
                pendingBookings: 45,
                totalTicketsSold: 3200
            });
        }, 500); // Giả lập load 0.5s cho đẹp
    });
};

/**
 * Search flights (public endpoint used by admin for listing).
 * POST /flights/search
 *
 * ⚠️  The Backend has NO "GET /admin/flights" list endpoint.
 *     The closest endpoint is POST /flights/search which is the public search.
 *     For admin flight listing, the BE team should create a dedicated endpoint.
 *     Using the search endpoint as a fallback for now.
 *
 * @see FlightController — @PostMapping("/flights/search")
 */
export const getFlights = async (
    params: { origin?: string; destination?: string; departureDate?: string; page?: number; size?: number } = { page: 1, size: 100 },
): Promise<IFlight[]> => {
    console.log("Sending payload:", params);
    const res: IApiResponse<IFlight[]> = await apiClient.post('/flights/search', params);
    return res.result;
};

/**
 * Search bookings (admin, paginated).
 * GET /admin/bookings?page=1&size=10
 *
 * NOTE: BE pagination starts at page=1 (not 0).
 *
 * @see AdminBookingController — @GetMapping("/admin/bookings")
 */
export const getBookings = async (
    params: {
        page?: number;
        size?: number;
        pnrCode?: string;
        contactEmail?: string;
        contactPhone?: string;
        status?: IBooking['status'];
        fromDate?: string;
        toDate?: string;
    } = { page: 1, size: 10 },
): Promise<IPage<IBooking>> => {
    const res: IApiResponse<IPage<IBooking>> = await apiClient.get('/admin/bookings', { params });
    return res.result;
};

/**
 * Get all users (NOT paginated).
 * GET /users
 *
 * NOTE: The BE returns a flat List<UserResponse>, NOT a page.
 *
 * @see UserController — @GetMapping("/users")
 */
export const getUsers = async (): Promise<IUser[]> => {
    const res: IApiResponse<IUser[]> = await apiClient.get('/users');
    return res.result;
};

/**
 * Update a user (general update).
 * PUT /users/{userId}
 *
 * NOTE: The BE has no dedicated "update status" endpoint.
 *       Use this general update endpoint.
 *
 * @see UserController — @PutMapping("/users/{userId}")
 */
export const updateUser = async (
    userId: string,
    payload: Record<string, unknown>,
): Promise<IUser> => {
    const res: IApiResponse<IUser> = await apiClient.put(`/users/${userId}`, payload);
    return res.result;
};

/**
 * Update flight status / schedule (admin).
 * PATCH /v1/admin/flights/{id}
 *
 * @see AdminFlightController — @PatchMapping("/v1/admin/flights/{id}")
 */
export const updateFlight = async (
    id: string,
    payload: IFlightUpdateRequest,
): Promise<IFlightUpdateResponse> => {
    const res: IApiResponse<IFlightUpdateResponse> = await apiClient.patch(`/v1/admin/flights/${id}`, payload);
    return res.result;
};

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Section 3: Legacy exports (backward-compat with existing pages) ─────────
// ═══════════════════════════════════════════════════════════════════════════════

/** @deprecated Use IDashboardStats instead */
export type DashboardStats = Pick<IDashboardStats,
    'totalRevenue' | 'totalBookings' | 'flightsToday' | 'newCustomers'
>;

/** @deprecated Use IFlight instead */
export type Flight = IFlight;

/** @deprecated Use IBooking instead */
export interface Booking {
    id: string;
    bookingCode: string;     // legacy alias for IBooking.pnrCode
    passengerName: string;   // legacy alias for IBooking.contactName
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
    currentPage: number;     // updated to match BE (was "page")
    pageSize: number;        // updated to match BE (was "size")
}

export interface PaginationParams {
    page?: number;
    size?: number;
}

/** @deprecated BE FlightUpdateRequestDTO only accepts departureTime, arrivalTime, status */
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

/** @deprecated Use getDashboardStats (returns IDashboardStats) instead */
export const getLegacyDashboardStats = async (): Promise<DashboardStats> => {
    const res: IApiResponse<DashboardStats> = await apiClient.get('/admin/dashboard/stats');
    return res.result;
};

/**
 * Create flight.
 * ⚠️  NO backend endpoint exists for creating flights.
 *     Kept as placeholder — the BE team needs to implement POST /v1/admin/flights.
 */
export const createFlight = async (payload: FlightPayload): Promise<Flight> => {
    const res: IApiResponse<Flight> = await apiClient.post('/v1/admin/flights', payload);
    return res.result;
};

/**
 * Delete flight.
 * ⚠️  NO backend endpoint exists for deleting flights.
 *     Kept as placeholder — the BE team needs to implement DELETE /v1/admin/flights/{id}.
 */
export const deleteFlight = async (id: string): Promise<void> => {
    await apiClient.delete(`/v1/admin/flights/${id}`);
};

/**
 * Update booking status.
 * ⚠️  NO backend endpoint exists for updating booking status.
 *     Kept as placeholder — the BE team needs to implement
 *     PATCH /admin/bookings/{id}/status.
 */
export const updateBookingStatus = async (
    id: string,
    status: IBooking['status'],
): Promise<IBooking> => {
    const res: IApiResponse<IBooking> = await apiClient.patch(`/admin/bookings/${id}/status`, { status });
    return res.result;
};

/**
 * Legacy alias — kept for backward compat.
 * @deprecated Use updateUser instead.
 */
export const updateUserStatus = async (
    userId: string,
    status: string,
): Promise<IUser> => {
    return updateUser(userId, { status });
};
