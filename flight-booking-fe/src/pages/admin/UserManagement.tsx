import { useState, useEffect, useCallback, useRef } from 'react';
import { Edit, RefreshCw, KeyRound, Trash2, X, Copy, Check, Eye, EyeOff } from 'lucide-react';
import {
    getUsers,
    updateUser,
    resetUserPassword,
    deleteUser,
} from '../../features/admin/services/adminApi';

// ─── Tự định nghĩa Interface ──────────────────────────────────────────────────
export interface IRole {
    id: number;
    name: string;
    description: string;
}

export interface IUser {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    roles: IRole[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
type RoleName = string;
const ALL_ROLES: RoleName[] = ['ADMIN', 'USER'];

const ROLE_BADGE: Record<string, string> = {
    ADMIN: 'bg-purple-100 text-purple-700',
    USER: 'bg-gray-100 text-gray-600',
};

const ROLE_LABELS: Record<string, string> = {
    ADMIN: 'Admin',
    USER: 'Khách hàng',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getPrimaryRole = (roles: IRole[]): string =>
    roles[0]?.name ?? 'USER';

// ─── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
                <td key={i} className="px-4 py-3">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                </td>
            ))}
        </tr>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function UserManagement() {
    const [users, setUsers] = useState<IUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [apiError, setApiError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
    const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);
    const itemsPerPage = 10;

    // ── Modal States ──────────────────────────────────────────────────────────
    const [editingUser, setEditingUser] = useState<IUser | null>(null);
    const [editForm, setEditForm] = useState({ fullName: '', phone: '' });
    const [isEditSubmitting, setIsEditSubmitting] = useState(false);

    const [resetPwUser, setResetPwUser] = useState<IUser | null>(null);
    const [isResetSubmitting, setIsResetSubmitting] = useState(false);
    const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [deletingUser, setDeletingUser] = useState<IUser | null>(null);
    const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);

    // 🚀 STATE LƯU THÔNG TIN ROLE ĐANG CHỜ XÁC NHẬN
    const [pendingRoleChange, setPendingRoleChange] = useState<{ userId: string; roleName: string } | null>(null);
    const [isRoleSubmitting, setIsRoleSubmitting] = useState(false);
    const [roleModalUser, setRoleModalUser] = useState<IUser | null>(null);
    const [selectedRole, setSelectedRole] = useState<string>('');

    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ msg, type });
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setToast(null), 3000);
    }, []);

    useEffect(() => {
        return () => {
            if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        };
    }, []);

    // ── Load users from API ───────────────────────────────────────────────────
    const loadUsers = useCallback(async () => {
        setIsLoading(true);
        setApiError(null);
        try {
            const res = await getUsers({ page: currentPage - 1, size: itemsPerPage }) as any;
            
            // 1. Get the main payload object safely
            const payload = res?.result || res?.data || res;
            
            // 2. Extract the array safely (check 'data', 'content', or if the payload itself is an array)
            const usersArray = payload?.data || payload?.content || (Array.isArray(payload) ? payload : []);
            
            // 3. Extract pagination metadata safely
            const totalPagesCount = payload?.totalPages || 1;
            const totalItemsCount = payload?.totalElements || usersArray.length;

            // 4. Update states
            setUsers(usersArray);
            setTotalPages(totalPagesCount);
            setTotalElements(totalItemsCount);
        } catch (err: unknown) {
            console.error('[UserManagement] getUsers failed:', err);
            setApiError('Không thể tải danh sách người dùng.');
            setUsers([]);
            setTotalPages(1);
            setTotalElements(0);
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, itemsPerPage]);

    useEffect(() => { loadUsers(); }, [loadUsers]);

    // ── Handlers: Edit Modal ──────────────────────────────────────────────────
    const openEditModal = (user: IUser) => {
        setEditingUser(user);
        setEditForm({ fullName: user.fullName || '', phone: user.phone || '' });
    };

    const handleEditSubmit = async () => {
        if (!editingUser || isEditSubmitting) return;
        setIsEditSubmitting(true);
        try {
            const currentRoles = (editingUser.roles || []).map(r => r.name);
            const payload = {
                fullName: editForm.fullName,
                phone: editForm.phone,
                roles: currentRoles.length > 0 ? currentRoles : ['USER'],
            };
            await updateUser(editingUser.id, payload);
            showToast('Cập nhật thông tin người dùng thành công!');
            setEditingUser(null);
            await loadUsers();
        } catch (error) {
            console.error('Lỗi cập nhật user:', error);
            showToast('Không thể cập nhật thông tin. Vui lòng thử lại.', 'error');
        } finally {
            setIsEditSubmitting(false);
        }
    };

    // ── Handlers: Reset Password Modal ────────────────────────────────────────
    const openResetPwModal = (user: IUser) => {
        setResetPwUser(user);
        setGeneratedPassword(null);
        setCopied(false);
        setShowPassword(false);
    };

    const handleGeneratePassword = async () => {
        if (!resetPwUser || isResetSubmitting) return;
        setIsResetSubmitting(true);
        try {
            const newPw = Math.random().toString(36).slice(-8);
            await resetUserPassword(resetPwUser.id, newPw);
            setGeneratedPassword(newPw);
            setCopied(false);
            setShowPassword(true);
        } catch (error) {
            console.error('Lỗi reset password:', error);
            showToast('Không thể đặt lại mật khẩu. Vui lòng thử lại.', 'error');
        } finally {
            setIsResetSubmitting(false);
        }
    };

    const handleCopyPassword = async () => {
        if (!generatedPassword) return;
        try {
            await navigator.clipboard.writeText(generatedPassword);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            showToast('Không thể copy. Hãy copy thủ công.', 'error');
        }
    };

    const closeResetPwModal = () => {
        setResetPwUser(null);
        setGeneratedPassword(null);
        setCopied(false);
        setShowPassword(false);
    };

    // ── Handlers: Delete Modal ────────────────────────────────────────────────
    const openDeleteModal = (user: IUser) => {
        setDeletingUser(user);
    };

    const handleDeleteUser = async () => {
        if (!deletingUser || isDeleteSubmitting) return;
        setIsDeleteSubmitting(true);
        try {
            await deleteUser(deletingUser.id);
            showToast('Đã xoá tài khoản thành công!');
            setDeletingUser(null);
            await loadUsers();
        } catch {
            showToast('Người dùng đã đặt chuyến rồi, không thể xoá tài khoản này!', 'error');
        } finally {
            setIsDeleteSubmitting(false);
        }
    };

    // ── Handlers: Role Change Modal ───────────────────────────────────────────
    const openRoleModal = (user: IUser) => {
        setRoleModalUser(user);
        setSelectedRole(getPrimaryRole(user.roles || []));
    };

    const handleRequestRoleChange = useCallback(() => {
        if (!roleModalUser || !selectedRole) return;
        const currentRole = getPrimaryRole(roleModalUser.roles || []);
        if (currentRole === selectedRole) {
            showToast('Role hiện tại không thay đổi.', 'info');
            return;
        }
        setPendingRoleChange({ userId: roleModalUser.id, roleName: selectedRole });
    }, [roleModalUser, selectedRole, showToast]);

    const confirmRoleChange = useCallback(async () => {
        if (!pendingRoleChange || isRoleSubmitting) return;
        const { userId, roleName } = pendingRoleChange;

        const targetUser = users.find(u => u.id === userId);
        if (!targetUser) {
            setPendingRoleChange(null);
            return;
        }

        setIsRoleSubmitting(true);

        try {
            const payload = {
                fullName: targetUser.fullName || 'Unknown',
                phone: targetUser.phone && targetUser.phone.length === 10 ? targetUser.phone : '0999999999',
                roles: [roleName],
            };
            await updateUser(userId, payload);
            showToast(`Đã đổi role → ${ROLE_LABELS[roleName] ?? roleName}.`);
            setPendingRoleChange(null);
            setRoleModalUser(null);
            await loadUsers();
        } catch (error) {
            console.error('Lỗi đổi role:', error);
            showToast('Không thể đổi role. Kiểm tra lại thông tin.', 'error');
        } finally {
            setIsRoleSubmitting(false);
        }
    }, [pendingRoleChange, isRoleSubmitting, users, showToast, loadUsers]);

    // ── Lọc Dữ Liệu ───────────────────────────────────────────────────────────
    const paginatedUsers = (users || []).filter((u) => {
        if (!u) return false;
        const q = search.toLowerCase();
        const primaryRole = getPrimaryRole(u.roles || []);
        return (
            !q ||
            (u.fullName && u.fullName.toLowerCase().includes(q)) ||
            (u.email && u.email.toLowerCase().includes(q)) ||
            (u.phone && u.phone.includes(q)) ||
            (primaryRole && primaryRole.toLowerCase().includes(q))
        );
    });

    const toastCls = (type: string) =>
        type === 'success' ? 'bg-green-50 border-green-200 text-green-700'
            : type === 'error' ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-blue-50 border-blue-200 text-blue-700';

    return (
        <div className="space-y-5 pb-10">
            {toast && (
                <div className={`fixed top-5 right-5 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border animate-in slide-in-from-right-2 ${toastCls(toast.type)}`}>
                    <span>{toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}</span>
                    <span>{toast.msg}</span>
                    <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70" aria-label="Đóng">✕</button>
                </div>
            )}

            <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">👥 Quản lý người dùng</h1>
                    <p className="mt-0.5 text-sm text-gray-500">Phân quyền và quản lý tài khoản</p>
                </div>
                {!isLoading && (
                    <div className="flex gap-2 text-xs font-medium">
                        <span className="px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 shadow-sm">
                            👥 Tổng cộng {totalElements || users.length} tài khoản
                        </span>
                    </div>
                )}
            </div>

            {isLoading && (
                <div className="flex items-center gap-2 text-sm text-indigo-600 font-medium">
                    <span className="inline-block w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                    Đang tải dữ liệu người dùng...
                </div>
            )}

            {apiError && (
                <div className="px-4 py-3 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm flex items-center justify-between gap-2 shadow-sm">
                    <span className="flex items-center gap-2"><span>⚠️</span><span className="font-medium">{apiError}</span></span>
                    <button onClick={loadUsers} className="px-3 py-1 bg-white border border-yellow-300 rounded-lg text-xs font-bold hover:bg-yellow-100 transition">Thử lại</button>
                </div>
            )}

            <div className="relative max-w-sm">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm pointer-events-none">🔍</span>
                <input
                    id="search-users"
                    type="text"
                    placeholder="Tìm theo tên, email, sđt, role..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                <div className="overflow-x-auto min-h-[350px]">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 tracking-wide font-bold">
                            <tr>
                                <th className="px-5 py-4 rounded-tl-2xl">ID</th>
                                <th className="px-5 py-4">Họ tên</th>
                                <th className="px-5 py-4">Email</th>
                                <th className="px-5 py-4">Điện thoại</th>
                                <th className="px-5 py-4">Phân quyền (Role)</th>
                                <th className="px-5 py-4 text-right rounded-tr-2xl">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading
                                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                                : paginatedUsers.length === 0
                                    ? (
                                        <tr>
                                            <td colSpan={6} className="px-5 py-12 text-center text-gray-400 text-sm">
                                                {users.length === 0 ? 'Chưa có dữ liệu người dùng trong hệ thống.' : 'Không tìm thấy người dùng nào khớp với tìm kiếm.'}
                                            </td>
                                        </tr>
                                    )
                                    : paginatedUsers.map((u) => {
                                        const primaryRole = getPrimaryRole(u.roles);

                                        return (
                                            <tr key={u.id} className="hover:bg-indigo-50/40 transition-colors group">
                                                <td className="px-5 py-4 font-mono text-xs text-gray-400">{u.id.substring(0, 8)}...</td>
                                                <td className="px-5 py-4 font-bold text-gray-800 whitespace-nowrap">{u.fullName}</td>
                                                <td className="px-5 py-4 text-gray-600">{u.email}</td>
                                                <td className="px-5 py-4 text-gray-500 whitespace-nowrap">{u.phone ?? '—'}</td>
                                                <td className="px-5 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${ROLE_BADGE[primaryRole] ?? 'bg-gray-100 text-gray-600'}`}>
                                                        {ROLE_LABELS[primaryRole] ?? primaryRole}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            onClick={() => openEditModal(u)}
                                                            className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                                                            title="Sửa thông tin"
                                                            aria-label={`Sửa thông tin ${u.fullName}`}
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => openRoleModal(u)}
                                                            className="p-1.5 text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 hover:text-purple-700 transition"
                                                            title="Đổi role"
                                                            aria-label={`Đổi role ${u.fullName}`}
                                                        >
                                                            <RefreshCw size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => openResetPwModal(u)}
                                                            className="p-2 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
                                                            title="Đặt lại mật khẩu"
                                                            aria-label={`Đặt lại mật khẩu ${u.fullName}`}
                                                        >
                                                            <KeyRound size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => openDeleteModal(u)}
                                                            className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                                                            title="Xoá tài khoản"
                                                            aria-label={`Xoá tài khoản ${u.fullName}`}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                            }
                        </tbody>
                    </table>
                </div>

                {/* ─── PHÂN TRANG (PAGINATION) ────────────────────────────────────── */}
                {!isLoading && users.length > 0 && (
                    <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-b-2xl">
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                            Trang hiển thị: <span className="font-bold text-gray-700">{currentPage}</span> / <span className="font-bold text-gray-700">{totalPages}</span>
                        </span>

                        <div className="flex flex-wrap items-center justify-end gap-4 w-full">
                            <button onClick={loadUsers} className="text-indigo-600 hover:text-indigo-800 transition text-xs font-bold flex items-center gap-1 hidden sm:flex">
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

            {/* ═══════════════════════════════════════════════════════════════════
                MODAL: SỬA THÔNG TIN NGƯỜI DÙNG (Edit Modal)
            ═══════════════════════════════════════════════════════════════════ */}
            {editingUser && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 pt-6 pb-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                    <Edit size={20} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800">Sửa thông tin</h3>
                            </div>
                            <button onClick={() => setEditingUser(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-4 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Họ tên</label>
                                <input
                                    type="text"
                                    value={editForm.fullName}
                                    onChange={(e) => setEditForm(f => ({ ...f, fullName: e.target.value }))}
                                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    placeholder="Nhập họ tên"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Số điện thoại</label>
                                <input
                                    type="text"
                                    value={editForm.phone}
                                    onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))}
                                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    placeholder="Nhập số điện thoại"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
                                <input
                                    type="text"
                                    value={editingUser.email}
                                    disabled
                                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-400 cursor-not-allowed"
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-3 px-6 pb-6 pt-2">
                            <button
                                onClick={() => setEditingUser(null)}
                                disabled={isEditSubmitting}
                                className="px-4 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl text-sm hover:bg-gray-200 transition disabled:opacity-50"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleEditSubmit}
                                disabled={isEditSubmitting || !editForm.fullName.trim()}
                                className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isEditSubmitting && <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                {isEditSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                MODAL: ĐẶT LẠI MẬT KHẨU (Reset Password Modal)
            ═══════════════════════════════════════════════════════════════════ */}
            {resetPwUser && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 pt-6 pb-2">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${generatedPassword ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                                    <KeyRound size={20} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800">
                                    {generatedPassword ? 'Mật khẩu mới đã tạo' : 'Đặt lại mật khẩu'}
                                </h3>
                            </div>
                            {generatedPassword && (
                                <button onClick={closeResetPwModal} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
                                    <X size={20} />
                                </button>
                            )}
                        </div>

                        {/* Body */}
                        <div className="px-6 py-4">
                            {!generatedPassword ? (
                                /* ── Trạng thái: Xác nhận ── */
                                <div className="space-y-4">
                                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                        <p className="text-sm text-amber-800 leading-relaxed">
                                            Bạn có chắc muốn cấp lại mật khẩu cho <span className="font-bold text-amber-900">{resetPwUser.email}</span>?
                                        </p>
                                        <p className="text-xs text-amber-600 mt-2">
                                            Mật khẩu mới sẽ được tạo tự động. Hãy gửi cho người dùng sau khi tạo.
                                        </p>
                                    </div>

                                    <div className="flex justify-end gap-3">
                                        <button
                                            onClick={closeResetPwModal}
                                            disabled={isResetSubmitting}
                                            className="px-4 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl text-sm hover:bg-gray-200 transition disabled:opacity-50"
                                        >
                                            Hủy bỏ
                                        </button>
                                        <button
                                            onClick={handleGeneratePassword}
                                            disabled={isResetSubmitting}
                                            className="px-5 py-2.5 bg-amber-600 text-white font-bold rounded-xl text-sm hover:bg-amber-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {isResetSubmitting && <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                            {isResetSubmitting ? 'Đang tạo...' : '🔑 Tạo mật khẩu'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* ── Trạng thái: Thành công ── */
                                <div className="space-y-4">
                                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center">
                                        <p className="text-xs text-green-600 font-medium mb-3">✅ Đã tạo mật khẩu mới thành công!</p>
                                        <div className="flex items-center justify-center gap-2 bg-white border-2 border-green-300 rounded-xl px-4 py-3">
                                            <span className={`text-2xl font-mono font-black tracking-widest text-green-800 select-all ${showPassword ? '' : 'blur-sm'}`}>
                                                {generatedPassword}
                                            </span>
                                            <button
                                                onClick={() => setShowPassword(v => !v)}
                                                className="p-1.5 rounded-lg hover:bg-green-100 text-green-600 transition"
                                                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        <p className="text-xs text-green-500 mt-2">Cho tài khoản: <span className="font-semibold">{resetPwUser.email}</span></p>
                                    </div>

                                    <div className="flex justify-between items-center gap-3">
                                        <button
                                            onClick={handleCopyPassword}
                                            className={`flex items-center gap-2 px-4 py-2.5 font-bold rounded-xl text-sm transition shadow-sm ${copied ? 'bg-green-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                                        >
                                            {copied ? <Check size={16} /> : <Copy size={16} />}
                                            {copied ? 'Đã copy!' : 'Copy mật khẩu'}
                                        </button>
                                        <button
                                            onClick={closeResetPwModal}
                                            className="px-5 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl text-sm hover:bg-gray-200 transition"
                                        >
                                            Đóng
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                MODAL: XOÁ TÀI KHOẢN (Delete Modal)
            ═══════════════════════════════════════════════════════════════════ */}
            {deletingUser && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-center gap-3 px-6 pt-6 pb-2">
                            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                                <Trash2 size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800">Xoá tài khoản</h3>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-4">
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-4">
                                <p className="text-sm text-red-800 leading-relaxed">
                                    Bạn có chắc chắn muốn <span className="font-bold">xoá vĩnh viễn</span> tài khoản của <span className="font-bold text-red-900">{deletingUser.fullName}</span>?
                                </p>
                                <p className="text-xs text-red-600 mt-2">
                                    ⚠️ Hành động này không thể hoàn tác. Toàn bộ dữ liệu người dùng sẽ bị mất.
                                </p>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setDeletingUser(null)}
                                    disabled={isDeleteSubmitting}
                                    className="px-4 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl text-sm hover:bg-gray-200 transition disabled:opacity-50"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    onClick={handleDeleteUser}
                                    disabled={isDeleteSubmitting}
                                    className="px-5 py-2.5 bg-red-600 text-white font-bold rounded-xl text-sm hover:bg-red-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isDeleteSubmitting && <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                    {isDeleteSubmitting ? 'Đang xoá...' : '🗑️ Xác nhận xoá'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                MODAL: ĐỔI ROLE NGƯỜI DÙNG (Role Change Modal)
            ═══════════════════════════════════════════════════════════════════ */}
            {roleModalUser && !pendingRoleChange && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 pt-6 pb-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                                    <RefreshCw size={20} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800">Đổi role</h3>
                            </div>
                            <button onClick={() => setRoleModalUser(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-4 space-y-4">
                            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                                <p className="text-xs text-gray-500 mb-0.5">Người dùng</p>
                                <p className="text-sm font-bold text-gray-800">{roleModalUser.fullName}</p>
                                <p className="text-xs text-gray-500">{roleModalUser.email}</p>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-2">Chọn role mới</label>
                                <div className="flex gap-2">
                                    {ALL_ROLES.map((role) => (
                                        <button
                                            key={role}
                                            onClick={() => setSelectedRole(role)}
                                            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition ${selectedRole === role
                                                ? 'border-purple-500 bg-purple-50 text-purple-700'
                                                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider mr-1.5 ${ROLE_BADGE[role] ?? 'bg-gray-100 text-gray-600'}`}>
                                                {ROLE_LABELS[role] ?? role}
                                            </span>
                                            {selectedRole === role && ' ✓'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-3 px-6 pb-6 pt-2">
                            <button
                                onClick={() => setRoleModalUser(null)}
                                className="px-4 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl text-sm hover:bg-gray-200 transition"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleRequestRoleChange}
                                disabled={selectedRole === getPrimaryRole(roleModalUser.roles || [])}
                                className="px-5 py-2.5 bg-purple-600 text-white font-bold rounded-xl text-sm hover:bg-purple-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Đổi role
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                MODAL: XÁC NHẬN ĐỔI ROLE (Role Confirm Modal)
            ═══════════════════════════════════════════════════════════════════ */}
            {pendingRoleChange && (
                <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 px-6 pt-6 pb-2">
                            <div className="w-10 h-10 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center text-xl">
                                ⚠️
                            </div>
                            <h3 className="text-lg font-bold text-gray-800">Xác nhận đổi quyền</h3>
                        </div>

                        <div className="px-6 py-4">
                            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                                Bạn có chắc chắn muốn cấp quyền{' '}
                                <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider ${ROLE_BADGE[pendingRoleChange.roleName]}`}>
                                    {ROLE_LABELS[pendingRoleChange.roleName]}
                                </span>{' '}
                                cho người dùng{' '}
                                <span className="font-bold text-gray-900">
                                    {users.find(u => u.id === pendingRoleChange.userId)?.fullName || 'này'}
                                </span>{' '}
                                không?
                            </p>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setPendingRoleChange(null)}
                                    disabled={isRoleSubmitting}
                                    className="px-4 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl text-sm hover:bg-gray-200 transition disabled:opacity-50"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    onClick={confirmRoleChange}
                                    disabled={isRoleSubmitting}
                                    className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-sm hover:bg-indigo-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isRoleSubmitting && <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                    {isRoleSubmitting ? 'Đang xử lý...' : 'Xác nhận đổi'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}