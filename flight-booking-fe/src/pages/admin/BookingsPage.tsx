import { useState, useEffect } from 'react';
import { Search, Ticket, ChevronLeft, ChevronRight, Filter, PlaneTakeoff, Clock } from 'lucide-react';
import apiClient from '../../services/apiClient';

// 1. Interface khớp 100% với JSON Backend trả về
interface IBooking {
    id: string;
    pnrCode: string;
    status: 'PENDING' | 'AWAITING_PAYMENT' | 'PAID' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED';
    totalAmount: number;
    createdAt: string;
    flightNumber: string;
    origin: string;
    destination: string;
    departureTime: string;
    contactName: string;
    contactPhone: string;
    contactEmail: string;
}

// Cấu trúc phân trang từ response.result
interface PageResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    currentPage: number; // BE của bạn đang trả về currentPage bắt đầu từ 1
    pageSize: number;
}

// 2. Định nghĩa danh sách Tabs dựa trên Enum của Backend
const TABS = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'PENDING', label: 'Chờ xử lý' },
    { id: 'AWAITING_PAYMENT', label: 'Chờ thanh toán' },
    { id: 'PAID', label: 'Đã thanh toán' },
    { id: 'CONFIRMED', label: 'Đã xác nhận' },
    { id: 'CANCELLED', label: 'Đã huỷ' },
    { id: 'REFUNDED', label: 'Đã hoàn tiền' },
];

export default function BookingManagement() {
    const [bookings, setBookings] = useState<IBooking[]>([]);
    const [loading, setLoading] = useState(false);
    
    const [activeTab, setActiveTab] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    // BE của bạn bắt đầu page từ 1
    const [currentPage, setCurrentPage] = useState(1); 
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const params: any = {
                page: currentPage,
                size: pageSize,
            };
            // Map đúng tham số tìm kiếm và trạng thái
            if (activeTab !== 'ALL') params.status = activeTab;
            if (searchTerm) params.pnrCode = searchTerm; // Giả định BE tìm theo pnrCode, bạn có thể đổi thành 'search' nếu BE dùng chung

            // Gọi API (chỉnh lại endpoint nếu cần)
            const response: any = await apiClient.get('/admin/bookings', { params });
            
            const pageData: PageResponse<IBooking> = response.result;
            
            setBookings(pageData.content || []);
            setTotalPages(pageData.totalPages || 0);
            setTotalElements(pageData.totalElements || 0);
        } catch (error) {
            console.error('Lỗi khi tải danh sách vé:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, [currentPage, activeTab]);

    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            setCurrentPage(1); // Reset về trang 1 khi tìm kiếm
            fetchBookings();
        }
    };

    // 3. Hàm hiển thị Badge Trạng thái cực đẹp, chuẩn Enum BE
    const getStatusBadge = (status: IBooking['status']) => {
        switch (status) {
            case 'PENDING':
                return <span className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-lg">Chờ xử lý</span>;
            case 'AWAITING_PAYMENT':
                return <span className="px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-100/70 rounded-lg">Chờ thanh toán</span>;
            case 'PAID':
                return <span className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-100 rounded-lg">Đã thanh toán</span>;
            case 'CONFIRMED':
                return <span className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 rounded-lg">Đã xác nhận</span>;
            case 'CANCELLED':
                return <span className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-100 rounded-lg">Đã huỷ</span>;
            case 'REFUNDED':
                return <span className="px-3 py-1.5 text-xs font-bold text-purple-700 bg-purple-100 rounded-lg">Đã hoàn tiền</span>;
            default:
                return <span className="px-3 py-1.5 text-xs font-bold text-gray-700 bg-gray-100 rounded-lg">{status}</span>;
        }
    };

    // Hàm format Date (từ "2026-03-10T07:25:14" thành "10/03/2026 07:25")
    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }).format(date);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Ticket className="text-indigo-600" />
                    Quản lý đặt vé
                </h1>
                <p className="text-slate-500 text-sm mt-1">Quản lý mã PNR, theo dõi thanh toán và xuất vé cho hành khách.</p>
            </div>

            {/* Toolbar: Tabs & Search */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                
                {/* Tabs cuộn ngang được nếu màn hình nhỏ */}
                <div className="w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 hide-scrollbar">
                    <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-xl min-w-max">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    setCurrentPage(1);
                                }}
                                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                                    activeTab === tab.id
                                        ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/50'
                                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search Box */}
                <div className="relative w-full xl:w-80 shrink-0">
                    <input
                        type="text"
                        placeholder="Tìm mã PNR (Nhấn Enter để tìm)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={handleSearch}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:font-normal"
                    />
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                </div>
            </div>

            {/* Bảng Dữ liệu */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[13px] uppercase tracking-wider">
                                <th className="px-5 py-4 font-bold">Mã PNR</th>
                                <th className="px-5 py-4 font-bold">Khách Hàng</th>
                                <th className="px-5 py-4 font-bold">Hành Trình</th>
                                <th className="px-5 py-4 font-bold">Ngày Đặt</th>
                                <th className="px-5 py-4 font-bold text-right">Tổng Tiền</th>
                                <th className="px-5 py-4 font-bold text-center">Trạng Thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3 text-slate-500">
                                            <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                            <span className="font-medium">Đang đồng bộ dữ liệu...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : bookings.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center flex flex-col items-center justify-center text-slate-500">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                                            <Filter size={28} className="text-slate-300" />
                                        </div>
                                        <p className="font-medium">Không tìm thấy đơn đặt vé nào phù hợp.</p>
                                    </td>
                                </tr>
                            ) : (
                                bookings.map((booking) => (
                                    <tr key={booking.id} className="hover:bg-slate-50/80 transition-colors group cursor-pointer">
                                        {/* PNR Code */}
                                        <td className="px-5 py-4">
                                            <span className="inline-flex items-center justify-center px-2.5 py-1 bg-slate-100 text-slate-800 font-bold rounded text-[13px] font-mono tracking-widest border border-slate-200">
                                                {booking.pnrCode}
                                            </span>
                                        </td>

                                        {/* Khách Hàng */}
                                        <td className="px-5 py-4">
                                            <p className="font-bold text-slate-800">{booking.contactName}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">{booking.contactPhone}</p>
                                        </td>

                                        {/* Hành Trình */}
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-xs">{booking.flightNumber}</span>
                                            </div>
                                            <div className="flex items-center text-slate-600 text-[13px] font-medium mt-1">
                                                <span className="truncate max-w-[120px]" title={booking.origin}>{booking.origin}</span>
                                                <PlaneTakeoff size={14} className="mx-2 text-slate-300 shrink-0" />
                                                <span className="truncate max-w-[120px]" title={booking.destination}>{booking.destination}</span>
                                            </div>
                                        </td>

                                        {/* Ngày Đặt */}
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-1.5 text-slate-600">
                                                <Clock size={14} className="text-slate-400" />
                                                <span className="font-medium">{formatDate(booking.createdAt)}</span>
                                            </div>
                                        </td>

                                        {/* Tổng Tiền */}
                                        <td className="px-5 py-4 font-bold text-slate-800 text-right text-[15px]">
                                            {booking.totalAmount.toLocaleString('vi-VN')} ₫
                                        </td>

                                        {/* Trạng Thái */}
                                        <td className="px-5 py-4 text-center">
                                            {getStatusBadge(booking.status)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer: Pagination (Tính toán theo currentPage bắt đầu từ 1) */}
                {!loading && bookings.length > 0 && (
                    <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-slate-500">
                            Hiển thị <span className="font-bold text-slate-800">{(currentPage - 1) * pageSize + 1}</span> đến{' '}
                            <span className="font-bold text-slate-800">
                                {Math.min(currentPage * pageSize, totalElements)}
                            </span>{' '}
                            trong tổng số <span className="font-bold text-slate-800">{totalElements}</span> đơn
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            
                            <div className="px-4 py-1.5 text-sm font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg min-w-[100px] text-center">
                                Trang {currentPage} / {totalPages || 1}
                            </div>

                            <button
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage >= totalPages || totalPages === 0}
                                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}