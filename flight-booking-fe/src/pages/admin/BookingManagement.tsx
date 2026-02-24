import { useState, useEffect, useCallback, type ChangeEvent } from 'react';
import {
    getBookings,
    updateBookingStatus,
    type IBooking,
} from '../../features/admin/services/adminApi';

// Convenience alias so the rest of the file stays concise
type Booking = IBooking;

// ─── Constants ────────────────────────────────────────────────────────────────

const BOOKING_STATUSES: Booking['status'][] = ['PENDING', 'CONFIRMED', 'CANCELLED'];

const STATUS_BADGE: Record<Booking['status'], string> = {
    CONFIRMED: 'bg-green-100 text-green-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    CANCELLED: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<Booking['status'], string> = {
    CONFIRMED: 'Xác nhận',
    PENDING: 'Chờ xử lý',
    CANCELLED: 'Đã huỷ',
};

// Dropdown ring colour matches current status so it feels intentional
const STATUS_SELECT_RING: Record<Booking['status'], string> = {
    CONFIRMED: 'ring-green-300 bg-green-50 text-green-700',
    PENDING: 'ring-yellow-300 bg-yellow-50 text-yellow-700',
    CANCELLED: 'ring-red-300 bg-red-50 text-red-700',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('vi-VN', { dateStyle: 'short' });

const fmtVND = (n: number) =>
    n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_BOOKINGS: IBooking[] = [
    { id: '1', pnr: 'BK-001', customerName: 'Nguyễn Văn A', flightId: 'f1', flightNumber: 'VN-201', route: 'HAN → SGN', status: 'CONFIRMED', totalAmount: 1_250_000, createdAt: '2026-02-24T08:00:00' },
    { id: '2', pnr: 'BK-002', customerName: 'Trần Thị B', flightId: 'f2', flightNumber: 'VN-305', route: 'SGN → DAD', status: 'PENDING', totalAmount: 890_000, createdAt: '2026-02-24T09:30:00' },
    { id: '3', pnr: 'BK-003', customerName: 'Lê Văn C', flightId: 'f3', flightNumber: 'QH-102', route: 'HAN → PQC', status: 'CONFIRMED', totalAmount: 1_580_000, createdAt: '2026-02-23T14:20:00' },
    { id: '4', pnr: 'BK-004', customerName: 'Phạm Thị D', flightId: 'f4', flightNumber: 'VJ-411', route: 'SGN → HAN', status: 'CANCELLED', totalAmount: 1_100_000, createdAt: '2026-02-23T11:00:00' },
    { id: '5', pnr: 'BK-005', customerName: 'Hoàng Văn E', flightId: 'f5', flightNumber: 'VN-789', route: 'HAN → DAD', status: 'PENDING', totalAmount: 750_000, createdAt: '2026-02-22T16:45:00' },
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
        setLoading(true);
        getBookings({ page: 0, size: 100 })
            .then((res) => {
                if (!cancelled) { setBookings(res.content); setLoading(false); }
            })
            .catch(() => {
                if (!cancelled) { setBookings(MOCK_BOOKINGS); setIsMock(true); setLoading(false); }
            });
        return () => { cancelled = true; };
    }, []);

    // Counts per status for filter badges
    const counts = bookings.reduce<Record<Booking['status'], number>>(
        (acc, b) => { acc[b.status]++; return acc; },
        { CONFIRMED: 0, PENDING: 0, CANCELLED: 0 },
    );

    // Filtered + searched list
    const visible = bookings.filter((b) => {
        if (filter !== 'ALL' && b.status !== filter) return false;
        const q = search.toLowerCase();
        return (
            !q ||
            b.pnr.toLowerCase().includes(q) ||
            b.customerName.toLowerCase().includes(q) ||
            b.flightNumber.toLowerCase().includes(q) ||
            b.route.toLowerCase().includes(q)
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
                                    ({counts[opt.value as Booking['status']]})
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
                                        <td className="px-4 py-3 font-mono font-semibold text-gray-800">{b.pnr}</td>
                                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{b.customerName}</td>
                                        <td className="px-4 py-3 font-medium text-gray-700">{b.flightNumber}</td>
                                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{b.route}</td>
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
