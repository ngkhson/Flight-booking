import { useState, useEffect, useCallback, useRef } from 'react';
import {
    getUsers,
    updateUser,
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

// ─── Role Dropdown ────────────────────────────────────────────────────────────
interface RoleDropdownProps {
    userId: string;
    current: string;
    onChangeRole: (id: string, role: string) => void;
    dropUp?: boolean;
}

function RoleDropdown({ userId, current, onChangeRole, dropUp }: RoleDropdownProps) {
    const [open, setOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setOpen((o) => !o)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                aria-label={`Đổi role cho ${userId}`}
                aria-expanded={open}
            >
                🔄 Đổi Role
                <span className="text-[10px] opacity-60">{dropUp ? '▴' : '▾'}</span>
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
                    <div className={`absolute right-0 z-50 w-40 bg-white rounded-xl shadow-xl border border-gray-100 py-1 overflow-hidden ${dropUp ? 'bottom-full mb-2' : 'top-full mt-1'}`}>
                        {ALL_ROLES.map((role) => (
                            <button
                                key={role}
                                onClick={() => { onChangeRole(userId, role); setOpen(false); }}
                                className={[
                                    'w-full text-left px-4 py-2 text-xs font-medium transition hover:bg-gray-50',
                                    role === current ? 'text-indigo-600 bg-indigo-50 font-semibold' : 'text-gray-700',
                                ].join(' ')}
                            >
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold mr-1.5 ${ROLE_BADGE[role] ?? 'bg-gray-100 text-gray-600'}`}>
                                    {ROLE_LABELS[role] ?? role}
                                </span>
                                {role === current && '✓'}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
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
    const itemsPerPage = 8;

    // 🚀 STATE LƯU THÔNG TIN ROLE ĐANG CHỜ XÁC NHẬN
    const [pendingRoleChange, setPendingRoleChange] = useState<{ userId: string, roleName: string } | null>(null);

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
            const rawRes = await getUsers({ page: 0, size: 500 }) as unknown;
            let userArray: IUser[] = [];

            if (Array.isArray(rawRes)) {
                userArray = rawRes as IUser[];
            } else if (rawRes && typeof rawRes === 'object') {
                const typedRes = rawRes as {
                    data?: { content?: IUser[] } | IUser[];
                    result?: { content?: IUser[] } | IUser[];
                    content?: IUser[];
                };

                if (typedRes.data && !Array.isArray(typedRes.data) && Array.isArray(typedRes.data.content)) {
                    userArray = typedRes.data.content;
                } else if (typedRes.result && !Array.isArray(typedRes.result) && Array.isArray(typedRes.result.content)) {
                    userArray = typedRes.result.content;
                } else if (Array.isArray(typedRes.content)) {
                    userArray = typedRes.content;
                } else if (Array.isArray(typedRes.data)) {
                    userArray = typedRes.data;
                } else if (Array.isArray(typedRes.result)) {
                    userArray = typedRes.result;
                }
            }

            setUsers(userArray || []);
        } catch (err: unknown) {
            console.error('[UserManagement] getUsers failed:', err);
            setApiError('Không thể tải danh sách người dùng.');
            setUsers([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { loadUsers(); }, [loadUsers]);

    // ── Hành động BẤM ĐỔI ROLE TỪ MENU (Chỉ lưu vào State chờ) ───────────────
    const handleRequestRoleChange = useCallback((id: string, roleName: string) => {
        const targetUser = users.find(u => u.id === id);
        const currentRole = getPrimaryRole(targetUser?.roles || []);
        
        // Nếu chọn lại role hiện tại thì không làm gì cả
        if (currentRole === roleName) return;

        setPendingRoleChange({ userId: id, roleName });
    }, [users]);

    // ── Hành động XÁC NHẬN ĐỔI ROLE TỪ DIALOG (Gọi API) ───────────────────────
    const confirmRoleChange = useCallback(async () => {
        if (!pendingRoleChange) return;
        const { userId, roleName } = pendingRoleChange;

        const targetUser = users.find(u => u.id === userId);
        if (!targetUser) {
            setPendingRoleChange(null);
            return;
        }

        // Đóng dialog
        setPendingRoleChange(null);

        // Optimistic Update
        setUsers((prev) => prev.map((u) =>
            u.id === userId ? { ...u, roles: [{ id: 0, name: roleName, description: '' }] } : u,
        ));
        
        try {
            const payload = {
                fullName: targetUser.fullName || "Unknown",
                phone: targetUser.phone && targetUser.phone.length === 10 ? targetUser.phone : "0999999999", 
                roles: [roleName] 
            };

            await updateUser(userId, payload);
            showToast(`Đã đổi role → ${ROLE_LABELS[roleName] ?? roleName}.`);
        } catch (error) {
            console.error("Lỗi đổi role:", error);
            await loadUsers(); // Rollback lại
            showToast('Không thể đổi role. Kiểm tra lại thông tin.', 'error');
        }
    }, [pendingRoleChange, users, showToast, loadUsers]);

    // ── Lọc Dữ Liệu ───────────────────────────────────────────────────────────
    const visible = (users || []).filter((u) => {
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

    const totalPages = Math.ceil(visible.length / itemsPerPage) || 1;
    const paginatedUsers = visible.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

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
                            👥 Tổng cộng {users.length} tài khoản
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
                                    : paginatedUsers.map((u, index) => {
                                        const primaryRole = getPrimaryRole(u.roles);
                                        const isNearBottom = paginatedUsers.length > 3 && index >= paginatedUsers.length - 3;

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
                                                    <div className="flex items-center justify-end gap-2">
                                                        <RoleDropdown
                                                            userId={u.id}
                                                            current={primaryRole}
                                                            onChangeRole={handleRequestRoleChange} // Sửa gọi hàm request thay vì đổi ngay
                                                            dropUp={isNearBottom}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                            }
                        </tbody>
                    </table>
                </div>

                {!isLoading && visible.length > 0 && (
                    <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-b-2xl">
                        <span className="text-xs text-gray-500">
                            Hiển thị <span className="font-bold text-gray-700">{(currentPage - 1) * itemsPerPage + 1}</span> đến <span className="font-bold text-gray-700">{Math.min(currentPage * itemsPerPage, visible.length)}</span> trong số <span className="font-bold text-gray-700">{visible.length}</span> tài khoản
                        </span>

                        <div className="flex items-center gap-4">
                            <button onClick={loadUsers} className="text-indigo-600 hover:text-indigo-800 transition text-xs font-bold flex items-center gap-1">
                                🔄 Làm mới
                            </button>

                            <div className="flex gap-1">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
                                >
                                    Trước
                                </button>

                                {Array.from({ length: totalPages }).map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition shadow-sm ${currentPage === i + 1 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}

                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
                                >
                                    Sau
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 🚀 MODAL XÁC NHẬN ĐỔI ROLE */}
            {pendingRoleChange && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center text-xl">
                                ⚠️
                            </div>
                            <h3 className="text-lg font-bold text-gray-800">Xác nhận đổi quyền</h3>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                            Bạn có chắc chắn muốn cấp quyền <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider ${ROLE_BADGE[pendingRoleChange.roleName]}`}>{ROLE_LABELS[pendingRoleChange.roleName]}</span> cho người dùng <span className="font-bold text-gray-900">{users.find(u => u.id === pendingRoleChange.userId)?.fullName || 'này'}</span> không?
                        </p>
                        
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setPendingRoleChange(null)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg text-sm hover:bg-gray-200 transition"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={confirmRoleChange}
                                className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg text-sm hover:bg-indigo-700 transition shadow-sm"
                            >
                                Xác nhận đổi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}