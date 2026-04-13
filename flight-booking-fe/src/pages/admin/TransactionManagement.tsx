import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Filter, RefreshCcw, DollarSign, CheckCircle2, XCircle, Clock } from 'lucide-react';
import AdminHeader from '../../components/admin/layout/AdminHeader';
import { getTransactions, type ITransaction } from '../../features/admin/services/adminApi';

// ─── HELPERS & FORMATTERS ─────────────────────────────────────────────────────
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const formatDate = (isoString: string) => {
    if (!isoString) return '—';
    const date = new Date(isoString);
    return date.toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

const STATUS_CONFIG: Record<string, { label: string, color: string, icon: any }> = {
    SUCCESS: { label: 'Thành công', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
    PENDING: { label: 'Đang xử lý', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
    FAILED: { label: 'Thất bại', color: 'bg-rose-100 text-rose-700 border-rose-200', icon: XCircle },
    REFUNDED: { label: 'Đã hoàn tiền', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: RefreshCcw }
};

// ─── SKELETON LOADER ────────────────────────────────────────────────────────
const SkeletonRow = () => (
    <tr className="animate-pulse border-b border-gray-50">
        {Array.from({ length: 6 }).map((_, i) => (
            <td key={i} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded w-full" /></td>
        ))}
    </tr>
);

export default function TransactionManagement() {
    // State dữ liệu
    const [transactions, setTransactions] = useState<ITransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [apiError, setApiError] = useState<string | null>(null);

    // State phân trang (Backend của bạn dùng page bắt đầu từ 1)
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);
    const pageSize = 10;

    // State bộ lọc (Gửi lên API)
    const [filterParams, setFilterParams] = useState({
        keyword: '',
        status: '',
        startDate: '',
        endDate: ''
    });

    // ─── GỌI API ───────────────────────────────────────────────────────────────
    const loadData = useCallback(async () => {
        setIsLoading(true);
        setApiError(null);
        try {
            // Loại bỏ các trường rỗng để tránh gửi URL thừa thãi
            const cleanParams = Object.fromEntries(
                Object.entries(filterParams).filter(([_, v]) => v !== '')
            );

            const response = await getTransactions({
                page: currentPage,
                size: pageSize,
                ...cleanParams
            });

            /// Bóc tách lớp result/data do axiosClient trả về
            const responseData = response?.result || response?.data || response;

            setTransactions(responseData?.data || []);
            setTotalPages(responseData?.totalPages || 1);
            setTotalElements(responseData?.totalElements || 0);
        } catch (error) {
            console.error("Lỗi lấy dữ liệu giao dịch:", error);
            setApiError("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, pageSize, filterParams]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // ─── XỬ LÝ LỌC & TÌM KIẾM ──────────────────────────────────────────────────
    // Dùng ref timeout để làm debounce cho ô tìm kiếm
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleSearchChange = (val: string) => {
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            setFilterParams(prev => ({ ...prev, keyword: val }));
            setCurrentPage(1); // Reset về trang 1 khi tìm kiếm
        }, 500); // Đợi 500ms sau khi ngừng gõ mới gọi API
    };

    const handleFilterChange = (field: string, value: string) => {
        setFilterParams(prev => ({ ...prev, [field]: value }));
        setCurrentPage(1);
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] pb-10 space-y-6 relative z-20">
            <AdminHeader title="Quản lý giao dịch" />

            {/* ─── BỘ LỌC & TÌM KIẾM ────────────────────────────────────────────── */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between">
                
                <div className="flex-1 max-w-md relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Tìm mã GD (VNPAY) hoặc Mã ngân hàng..."
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm text-gray-700 font-medium"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <select
                        value={filterParams.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="py-2.5 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="SUCCESS">Thành công</option>
                        <option value="PENDING">Đang xử lý</option>
                        <option value="FAILED">Thất bại</option>
                    </select>

                    <input
                        type="date"
                        value={filterParams.startDate}
                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                        className="py-2.5 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        title="Từ ngày"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                        type="date"
                        value={filterParams.endDate}
                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                        className="py-2.5 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        title="Đến ngày"
                    />
                </div>
            </div>

            {/* ─── BẢNG DỮ LIỆU ─────────────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-2 text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 font-semibold text-sm shadow-sm">
                        <DollarSign className="w-4 h-4" /> Tổng số: {totalElements} giao dịch
                    </div>
                    <button onClick={loadData} className="text-gray-500 hover:text-indigo-600 transition flex items-center gap-2 text-sm font-medium">
                        <RefreshCcw className="w-4 h-4" /> Làm mới
                    </button>
                </div>

                {apiError ? (
                    <div className="p-10 text-center text-red-500 font-medium bg-red-50/50">{apiError}</div>
                ) : (
                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50/80 text-xs uppercase text-gray-500 tracking-wider font-bold border-b border-gray-100">
                                <tr>
                                    <th className="px-5 py-4">Mã Giao Dịch (Gateway)</th>
                                    <th className="px-5 py-4">Ngân hàng (Bank Ref)</th>
                                    <th className="px-5 py-4">Số tiền</th>
                                    <th className="px-5 py-4">Phương thức</th>
                                    <th className="px-5 py-4">Thời gian</th>
                                    <th className="px-5 py-4 text-center">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-gray-700">
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                                ) : transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-16 text-center">
                                            <div className="inline-flex flex-col items-center justify-center text-gray-400">
                                                <Filter className="w-12 h-12 mb-3 text-gray-200" />
                                                <p className="text-base font-medium">Không tìm thấy giao dịch nào</p>
                                                <p className="text-xs mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((tx, idx) => {
                                        const status = STATUS_CONFIG[tx.status] || { label: tx.status, color: 'bg-gray-100 text-gray-700', icon: Clock };
                                        const StatusIcon = status.icon;

                                        return (
                                            <tr key={idx} className="hover:bg-indigo-50/30 transition-colors group">
                                                <td className="px-5 py-4 font-mono font-medium text-indigo-700">{tx.transactionNo || '—'}</td>
                                                <td className="px-5 py-4 font-mono text-gray-500">{tx.bankRefNo || '—'}</td>
                                                <td className="px-5 py-4 font-bold text-gray-900">{formatCurrency(tx.amount)}</td>
                                                <td className="px-5 py-4">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide bg-blue-50 text-blue-700 border border-blue-200">
                                                        {tx.paymentMethod || 'VNPAY'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-gray-500 font-medium">{formatDate(tx.createdAt)}</td>
                                                <td className="px-5 py-4 text-center">
                                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${status.color} shadow-sm`}>
                                                        <StatusIcon className="w-3.5 h-3.5" />
                                                        {status.label}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ─── PHÂN TRANG (PAGINATION) ────────────────────────────────────── */}
                {!isLoading && totalPages > 1 && (
                    <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-b-2xl">
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                            Hiển thị trang <span className="font-bold text-gray-700">{currentPage}</span> / {totalPages} (Tổng: <span className="font-bold text-gray-700">{totalElements}</span> giao dịch)
                        </span>

                        <div className="flex flex-wrap items-center justify-end gap-4 w-full">
                            <button onClick={loadData} className="text-indigo-600 hover:text-indigo-800 transition text-xs font-bold flex items-center gap-1 hidden sm:flex">
                                🔄 Làm mới
                            </button>

                            {/* Bộ nút phân trang */}
                            <div className="flex flex-wrap gap-1">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
                                >
                                    Trước
                                </button>

                                {/* Logic render nút có dấu ... */}
                                {(() => {
                                    const pages = [];
                                    const maxVisible = 5; // Số trang tối đa hiển thị xung quanh trang hiện tại

                                    if (totalPages <= maxVisible + 2) {
                                        // Nếu ít trang thì hiện hết
                                        for (let i = 1; i <= totalPages; i++) {
                                            pages.push(
                                                <button
                                                    key={i}
                                                    onClick={() => setCurrentPage(i)}
                                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition shadow-sm min-w-[32px] ${currentPage === i ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                                                >
                                                    {i}
                                                </button>
                                            );
                                        }
                                    } else {
                                        // Nếu nhiều trang thì dùng dấu ...
                                        pages.push(
                                            <button key={1} onClick={() => setCurrentPage(1)} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition shadow-sm min-w-[32px] ${currentPage === 1 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>1</button>
                                        );

                                        if (currentPage > 3) {
                                            pages.push(<span key="dots-1" className="px-2 py-1.5 text-gray-400 font-bold">...</span>);
                                        }

                                        let startPage = Math.max(2, currentPage - 1);
                                        let endPage = Math.min(totalPages - 1, currentPage + 1);

                                        if (currentPage === 1) endPage = 3;
                                        if (currentPage === totalPages) startPage = totalPages - 2;

                                        for (let i = startPage; i <= endPage; i++) {
                                            pages.push(
                                                <button
                                                    key={i}
                                                    onClick={() => setCurrentPage(i)}
                                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition shadow-sm min-w-[32px] ${currentPage === i ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                                                >
                                                    {i}
                                                </button>
                                            );
                                        }

                                        if (currentPage < totalPages - 2) {
                                            pages.push(<span key="dots-2" className="px-2 py-1.5 text-gray-400 font-bold">...</span>);
                                        }

                                        pages.push(
                                            <button key={totalPages} onClick={() => setCurrentPage(totalPages)} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition shadow-sm min-w-[32px] ${currentPage === totalPages ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>{totalPages}</button>
                                        );
                                    }
                                    return pages;
                                })()}

                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
                                >
                                    Sau
                                </button>
                            </div>

                            {/* Ô nhập số trang nhảy tới */}
                            <div className="flex items-center gap-2 border-l border-gray-200 pl-4 ml-2">
                                <span className="text-xs text-gray-500 font-medium">Đến trang:</span>
                                <input 
                                    type="number" 
                                    min="1" 
                                    max={totalPages} 
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const val = parseInt(e.currentTarget.value);
                                            if (val >= 1 && val <= totalPages) setCurrentPage(val);
                                            e.currentTarget.value = ''; // Xóa ô sau khi Enter
                                        }
                                    }}
                                    placeholder="#"
                                    className="w-12 px-2 py-1 text-xs font-bold text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 hide-arrows"
                                />
                            </div>

                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}