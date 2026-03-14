import { useState, useEffect, useCallback, type ChangeEvent } from 'react';
// Tạm thời comment API để chạy Mock Data test giao diện
// import { getBookings, updateBookingStatus } from '../../features/admin/services/adminApi';

// Tự định nghĩa IBooking
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

const STATUS_SELECT_RING: Record<Booking['status'], string> = {
    PENDING: 'ring-yellow-300 bg-yellow-50 text-yellow-700',
    AWAITING_PAYMENT: 'ring-orange-300 bg-orange-50 text-orange-700',
    PAID: 'ring-blue-300 bg-blue-50 text-blue-700',
    CONFIRMED: 'ring-green-300 bg-green-50 text-green-700',
    CANCELLED: 'ring-red-300 bg-red-50 text-red-700',
    REFUNDED: 'ring-gray-300 bg-gray-50 text-gray-600',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('vi-VN', { dateStyle: 'short' });
const fmtVND = (n: number) => n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

// ─── Mock data Động ───────────────────────────────────────────────────────────
const generateMockBookings = (): IBooking[] => {
    const now = new Date();
    const t1 = new Date(now); t1.setHours(now.getHours() - 2);
    const y1 = new Date(now); y1.setDate(y1.getDate() - 1);

    return [
        { id: '1', pnrCode: 'BK-001', contactName: 'Nguyễn Văn A', contactPhone: '0901234567', contactEmail: 'a@mail.com', flightNumber: 'VN-201', origin: 'HAN', destination: 'SGN', departureTime: '2026-03-20T06:00:00', status: 'CONFIRMED', totalAmount: 1250000, createdAt: t1.toISOString() },
        { id: '2', pnrCode: 'BK-002', contactName: 'Trần Thị B', contactPhone: '0901234568', contactEmail: 'b@mail.com', flightNumber: 'VN-305', origin: 'SGN', destination: 'DAD', departureTime: '2026-03-21T10:30:00', status: 'PENDING', totalAmount: 890000, createdAt: now.toISOString() },
        { id: '3', pnrCode: 'BK-003', contactName: 'Lê Văn C', contactPhone: '0901234569', contactEmail: 'c@mail.com', flightNumber: 'QH-102', origin: 'HAN', destination: 'PQC', departureTime: '2026-03-25T14:00:00', status: 'PAID', totalAmount: 1580000, createdAt: y1.toISOString() },
        { id: '4', pnrCode: 'BK-004', contactName: 'Phạm Thị D', contactPhone: '0901234570', contactEmail: 'd@mail.com', flightNumber: 'VJ-411', origin: 'SGN', destination: 'HAN', departureTime: '2026-03-18T18:00:00', status: 'CANCELLED', totalAmount: 1100000, createdAt: y1.toISOString() },
        { id: '5', pnrCode: 'BK-005', contactName: 'Hoàng Văn E', contactPhone: '0901234571', contactEmail: 'e@mail.com', flightNumber: 'VN-789', origin: 'HAN', destination: 'DAD', departureTime: '2026-03-30T20:00:00', status: 'AWAITING_PAYMENT', totalAmount: 750000, createdAt: t1.toISOString() },
    ];
};

type FilterStatus = 'ALL' | Booking['status'];

const FILTER_OPTIONS: { label: string; value: FilterStatus }[] = [
    { label: 'Tất cả', value: 'ALL' },
    { label: 'Xác nhận', value: 'CONFIRMED' },
    { label: 'Đã thanh toán', value: 'PAID' },
    { label: 'Chờ xử lý', value: 'PENDING' },
    { label: 'Đã huỷ', value: 'CANCELLED' },
];

// ─── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            {Array.from({ length: 8 }).map((_, i) => (
                <td key={i} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded w-3/4" /></td>
            ))}
        </tr>
    );
}

// ─── Status Dropdown ───────────────────────────────────────
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
            setLocalStatus(prev);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="relative flex items-center gap-1.5">
            {busy && <span className="inline-block w-3.5 h-3.5 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin flex-shrink-0" />}
            <select
                value={localStatus}
                onChange={handleChange}
                disabled={busy}
                className={[
                    'text-xs font-semibold px-2.5 py-1.5 rounded-lg ring-1 transition appearance-none',
                    'focus:outline-none focus:ring-2 focus:ring-indigo-500',
                    'disabled:opacity-60 cursor-pointer',
                    STATUS_SELECT_RING[localStatus],
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
export default function BookingManagement() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterStatus>('ALL');
    const [search, setSearch] = useState('');
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        if (!toast) return;
        const id = setTimeout(() => setToast(null), 3500);
        return () => clearTimeout(id);
    }, [toast]);

    // Lấy dữ liệu Mock trực tiếp
    useEffect(() => {
        setLoading(true);
        setTimeout(() => {
            setBookings(generateMockBookings());
            setLoading(false);
        }, 500); // Giả lập load
    }, []);

    const counts = (bookings || []).reduce<Partial<Record<Booking['status'], number>>>((acc, b) => {
        if (b && b.status) acc[b.status] = (acc[b.status] ?? 0) + 1;
        return acc;
    }, {});

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

    const handleStatusChange = useCallback(async (id: string, newStatus: Booking['status']): Promise<void> => {
        try {
            // MOCK: Update trực tiếp State
            await new Promise((r) => setTimeout(r, 400));
            setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: newStatus } : b));
            setToast({ msg: `Đã cập nhật trạng thái → ${STATUS_LABELS[newStatus]}.`, type: 'success' });
        } catch (e: unknown) {
            setToast({ msg: `Lỗi cập nhật!`, type: 'error' });
            throw e;
        }
    }, []);

    return (
        <div className="space-y-5 pb-10">
            {toast && (
                <div className={`fixed top-5 right-5 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-in slide-in-from-right-2 ${toast.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                    <span>{toast.type === 'success' ? '✅' : '❌'}</span>
                    <span>{toast.msg}</span>
                    <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70">✕</button>
                </div>
            )}

            <div>
                <h1 className="text-2xl font-bold text-gray-800">🎟️ Quản lý đặt vé</h1>
                <p className="mt-0.5 text-sm font-semibold text-yellow-600 bg-yellow-50 inline-block px-2 py-0.5 rounded border border-yellow-200">🛠 Đang chạy chế độ Test (Mock Data)</p>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex gap-2 flex-wrap bg-white p-1 rounded-xl border border-gray-200">
                    {FILTER_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => setFilter(opt.value)}
                            className={['px-4 py-1.5 rounded-lg text-sm font-medium transition focus:outline-none', filter === opt.value ? 'bg-indigo-600 text-white shadow' : 'bg-transparent text-gray-600 hover:bg-gray-50'].join(' ')}
                        >
                            {opt.label}
                            {!loading && opt.value !== 'ALL' && <span className="ml-1.5 text-xs opacity-70">({counts[opt.value as Booking['status']] ?? 0})</span>}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-auto">
                    <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm pointer-events-none">🔍</span>
                    <input type="text" placeholder="Tìm mã PNR, tên khách..." value={search} onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} className="w-full md:w-64 pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto relative z-0">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 tracking-wide font-bold">
                        <tr>
                            <th className="px-5 py-4">Mã đơn (PNR)</th>
                            <th className="px-5 py-4">Khách hàng</th>
                            <th className="px-5 py-4">Chuyến bay</th>
                            <th className="px-5 py-4">Hành trình</th>
                            <th className="px-5 py-4">Ngày đặt</th>
                            <th className="px-5 py-4">Tổng tiền</th>
                            <th className="px-5 py-4">Trạng thái hiện tại</th>
                            <th className="px-5 py-4">Đổi trạng thái</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />) : visible.length === 0 ? <tr><td colSpan={8} className="px-5 py-12 text-center text-gray-400">Không tìm thấy đơn đặt vé nào.</td></tr> :
                            visible.map((b) => (
                                <tr key={b.id} className="hover:bg-indigo-50/40 transition-colors">
                                    <td className="px-5 py-4 font-mono font-bold text-indigo-700">{b.pnrCode}</td>
                                    <td className="px-5 py-4 text-gray-800 font-medium">
                                        {b.contactName} <div className="text-xs text-gray-500">{b.contactPhone}</div>
                                    </td>
                                    <td className="px-5 py-4 font-bold text-gray-700">{b.flightNumber}</td>
                                    <td className="px-5 py-4 text-gray-600">{b.origin} → {b.destination}</td>
                                    <td className="px-5 py-4 text-gray-600">{fmtDate(b.createdAt)}</td>
                                    <td className="px-5 py-4 text-gray-800 font-bold">{fmtVND(b.totalAmount)}</td>
                                    <td className="px-5 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${STATUS_BADGE[b.status]}`}>
                                            {STATUS_LABELS[b.status]}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <StatusDropdown bookingId={b.id} current={b.status} onChange={handleStatusChange} />
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
                {!loading && (
                    <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-500 font-medium bg-gray-50/50">
                        Hiển thị <span className="font-bold text-gray-800">{visible.length}</span> / {bookings.length} đơn đặt vé
                    </div>
                )}
            </div>
        </div>
    );
}