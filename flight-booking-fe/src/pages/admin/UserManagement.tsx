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

// The BE returns roles as IRole[] — we use the role name string for display
type RoleName = string;

const ALL_ROLES: RoleName[] = ['ADMIN', 'ACCOUNTANT', 'AGENT', 'CUSTOMER'];

const ROLE_BADGE: Record<string, string> = {
    ADMIN: 'bg-purple-100 text-purple-700',
    ACCOUNTANT: 'bg-blue-100 text-blue-700',
    AGENT: 'bg-indigo-100 text-indigo-700',
    CUSTOMER: 'bg-gray-100 text-gray-600',
};

const ROLE_LABELS: Record<string, string> = {
    ADMIN: 'Admin',
    ACCOUNTANT: 'Kế toán',
    AGENT: 'Đại lý',
    CUSTOMER: 'Khách hàng',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Get the primary role name from the roles array, fallback to 'CUSTOMER' */
const getPrimaryRole = (roles: IRole[]): string =>
    roles[0]?.name ?? 'CUSTOMER';

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
}

function RoleDropdown({ userId, current, onChangeRole }: RoleDropdownProps) {
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
                <span className="text-[10px] opacity-60">▾</span>
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
                    <div className="absolute right-0 mt-1 z-20 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 overflow-hidden">
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

    const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ msg, type });
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setToast(null), 3000);
    }, []);

    // Cleanup toast timer on unmount
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
            const res: any = await getUsers();
            let userArray: IUser[] = [];

            // Bóc tách mảng an toàn
            if (Array.isArray(res)) {
                userArray = res;
            } else if (res && typeof res === 'object') {
                if (Array.isArray(res.data?.content)) userArray = res.data.content;
                else if (Array.isArray(res.result?.content)) userArray = res.result.content;
                else if (Array.isArray(res.content)) userArray = res.content;
                else if (Array.isArray(res.data)) userArray = res.data;
                else if (Array.isArray(res.result)) userArray = res.result;
            }

            // Chốt chặn
            if (!Array.isArray(userArray)) {
                userArray = [];
            }

            setUsers(userArray);
        } catch (err: unknown) {
            console.error('[UserManagement] getUsers failed:', err);
            setApiError('Không thể tải danh sách người dùng.');
            setUsers([]); // Đảm bảo users luôn là mảng khi có lỗi
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { loadUsers(); }, [loadUsers]);

    // ── Role change (local update + API) ──────────────────────────────────────
    const handleChangeRole = useCallback(async (id: string, roleName: string) => {
        // Optimistic local update
        setUsers((prev) => prev.map((u) =>
            u.id === id ? { ...u, roles: [{ id: 0, name: roleName, description: '' }] } : u,
        ));
        try {
            await updateUser(id, { roles: [roleName] });
            showToast(`Đã đổi role → ${ROLE_LABELS[roleName] ?? roleName}.`);
        } catch {
            // Rollback on error — reload from server
            await loadUsers();
            showToast('Không thể đổi role.', 'error');
        }
    }, [showToast, loadUsers]);

    // ── Derived ───────────────────────────────────────────────────────────────
    // Lọc an toàn, đề phòng user thiếu thuộc tính
    const visible = (users || []).filter((u) => {
        if (!u) return false;
        const q = search.toLowerCase();
        const primaryRole = getPrimaryRole(u.roles || []);
        return (
            !q ||
            (u.fullName && u.fullName.toLowerCase().includes(q)) ||
            (u.email && u.email.toLowerCase().includes(q)) ||
            (primaryRole && primaryRole.toLowerCase().includes(q))
        );
    });

    // Toast colour helper
    const toastCls = (type: string) =>
        type === 'success' ? 'bg-green-50 border-green-200 text-green-700'
            : type === 'error' ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-blue-50 border-blue-200 text-blue-700';

    return (
        <div className="space-y-5">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-5 right-5 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border ${toastCls(toast.type)}`}>
                    <span>{toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}</span>
                    <span>{toast.msg}</span>
                    <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70" aria-label="Đóng">✕</button>
                </div>
            )}

            {/* Page header */}
            <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">👥 Quản lý người dùng</h1>
                    <p className="mt-0.5 text-sm text-gray-500">Phân quyền và quản lý tài khoản</p>
                </div>
                {!isLoading && (
                    <div className="flex gap-2 text-xs font-medium">
                        <span className="px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700">
                            👥 {users.length} người dùng
                        </span>
                    </div>
                )}
            </div>

            {/* Loading indicator */}
            {isLoading && (
                <div className="flex items-center gap-2 text-sm text-indigo-600 font-medium">
                    <span className="inline-block w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                    Đang tải dữ liệu...
                </div>
            )}

            {/* API error */}
            {apiError && (
                <div className="px-4 py-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2"><span>⚠️</span><span>{apiError}</span></span>
                    <button onClick={loadUsers} className="text-xs underline underline-offset-2 hover:text-yellow-900 transition">Thử lại</button>
                </div>
            )}

            {/* Search */}
            <div className="relative max-w-sm">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm pointer-events-none">🔍</span>
                <input
                    id="search-users"
                    type="text"
                    placeholder="Tìm theo tên, email, role..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 tracking-wide">
                        <tr>
                            <th className="px-4 py-3">ID</th>
                            <th className="px-4 py-3">Họ tên</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Điện thoại</th>
                            <th className="px-4 py-3">Role</th>
                            <th className="px-4 py-3 text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {isLoading
                            ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                            : visible.length === 0
                                ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">
                                            {users.length === 0 ? 'Không có dữ liệu người dùng.' : 'Không tìm thấy người dùng nào.'}
                                        </td>
                                    </tr>
                                )
                                : visible.map((u) => {
                                    const primaryRole = getPrimaryRole(u.roles);
                                    return (
                                        <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-mono text-xs text-gray-400">{u.id}</td>
                                            <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{u.fullName}</td>
                                            <td className="px-4 py-3 text-gray-600">{u.email}</td>
                                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{u.phone ?? '—'}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${ROLE_BADGE[primaryRole] ?? 'bg-gray-100 text-gray-600'}`}>
                                                    {ROLE_LABELS[primaryRole] ?? primaryRole}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <RoleDropdown
                                                        userId={u.id}
                                                        current={primaryRole}
                                                        onChangeRole={handleChangeRole}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                        }
                    </tbody>
                </table>

                {!isLoading && (
                    <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400 flex items-center justify-between">
                        <span>Hiển thị {visible.length} / {users.length} người dùng</span>
                        <button onClick={loadUsers} className="text-indigo-500 hover:text-indigo-700 transition text-xs">🔄 Làm mới</button>
                    </div>
                )}
            </div>
        </div>
    );
}
