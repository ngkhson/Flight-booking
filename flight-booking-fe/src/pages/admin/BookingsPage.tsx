import { useState, useEffect, useCallback, useRef } from 'react';
import {
    getBookings, updateBookingStatus,
    type IBooking, type IBookingSearchRequest
} from '../../features/admin/services/adminApi';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
    CONFIRMED: 'bg-green-100 text-green-700 border-green-200',
    PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    CANCELLED: 'bg-red-100 text-red-700 border-red-200',
    PAID: 'bg-blue-100 text-blue-700 border-blue-200',
    AWAITING_PAYMENT: 'bg-orange-100 text-orange-700 border-orange-200',
    REFUNDED: 'bg-gray-100 text-gray-600 border-gray-200',
};

const STATUS_LABELS: Record<string, string> = {
    CONFIRMED: 'Xác nhận',
    PENDING: 'Chờ xử lý',
    CANCELLED: 'Đã huỷ',
    PAID: 'Đã thanh toán',
    AWAITING_PAYMENT: 'Chờ thanh toán',
    REFUNDED: 'Hoàn tiền',
};

// Danh sách status cho filter dropdown
const FILTER_STATUS_OPTIONS = [
    { label: 'Tất cả trạng thái', value: '' },
    { label: 'Chờ xử lý', value: 'PENDING' },
    { label: 'Chờ thanh toán', value: 'AWAITING_PAYMENT' },
    { label: 'Đã thanh toán', value: 'PAID' },
    { label: 'Xác nhận', value: 'CONFIRMED' },
    { label: 'Đã huỷ', value: 'CANCELLED' },
    { label: 'Hoàn tiền', value: 'REFUNDED' },
];

// Logic chuyển đổi trạng thái: key = status hiện tại, value = danh sách status được phép chuyển sang
const STATUS_TRANSITIONS: Record<string, string[]> = {
    PENDING: ['AWAITING_PAYMENT', 'CANCELLED'],
    AWAITING_PAYMENT: ['CONFIRMED', 'CANCELLED'],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (iso: string) =>
    iso ? new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const fmtVND = (n: number) =>
    (n || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

const resolveStr = (val: any): string => {
    if (!val) return '—';
    if (typeof val === 'object') return val.code || val.name || val.cityCode || '—';
    return val;
};

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            {Array.from({ length: 8 }).map((_, i) => (
                <td key={i} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded w-3/4" /></td>
            ))}
        </tr>
    );
}

// ─── Status Cell Component ────────────────────────────────────────────────────

function StatusCell({ booking, onStatusChange }: { booking: IBooking; onStatusChange: (id: string, newStatus: string) => void }) {
    const transitions = STATUS_TRANSITIONS[booking.status];
    const [isUpdating, setIsUpdating] = useState(false);

    // Nếu status không có transition -> hiển thị badge tĩnh (read-only)
    if (!transitions || transitions.length === 0) {
        return (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${STATUS_STYLES[booking.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                {STATUS_LABELS[booking.status] || booking.status}
            </span>
        );
    }

    // Nếu có transition -> hiển thị dropdown cho phép chuyển đổi
    const handleChange = async (newStatus: string) => {
        if (!newStatus || newStatus === booking.status) return;
        setIsUpdating(true);
        try {
            await onStatusChange(booking.id, newStatus);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="relative">
            <select
                value={booking.status}
                onChange={(e) => handleChange(e.target.value)}
                disabled={isUpdating}
                className={`appearance-none px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer transition focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-6 ${isUpdating ? 'opacity-50 cursor-wait' : ''} ${STATUS_STYLES[booking.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}
            >
                <option value={booking.status}>{STATUS_LABELS[booking.status] || booking.status}</option>
                {transitions.map(s => (
                    <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>
                ))}
            </select>
            {isUpdating && (
                <svg className="animate-spin h-3 w-3 absolute right-1 top-1/2 -translate-y-1/2 text-gray-500" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            )}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BookingsPage() {
    // Data state
    const [bookings, setBookings] = useState<IBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState<string | null>(null);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    // Phân trang — API Booking dùng 1-based page
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);
    const pageSize = 10;

    // Filter params — gửi trực tiếp lên server
    const [filterParams, setFilterParams] = useState({
        keyword: '',   // Dùng local để map sang pnrCode/contactPhone/contactEmail
        status: '',
        fromDate: '',
        toDate: '',
    });

    // Debounce search
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Toast auto-hide
    useEffect(() => {
        if (!toast) return;
        const id = setTimeout(() => setToast(null), 3500);
        return () => clearTimeout(id);
    }, [toast]);

    // ─── GỌI API ───────────────────────────────────────────────────────────────
    const loadData = useCallback(async () => {
        setLoading(true);
        setApiError(null);
        try {
            const params: IBookingSearchRequest = {
                page: currentPage,  // 1-based, gửi trực tiếp
                size: pageSize,
            };

            // Backend hỗ trợ search theo pnrCode, contactPhone, contactEmail
            // Gửi keyword vào pnrCode (backend sẽ tìm theo LIKE)
            if (filterParams.keyword) {
                params.pnrCode = filterParams.keyword;
            }
            if (filterParams.status) {
                params.status = filterParams.status;
            }
            // Format ngày tháng: HTML date input trả về YYYY-MM-DD
            // Spring Boot LocalDateTime cần ISO datetime → append T00:00:00
            if (filterParams.fromDate) {
                params.fromDate = `${filterParams.fromDate}T00:00:00`;
            }
            if (filterParams.toDate) {
                params.toDate = `${filterParams.toDate}T23:59:59`;
            }

            const res: any = await getBookings(params);

            // Bóc tách response
            const responseData = res?.result || res?.data || res;

            // Map dữ liệu
            const rawList = responseData?.data || responseData?.content || [];
            const mappedBookings: IBooking[] = (Array.isArray(rawList) ? rawList : []).map((b: any) => ({
                id: b.id || '',
                pnrCode: b.pnrCode || '—',
                contactName: b.contactName || '—',
                contactPhone: b.contactPhone,
                contactEmail: b.contactEmail,
                flightNumber: b.flightNumber || (typeof b.flight === 'object' ? b.flight?.flightNumber : '') || '—',
                origin: b.origin || (typeof b.flight === 'object' ? b.flight?.origin : null),
                destination: b.destination || (typeof b.flight === 'object' ? b.flight?.destination : null),
                departureTime: b.departureTime || (typeof b.flight === 'object' ? b.flight?.departureTime : ''),
                status: b.status || 'PENDING',
                totalAmount: b.totalAmount || 0,
                createdAt: b.createdAt || '',
            }));

            setBookings(mappedBookings);
            setTotalPages(responseData?.totalPages || 1);
            setTotalElements(responseData?.totalElements || mappedBookings.length);
        } catch (error: any) {
            console.error("Lỗi lấy dữ liệu đặt vé:", error);
            setApiError(error?.response?.data?.message || "Không thể kết nối đến máy chủ.");
            setBookings([]);
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, filterParams]);

    useEffect(() => { loadData(); }, [loadData]);

    // ─── HANDLERS ──────────────────────────────────────────────────────────────
    const handleSearchChange = (val: string) => {
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            setFilterParams(prev => ({ ...prev, keyword: val }));
            setCurrentPage(1);
        }, 500);
    };

    const handleFilterChange = (field: string, value: string) => {
        setFilterParams(prev => ({ ...prev, [field]: value }));
        setCurrentPage(1);
    };

    const handleStatusChange = async (bookingId: string, newStatus: string) => {
        try {
            await updateBookingStatus(bookingId, newStatus);
            // Cập nhật UI local ngay lập tức
            setBookings(prev => prev.map(b =>
                b.id === bookingId ? { ...b, status: newStatus } : b
            ));
            setToast({ msg: `Đã chuyển trạng thái sang ${STATUS_LABELS[newStatus] || newStatus}`, type: 'success' });
        } catch (err: any) {
            setToast({ msg: err?.response?.data?.message || 'Lỗi cập nhật trạng thái!', type: 'error' });
        }
    };

    // ─── RENDER ─────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-5 pb-10">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-5 right-5 z-[100] px-4 py-3 rounded-xl shadow-lg border font-medium animate-in slide-in-from-right-2 ${toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">🎟️ Quản lý đặt vé</h1>
                    <p className="mt-0.5 text-sm text-gray-500">Quản lý toàn bộ đơn đặt vé trong hệ thống</p>
                </div>
                <button onClick={loadData} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-100 transition flex items-center gap-2">
                    🔄 Làm mới
                </button>
            </div>

            {/* Bộ lọc */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between">
                {/* Search */}
                <div className="flex-1 max-w-md relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none">🔍</span>
                    <input
                        type="text"
                        placeholder="Tìm theo mã PNR, SĐT hoặc email..."
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm text-gray-700 font-medium"
                    />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    <select
                        value={filterParams.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="py-2.5 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                        {FILTER_STATUS_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>

                    <input
                        type="date"
                        value={filterParams.fromDate}
                        onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                        className="py-2.5 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        title="Từ ngày"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                        type="date"
                        value={filterParams.toDate}
                        onChange={(e) => handleFilterChange('toDate', e.target.value)}
                        className="py-2.5 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        title="Đến ngày"
                    />
                </div>
            </div>

            {/* Error */}
            {apiError && (
                <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                    <span>⚠️</span>
                    <span>{apiError}</span>
                </div>
            )}

            {/* Bảng */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-2 text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 font-semibold text-sm shadow-sm">
                        🎟️ Tổng số: {totalElements} đơn đặt vé
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50/80 text-xs uppercase text-gray-500 tracking-wider font-bold border-b border-gray-100">
                            <tr>
                                <th className="px-5 py-4">Mã PNR</th>
                                <th className="px-5 py-4">Hành khách</th>
                                <th className="px-5 py-4">Chuyến bay</th>
                                <th className="px-5 py-4">Hành trình</th>
                                <th className="px-5 py-4">Ngày đặt</th>
                                <th className="px-5 py-4">Khởi hành</th>
                                <th className="px-5 py-4 text-right">Tổng tiền</th>
                                <th className="px-5 py-4 text-center">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-gray-700">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                            ) : bookings.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-5 py-16 text-center">
                                        <div className="inline-flex flex-col items-center justify-center text-gray-400">
                                            <span className="text-4xl mb-3">📭</span>
                                            <p className="text-base font-medium">Không tìm thấy đơn đặt vé nào</p>
                                            <p className="text-xs mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                bookings.map((b) => (
                                    <tr key={b.id} className="hover:bg-indigo-50/30 transition-colors group">
                                        <td className="px-5 py-4 font-mono font-bold text-indigo-700">{b.pnrCode}</td>
                                        <td className="px-5 py-4">
                                            <div className="font-semibold text-gray-800">{b.contactName}</div>
                                            {b.contactPhone && <div className="text-xs text-gray-400">{b.contactPhone}</div>}
                                        </td>
                                        <td className="px-5 py-4 font-medium text-gray-700">{b.flightNumber}</td>
                                        <td className="px-5 py-4 font-bold text-gray-800">
                                            {resolveStr(b.origin)} <span className="text-gray-400 font-normal mx-1">→</span> {resolveStr(b.destination)}
                                        </td>
                                        <td className="px-5 py-4 text-gray-500 text-xs font-medium">{fmtDate(b.createdAt)}</td>
                                        <td className="px-5 py-4 text-gray-500 text-xs font-medium">{fmtDate(b.departureTime)}</td>
                                        <td className="px-5 py-4 text-right text-indigo-600 font-bold">{fmtVND(b.totalAmount)}</td>
                                        <td className="px-5 py-4 text-center">
                                            <StatusCell booking={b} onStatusChange={handleStatusChange} />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ─── PHÂN TRANG (PAGINATION) ────────────────────────────────────── */}
                {!loading && totalPages > 1 && (
                    <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-b-2xl">
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                            Hiển thị trang <span className="font-bold text-gray-700">{currentPage}</span> / {totalPages} (Tổng: <span className="font-bold text-gray-700">{totalElements}</span> đơn)
                        </span>

                        <div className="flex flex-wrap items-center justify-end gap-4 w-full">
                            <button onClick={loadData} className="text-indigo-600 hover:text-indigo-800 transition text-xs font-bold flex items-center gap-1 hidden sm:flex">
                                🔄 Làm mới
                            </button>

                            {/* Bộ nút phân trang */}
                            <div className="flex flex-wrap gap-1">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
                                >
                                    Trước
                                </button>

                                {(() => {
                                    const pages = [];
                                    const maxVisible = 5;

                                    if (totalPages <= maxVisible + 2) {
                                        for (let i = 1; i <= totalPages; i++) {
                                            pages.push(
                                                <button
                                                    key={i}
                                                    onClick={() => setCurrentPage(i)}
                                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition shadow-sm min-w-[32px] ${currentPage === i ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                                                >
                                                    {i}
                                                </button>
                                            );
                                        }
                                    } else {
                                        pages.push(
                                            <button key={1} onClick={() => setCurrentPage(1)} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition shadow-sm min-w-[32px] ${currentPage === 1 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>1</button>
                                        );
                                        if (currentPage > 3) pages.push(<span key="dots-1" className="px-2 py-1.5 text-gray-400 font-bold">...</span>);

                                        let startPage = Math.max(2, currentPage - 1);
                                        let endPage = Math.min(totalPages - 1, currentPage + 1);
                                        if (currentPage === 1) endPage = 3;
                                        if (currentPage === totalPages) startPage = totalPages - 2;

                                        for (let i = startPage; i <= endPage; i++) {
                                            pages.push(
                                                <button
                                                    key={i}
                                                    onClick={() => setCurrentPage(i)}
                                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition shadow-sm min-w-[32px] ${currentPage === i ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                                                >
                                                    {i}
                                                </button>
                                            );
                                        }

                                        if (currentPage < totalPages - 2) pages.push(<span key="dots-2" className="px-2 py-1.5 text-gray-400 font-bold">...</span>);
                                        pages.push(
                                            <button key={totalPages} onClick={() => setCurrentPage(totalPages)} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition shadow-sm min-w-[32px] ${currentPage === totalPages ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>{totalPages}</button>
                                        );
                                    }
                                    return pages;
                                })()}

                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
                                >
                                    Sau
                                </button>
                            </div>

                            {/* Ô nhập số trang nhảy tới */}
                            <div className="flex items-center gap-2 border-l border-gray-200 pl-4 ml-2">
                                <span className="text-xs text-gray-500 font-medium">Đến trang:</span>
                                <input
                                    type="number"
                                    min="1"
                                    max={totalPages}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const val = parseInt(e.currentTarget.value);
                                            if (val >= 1 && val <= totalPages) setCurrentPage(val);
                                            e.currentTarget.value = '';
                                        }
                                    }}
                                    placeholder="#"
                                    className="w-12 px-2 py-1 text-xs font-bold text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 hide-arrows"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}