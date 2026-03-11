import { useState, useEffect } from 'react';
import { Search, Ticket, ChevronLeft, ChevronRight, Filter, PlaneTakeoff, Clock, X, SlidersHorizontal } from 'lucide-react';
import apiClient from '../../services/apiClient';

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

interface PageResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    currentPage: number; 
    pageSize: number;
}

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
    
    // UI States
    const [activeTab, setActiveTab] = useState('ALL');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1); 
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    // Search Parameters (Khớp với AdminBookingSearchRequest của BE)
    const [searchParams, setSearchParams] = useState({
        pnrCode: '',
        contactEmail: '',
        contactPhone: '',
        fromDate: '',
        toDate: ''
    });

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const params: any = {
                page: currentPage,
                size: pageSize,
            };
            
            // Map các tham số tìm kiếm
            if (activeTab !== 'ALL') params.status = activeTab;
            if (searchParams.pnrCode) params.pnrCode = searchParams.pnrCode;
            if (searchParams.contactEmail) params.contactEmail = searchParams.contactEmail;
            if (searchParams.contactPhone) params.contactPhone = searchParams.contactPhone;
            
            // Format datetime local sang chuẩn ISO nếu BE yêu cầu (hoặc giữ nguyên tuỳ BE)
            if (searchParams.fromDate) params.fromDate = searchParams.fromDate;
            if (searchParams.toDate) params.toDate = searchParams.toDate;

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

    // Tự động gọi API khi đổi trang hoặc đổi Tab
    useEffect(() => {
        fetchBookings();
    }, [currentPage, activeTab]);

    // Xử lý khi nhấn nút Tìm kiếm
    const handleApplySearch = () => {
        setCurrentPage(1);
        fetchBookings();
    };

    // Xử lý khi nhấn Enter ở ô tìm kiếm nhanh PNR
    const handleQuickSearchEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleApplySearch();
        }
    };

    // Xóa bộ lọc
    const handleClearFilters = () => {
        setSearchParams({ pnrCode: '', contactEmail: '', contactPhone: '', fromDate: '', toDate: '' });
        setCurrentPage(1);
        // Chờ state cập nhật xong thì gọi API (useEffect không track searchParams để tránh gọi liên tục)
        setTimeout(() => fetchBookings(), 50); 
    };

    const getStatusBadge = (status: IBooking['status']) => {
        switch (status) {
            case 'PENDING':
                return <span className="px-3.5 py-1.5 text-sm font-bold text-slate-600 bg-slate-100 rounded-lg">Chờ xử lý</span>;
            case 'AWAITING_PAYMENT':
                return <span className="px-3.5 py-1.5 text-sm font-bold text-amber-700 bg-amber-100 rounded-lg">Chờ thanh toán</span>;
            case 'PAID':
                return <span className="px-3.5 py-1.5 text-sm font-bold text-blue-700 bg-blue-100 rounded-lg">Đã thanh toán</span>;
            case 'CONFIRMED':
                return <span className="px-3.5 py-1.5 text-sm font-bold text-emerald-700 bg-emerald-100 rounded-lg">Đã xác nhận</span>;
            case 'CANCELLED':
                return <span className="px-3.5 py-1.5 text-sm font-bold text-rose-700 bg-rose-100 rounded-lg">Đã huỷ</span>;
            case 'REFUNDED':
                return <span className="px-3.5 py-1.5 text-sm font-bold text-purple-700 bg-purple-100 rounded-lg">Đã hoàn tiền</span>;
            default:
                return <span className="px-3.5 py-1.5 text-sm font-bold text-gray-700 bg-gray-100 rounded-lg">{status}</span>;
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }).format(date);
    };

    return (
        // Dùng min-h-full và flex-col để trang luôn đẩy đủ màn hình
        <div className="min-h-full flex flex-col space-y-6">
            
            {/* Header */}
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                    <Ticket className="text-indigo-600 w-8 h-8" />
                    Quản lý đặt vé
                </h1>
                <p className="text-slate-500 text-base mt-2">Quản lý mã PNR, theo dõi thanh toán và xuất vé cho hành khách.</p>
            </div>

            {/* Toolbar: Tabs & Nút bật bộ lọc */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                    
                    {/* Tabs */}
                    <div className="w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 hide-scrollbar">
                        <div className="flex items-center gap-3 bg-slate-100/80 p-2 rounded-xl min-w-max">
                            {TABS.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveTab(tab.id);
                                        setCurrentPage(1);
                                    }}
                                    className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 ${
                                        activeTab === tab.id
                                            ? 'bg-white text-indigo-700 shadow ring-1 ring-slate-200/50'
                                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quick Search & Filter Toggle */}
                    <div className="flex items-center gap-3 w-full xl:w-auto">
                        <div className="relative flex-1 xl:w-80">
                            <input
                                type="text"
                                placeholder="Tìm nhanh mã PNR..."
                                value={searchParams.pnrCode}
                                onChange={(e) => setSearchParams({...searchParams, pnrCode: e.target.value})}
                                onKeyDown={handleQuickSearchEnter}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:font-normal"
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        </div>
                        <button 
                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                            className={`p-3 rounded-xl border transition-all flex items-center gap-2 ${showAdvancedFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                            <SlidersHorizontal size={20} />
                            <span className="hidden sm:block font-semibold">Lọc nâng cao</span>
                        </button>
                    </div>
                </div>

                {/* Advanced Filter Panel (Hiển thị khi toggle) */}
                {showAdvancedFilters && (
                    <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email liên hệ</label>
                            <input 
                                type="text" 
                                placeholder="Nhập email..."
                                value={searchParams.contactEmail}
                                onChange={(e) => setSearchParams({...searchParams, contactEmail: e.target.value})}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Số điện thoại</label>
                            <input 
                                type="text" 
                                placeholder="Nhập SĐT..."
                                value={searchParams.contactPhone}
                                onChange={(e) => setSearchParams({...searchParams, contactPhone: e.target.value})}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Từ ngày (Ngày đặt)</label>
                            <input 
                                type="datetime-local" 
                                value={searchParams.fromDate}
                                onChange={(e) => setSearchParams({...searchParams, fromDate: e.target.value})}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Đến ngày (Ngày đặt)</label>
                            <input 
                                type="datetime-local" 
                                value={searchParams.toDate}
                                onChange={(e) => setSearchParams({...searchParams, toDate: e.target.value})}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700"
                            />
                        </div>
                        <div className="lg:col-span-4 flex justify-end gap-3 mt-2">
                            <button 
                                onClick={handleClearFilters}
                                className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <X size={16} /> Xóa lọc
                            </button>
                            <button 
                                onClick={handleApplySearch}
                                className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                            >
                                Tìm kiếm
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Bảng Dữ liệu - Cho phép flex-1 để chiếm nốt không gian còn lại */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm uppercase tracking-wider">
                                <th className="px-6 py-5 font-bold">Mã PNR</th>
                                <th className="px-6 py-5 font-bold">Khách Hàng</th>
                                <th className="px-6 py-5 font-bold">Hành Trình</th>
                                <th className="px-6 py-5 font-bold">Ngày Đặt</th>
                                <th className="px-6 py-5 font-bold text-right">Tổng Tiền</th>
                                <th className="px-6 py-5 font-bold text-center">Trạng Thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-base">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-16 text-center">
                                        <div className="flex flex-col items-center justify-center gap-4 text-slate-500">
                                            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                            <span className="font-semibold text-lg">Đang đồng bộ dữ liệu...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : bookings.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-16 text-center flex flex-col items-center justify-center text-slate-500">
                                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                            <Filter size={36} className="text-slate-300" />
                                        </div>
                                        <p className="font-semibold text-lg">Không tìm thấy đơn đặt vé nào phù hợp.</p>
                                    </td>
                                </tr>
                            ) : (
                                bookings.map((booking) => (
                                    <tr key={booking.id} className="hover:bg-slate-50 transition-colors group">
                                        {/* PNR Code */}
                                        <td className="px-6 py-5">
                                            <span className="inline-flex items-center justify-center px-3 py-1.5 bg-slate-100 text-slate-800 font-bold rounded-md text-sm font-mono tracking-widest border border-slate-200">
                                                {booking.pnrCode}
                                            </span>
                                        </td>

                                        {/* Khách Hàng */}
                                        <td className="px-6 py-5">
                                            <p className="font-bold text-slate-800 text-base">{booking.contactName}</p>
                                            <p className="text-sm text-slate-500 mt-1">{booking.contactPhone}</p>
                                        </td>

                                        {/* Hành Trình */}
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className="font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded text-sm">{booking.flightNumber}</span>
                                            </div>
                                            <div className="flex items-center text-slate-600 text-sm font-semibold mt-1">
                                                <span className="truncate max-w-[140px]" title={booking.origin}>{booking.origin}</span>
                                                <PlaneTakeoff size={16} className="mx-3 text-slate-300 shrink-0" />
                                                <span className="truncate max-w-[140px]" title={booking.destination}>{booking.destination}</span>
                                            </div>
                                        </td>

                                        {/* Ngày Đặt */}
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Clock size={16} className="text-slate-400" />
                                                <span className="font-semibold">{formatDate(booking.createdAt)}</span>
                                            </div>
                                        </td>

                                        {/* Tổng Tiền */}
                                        <td className="px-6 py-5 font-bold text-slate-800 text-right text-base">
                                            {booking.totalAmount.toLocaleString('vi-VN')} ₫
                                        </td>

                                        {/* Trạng Thái */}
                                        <td className="px-6 py-5 text-center">
                                            {getStatusBadge(booking.status)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer: Pagination */}
                {!loading && bookings.length > 0 && (
                    <div className="p-5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto">
                        <p className="text-base text-slate-500">
                            Hiển thị <span className="font-bold text-slate-800">{(currentPage - 1) * pageSize + 1}</span> đến{' '}
                            <span className="font-bold text-slate-800">
                                {Math.min(currentPage * pageSize, totalElements)}
                            </span>{' '}
                            trong tổng số <span className="font-bold text-slate-800">{totalElements}</span> đơn
                        </p>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            
                            <div className="px-5 py-2 text-base font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg min-w-[120px] text-center">
                                Trang {currentPage} / {totalPages || 1}
                            </div>

                            <button
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage >= totalPages || totalPages === 0}
                                className="p-2.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}