import { useState, useEffect } from 'react';
import { getBookings, type IBooking } from '../../features/admin/services/adminApi';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<IBooking['status'], string> = {
    CONFIRMED: 'bg-green-100 text-green-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    CANCELLED: 'bg-red-100 text-red-700',
    PAID: 'bg-blue-100 text-blue-700',
    AWAITING_PAYMENT: 'bg-orange-100 text-orange-700',
    REFUNDED: 'bg-gray-100 text-gray-600',
};

const STATUS_LABELS: Record<IBooking['status'], string> = {
    CONFIRMED: 'Xác nhận',
    PENDING: 'Chờ xử lý',
    CANCELLED: 'Đã huỷ',
    PAID: 'Đã thanh toán',
    AWAITING_PAYMENT: 'Chờ thanh toán',
    REFUNDED: 'Hoàn tiền',
};

const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('vi-VN', { dateStyle: 'short' });

const fmtVND = (n: number) =>
    n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

// ─── Mock data (fallback) ─────────────────────────────────────────────────────

const MOCK_BOOKINGS: IBooking[] = [
    { id: '1', pnrCode: 'BK-001', contactName: 'Nguyễn Văn A', contactPhone: '0901234567', contactEmail: 'a@mail.com', flightNumber: 'VN-201', origin: 'HAN', destination: 'SGN', departureTime: '2026-02-25T06:00:00', status: 'CONFIRMED', totalAmount: 1_250_000, createdAt: '2026-02-24T08:00:00' },
    { id: '2', pnrCode: 'BK-002', contactName: 'Trần Thị B', contactPhone: '0901234568', contactEmail: 'b@mail.com', flightNumber: 'VN-305', origin: 'SGN', destination: 'DAD', departureTime: '2026-02-25T10:30:00', status: 'PENDING', totalAmount: 890_000, createdAt: '2026-02-24T09:30:00' },
    { id: '3', pnrCode: 'BK-003', contactName: 'Lê Văn C', contactPhone: '0901234569', contactEmail: 'c@mail.com', flightNumber: 'QH-102', origin: 'HAN', destination: 'PQC', departureTime: '2026-02-25T14:00:00', status: 'CONFIRMED', totalAmount: 1_580_000, createdAt: '2026-02-23T14:20:00' },
    { id: '4', pnrCode: 'BK-004', contactName: 'Phạm Thị D', contactPhone: '0901234570', contactEmail: 'd@mail.com', flightNumber: 'VJ-411', origin: 'SGN', destination: 'HAN', departureTime: '2026-02-24T18:00:00', status: 'CANCELLED', totalAmount: 1_100_000, createdAt: '2026-02-23T11:00:00' },
    { id: '5', pnrCode: 'BK-005', contactName: 'Hoàng Văn E', contactPhone: '0901234571', contactEmail: 'e@mail.com', flightNumber: 'VN-789', origin: 'HAN', destination: 'DAD', departureTime: '2026-02-25T20:00:00', status: 'PENDING', totalAmount: 750_000, createdAt: '2026-02-22T16:45:00' },
];

type FilterStatus = 'ALL' | IBooking['status'];

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            {Array.from({ length: 7 }).map((_, i) => (
                <td key={i} className="px-4 py-3">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                </td>
            ))}
        </tr>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BookingsPage() {
    const [bookings, setBookings] = useState<IBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState(false);
    const [filter, setFilter] = useState<FilterStatus>('ALL');

    useEffect(() => {
        let cancelled = false;

        getBookings({ page: 1, size: 50 })
            .then((res) => {
                if (!cancelled) {
                    setBookings(res.content);
                    setLoading(false);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setBookings(MOCK_BOOKINGS);
                    setApiError(true);
                    setLoading(false);
                }
            });

        return () => { cancelled = true; };
    }, []);

    const filtered =
        filter === 'ALL' ? bookings : bookings.filter((b) => b.status === filter);

    const FILTER_OPTIONS: { label: string; value: FilterStatus }[] = [
        { label: 'Tất cả', value: 'ALL' },
        { label: 'Xác nhận', value: 'CONFIRMED' },
        { label: 'Chờ xử lý', value: 'PENDING' },
        { label: 'Đã huỷ', value: 'CANCELLED' },
    ];

    return (
        <div className="space-y-5">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">🎟️ Quản lý đặt vé</h1>
                <p className="mt-0.5 text-sm text-gray-500">Danh sách toàn bộ đơn đặt vé trong hệ thống</p>
            </div>

            {/* API warning */}
            {apiError && (
                <div className="px-4 py-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm flex items-center gap-2">
                    <span>⚠️</span>
                    <span>Không thể kết nối API — đang hiển thị dữ liệu mẫu.</span>
                </div>
            )}

            {/* Filter tabs */}
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
                                ({bookings.filter((b) => b.status === opt.value).length})
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 tracking-wide">
                        <tr>
                            <th className="px-4 py-3">Mã đặt vé</th>
                            <th className="px-4 py-3">Hành khách</th>
                            <th className="px-4 py-3">Chuyến bay</th>
                            <th className="px-4 py-3">Hành trình</th>
                            <th className="px-4 py-3">Ngày đặt</th>
                            <th className="px-4 py-3">Tổng tiền</th>
                            <th className="px-4 py-3">Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading
                            ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                            : filtered.length === 0
                                ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-10 text-center text-gray-400 text-sm">
                                            Không có đơn đặt vé nào.
                                        </td>
                                    </tr>
                                )
                                : filtered.map((b) => (
                                    <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 font-mono font-semibold text-gray-800">{b.pnrCode}</td>
                                        <td className="px-4 py-3 text-gray-700">{b.contactName}</td>
                                        <td className="px-4 py-3 font-medium text-gray-700">{b.flightNumber}</td>
                                        <td className="px-4 py-3 text-gray-600">{b.origin} → {b.destination}</td>
                                        <td className="px-4 py-3 text-gray-600">{fmtDate(b.createdAt)}</td>
                                        <td className="px-4 py-3 text-gray-700 font-medium">{fmtVND(b.totalAmount)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[b.status]}`}>
                                                {STATUS_LABELS[b.status]}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                        }
                    </tbody>
                </table>

                {/* Footer count */}
                {!loading && (
                    <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
                        Hiển thị {filtered.length} / {bookings.length} đơn đặt vé
                    </div>
                )}
            </div>
        </div>
    );
}
