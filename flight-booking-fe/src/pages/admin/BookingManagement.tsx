import { useState, useEffect, useCallback, type ChangeEvent } from 'react';
import {
    getBookings,
    updateBookingStatus,
} from '../../features/admin/services/adminApi';

// ─── Tự định nghĩa Interface ──────────────────────────────────────────────────
export interface IBooking {
    id: string;
    pnrCode: string;
    contactName: string;
    contactPhone: string;
    contactEmail: string;
    flightNumber: string;
    origin: string;
    destination: string;
    departureTime: string;
    status: 'PENDING' | 'AWAITING_PAYMENT' | 'PAID' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED' | string;
    totalAmount: number;
    createdAt: string;
}

type Booking = IBooking;

// ─── Constants ────────────────────────────────────────────────────────────────
const BOOKING_STATUSES: Booking['status'][] = [
    'PENDING', 'AWAITING_PAYMENT', 'PAID', 'CONFIRMED', 'CANCELLED', 'REFUNDED',
];

const STATUS_BADGE: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    AWAITING_PAYMENT: 'bg-orange-100 text-orange-700',
    PAID: 'bg-blue-100 text-blue-700',
    CONFIRMED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
    REFUNDED: 'bg-gray-100 text-gray-600',
};

const STATUS_LABELS: Record<string, string> = {
    PENDING: 'Chờ xử lý',
    AWAITING_PAYMENT: 'Chờ thanh toán',
    PAID: 'Đã thanh toán',
    CONFIRMED: 'Xác nhận',
    CANCELLED: 'Đã huỷ',
    REFUNDED: 'Hoàn tiền',
};

const STATUS_SELECT_RING: Record<string, string> = {
    PENDING: 'ring-yellow-300 bg-yellow-50 text-yellow-700',
    AWAITING_PAYMENT: 'ring-orange-300 bg-orange-50 text-orange-700',
    PAID: 'ring-blue-300 bg-blue-50 text-blue-700',
    CONFIRMED: 'ring-green-300 bg-green-50 text-green-700',
    CANCELLED: 'ring-red-300 bg-red-50 text-red-700',
    REFUNDED: 'ring-gray-300 bg-gray-50 text-gray-600',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (iso: string) =>
    iso ? new Date(iso).toLocaleDateString('vi-VN', { dateStyle: 'short' }) : '—';

const fmtVND = (n: number) =>
    (n || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

type FilterStatus = 'ALL' | Booking['status'];

const FILTER_OPTIONS: { label: string; value: FilterStatus }[] = [
    { label: 'Tất cả', value: 'ALL' },
    { label: 'Chờ xử lý', value: 'PENDING' },
    { label: 'Chờ thanh toán', value: 'AWAITING_PAYMENT' },
    { label: 'Đã thanh toán', value: 'PAID' },
    { label: 'Xác nhận', value: 'CONFIRMED' },
    { label: 'Đã huỷ', value: 'CANCELLED' },
    { label: 'Hoàn tiền', value: 'REFUNDED' },
];

// ─── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            {Array.from({ length: 8 }).map((_, i) => (
                <td key={i} className="px-4 py-3">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                </td>
            ))}
        </tr>
    );
}

// ─── Status Dropdown (inline, per row) ───────────────────────────────────────
interface StatusDropdownProps {
    bookingId: string;
    current: Booking['status'];
    onChange: (id: string, newStatus: Booking['status']) => Promise<void>;
}

function StatusDropdown({ bookingId, current, onChange }: StatusDropdownProps) {
    const [busy, setBusy] = useState(false);
    const [localStatus, setLocalStatus] = useState<Booking['status']>(current);

    useEffect(() => setLocalStatus(current), [current]);

    const handleChange = async (e: ChangeEvent<HTMLSelectElement>) => {
        const next = e.target.value as Booking['status'];
        if (next === localStatus) return;

        setBusy(true);
        const prev = localStatus;
        setLocalStatus(next);
        try {
            await onChange(bookingId, next);
        } catch {
            setLocalStatus(prev); // Rollback on error
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="relative flex items-center gap-1.5">
            {busy && (
                <span className="inline-block w-3.5 h-3.5 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin flex-shrink-0" />
            )}
            <select
                value={localStatus}
                onChange={handleChange}
                disabled={busy}
                className={[
                    'text-xs font-semibold px-2.5 py-1.5 rounded-lg ring-1 transition appearance-none pr-6',
                    'focus:outline-none focus:ring-2 focus:ring-indigo-500',
                    'disabled:opacity-60 cursor-pointer',
                    STATUS_SELECT_RING[localStatus] || 'bg-gray-50 text-gray-700 ring-gray-300',
                ].join(' ')}
            >
                {BOOKING_STATUSES.map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] opacity-60">▾</span>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterStatus>('ALL');
    const [search, setSearch] = useState('');
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    // 🚀 Đã chỉnh sửa: 7 items per page
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Reset về trang 1 mỗi khi đổi bộ lọc hoặc gõ tìm kiếm
    useEffect(() => {
        setCurrentPage(1);
    }, [filter, search]);

    useEffect(() => {
        if (!toast) return;
        const id = setTimeout(() => setToast(null), 3500);
        return () => clearTimeout(id);
    }, [toast]);

    const fetchBookings = useCallback(async () => {
        setLoading(true);
        try {
            // Lấy nhiều dữ liệu lên một lúc để Frontend tự phân trang
            const res: any = await getBookings({ page: 1, size: 500 });

            const extractArray = (obj: any): any[] => {
                if (!obj) return [];
                if (Array.isArray(obj)) return obj;
                if (Array.isArray(obj.content)) return obj.content;
                if (Array.isArray(obj.data)) return obj.data;
                if (Array.isArray(obj.result)) return obj.result;
                if (obj.result && typeof obj.result === 'object') {
                    if (Array.isArray(obj.result.content)) return obj.result.content;
                    if (Array.isArray(obj.result.data)) return obj.result.data;
                }
                if (obj.data && typeof obj.data === 'object') {
                    if (Array.isArray(obj.data.content)) return obj.data.content;
                }
                return [];
            };

            const rawArray = extractArray(res);

            const mappedBookings = rawArray.map((b: any) => ({
                id: b.id,
                pnrCode: b.pnrCode || 'N/A',
                contactName: b.contactName || 'Khách hàng',
                contactPhone: b.contactPhone || '',
                contactEmail: b.contactEmail || '',
                flightNumber: b.flightNumber || 'N/A',
                origin: b.origin || 'N/A',
                destination: b.destination || 'N/A',
                departureTime: b.departureTime,
                status: b.status || 'PENDING',
                totalAmount: b.totalAmount || 0,
                createdAt: b.createdAt
            }));

            setBookings(mappedBookings);
        } catch (err) {
            console.error("Lỗi lấy API Booking:", err);
            setBookings([]);
            setToast({ msg: 'Lỗi tải dữ liệu. Vui lòng kiểm tra API.', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchBookings(); }, [fetchBookings]);

    const counts = bookings.reduce<Partial<Record<Booking['status'], number>>>((acc, b) => {
        acc[b.status] = (acc[b.status] ?? 0) + 1;
        return acc;
    }, {});

    const visible = bookings.filter((b) => {
        if (filter !== 'ALL' && b.status !== filter) return false;
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            (b.pnrCode || '').toLowerCase().includes(q) ||
            (b.contactName || '').toLowerCase().includes(q) ||
            (b.flightNumber || '').toLowerCase().includes(q) ||
            (b.contactPhone || '').includes(q)
        );
    });

    // 🚀 Tính toán dữ liệu cho trang hiện tại
    const totalPages = Math.ceil(visible.length / itemsPerPage) || 1;
    const paginatedBookings = visible.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleStatusChange = async (id: string, newStatus: Booking['status']) => {
        try {
            await updateBookingStatus(id, newStatus);
            setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: newStatus } : b));
            setToast({ msg: `Đã cập nhật đơn sang: ${STATUS_LABELS[newStatus]}.`, type: 'success' });
        } catch (e: any) {
            setToast({ msg: 'Lỗi khi cập nhật trạng thái.', type: 'error' });
            throw e;
        }
    };

    return (
        <div className="space-y-5 pb-10">
            {toast && (
                <div className={`fixed top-5 right-5 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-in slide-in-from-right-2 ${toast.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                    <span>{toast.type === 'success' ? '✅' : '❌'}</span>
                    <span>{toast.msg}</span>
                </div>
            )}

            <div>
                <h1 className="text-2xl font-bold text-gray-800">🎟️ Quản lý đặt vé</h1>
                <p className="mt-0.5 text-sm text-gray-500">Danh sách toàn bộ đơn đặt vé trong hệ thống</p>
            </div>

            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div className="flex gap-2 flex-wrap">
                    {FILTER_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => setFilter(opt.value)}
                            className={[
                                'px-4 py-1.5 rounded-xl text-sm font-bold transition focus:outline-none',
                                filter === opt.value
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-400 hover:text-indigo-600',
                            ].join(' ')}
                        >
                            {opt.label}
                            {!loading && opt.value !== 'ALL' && (
                                <span className="ml-1.5 text-xs opacity-80 bg-black/10 px-1.5 py-0.5 rounded-md">
                                    {counts[opt.value] ?? 0}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="relative w-full xl:w-64">
                    <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none">🔍</span>
                    <input
                        type="text"
                        placeholder="Tìm mã PNR, Tên, Số điện thoại..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-bold">
                            <tr>
                                <th className="px-5 py-4">Mã đơn (PNR)</th>
                                <th className="px-5 py-4">Hành khách</th>
                                <th className="px-5 py-4">Chuyến bay</th>
                                <th className="px-5 py-4">Hành trình</th>
                                <th className="px-5 py-4">Ngày đặt</th>
                                <th className="px-5 py-4 text-right">Tổng tiền</th>
                                <th className="px-5 py-4 text-center">Trạng thái (Read-only)</th>
                                <th className="px-5 py-4">Cập nhật</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />) :
                                paginatedBookings.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-5 py-12 text-center text-gray-400">
                                            Không tìm thấy đơn đặt vé nào.
                                        </td>
                                    </tr>
                                ) : paginatedBookings.map((b) => (
                                    <tr key={b.id} className="hover:bg-indigo-50/40 transition-colors group">
                                        <td className="px-5 py-4 font-mono font-bold text-indigo-700">{b.pnrCode}</td>
                                        <td className="px-5 py-4 text-gray-800 font-medium">
                                            <div>{b.contactName}</div>
                                            <div className="text-xs text-gray-500 font-normal mt-0.5">{b.contactPhone}</div>
                                        </td>
                                        <td className="px-5 py-4 font-bold text-gray-700">{b.flightNumber}</td>
                                        <td className="px-5 py-4 text-gray-600 font-medium whitespace-nowrap">{b.origin} <span className="text-gray-400 mx-1">→</span> {b.destination}</td>
                                        <td className="px-5 py-4 text-xs text-gray-600">{fmtDate(b.createdAt)}</td>
                                        <td className="px-5 py-4 text-right text-indigo-600 font-bold">{fmtVND(b.totalAmount)}</td>
                                        <td className="px-5 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${STATUS_BADGE[b.status] || 'bg-gray-100 text-gray-600'}`}>
                                                {STATUS_LABELS[b.status] || b.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <StatusDropdown bookingId={b.id} current={b.status} onChange={handleStatusChange} />
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>

                {/* ─── PHÂN TRANG (PAGINATION) ────────────────────────────────────── */}
                {!loading && visible.length > 0 && (
                    <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                            Hiển thị <span className="font-bold text-gray-700">{(currentPage - 1) * itemsPerPage + 1}</span> đến <span className="font-bold text-gray-700">{Math.min(currentPage * itemsPerPage, visible.length)}</span> trong số <span className="font-bold text-gray-700">{visible.length}</span> đơn
                        </span>

                        <div className="flex flex-wrap items-center justify-end gap-4 w-full">
                            <button onClick={fetchBookings} className="text-indigo-600 hover:text-indigo-800 transition text-xs font-bold flex items-center gap-1 hidden sm:flex">
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

                                {/* Logic render nút có dấu ... */}
                                {(() => {
                                    const pages = [];
                                    const maxVisible = 5; // Số trang tối đa hiển thị xung quanh trang hiện tại

                                    if (totalPages <= maxVisible + 2) {
                                        // Nếu ít trang thì hiện hết
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
                                        // Nếu nhiều trang thì dùng dấu ...
                                        pages.push(
                                            <button key={1} onClick={() => setCurrentPage(1)} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition shadow-sm min-w-[32px] ${currentPage === 1 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>1</button>
                                        );

                                        if (currentPage > 3) {
                                            pages.push(<span key="dots-1" className="px-2 py-1.5 text-gray-400 font-bold">...</span>);
                                        }

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

                                        if (currentPage < totalPages - 2) {
                                            pages.push(<span key="dots-2" className="px-2 py-1.5 text-gray-400 font-bold">...</span>);
                                        }

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
                                            e.currentTarget.value = ''; // Xóa ô sau khi Enter
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