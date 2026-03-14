import { useEffect, useState } from 'react';
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import {
    Search, Bell, Plane, PlaneTakeoff, PlaneLanding,
    Ban, DollarSign, Calendar, X
} from 'lucide-react';
import StatsCard from '../../components/admin/dashboard/StatsCard';
import {
    type IDashboardSummary, type ITopRoute, type IRevenueChart
} from '../../features/admin/services/adminApi';

// ─── Formatters ───────────────────────────────────────────────────────────────

const fmtNumber = (n?: number) => (n || 0).toLocaleString('vi-VN');

const fmtRevenue = (vnd: number): string => {
    if (vnd >= 1_000_000_000) return `${(vnd / 1_000_000_000).toFixed(1)} tỷ ₫`;
    if (vnd >= 1_000_000) return `${(vnd / 1_000_000).toFixed(0)} tr ₫`;
    return `${fmtNumber(vnd)} ₫`;
};

const fmtDateChart = (dateStr: string) => {
    if (!dateStr) return '';
    if (dateStr.includes(':')) return dateStr;
    const parts = dateStr.split('-');
    return parts.length === 3 ? `${parts[2]}/${parts[1]}` : dateStr;
};

// ─── Shared Components ──────────────────────────────────────────────────────

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 ${className}`}>
            {children}
        </div>
    );
}

function CardHeader({ title }: { title: string }) {
    return (
        <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-gray-800">{title}</h3>
        </div>
    );
}

function RevenueTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-xs space-y-1.5 min-w-[140px]">
            <p className="font-semibold text-gray-700 pb-1.5 border-b border-gray-100">Thời gian: {label}</p>
            <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-gray-500">
                    <span className="inline-block w-2 h-2 rounded-full bg-yellow-500" /> Doanh thu
                </span>
                <span className="font-semibold text-gray-800">{fmtRevenue(payload[0].value)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-gray-500">
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-500" /> Số đơn
                </span>
                <span className="font-semibold text-gray-800">{fmtNumber(payload[1]?.payload?.bookingCount)}</span>
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

    const [dateFilter, setDateFilter] = useState('7days');
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [customRange, setCustomRange] = useState({ start: '', end: '' });
    const [appliedRange, setAppliedRange] = useState({ start: '', end: '' });

    useEffect(() => {
        let isCancelled = false;
        const fetchDashboardData = async () => {
            setIsLoading(true);
            setTimeout(() => {
                if (!isCancelled) {
                    const baseRevenue = dateFilter === 'today' ? 8500000 : dateFilter === 'custom' ? 15000000 : 48500000;
                    setSummary({
                        totalRevenue: baseRevenue,
                        totalBookings: dateFilter === 'today' ? 12 : dateFilter === 'custom' ? 45 : 125,
                        totalTicketsIssued: dateFilter === 'today' ? 10 : dateFilter === 'custom' ? 40 : 110,
                        totalCancelledBookings: dateFilter === 'today' ? 1 : 5
                    });

                    let mockData: IRevenueChart[] = [];
                    if (dateFilter === 'today') {
                        mockData = [
                            { reportDate: '08:00', bookingCount: 2, revenue: 1500000 },
                            { reportDate: '10:00', bookingCount: 4, revenue: 3200000 },
                            { reportDate: '13:00', bookingCount: 3, revenue: 2100000 },
                            { reportDate: '17:00', bookingCount: 3, revenue: 1700000 },
                        ];
                    } else if (dateFilter === '7days') {
                        mockData = [
                            { reportDate: '2026-03-08', bookingCount: 10, revenue: 5000000 },
                            { reportDate: '2026-03-10', bookingCount: 15, revenue: 9500000 },
                            { reportDate: '2026-03-12', bookingCount: 22, revenue: 14000000 },
                            { reportDate: '2026-03-14', bookingCount: 12, revenue: 8500000 },
                        ];
                    } else if (dateFilter === 'custom') {
                        mockData = [
                            { reportDate: appliedRange.start || 'Start', bookingCount: 15, revenue: 5000000 },
                            { reportDate: 'Giữa kỳ', bookingCount: 20, revenue: 7000000 },
                            { reportDate: appliedRange.end || 'End', bookingCount: 10, revenue: 3000000 },
                        ];
                    } else {
                        mockData = [
                            { reportDate: '2026-03-01', bookingCount: 45, revenue: 25000000 },
                            { reportDate: '2026-03-14', bookingCount: 80, revenue: 48500000 },
                        ];
                    }

                    setRevenueData(mockData);
                    setTopRoutes([
                        { route: 'HAN → SGN', ticketCount: 45, percentage: 40.9 },
                        { route: 'SGN → DAD', ticketCount: 30, percentage: 27.2 },
                        { route: 'HAN → PQC', ticketCount: 20, percentage: 18.1 },
                        { route: 'DAD → CXR', ticketCount: 10, percentage: 9.0 },
                    ]);
                    setIsLoading(false);
                }
            }, 400);
        };
        fetchDashboardData();
        return () => { isCancelled = true; };
    }, [dateFilter, appliedRange]);

    const filterLabels: Record<string, string> = {
        'today': 'Hôm nay',
        '7days': '7 ngày qua',
        '30days': '30 ngày qua',
        'this_month': 'Tháng này',
        'custom': 'Tùy chỉnh'
    };

    const handleApplyCustomDate = () => {
        if (!customRange.start || !customRange.end) {
            alert("Vui lòng chọn đầy đủ Từ ngày và Đến ngày!");
            return;
        }
        if (new Date(customRange.start) > new Date(customRange.end)) {
            alert("Ngày bắt đầu không được lớn hơn ngày kết thúc!");
            return;
        }
        setAppliedRange(customRange);
        setDateFilter('custom');
        setShowDatePicker(false);
    };

    // 🚀 HÀM MỚI: Xóa bộ lọc tùy chỉnh và quay về mặc định (7 ngày)
    const handleClearCustomDate = (e: React.MouseEvent) => {
        e.stopPropagation(); // Ngăn sự kiện click lan ra ngoài làm mở popup
        setDateFilter('7days');
        setAppliedRange({ start: '', end: '' });
        setCustomRange({ start: '', end: '' });
        setShowDatePicker(false);
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] space-y-6 pb-10 px-4 md:px-8 pt-4">
            {/* Header */}
            <div className="flex items-center justify-between gap-6 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">Tổng quan hệ thống</h1>
                <div className="flex items-center gap-3">
                    <button className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition"><Bell size={18} className="text-gray-600" /></button>
                </div>
            </div>

            {/* Thanh lọc tổng quát */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-2 rounded-2xl border border-gray-200 shadow-sm gap-4">
                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
                    {Object.entries(filterLabels).filter(([key]) => key !== 'custom').map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => {
                                setDateFilter(key);
                                setShowDatePicker(false);
                            }}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${dateFilter === key ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* 🚀 Giao diện Nút Tùy chỉnh ngày MỚI (Có chứa nút X) */}
                <div className="relative">
                    <div className={`flex items-center rounded-xl border transition-all ${dateFilter === 'custom' || showDatePicker
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                    >
                        <button
                            onClick={() => setShowDatePicker(!showDatePicker)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-bold outline-none"
                        >
                            <Calendar size={16} className={dateFilter === 'custom' ? 'text-indigo-600' : 'text-gray-500'} />
                            <span>
                                {dateFilter === 'custom' && appliedRange.start
                                    ? `${fmtDateChart(appliedRange.start)} - ${fmtDateChart(appliedRange.end)}`
                                    : 'Tùy chỉnh'}
                            </span>
                        </button>

                        {/* 🚀 Nút X chỉ hiện ra khi dateFilter đang là 'custom' */}
                        {dateFilter === 'custom' && (
                            <div className="pr-2 flex items-center">
                                <div className="w-[1px] h-4 bg-indigo-200 mr-1.5"></div>
                                <button
                                    onClick={handleClearCustomDate}
                                    className="p-1 rounded-md hover:bg-indigo-100 text-indigo-400 hover:text-indigo-700 transition"
                                    title="Xóa bộ lọc tùy chỉnh"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Popup chọn ngày */}
                    {showDatePicker && (
                        <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50 animate-in fade-in slide-in-from-top-2">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold text-gray-800 text-sm">Chọn khoảng thời gian</h4>
                                <button onClick={() => setShowDatePicker(false)} className="text-gray-400 hover:text-red-500 transition"><X size={16} /></button>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Từ ngày</label>
                                    <input
                                        type="date"
                                        value={customRange.start}
                                        onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Đến ngày</label>
                                    <input
                                        type="date"
                                        value={customRange.end}
                                        onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>
                                <button
                                    onClick={handleApplyCustomDate}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-sm transition-colors mt-2"
                                >
                                    Áp dụng lọc
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            {!isLoading && summary && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatsCard title="Tổng doanh thu" value={fmtRevenue(summary.totalRevenue)} icon={<DollarSign size={24} />} color="gold" />
                    <StatsCard title="Vé bán ra" value={fmtNumber(summary.totalTicketsIssued)} icon={<PlaneTakeoff size={24} />} color="green" />
                    <StatsCard title="Số đơn đặt" value={fmtNumber(summary.totalBookings)} icon={<PlaneLanding size={24} />} color="blue" />
                    <StatsCard title="Đơn bị hủy" value={fmtNumber(summary.totalCancelledBookings)} icon={<Ban size={24} />} color="red" />
                </div>
            )}

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader title={`Biểu đồ doanh thu (${dateFilter === 'custom' ? `${fmtDateChart(appliedRange.start)} đến ${fmtDateChart(appliedRange.end)}` : filterLabels[dateFilter]})`} />

                    {isLoading ? (
                        <div className="h-[280px] flex items-center justify-center animate-pulse bg-gray-50 rounded-xl text-gray-400">Đang cập nhật...</div>
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
                                    tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                                    axisLine={false} tickLine={false} dy={10}
                                />
                                <YAxis
                                    tickFormatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(0)}M` : val}
                                    tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                                    axisLine={false} tickLine={false} width={40}
                                />
                                <Tooltip content={<RevenueTooltip />} />
                                <Area type="monotone" dataKey="revenue" stroke="#EAB308" strokeWidth={4} fill="url(#goldGrad)" animationDuration={1000} activeDot={{ r: 6, fill: '#EAB308', stroke: '#fff', strokeWidth: 3 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </Card>

                <Card>
                    <CardHeader title="Tuyến bay bán chạy" />
                    <div className="space-y-5">
                        {topRoutes.map((r, i) => (
                            <div key={i} className="group">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all"><Plane size={16} /></div>
                                        <span className="text-sm font-bold text-gray-700">{r.route}</span>
                                    </div>
                                    <span className="text-xs font-black text-indigo-600">{fmtNumber(r.ticketCount)} vé</span>
                                </div>
                                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${r.percentage}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}