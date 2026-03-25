import { useEffect, useState } from 'react';
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import {
    Search, Plane, PlaneTakeoff, PlaneLanding,
    Ban, DollarSign, Filter, X
} from 'lucide-react';
import StatsCard from '../../components/admin/dashboard/StatsCard';
import {
    getDashboardSummary, getTopRoutes, getRevenueChart,
    type IDashboardSummary, type ITopRoute, type IRevenueChart
} from '../../features/admin/services/adminApi';

// NẠP COMPONENT HEADER MỚI
import AdminHeader from '../../components/admin/layout/AdminHeader';

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
    const parts = dateStr.split('-');
    return parts.length === 3 ? `${parts[2]}/${parts[1]}` : dateStr;
};

// ─── Shared Components ──────────────────────────────────────────────────────
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 ${className}`}>{children}</div>;
}

function CardHeader({ title }: { title: string }) {
    return (
        <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-gray-800">{title}</h3>
        </div>
    );
}

// KHAI BÁO RÕ RÀNG KIỂU DỮ LIỆU (Tránh lỗi ESLint 'any')
interface TooltipProps {
    active?: boolean;
    payload?: { value: number; payload: { bookingCount: number } }[];
    label?: string;
}

function RevenueTooltip({ active, payload, label }: TooltipProps) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm space-y-2 min-w-[150px] z-50">
            <p className="font-bold text-gray-700 pb-2 border-b border-gray-100">Ngày: {label}</p>
            <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-gray-500"><span className="inline-block w-2.5 h-2.5 rounded-full bg-yellow-500" /> Doanh thu</span>
                <span className="font-bold text-gray-900">{fmtRevenue(payload[0].value)}</span>
            </div>
            {payload[1] && (
                <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-gray-500"><span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500" /> Số đơn</span>
                    <span className="font-bold text-gray-900">{fmtNumber(payload[1].payload.bookingCount)} đơn</span>
                </div>
            )}
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

    // STATE BỘ LỌC
    const [dateFilter, setDateFilter] = useState('this_month');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [customRange, setCustomRange] = useState({ start: '', end: '' });
    const [appliedRange, setAppliedRange] = useState({ start: '', end: '' });

    // FETCH API
    useEffect(() => {
        let isCancelled = false;

        const getFilterDates = () => {
            const today = new Date();
            const formatDate = (date: Date) => {
                const y = date.getFullYear();
                const m = String(date.getMonth() + 1).padStart(2, '0');
                const d = String(date.getDate()).padStart(2, '0');
                return `${y}-${m}-${d}`;
            };

            let startDate = '';
            let endDate = formatDate(today);

            switch (dateFilter) {
                case 'today':
                    startDate = formatDate(today);
                    break;
                case 'this_week': { 
                    const lastWeek = new Date(today); lastWeek.setDate(today.getDate() - 7);
                    startDate = formatDate(lastWeek);
                    break;
                }
                case 'this_month': { 
                    const lastMonth = new Date(today); lastMonth.setDate(today.getDate() - 30);
                    startDate = formatDate(lastMonth);
                    break;
                }
                case 'all':
                    startDate = '2020-01-01'; // Để lấy tất cả, truyền mốc thời gian từ xa xưa
                    break;
                case 'custom':
                    startDate = appliedRange.start;
                    endDate = appliedRange.end;
                    break;
                default:
                    startDate = formatDate(new Date(today.setDate(today.getDate() - 30)));
            }
            return { startDate, endDate };
        };

        const fetchDashboardData = async () => {
            setIsLoading(true); setIsError(false);
            try {
                const { startDate, endDate } = getFilterDates();
                const params = { startDate, endDate };

                // Ép kiểu an toàn (unknown -> Record) thay vì any để không bị ESLint mắng
                const [summaryRes, routesRes, revenueRes] = await Promise.all([
                    getDashboardSummary(params) as unknown as Record<string, unknown>,
                    getTopRoutes(params) as unknown as Record<string, unknown>,
                    getRevenueChart(params) as unknown as Record<string, unknown>
                ]);

                if (!isCancelled) {
                    setSummary((summaryRes?.result || summaryRes) as IDashboardSummary);
                    setTopRoutes((routesRes?.result || routesRes || []) as ITopRoute[]);
                    setRevenueData((revenueRes?.result || revenueRes || []) as IRevenueChart[]);
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
    }, [dateFilter, appliedRange]);

    // Các hàm xử lý Filter UI
    const handleApplyCustomDate = () => {
        if (!customRange.start || !customRange.end) { alert("Vui lòng chọn đầy đủ Từ ngày và Đến ngày!"); return; }
        if (new Date(customRange.start) > new Date(customRange.end)) { alert("Ngày bắt đầu không được lớn hơn ngày kết thúc!"); return; }
        setAppliedRange(customRange); setDateFilter('custom'); setShowDatePicker(false);
    };

    const handleClearCustomDate = (e: React.MouseEvent) => {
        e.stopPropagation(); setDateFilter('this_month'); setAppliedRange({ start: '', end: '' }); setCustomRange({ start: '', end: '' }); setShowDatePicker(false);
    };

    const getFilterLabel = () => {
        switch (dateFilter) {
            case 'all': return 'Tất cả'; case 'today': return 'Hôm nay'; case 'this_week': return '7 ngày qua'; case 'this_month': return '30 ngày qua';
            case 'custom': return appliedRange.start ? `${fmtDateChart(appliedRange.start)} - ${fmtDateChart(appliedRange.end)}` : 'Tùy chỉnh';
            default: return '';
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] space-y-6 pb-10">
            
            {/* 🚀 NẠP COMPONENT HEADER MỚI VÀO ĐÂY */}
            <AdminHeader title="Tổng quan hệ thống" />

            {/* 🚀 THANH BỘ LỌC */}
            <div className="flex items-center justify-between w-full pb-2 md:pb-0 relative z-20">
                <div className="flex items-center bg-white p-1 rounded-xl border border-gray-200 overflow-x-auto hide-scrollbar">
                    {['all', 'today', 'this_week', 'this_month'].map(key => (
                        <button
                            key={key}
                            onClick={() => { setDateFilter(key); setShowDatePicker(false); }}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${dateFilter === key ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
                        >
                            {key === 'all' ? 'Tất cả' : key === 'today' ? 'Hôm nay' : key === 'this_week' ? 'Tuần này' : 'Tháng này'}
                        </button>
                    ))}
                </div>

                <div className="relative shrink-0 ml-4">
                    <div className={`flex items-center rounded-xl border transition-all bg-white ${dateFilter === 'custom' || showDatePicker ? 'border-indigo-400 text-indigo-700 shadow-sm' : 'text-gray-700 border-gray-200 hover:bg-gray-50'}`}>
                        <button onClick={() => setShowDatePicker(!showDatePicker)} className="flex items-center gap-2 px-4 py-2 text-sm font-bold outline-none whitespace-nowrap">
                            <Filter size={16} className={dateFilter === 'custom' ? 'text-indigo-600' : 'text-gray-400'} />
                            <span>{dateFilter === 'custom' && appliedRange.start ? `${fmtDateChart(appliedRange.start)} - ${fmtDateChart(appliedRange.end)}` : 'Tùy chỉnh'}</span>
                        </button>
                        {dateFilter === 'custom' && (
                            <div className="pr-2 flex items-center">
                                <div className="w-[1px] h-4 bg-gray-200 mr-2"></div>
                                <button onClick={handleClearCustomDate} className="text-indigo-400 hover:text-indigo-700 transition p-1"><X size={16} /></button>
                            </div>
                        )}
                    </div>

                    {showDatePicker && (
                        <div className="absolute right-0 top-[calc(100%+8px)] w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-5 z-50 animate-in fade-in slide-in-from-top-1">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold text-gray-800 text-base">Chọn ngày</h4>
                                <button onClick={() => setShowDatePicker(false)} className="text-gray-400 hover:text-red-500 transition-colors"><X size={18} /></button>
                            </div>
                            <div className="space-y-4">
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Từ ngày</label><input type="date" value={customRange.start} onChange={e => setCustomRange({ ...customRange, start: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Đến ngày</label><input type="date" value={customRange.end} onChange={e => setCustomRange({ ...customRange, end: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                                <button onClick={handleApplyCustomDate} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-sm transition-colors mt-2 shadow-md">Áp dụng lọc</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── KPI Stats Cards ────────────────────────────────────── */}
            <div className="relative z-0">
                {isLoading ? (
                    <div className="py-12 flex justify-center items-center text-gray-500 font-medium animate-pulse bg-white rounded-2xl border border-gray-100">Đang cập nhật báo cáo...</div>
                ) : isError || !summary ? (
                    <div className="py-12 flex justify-center items-center text-red-500 font-medium bg-white rounded-2xl border border-red-100">Không thể kết nối đến máy chủ thống kê.</div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                            <StatsCard title="Tổng doanh thu" value={fmtRevenue(summary.totalRevenue)} icon={<DollarSign size={24} />} color="gold" />
                            <StatsCard title="Tổng số vé bán ra" value={fmtNumber(summary.totalTicketsIssued)} icon={<PlaneTakeoff size={24} />} color="green" />
                            <StatsCard title="Số đơn đặt chỗ" value={fmtNumber(summary.totalBookings)} icon={<PlaneLanding size={24} />} color="blue" />
                            <StatsCard title="Đơn bị hủy" value={fmtNumber(summary.totalCancelledBookings)} icon={<Ban size={24} />} color="red" />
                        </div>

                        {/* ── Charts & Lists ─────────────────────────────────────────── */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <Card className="lg:col-span-2 relative z-0">
                                <CardHeader title={`Biểu đồ doanh thu (${getFilterLabel()})`} />
                                {revenueData.length === 0 ? (
                                    <div className="h-[260px] flex flex-col items-center justify-center text-gray-400 text-sm gap-2">
                                        <Search size={32} className="text-gray-300" />
                                        Không có giao dịch nào trong khoảng thời gian này
                                    </div>
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
                                            <XAxis dataKey="reportDate" tickFormatter={fmtDateChart} tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 500 }} axisLine={false} tickLine={false} dy={10} />
                                            <YAxis tickFormatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(0)}M` : val} tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 500 }} axisLine={false} tickLine={false} width={45} />
                                            <Tooltip content={<RevenueTooltip />} cursor={{ stroke: '#f3f4f6', strokeWidth: 2 }} />
                                            <Area type="monotone" dataKey="revenue" name="Doanh thu" stroke="#EAB308" strokeWidth={3} fill="url(#goldGrad)" activeDot={{ r: 6, fill: '#EAB308', stroke: '#fff', strokeWidth: 3 }} animationDuration={500} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                )}
                            </Card>

                            <Card>
                                <CardHeader title="Tuyến bay bán chạy nhất" />
                                {topRoutes.length === 0 ? (
                                    <div className="py-10 text-center text-gray-400 text-sm">Chưa có dữ liệu tuyến bay</div>
                                ) : (
                                    <div className="divide-y divide-gray-100 space-y-1 mt-2 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                                        {topRoutes.map((r, i) => (
                                            <div key={i} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0 group">
                                                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 shrink-0 group-hover:bg-indigo-600 transition-colors">
                                                    <Plane size={18} className="text-indigo-600 group-hover:text-white transition-colors" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className="text-sm font-bold text-gray-800 truncate">{r.route}</span>
                                                        <span className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{fmtNumber(r.ticketCount)} vé</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-indigo-600 transition-all duration-1000" style={{ width: `${Math.min(r.percentage, 100)}%` }} />
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
        </div>
    );
}