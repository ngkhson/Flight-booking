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

export interface CreateFlightPayload {
    flightNumber: string;
    airlineCode: string;
    aircraftCode: string;
    originCode: string;
    destinationCode: string;
    departureTime: string;
    arrivalTime: string;
}

export interface UpdateFlightPayload {
    departureTime: string;
    arrivalTime: string;
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
        params: { page: 0, size: 10, ...params }
    });
};

export const searchFlights = async (params: any) => {
    return await axiosClient.get('/v1/admin/flights/search', { params });
};

export const createFlight = async (payload: CreateFlightPayload): Promise<any> => {
    return await axiosClient.post('/v1/admin/flights', payload);
};

export const updateFlight = async (id: string, payload: UpdateFlightPayload): Promise<any> => {
    return await axiosClient.patch(`/v1/admin/flights/${id}`, payload);
};

// ─── API LẤY DANH SÁCH SÂN BAY & HÃNG BAY (cho Dropdown) ─────────────────────
export const getAirports = async (): Promise<any> => {
    return await axiosClient.get('/v1/airports', { params: { size: 500 } });
};

export const getAirlines = async (): Promise<any> => {
    return await axiosClient.get('/v1/airlines', { params: { size: 500 } });
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
// 3. API QUẢN LÝ ĐẶT VÉ (BOOKINGS) — 1-based page
// =====================================================================

export interface IBooking {
    id: string;
    pnrCode: string;
    contactName: string;
    contactPhone?: string;
    contactEmail?: string;
    flightNumber: string;
    origin: any;
    destination: any;
    departureTime: string;
    status: string;
    totalAmount: number;
    createdAt: string;
}

export interface IBookingSearchRequest {
    pnrCode?: string;
    contactPhone?: string;
    contactEmail?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    size?: number;
}

// ─── Booking Detail Interfaces ────────────────────────────────────────────────
export interface IBookingPassenger {
    id: string;
    fullName: string;
    type: string;
    gender?: string;
    dateOfBirth?: string;
    nationality?: string;
    seatNumber?: string;
}

export interface IBookingTicket {
    id: string;
    ticketNumber?: string;
    passengerName?: string;
    seatNumber?: string;
    className?: string;
    price?: number;
    status?: string;
}

export interface IBookingAncillary {
    id: string;
    name: string;
    type?: string;
    code?: string;
    price: number;
    quantity?: number;
    passengerName?: string;
}

export interface IBookingContact {
    fullName?: string;
    phone?: string;
    email?: string;
}

export interface IBookingBaseDetails {
    contact?: IBookingContact;
    passengers?: IBookingPassenger[];
    tickets?: IBookingTicket[];
    ancillaries?: IBookingAncillary[];
}

export interface IBookingTransaction {
    id?: string;
    transactionNo?: string;
    amount?: number;
    paymentMethod?: string;
    status?: string;
    bankRefNo?: string;
    gatewayResponse?: string;
    createdAt?: string;
}

export interface IBookingDetailResponse {
    id: string;
    pnrCode: string;
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
    flightNumber?: string;
    origin?: any;
    destination?: any;
    departureTime?: string;
    status: string;
    totalAmount: number;
    createdAt?: string;
    baseDetails?: IBookingBaseDetails;
    transactions?: IBookingTransaction[];
}
// ─── TRANSACTION INTERFACES ───────────────────────────────────────────────────
export interface ITransaction {
    amount: number;
    paymentMethod: string;
    status: 'PENDING' | 'SUCCESS' | 'FAILED';
    transactionNo: string;
    bankRefNo: string;
    gatewayResponse: string;
    createdAt: string;
}

export interface ITransactionSearchRequest {
    keyword?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    size?: number;
}
// ─── ANCILLARY CATALOG INTERFACES ─────────────────────────────────────────────
export interface IAncillaryCatalog {
    id: string;
    code: string;
    type: string;
    name: string;
    price: number;
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: string;
    updatedAt: string;
}

export interface IAncillaryCatalogSearchRequest {
    keyword?: string;
    type?: string;
    status?: string;
    page?: number;
    size?: number;
}

export interface IAncillaryCatalogCreationRequest {
    code: string;
    type: string;
    name: string;
    price: number;
    status: 'ACTIVE' | 'INACTIVE';
}

export interface IAncillaryCatalogUpdateRequest {
    type: string;
    name: string;
    price: number;
    status: 'ACTIVE' | 'INACTIVE';
}

// =====================================================================
// 2. API QUẢN LÝ CHUYẾN BAY (FLIGHTS)
// =====================================================================

// Mặc định page: 0 theo chuẩn Spring Data JPA thông thường
export const getFlights = async (params?: any): Promise<any> => {
    return await axiosClient.get('/v1/admin/flights', {
        params: { page: 0, size: 10, ...params }
    });
};

export const createFlight = async (payload: CreateFlightPayload): Promise<any> => {
    return await axiosClient.post('/v1/admin/flights', payload);
};

export const updateFlight = async (id: string, payload: UpdateFlightPayload): Promise<any> => {
    return await axiosClient.patch(`/v1/admin/flights/${id}`, payload);
};

// ─── API LẤY DANH SÁCH SÂN BAY & HÃNG BAY (cho Dropdown) ─────────────────────
export const getAirports = async (): Promise<any> => {
    return await axiosClient.get('/v1/airports', { params: { size: 500 } });
};

export const getAirlines = async (): Promise<any> => {
    return await axiosClient.get('/v1/airlines', { params: { size: 500 } });
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
// 3. API QUẢN LÝ ĐẶT VÉ (BOOKINGS) — 1-based page
// =====================================================================


// Booking API dùng 1-based page — FE truyền page trực tiếp (1, 2, 3...)
export const getBookings = async (params: IBookingSearchRequest = { page: 1, size: 10 }): Promise<any> => {
    return await axiosClient.get('/admin/bookings', { params });
};

// Hủy vé: PATCH /admin/bookings/{bookingId}/cancel
export const cancelBooking = async (bookingId: string): Promise<any> => {
    return await axiosClient.patch(`/admin/bookings/${bookingId}/cancel`);
};

// Gửi lại Email xác nhận: POST /admin/bookings/{bookingId}/resend-email
export const resendBookingEmail = async (bookingId: string): Promise<any> => {
    return await axiosClient.post(`/admin/bookings/${bookingId}/resend-email`);
};

// Kiểm tra thanh toán theo PNR: GET /admin/bookings/verify-payment/{pnrCode}
export const verifyPayment = async (pnrCode: string): Promise<any> => {
    return await axiosClient.get(`/admin/bookings/verify-payment/${pnrCode}`);
};

// Xem chi tiết booking: GET /admin/bookings/{bookingId}
export const getBookingDetail = async (bookingId: string): Promise<any> => {
    return await axiosClient.get(`/admin/bookings/${bookingId}`);
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

export const resetUserPassword = async (userId: string, newPassword: string) => {
    return await axiosClient.patch(`/users/${userId}/reset-password`, { newPassword });
};

export const getRoles = async () => {
    return await axiosClient.get('/roles');
};


// ─── API LẤY DANH SÁCH GIAO DỊCH ──────────────────────────────────────────────
// Dùng axiosClient và trả về Promise<any> để tránh lỗi Interface không tồn tại
export const getTransactions = async (params: ITransactionSearchRequest = { page: 1, size: 10 }): Promise<any> => {
    return await axiosClient.get('/admin/transactions', { params });
};



// ─── API DỊCH VỤ PHỤ TRỢ ──────────────────────────────────────────────────────
export const searchAncillaryCatalogs = async (params: IAncillaryCatalogSearchRequest = { page: 1, size: 10 }): Promise<any> => {
    return await axiosClient.get('/ancillary-catalogs/search', { params });
};

export const createAncillaryCatalog = async (payload: IAncillaryCatalogCreationRequest): Promise<any> => {
    return await axiosClient.post('/ancillary-catalogs', payload);
};

export const updateAncillaryCatalog = async (id: string, payload: IAncillaryCatalogUpdateRequest): Promise<any> => {
    return await axiosClient.put(`/ancillary-catalogs/${id}`, payload);
};

export const deleteAncillaryCatalog = async (id: string): Promise<any> => {
    return await axiosClient.delete(`/ancillary-catalogs/${id}`);
};
// ─── API THÔNG TIN CÁ NHÂN & MẬT KHẨU (PROFILE) ───────────────────────────────

export const getMyProfile = async (): Promise<any> => {
    return await axiosClient.get('/users/my-infor');
};

export const updateMyProfile = async (payload: { fullName: string; phone: string }): Promise<any> => {
    return await axiosClient.put('/users/my-infor', payload);
};

export const changeMyPassword = async (payload: { oldPassword: string; newPassword: string; confirmPassword: string }): Promise<any> => {
    return await axiosClient.patch('/users/change-password', payload);
};