import {
    ResponsiveContainer, BarChart, Bar, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Cell, PieChart, Pie,
} from 'recharts';
import {
    Search, Bell, Plane, PlaneTakeoff, PlaneLanding,
    Ban, DollarSign, ChevronDown, MapPin,
} from 'lucide-react';
import StatsCard from '../../components/admin/dashboard/StatsCard';

// ═══════════════════════════════════════════════════════════════════════════════
// ─── MOCK DATA ────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { getDashboardStats } from '../../features/admin/services/adminApi';

// Tự định nghĩa Interface tại đây thay vì import từ adminApi
export interface IDashboardStats {
    totalFlights: number;
    activeFlights: number;
    pendingBookings: number;
    totalRevenue: number;
}
const TICKET_SALES = [
    { name: 'T1', economy: 120, business: 45 },
    { name: 'T2', economy: 98, business: 52 },
    { name: 'T3', economy: 145, business: 38 },
    { name: 'T4', economy: 110, business: 61 },
    { name: 'T5', economy: 160, business: 50 },
    { name: 'T6', economy: 135, business: 72 },
    { name: 'T7', economy: 175, business: 65 },
];

const FLIGHT_SCHEDULE = [
    { name: 'T2', flights: 18 },
    { name: 'T3', flights: 24 },
    { name: 'T4', flights: 15 },
    { name: 'T5', flights: 32 },
    { name: 'T6', flights: 28 },
    { name: 'T7', flights: 38 },
    { name: 'CN', flights: 22 },
];

const POPULAR_AIRLINES = [
    { name: 'Vietnam Airlines', value: 45, color: '#EAB308' },
    { name: 'VietJet Air', value: 30, color: '#F59E0B' },
    { name: 'Bamboo Airways', value: 15, color: '#D97706' },
    { name: 'Khác', value: 10, color: '#E5E7EB' },
];

const TOP_ROUTES = [
    { from: 'Hà Nội', to: 'TP.HCM', code: 'HAN → SGN', pct: 92 },
    { from: 'TP.HCM', to: 'Đà Nẵng', code: 'SGN → DAD', pct: 78 },
    { from: 'Hà Nội', to: 'Phú Quốc', code: 'HAN → PQC', pct: 65 },
    { from: 'TP.HCM', to: 'Nha Trang', code: 'SGN → CXR', pct: 54 },
    { from: 'Đà Nẵng', to: 'Hà Nội', code: 'DAD → HAN', pct: 41 },
];

const DESTINATIONS = [
    { name: 'TP. Hồ Chí Minh', flights: 324 },
    { name: 'Hà Nội', flights: 298 },
    { name: 'Đà Nẵng', flights: 187 },
    { name: 'Phú Quốc', flights: 142 },
    { name: 'Nha Trang', flights: 119 },
];

// ─── Formatters ───────────────────────────────────────────────────────────────

// Sửa hàm fmtNumber để nếu giá trị là undefined/null thì tự động gán bằng 0
const fmtNumber = (n?: number) => {
    return (n || 0).toLocaleString('vi-VN');
};
const fmtRevenue = (vnd: number): string => {
    if (vnd >= 1_000_000_000) return `${(vnd / 1_000_000_000).toFixed(1)} tỷ ₫`;
    if (vnd >= 1_000_000) return `${(vnd / 1_000_000).toFixed(0)} tr ₫`;
    return `${fmtNumber(vnd)} ₫`;
};

// ─── Shared card wrapper ──────────────────────────────────────────────────────

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 ${className}`}>
            {children}
        </div>
    );
}

function CardHeader({ title, filter }: { title: string; filter?: string }) {
    return (
        <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-gray-800">{title}</h3>
            {filter && (
                <button className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-100 transition-colors">
                    {filter}
                    <ChevronDown size={14} />
                </button>
            )}
        </div>
    );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

interface TooltipEntry { name: string; value: number; color: string; }
interface CustomTooltipProps { active?: boolean; payload?: TooltipEntry[]; label?: string; }

function ChartTooltip({ active, payload, label }: CustomTooltipProps) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-xs space-y-1.5 min-w-[140px]">
            <p className="font-semibold text-gray-700 pb-1.5 border-b border-gray-100">{label}</p>
            {payload.map((p) => (
                <div key={p.name} className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-gray-500">
                        <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                        {p.name}
                    </span>
                    <span className="font-semibold text-gray-800">{fmtNumber(p.value)}</span>
                </div>
            ))}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Main Component ───────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export default function AdminDashboard() {
    const [stats, setStats] = useState<IDashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        // Bật trạng thái loading trước khi gọi API
        setIsLoading(true);
        setIsError(false);

        getDashboardStats()
            .then((res: any) => {
                // Spring Boot thường bọc data trong res.result hoặc res.data
                const actualData = res?.result || res?.data || res;

                if (actualData) {
                    setStats(actualData);
                }
            })
            .catch(err => {
                console.error(err);
                // Nếu lỗi thì bật cờ Error lên
                setIsError(true);
            })
            .finally(() => {
                // Dù thành công hay thất bại cũng phải tắt loading
                setIsLoading(false);
            });
    }, []);

    return (
        <div className="min-h-screen bg-[#F8F9FA] space-y-12">

            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="flex items-center justify-between gap-6">
                <h1 className="text-xl font-bold text-gray-900 whitespace-nowrap">Dashboard</h1>

                {/* Search */}
                <div className="relative flex-1 max-w-lg">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm chuyến bay, đặt vé..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400 transition"
                    />
                </div>

                {/* Right actions */}
                <div className="flex items-center gap-3">
                    <button className="relative p-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition">
                        <Bell size={18} className="text-gray-600" />
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-yellow-500 rounded-full border-2 border-[#F8F9FA]" />
                    </button>
                    <div className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-xl px-3 py-2 cursor-pointer hover:bg-gray-50 transition">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-white text-xs font-bold">
                            AD
                        </div>
                        <div className="hidden sm:block">
                            <p className="text-sm font-medium text-gray-800 leading-tight">Admin</p>
                            <p className="text-xs text-gray-400">Quản trị viên</p>
                        </div>
                        <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
                    </div>
                </div>
            </div>

            {/* ── KPI Stats Cards ────────────────────────────────────── */}
            {isLoading ? (
                <div className="py-12 flex justify-center items-center text-gray-500 font-medium">Đang tải dữ liệu...</div>
            ) : isError || !stats ? (
                <div className="py-12 flex justify-center items-center text-red-500 font-medium">Lỗi khi tải dữ liệu. Vui lòng thử lại sau.</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatsCard
                        title="Tổng chuyến bay"
                        value={fmtNumber(stats.totalFlights)}
                        icon={<PlaneLanding size={24} />}
                        trend="+5%"
                        color="green"
                    />
                    <StatsCard
                        title="Chuyến bay đang hoạt động"
                        value={fmtNumber(stats.activeFlights)}
                        icon={<PlaneTakeoff size={24} />}
                        trend="+3%"
                        color="gold"
                    />
                    <StatsCard
                        title="Đặt chỗ đang chờ"
                        value={fmtNumber(stats.pendingBookings)}
                        icon={<Ban size={24} />}
                        trend="-2%"
                        color="red"
                    />
                    <StatsCard
                        title="Tổng doanh thu"
                        value={fmtRevenue(stats.totalRevenue)}
                        icon={<DollarSign size={24} />}
                        trend="+12%"
                        color="gold"
                    />
                </div>
            )}

            {/* ── Charts Row ─────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Ticket Sales – Bar Chart */}
                <Card>
                    <CardHeader title="Lượng vé bán ra" filter="7 ngày" />
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={TICKET_SALES} barGap={4}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={32} />
                            <Tooltip content={<ChartTooltip />} />
                            <Bar dataKey="economy" name="Phổ thông" fill="#EAB308" radius={[6, 6, 0, 0]} barSize={16} />
                            <Bar dataKey="business" name="Thương gia" fill="#F59E0B" radius={[6, 6, 0, 0]} barSize={16} opacity={0.55} />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>

                {/* Flight Schedule – Area Chart */}
                <Card>
                    <CardHeader title="Lịch bay trong tuần" filter="Tuần này" />
                    <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={FLIGHT_SCHEDULE}>
                            <defs>
                                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#EAB308" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="#EAB308" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={32} />
                            <Tooltip content={<ChartTooltip />} />
                            <Area type="monotone" dataKey="flights" name="Chuyến bay" stroke="#EAB308" strokeWidth={2.5} fill="url(#goldGrad)" dot={{ r: 3, fill: '#EAB308', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#EAB308', stroke: '#FEF9C3', strokeWidth: 3 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </Card>

                {/* Popular Airlines – Donut Chart */}
                <Card>
                    <CardHeader title="Hãng hàng không phổ biến" filter="Tháng này" />
                    <div className="flex items-center gap-6">
                        <ResponsiveContainer width="55%" height={260}>
                            <PieChart>
                                <Pie
                                    data={POPULAR_AIRLINES}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={85}
                                    paddingAngle={3}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {POPULAR_AIRLINES.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex-1 space-y-4">
                            {POPULAR_AIRLINES.map((a) => (
                                <div key={a.name} className="flex items-center gap-2.5 text-sm">
                                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: a.color }} />
                                    <span className="text-gray-600 truncate flex-1">{a.name}</span>
                                    <span className="font-bold text-gray-800">{a.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            </div>

            {/* ── Bottom Row ─────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Top Flight Routes */}
                <Card className="lg:col-span-2 pt-8">
                    <CardHeader title="Tuyến bay hàng đầu" filter="Tháng này" />
                    <div className="divide-y divide-gray-100 space-y-1">
                        {TOP_ROUTES.map((r) => (
                            <div key={r.code} className="flex items-center gap-4 py-5 first:pt-0 last:pb-0">
                                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-yellow-50">
                                    <Plane size={18} className="text-yellow-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-800 truncate">
                                            {r.from} → {r.to}
                                        </span>
                                        <span className="text-xs font-semibold text-gray-500 ml-3">{r.pct}%</span>
                                    </div>
                                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-all"
                                            style={{ width: `${r.pct}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Popular Destinations */}
                <Card>
                    <CardHeader title="Điểm đến phổ biến" />
                    <div className="divide-y divide-gray-100">
                        {DESTINATIONS.map((d, i) => (
                            <div key={d.name} className="flex items-center gap-3.5 py-4 first:pt-0 last:pb-0 group">
                                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-yellow-50 group-hover:bg-yellow-100 transition-colors">
                                    <MapPin size={16} className="text-yellow-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate">{d.name}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{fmtNumber(d.flights)} chuyến bay</p>
                                </div>
                                <span className="text-xs font-bold text-yellow-600 bg-yellow-50 rounded-full px-2.5 py-1">
                                    #{i + 1}
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
