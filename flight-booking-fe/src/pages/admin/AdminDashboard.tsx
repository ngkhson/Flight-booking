import { useState, useEffect } from 'react';
import { getDashboardStats, type DashboardStats } from '../../features/admin/services/adminApi';

// ─── Stat card config ─────────────────────────────────────────────────────────

interface StatCard {
    label: string;
    value: string;
    icon: string;
    change: string;
    color: string;
    iconBg: string;
    textColor: string;
}

/** Format số nguyên → chuỗi có dấu phân cách hàng nghìn */
const fmtNumber = (n: number) => n.toLocaleString('vi-VN');

/** Format tiền VND → "₫ x.xx tỷ" hoặc "₫ xxx tr" */
const fmtRevenue = (vnd: number): string => {
    if (vnd >= 1_000_000_000) return `₫ ${(vnd / 1_000_000_000).toFixed(2)} tỷ`;
    if (vnd >= 1_000_000) return `₫ ${(vnd / 1_000_000).toFixed(0)} tr`;
    return `₫ ${fmtNumber(vnd)}`;
};

/** Chuyển DashboardStats API → mảng StatCard cho UI */
const buildStatCards = (data: DashboardStats): StatCard[] => [
    {
        label: 'Tổng số vé',
        value: fmtNumber(data.totalBookings),
        icon: '🎟️',
        change: 'Cập nhật từ API',
        color: 'bg-indigo-50 border-indigo-200',
        iconBg: 'bg-indigo-100',
        textColor: 'text-indigo-700',
    },
    {
        label: 'Tổng doanh thu',
        value: fmtRevenue(data.totalRevenue),
        icon: '💰',
        change: 'Cập nhật từ API',
        color: 'bg-emerald-50 border-emerald-200',
        iconBg: 'bg-emerald-100',
        textColor: 'text-emerald-700',
    },
    {
        label: 'Chuyến bay hôm nay',
        value: fmtNumber(data.flightsToday),
        icon: '✈️',
        change: 'Cập nhật từ API',
        color: 'bg-sky-50 border-sky-200',
        iconBg: 'bg-sky-100',
        textColor: 'text-sky-700',
    },
    {
        label: 'Khách hàng mới',
        value: fmtNumber(data.newCustomers),
        icon: '👤',
        change: 'Cập nhật từ API',
        color: 'bg-violet-50 border-violet-200',
        iconBg: 'bg-violet-100',
        textColor: 'text-violet-700',
    },
];

/** Stats hiển thị khi đang load hoặc chưa có dữ liệu */
const FALLBACK_STATS: StatCard[] = [
    { label: 'Tổng số vé', value: '—', icon: '🎟️', change: 'Đang tải...', color: 'bg-indigo-50 border-indigo-200', iconBg: 'bg-indigo-100', textColor: 'text-indigo-700' },
    { label: 'Tổng doanh thu', value: '—', icon: '💰', change: 'Đang tải...', color: 'bg-emerald-50 border-emerald-200', iconBg: 'bg-emerald-100', textColor: 'text-emerald-700' },
    { label: 'Chuyến bay hôm nay', value: '—', icon: '✈️', change: 'Đang tải...', color: 'bg-sky-50 border-sky-200', iconBg: 'bg-sky-100', textColor: 'text-sky-700' },
    { label: 'Khách hàng mới', value: '—', icon: '👤', change: 'Đang tải...', color: 'bg-violet-50 border-violet-200', iconBg: 'bg-violet-100', textColor: 'text-violet-700' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
    const [stats, setStats] = useState<StatCard[]>(FALLBACK_STATS);
    const [apiError, setApiError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        getDashboardStats()
            .then((data) => {
                if (!cancelled) setStats(buildStatCards(data));
            })
            .catch((err: unknown) => {
                if (!cancelled) {
                    console.error('[AdminDashboard] getDashboardStats failed:', err);
                    setApiError('Không thể tải số liệu. Backend chưa sẵn sàng.');
                }
            });

        return () => { cancelled = true; };   // cleanup: tránh setState sau unmount
    }, []);

    return (
        <div className="space-y-6">
            {/* Page heading */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">
                    Welcome to Flight Booking Admin Dashboard
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                    Tổng quan hệ thống đặt vé máy bay
                </p>
            </div>

            {/* API error banner */}
            {apiError && (
                <div className="px-4 py-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm flex items-center gap-2">
                    <span>⚠️</span>
                    <span>{apiError} — Đang hiển thị dữ liệu mẫu.</span>
                </div>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className={`rounded-xl border p-5 ${stat.color} flex items-start gap-4 shadow-sm`}
                    >
                        <div
                            className={`w-12 h-12 rounded-lg ${stat.iconBg} flex items-center justify-center text-2xl flex-shrink-0`}
                        >
                            {stat.icon}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                            <p className={`text-2xl font-bold mt-0.5 ${stat.textColor}`}>
                                {stat.value}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Placeholder recent bookings table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-base font-semibold text-gray-700">Đặt vé gần đây</h2>
                </div>
                <div className="divide-y divide-gray-50">
                    {[
                        { id: '#BK-001', route: 'HAN → SGN', passenger: 'Nguyễn Văn A', status: 'Xác nhận' },
                        { id: '#BK-002', route: 'SGN → DAD', passenger: 'Trần Thị B', status: 'Chờ xử lý' },
                        { id: '#BK-003', route: 'HAN → PQC', passenger: 'Lê Văn C', status: 'Xác nhận' },
                        { id: '#BK-004', route: 'SGN → HAN', passenger: 'Phạm Thị D', status: 'Đã huỷ' },
                    ].map((row) => (
                        <div
                            key={row.id}
                            className="grid grid-cols-4 px-6 py-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            <span className="font-mono font-medium text-gray-800">{row.id}</span>
                            <span>{row.route}</span>
                            <span>{row.passenger}</span>
                            <span
                                className={[
                                    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold w-fit',
                                    row.status === 'Xác nhận'
                                        ? 'bg-green-100 text-green-700'
                                        : row.status === 'Chờ xử lý'
                                            ? 'bg-yellow-100 text-yellow-700'
                                            : 'bg-red-100 text-red-700',
                                ].join(' ')}
                            >
                                {row.status}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
