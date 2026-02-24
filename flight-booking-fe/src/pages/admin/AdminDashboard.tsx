import { useState, useEffect } from 'react';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from 'recharts';
import { getDashboardStats, type DashboardStats } from '../../features/admin/services/adminApi';

// ─── Revenue chart data (7 ngày gần nhất) ────────────────────────────────────

const REVENUE_DATA = [
    { name: 'T2', total: 12_500_000, tickets: 10 },
    { name: 'T3', total: 18_200_000, tickets: 15 },
    { name: 'T4', total: 9_800_000, tickets: 8 },
    { name: 'T5', total: 24_600_000, tickets: 21 },
    { name: 'T6', total: 31_000_000, tickets: 27 },
    { name: 'T7', total: 41_500_000, tickets: 35 },
    { name: 'CN', total: 28_900_000, tickets: 24 },
];

// ─── Stat card types ──────────────────────────────────────────────────────────

interface StatCard {
    label: string;
    value: string;
    icon: string;
    change: string;
    color: string;
    iconBg: string;
    textColor: string;
}

const fmtNumber = (n: number) => n.toLocaleString('vi-VN');
const fmtRevenue = (vnd: number): string => {
    if (vnd >= 1_000_000_000) return `₫ ${(vnd / 1_000_000_000).toFixed(2)} tỷ`;
    if (vnd >= 1_000_000) return `₫ ${(vnd / 1_000_000).toFixed(0)} tr`;
    return `₫ ${fmtNumber(vnd)}`;
};

const buildStatCards = (data: DashboardStats): StatCard[] => [
    { label: 'Tổng số vé', value: fmtNumber(data.totalBookings), icon: '🎟️', change: 'Cập nhật từ API', color: 'bg-indigo-50 border-indigo-200', iconBg: 'bg-indigo-100', textColor: 'text-indigo-700' },
    { label: 'Tổng doanh thu', value: fmtRevenue(data.totalRevenue), icon: '💰', change: 'Cập nhật từ API', color: 'bg-emerald-50 border-emerald-200', iconBg: 'bg-emerald-100', textColor: 'text-emerald-700' },
    { label: 'Chuyến bay hôm nay', value: fmtNumber(data.flightsToday), icon: '✈️', change: 'Cập nhật từ API', color: 'bg-sky-50 border-sky-200', iconBg: 'bg-sky-100', textColor: 'text-sky-700' },
    { label: 'Khách hàng mới', value: fmtNumber(data.newCustomers), icon: '👤', change: 'Cập nhật từ API', color: 'bg-violet-50 border-violet-200', iconBg: 'bg-violet-100', textColor: 'text-violet-700' },
];

const FALLBACK_STATS: StatCard[] = [
    { label: 'Tổng số vé', value: '—', icon: '🎟️', change: 'Đang tải...', color: 'bg-indigo-50 border-indigo-200', iconBg: 'bg-indigo-100', textColor: 'text-indigo-700' },
    { label: 'Tổng doanh thu', value: '—', icon: '💰', change: 'Đang tải...', color: 'bg-emerald-50 border-emerald-200', iconBg: 'bg-emerald-100', textColor: 'text-emerald-700' },
    { label: 'Chuyến bay hôm nay', value: '—', icon: '✈️', change: 'Đang tải...', color: 'bg-sky-50 border-sky-200', iconBg: 'bg-sky-100', textColor: 'text-sky-700' },
    { label: 'Khách hàng mới', value: '—', icon: '👤', change: 'Đang tải...', color: 'bg-violet-50 border-violet-200', iconBg: 'bg-violet-100', textColor: 'text-violet-700' },
];

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

interface TooltipPayloadItem {
    name: string;
    value: number;
    color: string;
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: TooltipPayloadItem[];
    label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm space-y-1.5 min-w-[160px]">
            <p className="font-semibold text-gray-700 border-b border-gray-100 pb-1.5 mb-1">{label}</p>
            {payload.map((p) => (
                <div key={p.name} className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-gray-500">
                        <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                        {p.name === 'total' ? 'Doanh thu' : 'Số vé'}
                    </span>
                    <span className="font-semibold text-gray-800">
                        {p.name === 'total'
                            ? fmtRevenue(p.value)
                            : `${p.value} vé`}
                    </span>
                </div>
            ))}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
    const [stats, setStats] = useState<StatCard[]>(FALLBACK_STATS);
    const [apiError, setApiError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        getDashboardStats()
            .then((data) => { if (!cancelled) setStats(buildStatCards(data)); })
            .catch((err: unknown) => {
                if (!cancelled) {
                    console.error('[AdminDashboard] getDashboardStats failed:', err);
                    setApiError('Không thể tải số liệu. Backend chưa sẵn sàng.');
                }
            });
        return () => { cancelled = true; };
    }, []);

    return (
        <div className="space-y-6">
            {/* Page heading */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Welcome to Flight Booking Admin Dashboard</h1>
                <p className="mt-1 text-sm text-gray-500">Tổng quan hệ thống đặt vé máy bay</p>
            </div>

            {/* API error banner */}
            {apiError && (
                <div className="px-4 py-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm flex items-center gap-2">
                    <span>⚠️</span>
                    <span>{apiError} — Đang hiển thị dữ liệu mẫu.</span>
                </div>
            )}

            {/* Stat cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                {stats.map((stat) => (
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
                            <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Revenue LineChart ── */}
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
                    {/* ResponsiveContainer makes the chart adapt to its parent width */}
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart
                            data={REVENUE_DATA}
                            margin={{ top: 8, right: 24, left: 8, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />

                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 12, fill: '#6b7280' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            {/* Left Y-axis: revenue in millions */}
                            <YAxis
                                yAxisId="revenue"
                                orientation="left"
                                tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(0)}tr`}
                                tick={{ fontSize: 11, fill: '#6b7280' }}
                                axisLine={false}
                                tickLine={false}
                                width={42}
                            />
                            {/* Right Y-axis: ticket count */}
                            <YAxis
                                yAxisId="tickets"
                                orientation="right"
                                tickFormatter={(v: number) => `${v}`}
                                tick={{ fontSize: 11, fill: '#6b7280' }}
                                axisLine={false}
                                tickLine={false}
                                width={30}
                            />

                            <Tooltip content={<CustomTooltip />} />

                            <Legend
                                formatter={(value) =>
                                    value === 'total' ? 'Doanh thu' : 'Số vé'
                                }
                                wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                            />

                            <Line
                                yAxisId="revenue"
                                type="monotone"
                                dataKey="total"
                                stroke="#6366f1"
                                strokeWidth={2.5}
                                dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }}
                                activeDot={{ r: 6, fill: '#6366f1', stroke: '#e0e7ff', strokeWidth: 3 }}
                            />
                            <Line
                                yAxisId="tickets"
                                type="monotone"
                                dataKey="tickets"
                                stroke="#10b981"
                                strokeWidth={2}
                                strokeDasharray="5 3"
                                dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
                                activeDot={{ r: 5, fill: '#10b981', stroke: '#d1fae5', strokeWidth: 3 }}
                            />
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
                                    row.status === 'Xác nhận' ? 'bg-green-100 text-green-700'
                                        : row.status === 'Chờ xử lý' ? 'bg-yellow-100 text-yellow-700'
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
