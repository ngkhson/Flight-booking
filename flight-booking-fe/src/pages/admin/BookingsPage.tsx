import { useState, useEffect } from 'react';
// import { getBookings } from '../../features/admin/services/adminApi';

// ─── Tự định nghĩa Interface nghiêm ngặt (Đã xóa | string) ─────────────────────
export interface IBooking {
    id: string;
    pnrCode: string;
    contactName: string;
    contactPhone?: string;
    contactEmail?: string;
    flightNumber: string;
    origin: string;
    destination: string;
    departureTime: string;
    status: 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'PAID' | 'AWAITING_PAYMENT' | 'REFUNDED';
    totalAmount: number;
    createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
    CONFIRMED: 'bg-green-100 text-green-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    CANCELLED: 'bg-red-100 text-red-700',
    PAID: 'bg-blue-100 text-blue-700',
    AWAITING_PAYMENT: 'bg-orange-100 text-orange-700',
    REFUNDED: 'bg-gray-100 text-gray-600',
};

const STATUS_LABELS: Record<string, string> = {
    CONFIRMED: 'Xác nhận',
    PENDING: 'Chờ xử lý',
    CANCELLED: 'Đã huỷ',
    PAID: 'Đã thanh toán',
    AWAITING_PAYMENT: 'Chờ thanh toán',
    REFUNDED: 'Hoàn tiền',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (iso: string) => iso ? new Date(iso).toLocaleDateString('vi-VN', { dateStyle: 'short' }) : '—';
const fmtVND = (n: number) => (n || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

// ─── Mock data Động ───────────────────────────────────────────────────────────
const generateMockBookings = (): IBooking[] => {
    const now = new Date();
    return [
        { id: '1', pnrCode: 'BK-001', contactName: 'Nguyễn Văn A', contactPhone: '0987654321', flightNumber: 'VN-201', origin: 'HAN', destination: 'SGN', status: 'CONFIRMED', totalAmount: 1250000, createdAt: now.toISOString(), departureTime: '2026-03-25T06:00:00' },
        { id: '2', pnrCode: 'BK-002', contactName: 'Trần Thị B', contactPhone: '0912345678', flightNumber: 'VN-305', origin: 'SGN', destination: 'DAD', status: 'PENDING', totalAmount: 890000, createdAt: now.toISOString(), departureTime: '2026-03-25T10:30:00' },
    ];
};

type FilterStatus = 'ALL' | IBooking['status'];

// ─── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            {Array.from({ length: 7 }).map((_, i) => (
                <td key={i} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded w-3/4" /></td>
            ))}
        </tr>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function BookingsPage() {
    const [bookings, setBookings] = useState<IBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterStatus>('ALL');

    // 🚀 Load Mock Data trực tiếp thay vì gọi API
    useEffect(() => {
        setLoading(true);
        setTimeout(() => {
            setBookings(generateMockBookings());
            setLoading(false);
        }, 500);
    }, []);

    const filtered = (bookings || []).filter((b) => filter === 'ALL' ? true : b.status === filter);

    const FILTER_OPTIONS: { label: string; value: FilterStatus }[] = [
        { label: 'Tất cả', value: 'ALL' },
        { label: 'Xác nhận', value: 'CONFIRMED' },
        { label: 'Chờ xử lý', value: 'PENDING' },
        { label: 'Đã huỷ', value: 'CANCELLED' },
    ];

    return (
        <div className="space-y-5 pb-10">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">🎟️ Danh sách đặt vé</h1>
                <p className="mt-0.5 text-sm font-semibold text-yellow-600 bg-yellow-50 inline-block px-2 py-0.5 rounded border border-yellow-200">🛠 Đang chạy chế độ Test (Mock Data)</p>
            </div>

            <div className="flex gap-2 flex-wrap bg-white p-1 rounded-xl border border-gray-200 w-fit">
                {FILTER_OPTIONS.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => setFilter(opt.value)}
                        className={['px-4 py-1.5 rounded-lg text-sm font-medium transition focus:outline-none', filter === opt.value ? 'bg-indigo-600 text-white shadow' : 'bg-transparent text-gray-600 hover:bg-gray-50'].join(' ')}
                    >
                        {opt.label}
                        {!loading && opt.value !== 'ALL' && (
                            <span className="ml-1.5 text-xs opacity-70">({bookings.filter((b) => b.status === opt.value).length})</span>
                        )}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 tracking-wide font-bold">
                        <tr>
                            <th className="px-5 py-4">Mã đặt vé (PNR)</th>
                            <th className="px-5 py-4">Hành khách</th>
                            <th className="px-5 py-4">Chuyến bay</th>
                            <th className="px-5 py-4">Hành trình</th>
                            <th className="px-5 py-4">Ngày đặt</th>
                            <th className="px-5 py-4">Tổng tiền</th>
                            <th className="px-5 py-4">Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />) : filtered.length === 0 ? <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-400 text-sm">Không có đơn đặt vé nào.</td></tr> :
                            filtered.map((b) => (
                                <tr key={b.id} className="hover:bg-indigo-50/30 transition-colors">
                                    <td className="px-5 py-4 font-mono font-bold text-indigo-700">{b.pnrCode}</td>
                                    <td className="px-5 py-4 text-gray-800 font-medium">{b.contactName}</td>
                                    <td className="px-5 py-4 font-bold text-gray-700">{b.flightNumber}</td>
                                    <td className="px-5 py-4 text-gray-600">{b.origin} → {b.destination}</td>
                                    <td className="px-5 py-4 text-gray-600">{fmtDate(b.createdAt)}</td>
                                    <td className="px-5 py-4 text-gray-800 font-bold">{fmtVND(b.totalAmount)}</td>
                                    <td className="px-5 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${STATUS_STYLES[b.status] || 'bg-gray-100 text-gray-600'}`}>
                                            {STATUS_LABELS[b.status] || b.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}