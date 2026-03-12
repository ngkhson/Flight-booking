import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Plane, Ticket, Users, LogOut,
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { logoutUser } from '@/store/authSlice'; // Đảm bảo đường dẫn này đúng với project của bạn

const navItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/flights', label: 'Chuyến bay', icon: Plane },
    { to: '/admin/bookings', label: 'Đặt vé', icon: Ticket },
    { to: '/admin/users', label: 'Người dùng', icon: Users },
];

export default function AdminLayout() {
    const navigate = useNavigate();

    const dispatch = useDispatch(); // 👇 2. Khai báo dispatch

    const handleLogout = () => {
        // 👇 3. Gọi action xóa token và user
        dispatch(logoutUser());
        // 👇 4. Đá về trang đăng nhập của Admin
        navigate('/admin/login');
    };

    return (
        <div className="flex h-screen bg-gray-50 font-sans">
            {/* ── Sidebar ────────────────────────────────────────────── */}
            <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 shadow-[2px_0_8px_rgba(0,0,0,0.04)] flex flex-col">
                {/* Logo */}
                <div className="h-16 flex items-center gap-2.5 px-6 border-b border-gray-100">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
                        <Plane size={16} className="text-white -rotate-45" />
                    </div>
                    <span className="text-lg font-bold text-gray-900 tracking-tight">
                        Skytix
                    </span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-5 space-y-1">
                    {navItems.map(({ to, label, icon: Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                [
                                    'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                                    isActive
                                        ? 'bg-yellow-50 text-gray-900 border-l-[3px] border-yellow-500'
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800 border-l-[3px] border-transparent',
                                ].join(' ')
                            }
                        >
                            <Icon size={18} />
                            {label}
                        </NavLink>
                    ))}
                </nav>

                {/* Bottom: Logout + Version */}
                <div className="px-3 py-4 border-t border-gray-100 space-y-3">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150"
                    >
                        <LogOut size={18} />
                        Đăng xuất
                    </button>
                    <p className="px-4 text-xs text-gray-300">v1.0.0</p>
                </div>
            </aside>

            {/* ── Main content ───────────────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0">
                <main className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
