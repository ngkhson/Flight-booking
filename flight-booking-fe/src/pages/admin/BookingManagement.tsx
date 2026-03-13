import { useState, useEffect, useCallback, type ChangeEvent } from 'react';
import {
    getBookings,
    updateBookingStatus,
} from '../../features/admin/services/adminApi';

// Tự định nghĩa IBooking tại đây thay vì import từ adminApi bị thiếu
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
    status: 'PENDING' | 'AWAITING_PAYMENT' | 'PAID' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED';
    totalAmount: number;
    createdAt: string;
}

// Convenience alias so the rest of the file stays concise
type Booking = IBooking;
// ─── Constants ────────────────────────────────────────────────────────────────

const BOOKING_STATUSES: Booking['status'][] = [
    'PENDING', 'AWAITING_PAYMENT', 'PAID', 'CONFIRMED', 'CANCELLED', 'REFUNDED',
];

const STATUS_BADGE: Record<Booking['status'], string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    AWAITING_PAYMENT: 'bg-orange-100 text-orange-700',
    PAID: 'bg-blue-100 text-blue-700',
    CONFIRMED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
    REFUNDED: 'bg-gray-100 text-gray-600',
};

const STATUS_LABELS: Record<Booking['status'], string> = {
    PENDING: 'Chờ xử lý',
    AWAITING_PAYMENT: 'Chờ thanh toán',
    PAID: 'Đã thanh toán',
    CONFIRMED: 'Xác nhận',
    CANCELLED: 'Đã huỷ',
    REFUNDED: 'Hoàn tiền',
};

// Dropdown ring colour matches current status so it feels intentional
const STATUS_SELECT_RING: Record<Booking['status'], string> = {
    PENDING: 'ring-yellow-300 bg-yellow-50 text-yellow-700',
    AWAITING_PAYMENT: 'ring-orange-300 bg-orange-50 text-orange-700',
    PAID: 'ring-blue-300 bg-blue-50 text-blue-700',
    CONFIRMED: 'ring-green-300 bg-green-50 text-green-700',
    CANCELLED: 'ring-red-300 bg-red-50 text-red-700',
    REFUNDED: 'ring-gray-300 bg-gray-50 text-gray-600',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('vi-VN', { dateStyle: 'short' });

const fmtVND = (n: number) =>
    n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_BOOKINGS: IBooking[] = [
    { id: '1', pnrCode: 'BK-001', contactName: 'Nguyễn Văn A', contactPhone: '0901234567', contactEmail: 'a@mail.com', flightNumber: 'VN-201', origin: 'HAN', destination: 'SGN', departureTime: '2026-02-25T06:00:00', status: 'CONFIRMED', totalAmount: 1_250_000, createdAt: '2026-02-24T08:00:00' },
    { id: '2', pnrCode: 'BK-002', contactName: 'Trần Thị B', contactPhone: '0901234568', contactEmail: 'b@mail.com', flightNumber: 'VN-305', origin: 'SGN', destination: 'DAD', departureTime: '2026-02-25T10:30:00', status: 'PENDING', totalAmount: 890_000, createdAt: '2026-02-24T09:30:00' },
    { id: '3', pnrCode: 'BK-003', contactName: 'Lê Văn C', contactPhone: '0901234569', contactEmail: 'c@mail.com', flightNumber: 'QH-102', origin: 'HAN', destination: 'PQC', departureTime: '2026-02-25T14:00:00', status: 'CONFIRMED', totalAmount: 1_580_000, createdAt: '2026-02-23T14:20:00' },
    { id: '4', pnrCode: 'BK-004', contactName: 'Phạm Thị D', contactPhone: '0901234570', contactEmail: 'd@mail.com', flightNumber: 'VJ-411', origin: 'SGN', destination: 'HAN', departureTime: '2026-02-24T18:00:00', status: 'CANCELLED', totalAmount: 1_100_000, createdAt: '2026-02-23T11:00:00' },
    { id: '5', pnrCode: 'BK-005', contactName: 'Hoàng Văn E', contactPhone: '0901234571', contactEmail: 'e@mail.com', flightNumber: 'VN-789', origin: 'HAN', destination: 'DAD', departureTime: '2026-02-25T20:00:00', status: 'PENDING', totalAmount: 750_000, createdAt: '2026-02-22T16:45:00' },
];

type FilterStatus = 'ALL' | Booking['status'];

const FILTER_OPTIONS: { label: string; value: FilterStatus }[] = [
    { label: 'Tất cả', value: 'ALL' },
    { label: 'Xác nhận', value: 'CONFIRMED' },
    { label: 'Chờ xử lý', value: 'PENDING' },
    { label: 'Đã huỷ', value: 'CANCELLED' },
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

    // Keep local state in sync when parent list re-renders
    useEffect(() => setLocalStatus(current), [current]);

    const handleChange = async (e: ChangeEvent<HTMLSelectElement>) => {
        const next = e.target.value as Booking['status'];
        if (next === localStatus) return;

        setBusy(true);
        const prev = localStatus;
        setLocalStatus(next); // Optimistic
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
                aria-label={`Trạng thái đơn ${bookingId}`}
                className={[
                    'text-xs font-semibold px-2.5 py-1 rounded-lg ring-1 transition appearance-none',
                    'focus:outline-none focus:ring-2 focus:ring-indigo-500',
                    'disabled:opacity-60 cursor-pointer',
                    STATUS_SELECT_RING[localStatus],
                ].join(' ')}
            >
                {BOOKING_STATUSES.map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
            </select>
            {/* Custom chevron */}
            <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] opacity-60">▾</span>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BookingManagement() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMock, setIsMock] = useState(false);
    const [filter, setFilter] = useState<FilterStatus>('ALL');
    const [search, setSearch] = useState('');

    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    // Toast auto-dismiss
    useEffect(() => {
        if (!toast) return;
        const id = setTimeout(() => setToast(null), 3500);
        return () => clearTimeout(id);
    }, [toast]);

    // Load bookings
    useEffect(() => {
        let cancelled = false;
        setLoading(true); // Nhớ bật loading trước khi gọi

        getBookings({ page: 1, size: 100 })
            .then((res: any) => {
                if (!cancelled) {
                    console.log("🔥 Booking API Data:", res);
                    let bookingArray: any[] = [];

                    // Bóc tách mảng an toàn
                    if (Array.isArray(res)) {
                        bookingArray = res;
                    } else if (res && typeof res === 'object') {
                        if (Array.isArray(res.data?.content)) bookingArray = res.data.content;
                        else if (Array.isArray(res.result?.content)) bookingArray = res.result.content;
                        else if (Array.isArray(res.content)) bookingArray = res.content;
                        else if (Array.isArray(res.data)) bookingArray = res.data;
                        else if (Array.isArray(res.result)) bookingArray = res.result;
                    }

                    // Chốt chặn cuối cùng
                    if (!Array.isArray(bookingArray)) {
                        bookingArray = [];
                    }

                    setBookings(bookingArray);
                    setLoading(false);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    console.error("Lỗi lấy API Booking:", err);
                    // Rớt mạng hoặc lỗi thì dùng Mock Data (Giữ nguyên logic cũ của bạn)
                    setBookings(MOCK_BOOKINGS);
                    setIsMock(true);
                    setLoading(false);
                }
            });
        return () => { cancelled = true; };
    }, []);

    // Counts per status for filter badges (Đã thêm bọc thép bằng: bookings || [])
    const counts = (bookings || []).reduce<Partial<Record<Booking['status'], number>>>(
        (acc, b) => {
            if (b && b.status) {
                acc[b.status] = (acc[b.status] ?? 0) + 1;
            }
            return acc;
        },
        {},
    );

    // Filtered + searched list (Đã thêm bọc thép)
    const visible = (bookings || []).filter((b) => {
        if (!b) return false;
        if (filter !== 'ALL' && b.status !== filter) return false;
        const q = search.toLowerCase();
        return (
            !q ||
            (b.pnrCode && b.pnrCode.toLowerCase().includes(q)) ||
            (b.contactName && b.contactName.toLowerCase().includes(q)) ||
            (b.flightNumber && b.flightNumber.toLowerCase().includes(q)) ||
            (b.origin && b.destination && `${b.origin} → ${b.destination}`.toLowerCase().includes(q))
        );
    });

    const handleStatusChange = useCallback(async (
        id: string,
        newStatus: Booking['status'],
    ): Promise<void> => {
        try {
            if (isMock) {
                // Simulate latency in mock mode
                await new Promise((r) => setTimeout(r, 350));
                setBookings((prev) =>
                    prev.map((b) => b.id === id ? { ...b, status: newStatus } : b),
                );
            } else {
                // API returns updated booking; merge back into list
                await updateBookingStatus(id, newStatus);
                setBookings((prev) =>
                    prev.map((b) => b.id === id ? { ...b, status: newStatus } : b),
                );
            }
            setToast({ msg: `Đã cập nhật trạng thái → ${STATUS_LABELS[newStatus]}.`, type: 'success' });
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Lỗi không xác định.';
            setToast({ msg: `Không thể cập nhật: ${msg}`, type: 'error' });
            throw e; // rethrow so StatusDropdown can rollback
        }
    }, [isMock]);

    return (
        <div className="space-y-5">
            {/* Toast */}
            {toast && (
                <div
                    className={`fixed top-5 right-5 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === 'success'
                        ? 'bg-green-50 border border-green-200 text-green-700'
                        : 'bg-red-50 border border-red-200 text-red-700'
                        }`}
                >
                    <span>{toast.type === 'success' ? '✅' : '❌'}</span>
                    <span>{toast.msg}</span>
                    <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70" aria-label="Đóng thông báo">✕</button>
                </div>
            )}

            {/* Page header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">🎟️ Quản lý đặt vé</h1>
                <p className="mt-0.5 text-sm text-gray-500">Xem và cập nhật trạng thái đơn đặt vé</p>
            </div>

            {/* Mock-data warning */}
            {isMock && (
                <div className="px-4 py-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm flex items-center gap-2">
                    <span>⚠️</span>
                    <span>Không thể kết nối API — đang dùng dữ liệu mẫu. Thay đổi trạng thái cập nhật cục bộ.</span>
                </div>
            )}

            {/* Toolbar: filter tabs + search */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                {/* Status filter tabs */}
                <div className="flex gap-2 flex-wrap">
                    {FILTER_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => setFilter(opt.value)}
                            className={[
                                'px-4 py-1.5 rounded-full text-sm font-medium transition focus:outline-none',
                                filter === opt.value
                                    ? 'bg-indigo-600 text-white shadow'
                                    : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-400 hover:text-indigo-600',
                            ].join(' ')}
                        >
                            {opt.label}
                            {!loading && opt.value !== 'ALL' && (
                                <span className="ml-1.5 text-xs opacity-70">
                                    ({counts[opt.value as Booking['status']] ?? 0})
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm pointer-events-none">🔍</span>
                    <input
                        id="search-bookings"
                        type="text"
                        placeholder="Tìm mã, tên, chuyến bay..."
                        value={search}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition w-56"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 tracking-wide">
                        <tr>
                            <th className="px-4 py-3">Mã đơn</th>
                            <th className="px-4 py-3">Hành khách</th>
                            <th className="px-4 py-3">Chuyến bay</th>
                            <th className="px-4 py-3">Hành trình</th>
                            <th className="px-4 py-3">Ngày đặt</th>
                            <th className="px-4 py-3">Tổng tiền</th>
                            <th className="px-4 py-3">Trạng thái hiện tại</th>
                            <th className="px-4 py-3">Đổi trạng thái</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading
                            ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                            : visible.length === 0
                                ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-sm">
                                            Không tìm thấy đơn đặt vé nào.
                                        </td>
                                    </tr>
                                )
                                : visible.map((b) => (
                                    <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 font-mono font-semibold text-gray-800">{b.pnrCode}</td>
                                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{b.contactName}</td>
                                        <td className="px-4 py-3 font-medium text-gray-700">{b.flightNumber}</td>
                                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{b.origin} → {b.destination}</td>
                                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmtDate(b.createdAt)}</td>
                                        <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">{fmtVND(b.totalAmount)}</td>

                                        {/* Read-only badge */}
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[b.status]}`}>
                                                {STATUS_LABELS[b.status]}
                                            </span>
                                        </td>

                                        {/* Editable dropdown */}
                                        <td className="px-4 py-3">
                                            <StatusDropdown
                                                bookingId={b.id}
                                                current={b.status}
                                                onChange={handleStatusChange}
                                            />
                                        </td>
                                    </tr>
                                ))
                        }
                    </tbody>
                </table>

                {/* Footer */}
                {!loading && (
                    <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400 flex items-center justify-between">
                        <span>Hiển thị {visible.length} / {bookings.length} đơn đặt vé</span>
                        {isMock && <span className="text-yellow-600 font-medium">● Dữ liệu mẫu</span>}
                    </div>
                )}
            </div>
        </div>
    );
}
