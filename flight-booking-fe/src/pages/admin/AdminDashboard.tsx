import { useEffect, useState } from 'react';
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import {
    Search, Bell, Plane, PlaneTakeoff, PlaneLanding,
    Ban, DollarSign, ChevronDown
} from 'lucide-react';
import StatsCard from '../../components/admin/dashboard/StatsCard';
import {
    getDashboardSummary, getTopRoutes, getRevenueChart,
    type IDashboardSummary, type ITopRoute, type IRevenueChart
} from '../../features/admin/services/adminApi';

// ─── Formatters ───────────────────────────────────────────────────────────────

const fmtNumber = (n?: number) => (n || 0).toLocaleString('vi-VN');

const fmtRevenue = (vnd: number): string => {
    if (vnd >= 1_000_000_000) return `${(vnd / 1_000_000_000).toFixed(1)} tỷ ₫`;
    if (vnd >= 1_000_000) return `${(vnd / 1_000_000).toFixed(0)} tr ₫`;
    return `${fmtNumber(vnd)} ₫`;
};

// Hàm đổi định dạng ngày cho biểu đồ (YYYY-MM-DD -> DD/MM)
const fmtDateChart = (dateStr: string) => {
    if (!dateStr) return '';
    const [, month, day] = dateStr.split('-');
    return `${day}/${month}`;
};

// ─── Shared Components ──────────────────────────────────────────────────────

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

// Custom Tooltip cho Biểu đồ doanh thu
function RevenueTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-xs space-y-1.5 min-w-[140px]">
            <p className="font-semibold text-gray-700 pb-1.5 border-b border-gray-100">Ngày: {label}</p>
            <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-gray-500">
                    <span className="inline-block w-2 h-2 rounded-full bg-yellow-500" /> Doanh thu
                </span>
                <span className="font-semibold text-gray-800">{fmtRevenue(payload[0].value)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-gray-500">
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-500" /> Số đơn đặt
                </span>
                <span className="font-semibold text-gray-800">{fmtNumber(payload[1]?.payload?.bookingCount)} đơn</span>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Main Component ───────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export default function AdminDashboard() {
    const [summary, setSummary] = useState<IDashboardSummary | null>(null);
    const [topRoutes, setTopRoutes] = useState<ITopRoute[]>([]);
    const [revenueData, setRevenueData] = useState<IRevenueChart[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        let isCancelled = false;

        const fetchDashboardData = async () => {
            setIsLoading(true);
            setIsError(false);
            try {
                // Gọi song song 3 API để tăng tốc độ load
                const [summaryRes, routesRes, revenueRes] = await Promise.all([
                    getDashboardSummary(),
                    getTopRoutes(),
                    getRevenueChart()
                ]);

                if (!isCancelled) {
                    // Bóc tách dữ liệu theo chuẩn bọc của Spring Boot (thường là res.result)
                    setSummary((summaryRes as any).result || summaryRes);
                    setTopRoutes((routesRes as any).result || routesRes || []);
                    setRevenueData((revenueRes as any).result || revenueRes || []);
                }
            } catch (err) {
                console.error("Lỗi lấy dữ liệu Dashboard:", err);
                if (!isCancelled) setIsError(true);
            } finally {
                if (!isCancelled) setIsLoading(false);
            }
        };

        fetchDashboardData();
        return () => { isCancelled = true; };
    }, []);

    return (
        <div className="min-h-screen bg-[#F8F9FA] space-y-8 pb-10">

            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="flex items-center justify-between gap-6">
                <h1 className="text-2xl font-bold text-gray-900 whitespace-nowrap">Tổng quan hệ thống</h1>

                <div className="relative flex-1 max-w-lg">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400 transition"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <button className="relative p-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition">
                        <Bell size={18} className="text-gray-600" />
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                    </button>
                    <div className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-xl px-3 py-2 cursor-pointer hover:bg-gray-50 transition">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                            AD
                        </div>
                        <div className="hidden sm:block">
                            <p className="text-sm font-medium text-gray-800 leading-tight">Admin</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── KPI Stats Cards ────────────────────────────────────── */}
            {isLoading ? (
                <div className="py-12 flex justify-center items-center text-gray-500 font-medium animate-pulse">
                    Đang tải dữ liệu báo cáo...
                </div>
            ) : isError || !summary ? (
                <div className="py-12 flex justify-center items-center text-red-500 font-medium">
                    Không thể kết nối đến máy chủ thống kê.
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatsCard
                            title="Tổng doanh thu"
                            value={fmtRevenue(summary.totalRevenue)}
                            icon={<DollarSign size={24} />}
                            color="gold"
                        />
                        <StatsCard
                            title="Tổng số vé bán ra"
                            value={fmtNumber(summary.totalTicketsIssued)}
                            icon={<PlaneTakeoff size={24} />}
                            color="green"
                        />
                        <StatsCard
                            title="Số đơn đặt chỗ"
                            value={fmtNumber(summary.totalBookings)}
                            icon={<PlaneLanding size={24} />}
                            color="blue"
                        />
                        <StatsCard
                            title="Đơn bị hủy"
                            value={fmtNumber(summary.totalCancelledBookings)}
                            icon={<Ban size={24} />}
                            color="red"
                        />
                    </div>

                    {/* ── Charts & Lists ─────────────────────────────────────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Revenue Chart (Area Chart) - Chiếm 2 cột */}
                        <Card className="lg:col-span-2">
                            <CardHeader title="Biểu đồ doanh thu" filter="7 ngày qua" />
                            {revenueData.length === 0 ? (
                                <div className="h-[260px] flex items-center justify-center text-gray-400 text-sm">Chưa có dữ liệu doanh thu</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={280}>
                                    <AreaChart data={revenueData}>
                                        <defs>
                                            <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#EAB308" stopOpacity={0.4} />
                                                <stop offset="100%" stopColor="#EAB308" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                                        <XAxis
                                            dataKey="reportDate"
                                            tickFormatter={fmtDateChart}
                                            tick={{ fontSize: 12, fill: '#6b7280' }}
                                            axisLine={false} tickLine={false}
                                        />
                                        <YAxis
                                            tickFormatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(0)}M` : val}
                                            tick={{ fontSize: 12, fill: '#6b7280' }}
                                            axisLine={false} tickLine={false} width={45}
                                        />
                                        <Tooltip content={<RevenueTooltip />} />
                                        <Area type="monotone" dataKey="revenue" name="Doanh thu" stroke="#EAB308" strokeWidth={3} fill="url(#goldGrad)" activeDot={{ r: 6, fill: '#EAB308', stroke: '#fff', strokeWidth: 2 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </Card>

                        {/* Top Routes List - Chiếm 1 cột */}
                        <Card>
                            <CardHeader title="Tuyến bay bán chạy nhất" />
                            {topRoutes.length === 0 ? (
                                <div className="py-10 text-center text-gray-400 text-sm">Chưa có tuyến bay nào</div>
                            ) : (
                                <div className="divide-y divide-gray-100 space-y-1 mt-2">
                                    {topRoutes.map((r, i) => (
                                        <div key={i} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 shrink-0">
                                                <Plane size={18} className="text-indigo-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-sm font-bold text-gray-800 truncate">{r.route}</span>
                                                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                                        {fmtNumber(r.ticketCount)} vé
                                                    </span>
                                                </div>
                                                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-indigo-600 transition-all"
                                                        style={{ width: `${Math.min(r.percentage, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>

                    </div>
                </>
            )}
        </div>
    );
}