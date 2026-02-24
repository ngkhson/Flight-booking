import { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type UserRole = 'ADMIN' | 'ACCOUNTANT' | 'AGENT' | 'CUSTOMER';
type UserStatus = 'ACTIVE' | 'LOCKED';

interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_ROLES: UserRole[] = ['ADMIN', 'ACCOUNTANT', 'AGENT', 'CUSTOMER'];

const ROLE_BADGE: Record<UserRole, string> = {
    ADMIN: 'bg-purple-100 text-purple-700',
    ACCOUNTANT: 'bg-blue-100 text-blue-700',
    AGENT: 'bg-indigo-100 text-indigo-700',
    CUSTOMER: 'bg-gray-100 text-gray-600',
};

const ROLE_LABELS: Record<UserRole, string> = {
    ADMIN: 'Admin',
    ACCOUNTANT: 'Kế toán',
    AGENT: 'Đại lý',
    CUSTOMER: 'Khách hàng',
};

const STATUS_BADGE: Record<UserStatus, string> = {
    ACTIVE: 'bg-green-100 text-green-700',
    LOCKED: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<UserStatus, string> = {
    ACTIVE: 'Hoạt động',
    LOCKED: 'Bị khoá',
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const INITIAL_USERS: User[] = [
    { id: 'u1', name: 'Nguyễn Văn Admin', email: 'admin@flightbook.vn', role: 'ADMIN', status: 'ACTIVE', createdAt: '2025-01-10' },
    { id: 'u2', name: 'Trần Thị Kế Toán', email: 'acc@flightbook.vn', role: 'ACCOUNTANT', status: 'ACTIVE', createdAt: '2025-03-22' },
    { id: 'u3', name: 'Lê Văn Đại Lý', email: 'agent01@flightbook.vn', role: 'AGENT', status: 'ACTIVE', createdAt: '2025-06-05' },
    { id: 'u4', name: 'Phạm Thị Khách', email: 'customer01@gmail.com', role: 'CUSTOMER', status: 'ACTIVE', createdAt: '2025-08-14' },
    { id: 'u5', name: 'Hoàng Văn Bị Khoá', email: 'locked.user@gmail.com', role: 'CUSTOMER', status: 'LOCKED', createdAt: '2025-09-01' },
    { id: 'u6', name: 'Đặng Thị Agent', email: 'agent02@flightbook.vn', role: 'AGENT', status: 'ACTIVE', createdAt: '2025-10-18' },
    { id: 'u7', name: 'Vũ Minh Accountant', email: 'acc2@flightbook.vn', role: 'ACCOUNTANT', status: 'LOCKED', createdAt: '2025-11-30' },
];

// ─── Role Dropdown (popover-style) ───────────────────────────────────────────

interface RoleDropdownProps {
    userId: string;
    current: UserRole;
    onChangeRole: (id: string, role: UserRole) => void;
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
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpen(false)}
                        aria-hidden="true"
                    />
                    {/* Dropdown panel */}
                    <div className="absolute right-0 mt-1 z-20 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 overflow-hidden">
                        {ALL_ROLES.map((role) => (
                            <button
                                key={role}
                                onClick={() => { onChangeRole(userId, role); setOpen(false); }}
                                className={[
                                    'w-full text-left px-4 py-2 text-xs font-medium transition hover:bg-gray-50',
                                    role === current
                                        ? 'text-indigo-600 bg-indigo-50 font-semibold'
                                        : 'text-gray-700',
                                ].join(' ')}
                            >
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold mr-1.5 ${ROLE_BADGE[role]}`}>
                                    {ROLE_LABELS[role]}
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
    const [users, setUsers] = useState<User[]>(INITIAL_USERS);
    const [search, setSearch] = useState('');

    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'info' } | null>(null);

    const showToast = (msg: string, type: 'success' | 'info' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleChangeRole = (id: string, role: UserRole) => {
        setUsers((prev) =>
            prev.map((u) => u.id === id ? { ...u, role } : u),
        );
        showToast(`Đã đổi role → ${ROLE_LABELS[role]}.`);
    };

    const handleToggleStatus = (id: string) => {
        setUsers((prev) =>
            prev.map((u) =>
                u.id === id
                    ? { ...u, status: u.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE' }
                    : u,
            ),
        );
        const user = users.find((u) => u.id === id);
        const next = user?.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
        showToast(
            next === 'LOCKED' ? `Đã khoá tài khoản ${user?.name}.` : `Đã mở khoá ${user?.name}.`,
            next === 'LOCKED' ? 'info' : 'success',
        );
    };

    const visible = users.filter((u) => {
        const q = search.toLowerCase();
        return (
            !q ||
            u.name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            u.role.toLowerCase().includes(q)
        );
    });

    // Summary counts
    const totalActive = users.filter((u) => u.status === 'ACTIVE').length;
    const totalLocked = users.filter((u) => u.status === 'LOCKED').length;

    return (
        <div className="space-y-5">
            {/* Toast */}
            {toast && (
                <div
                    className={`fixed top-5 right-5 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === 'success'
                            ? 'bg-green-50 border border-green-200 text-green-700'
                            : 'bg-blue-50 border border-blue-200 text-blue-700'
                        }`}
                >
                    <span>{toast.type === 'success' ? '✅' : 'ℹ️'}</span>
                    <span>{toast.msg}</span>
                    <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70" aria-label="Đóng">✕</button>
                </div>
            )}

            {/* Page header */}
            <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">👥 Quản lý người dùng</h1>
                    <p className="mt-0.5 text-sm text-gray-500">Phân quyền và quản lý trạng thái tài khoản</p>
                </div>
                {/* Summary chips */}
                <div className="flex gap-2 text-xs font-medium">
                    <span className="px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-700">
                        ✅ {totalActive} hoạt động
                    </span>
                    <span className="px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-600">
                        🔒 {totalLocked} bị khoá
                    </span>
                </div>
            </div>

            {/* Note: using local mock data */}
            <div className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm flex items-center gap-2">
                <span>ℹ️</span>
                <span>Dữ liệu người dùng hiện tại là mock client-side. Tích hợp API sẽ bổ sung sau.</span>
            </div>

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
                            <th className="px-4 py-3">Role</th>
                            <th className="px-4 py-3">Ngày tạo</th>
                            <th className="px-4 py-3">Trạng thái</th>
                            <th className="px-4 py-3 text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {visible.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm">
                                    Không tìm thấy người dùng nào.
                                </td>
                            </tr>
                        ) : (
                            visible.map((u) => (
                                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{u.id}</td>
                                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{u.name}</td>
                                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${ROLE_BADGE[u.role]}`}>
                                            {ROLE_LABELS[u.role]}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{u.createdAt}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[u.status]}`}>
                                            {u.status === 'ACTIVE' ? '● ' : '🔒 '}{STATUS_LABELS[u.status]}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {/* Role dropdown */}
                                            <RoleDropdown
                                                userId={u.id}
                                                current={u.role}
                                                onChangeRole={handleChangeRole}
                                            />
                                            {/* Lock / unlock toggle */}
                                            <button
                                                onClick={() => handleToggleStatus(u.id)}
                                                className={[
                                                    'px-3 py-1.5 text-xs font-semibold rounded-lg transition',
                                                    u.status === 'ACTIVE'
                                                        ? 'text-red-600 bg-red-50 hover:bg-red-100'
                                                        : 'text-green-600 bg-green-50 hover:bg-green-100',
                                                ].join(' ')}
                                                aria-label={u.status === 'ACTIVE' ? `Khoá ${u.name}` : `Mở khoá ${u.name}`}
                                            >
                                                {u.status === 'ACTIVE' ? '🔒 Khoá' : '🔓 Mở khoá'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
                    Hiển thị {visible.length} / {users.length} người dùng
                </div>
            </div>
        </div>
    );
}
