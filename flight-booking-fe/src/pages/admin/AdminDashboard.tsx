import { useState, useEffect, useCallback } from 'react';
import {
    ResponsiveContainer, LineChart, Line, XAxis, YAxis,
    CartesianGrid, Tooltip, Legend,
} from 'recharts';
import {
    getDashboardStats,
    type IDashboardStats,
} from '../../features/admin/services/adminApi';

// ─── Revenue chart mock data (7 ngày gần nhất) ───────────────────────────────

const REVENUE_DATA = [
    { name: 'T2', total: 12_500_000, tickets: 10 },
    { name: 'T3', total: 18_200_000, tickets: 15 },
    { name: 'T4', total: 9_800_000, tickets: 8 },
    { name: 'T5', total: 24_600_000, tickets: 21 },
    { name: 'T6', total: 31_000_000, tickets: 27 },
    { name: 'T7', total: 41_500_000, tickets: 35 },
    { name: 'CN', total: 28_900_000, tickets: 24 },
];

// ─── Formatters ───────────────────────────────────────────────────────────────

const fmtNumber = (n: number) => n.toLocaleString('vi-VN');
const fmtRevenue = (vnd: number): string => {
    if (vnd >= 1_000_000_000) return `₫ ${(vnd / 1_000_000_000).toFixed(2)} tỷ`;
    if (vnd >= 1_000_000) return `₫ ${(vnd / 1_000_000).toFixed(0)} tr`;
    return `₫ ${fmtNumber(vnd)}`;
};

// ─── Stat card builder (từ IDashboardStats) ───────────────────────────────────

interface StatCard {
    label: string;
    value: string;
    icon: string;
    color: string;
    iconBg: string;
    textColor: string;
}

const buildStatCards = (d: IDashboardStats): StatCard[] => [
    { label: 'Tổng số vé', value: fmtNumber(d.totalBookings), icon: '🎟️', color: 'bg-indigo-50 border-indigo-200', iconBg: 'bg-indigo-100', textColor: 'text-indigo-700' },
    { label: 'Tổng doanh thu', value: fmtRevenue(d.totalRevenue), icon: '💰', color: 'bg-emerald-50 border-emerald-200', iconBg: 'bg-emerald-100', textColor: 'text-emerald-700' },
    { label: 'Tổng chuyến bay', value: fmtNumber(d.totalFlights), icon: '✈️', color: 'bg-sky-50 border-sky-200', iconBg: 'bg-sky-100', textColor: 'text-sky-700' },
    { label: 'Tổng người dùng', value: fmtNumber(d.totalUsers), icon: '👥', color: 'bg-violet-50 border-violet-200', iconBg: 'bg-violet-100', textColor: 'text-violet-700' },
    { label: 'Chuyến bay hôm nay', value: fmtNumber(d.flightsToday), icon: '📅', color: 'bg-orange-50 border-orange-200', iconBg: 'bg-orange-100', textColor: 'text-orange-700' },
    { label: 'Khách hàng mới', value: fmtNumber(d.newCustomers), icon: '👤', color: 'bg-pink-50 border-pink-200', iconBg: 'bg-pink-100', textColor: 'text-pink-700' },
];

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

interface TooltipEntry { name: string; value: number; color: string; }
interface CustomTooltipProps { active?: boolean; payload?: TooltipEntry[]; label?: string; }

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm space-y-1.5 min-w-[160px]">
            <p className="font-semibold text-gray-700 border-b border-gray-100 pb-1.5">{label}</p>
            {payload.map((p) => (
                <div key={p.name} className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-gray-500">
                        <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                        {p.name === 'total' ? 'Doanh thu' : 'Số vé'}
                    </span>
                    <span className="font-semibold text-gray-800">
                        {p.name === 'total' ? fmtRevenue(p.value) : `${p.value} vé`}
                    </span>
                </div>
            ))}
        </div>
    );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function StatSkeleton() {
    return (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 flex items-start gap-4 shadow-sm animate-pulse">
            <div className="w-12 h-12 rounded-lg bg-gray-200 flex-shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
                <div className="h-3 bg-gray-200 rounded w-2/3" />
                <div className="h-6 bg-gray-200 rounded w-1/2" />
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
    const [stats, setStats] = useState<StatCard[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [apiError, setApiError] = useState<string | null>(null);

    const loadStats = useCallback(() => {
        setIsLoading(true);
        setApiError(null);
        getDashboardStats()
            .then((data) => {
                setStats(buildStatCards(data));
                setIsLoading(false);
            })
            .catch((err: unknown) => {
                console.error('[AdminDashboard] getDashboardStats failed:', err);
                setApiError('Không thể tải số liệu từ server. Vui lòng thử lại.');
                setIsLoading(false);
            });
    }, []);

    useEffect(() => {
        loadStats();
    }, [loadStats]);

    return (
        <div className="space-y-6">
            {/* Page heading */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Welcome to Flight Booking Admin Dashboard</h1>
                <p className="mt-1 text-sm text-gray-500">Tổng quan hệ thống đặt vé máy bay</p>
            </div>

            {/* Loading text */}
            {isLoading && (
                <div className="flex items-center gap-2 text-sm text-indigo-600 font-medium">
                    <span className="inline-block w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                    Đang tải dữ liệu...
                </div>
            )}

            {/* API error banner */}
            {apiError && (
                <div className="px-4 py-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                        <span>⚠️</span>
                        <span>{apiError}</span>
                    </span>
                    <button
                        onClick={loadStats}
                        className="text-xs underline underline-offset-2 hover:text-yellow-900 transition"
                    >
                        Thử lại
                    </button>
                </div>
            )}

            {/* Stat cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {isLoading
                    ? Array.from({ length: 6 }).map((_, i) => <StatSkeleton key={i} />)
                    : (stats ?? []).map((stat) => (
                        <div
                            key={stat.label}
                            className={`rounded-xl border p-5 ${stat.color} flex items-start gap-4 shadow-sm`}
                        >
                            <div className={`w-12 h-12 rounded-lg ${stat.iconBg} flex items-center justify-center text-2xl flex-shrink-0`}>
                                {stat.icon}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                                <p className={`text-2xl font-bold mt-0.5 ${stat.textColor}`}>{stat.value}</p>
                            </div>
                        </div>
                    ))
                }
            </div>

            {/* Revenue LineChart */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-gray-800">📈 Doanh thu 7 ngày gần nhất</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Hover vào điểm để xem chi tiết</p>
                    </div>
                    <span className="text-xs text-gray-400 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full">
                        Dữ liệu mẫu
                    </span>
                </div>
                <div className="px-4 py-5">
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={REVENUE_DATA} margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                            <YAxis yAxisId="revenue" orientation="left" tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(0)}tr`} tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={42} />
                            <YAxis yAxisId="tickets" orientation="right" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={30} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend formatter={(v) => v === 'total' ? 'Doanh thu' : 'Số vé'} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                            <Line yAxisId="revenue" type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#6366f1', stroke: '#e0e7ff', strokeWidth: 3 }} />
                            <Line yAxisId="tickets" type="monotone" dataKey="tickets" stroke="#10b981" strokeWidth={2} strokeDasharray="5 3" dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#10b981', stroke: '#d1fae5', strokeWidth: 3 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent bookings table */}
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
                        <div key={row.id} className="grid grid-cols-4 px-6 py-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                            <span className="font-mono font-medium text-gray-800">{row.id}</span>
                            <span>{row.route}</span>
                            <span>{row.passenger}</span>
                            <span className={['inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold w-fit',
                                row.status === 'Xác nhận' ? 'bg-green-100 text-green-700' :
                                    row.status === 'Chờ xử lý' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-red-100 text-red-700'].join(' ')}>
                                {row.status}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
