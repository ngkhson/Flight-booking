import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Plus, Edit2, Trash2, Filter, Package, AlertTriangle, X } from 'lucide-react';
import AdminHeader from '../../components/admin/layout/AdminHeader';
import {
    searchAncillaryCatalogs, createAncillaryCatalog, updateAncillaryCatalog, deleteAncillaryCatalog,
    type IAncillaryCatalog, type IAncillaryCatalogCreationRequest
} from '../../features/admin/services/adminApi';

// Cập nhật Enum Types theo đúng Backend của bạn
const CATALOG_TYPES = ['BAGGAGE', 'MEAL', 'SEAT'];

const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const SkeletonRow = () => (
    <tr className="animate-pulse border-b border-gray-50">
        {Array.from({ length: 6 }).map((_, i) => (
            <td key={i} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded w-full" /></td>
        ))}
    </tr>
);

export default function AncillaryManagement() {
    const [catalogs, setCatalogs] = useState<IAncillaryCatalog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    // Phân trang & Lọc
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);
    const [filterParams, setFilterParams] = useState({ keyword: '', type: '', status: '' });
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<IAncillaryCatalogCreationRequest>({ code: '', name: '', type: 'BAGGAGE', price: 0, status: 'ACTIVE' });
    
    // Confirm Delete State
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    // ─── FETCH DATA ───────────────────────────────────────────────────────────
    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const cleanParams = Object.fromEntries(Object.entries(filterParams).filter(([_, v]) => v !== ''));

            // ✅ GET /ancillary-catalogs/search — 1-based page index
            // UI Page 1 → API page: 1 (gửi trực tiếp)
            const res: any = await searchAncillaryCatalogs({ page: currentPage, size: 10, ...cleanParams });

            // ── Bóc tách PageResponse: res.result chứa { data, currentPage, totalPages, totalElements } ──
            const pageResponse = res?.result || res?.data || res;
            
            // Ưu tiên trường `data` theo contract PageResponse
            setCatalogs(Array.isArray(pageResponse?.data) ? pageResponse.data : []);
            setTotalPages(pageResponse?.totalPages || 1);
            setTotalElements(pageResponse?.totalElements || 0);
        } catch (error) {
            console.error("Lỗi lấy dữ liệu:", error);
            showToast("Không thể tải dữ liệu dịch vụ.", "error");
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, filterParams]);

    useEffect(() => { loadData(); }, [loadData]);

    // ─── HANDLERS ─────────────────────────────────────────────────────────────
    const handleSearch = (val: string) => {
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            setFilterParams(prev => ({ ...prev, keyword: val }));
            setCurrentPage(1);
        }, 500);
    };

    const handleFilter = (field: string, val: string) => {
        setFilterParams(prev => ({ ...prev, [field]: val }));
        setCurrentPage(1);
    };

    const openModal = (catalog?: IAncillaryCatalog) => {
        if (catalog) {
            setEditingId(catalog.id);
            setFormData({ code: catalog.code, name: catalog.name, type: catalog.type, price: catalog.price, status: catalog.status });
        } else {
            setEditingId(null);
            setFormData({ code: '', name: '', type: 'BAGGAGE', price: 0, status: 'ACTIVE' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                // Code là trường duy nhất không cho phép sửa (theo Request Backend)
                const { code, ...updatePayload } = formData; 
                await updateAncillaryCatalog(editingId, updatePayload as any);
                showToast("Cập nhật dịch vụ thành công!");
            } else {
                await createAncillaryCatalog(formData);
                showToast("Thêm mới dịch vụ thành công!");
            }
            setIsModalOpen(false);
            loadData();
        } catch (error: any) {
            const errMsg = error.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại!";
            showToast(errMsg, "error");
        }
    };

    const confirmDelete = async () => {
        if (!deletingId) return;
        try {
            await deleteAncillaryCatalog(deletingId);
            showToast("Đã vô hiệu hóa dịch vụ!");
            setDeletingId(null);
            loadData();
        } catch (error) {
            showToast("Xóa thất bại!", "error");
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] pb-10 space-y-6 relative z-20">
            <AdminHeader title="Quản lý dịch vụ phụ trợ" />

            {toast && (
                <div className={`fixed top-5 right-5 z-[200] px-4 py-3 rounded-xl shadow-lg text-sm font-medium border animate-in slide-in-from-right-2 ${toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                    {toast.msg}
                </div>
            )}

            {/* ── BỘ LỌC & NÚT THÊM ── */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex-1 w-full flex gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input type="text" placeholder="Tìm kiếm mã hoặc tên..." onChange={(e) => handleSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                    </div>
                    <select onChange={(e) => handleFilter('type', e.target.value)} className="py-2.5 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="">Tất cả loại</option>
                        {CATALOG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <select onChange={(e) => handleFilter('status', e.target.value)} className="py-2.5 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="">Tất cả trạng thái</option>
                        <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                        <option value="INACTIVE">Vô hiệu (INACTIVE)</option>
                    </select>
                </div>
                <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition shadow-sm whitespace-nowrap">
                    <Plus size={18} /> Thêm dịch vụ
                </button>
            </div>

            {/* ── BẢNG DỮ LIỆU ── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50/80 text-xs uppercase text-gray-500 tracking-wider font-bold border-b border-gray-100">
                            <tr>
                                <th className="px-5 py-4">Mã DV (Code)</th>
                                <th className="px-5 py-4">Tên dịch vụ</th>
                                <th className="px-5 py-4">Loại hình</th>
                                <th className="px-5 py-4">Đơn giá</th>
                                <th className="px-5 py-4">Trạng thái</th>
                                <th className="px-5 py-4 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-gray-700">
                            {isLoading ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />) : catalogs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-16 text-center text-gray-400">
                                        <Filter className="w-12 h-12 mb-3 mx-auto text-gray-200" />
                                        <p className="font-medium">Chưa có dịch vụ nào</p>
                                    </td>
                                </tr>
                            ) : (
                                catalogs.map((cat) => (
                                    <tr key={cat.id} className="hover:bg-indigo-50/30 transition-colors">
                                        <td className="px-5 py-4 font-mono font-bold text-indigo-700">{cat.code}</td>
                                        <td className="px-5 py-4 font-semibold text-gray-900 flex items-center gap-2"><Package size={16} className="text-gray-400"/> {cat.name}</td>
                                        <td className="px-5 py-4"><span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-bold">{cat.type}</span></td>
                                        <td className="px-5 py-4 font-bold text-gray-900">{formatCurrency(cat.price)}</td>
                                        <td className="px-5 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${cat.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {cat.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => openModal(cat)} className="p-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition"><Edit2 size={16} /></button>
                                                {cat.status === 'ACTIVE' && (
                                                    <button onClick={() => setDeletingId(cat.id)} className="p-1.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"><Trash2 size={16} /></button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ─── PHÂN TRANG (PAGINATION) ────────────────────────────────────── */}
                {!isLoading && totalPages > 1 && (
                    <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-b-2xl">
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                            Hiển thị trang <span className="font-bold text-gray-700">{currentPage}</span> / {totalPages} (Tổng: <span className="font-bold text-gray-700">{totalElements}</span> dịch vụ)
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

            {/* ── MODAL THÊM/SỬA ── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg text-gray-900">{editingId ? 'Cập nhật dịch vụ' : 'Thêm dịch vụ mới'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 transition"><X size={20}/></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Mã dịch vụ (Code) <span className="text-red-500">*</span></label>
                                <input required disabled={!!editingId} type="text" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="VD: BG20KG" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Tên hiển thị <span className="text-red-500">*</span></label>
                                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="VD: Hành lý ký gửi 20kg" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Loại hình <span className="text-red-500">*</span></label>
                                    <select required value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500">
                                        {CATALOG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Đơn giá (VND) <span className="text-red-500">*</span></label>
                                    <input required type="number" min="0" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Trạng thái</label>
                                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500">
                                    <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                                    <option value="INACTIVE">Vô hiệu hóa (INACTIVE)</option>
                                </select>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition">Hủy</button>
                                <button type="submit" className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-md">{editingId ? 'Lưu thay đổi' : 'Tạo mới'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── MODAL XÓA ── */}
            {deletingId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 text-center">
                        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={24}/></div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Vô hiệu hóa dịch vụ?</h3>
                        <p className="text-sm text-gray-500 mb-6">Dịch vụ này sẽ bị chuyển sang trạng thái INACTIVE và không thể mua được nữa. Bạn có chắc chắn?</p>
                        <div className="flex justify-center gap-3">
                            <button onClick={() => setDeletingId(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-200 transition">Hủy bỏ</button>
                            <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition shadow-sm">Đồng ý</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}