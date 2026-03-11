import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Plane, Ticket, Users, LogOut, ShieldCheck
} from 'lucide-react';

const navItems = [
    { to: '/admin/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { to: '/admin/flights', label: 'Chuyến bay', icon: Plane },
    { to: '/admin/bookings', label: 'Đặt vé', icon: Ticket },
    { to: '/admin/users', label: 'Người dùng', icon: Users },
];

export default function AdminLayout() {
    const navigate = useNavigate();

    const handleLogout = () => {
        // 1. Xóa các token và dữ liệu phiên làm việc khỏi trình duyệt
        localStorage.removeItem('token');
        localStorage.removeItem('userScope');
        
        // 2. Điều hướng thẳng về trang Login và không cho back lại
        navigate('/login', { replace: true });
    };

    return (
        <div className="flex h-screen bg-slate-50 font-sans">
            {/* ── Sidebar ────────────────────────────────────────────── */}
            <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-200 shadow-sm flex flex-col z-10">
                {/* Logo Section */}
                <div className="h-20 flex items-center gap-3 px-6 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 shadow-lg shadow-indigo-200 flex items-center justify-center transform transition-transform hover:scale-105">
                        <Plane size={20} className="text-white -rotate-45" />
                    </div>
                    <div>
                        <span className="block text-xl font-extrabold text-slate-900 tracking-tight leading-none">
                            Flight Admin
                        </span>
                        <span className="text-xs font-medium text-slate-500">Hệ thống quản trị</span>
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    {navItems.map(({ to, label, icon: Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                [
                                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200',
                                    isActive
                                        ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-100'
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
                                ].join(' ')
                            }
                        >
                            <Icon size={20} strokeWidth={2.5} />
                            {label}
                        </NavLink>
                    ))}
                </nav>

                {/* Bottom Section: Info & Logout */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3 px-2 mb-4">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">
                            <ShieldCheck size={18} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-800">Quản trị viên</p>
                            <p className="text-xs text-slate-500 font-medium">Đang hoạt động</p>
                        </div>
                    </div>
                    
                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-white border border-slate-200 shadow-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all duration-200"
                    >
                        <LogOut size={18} />
                        Đăng xuất
                    </button>
                    <p className="text-center mt-3 text-[11px] font-medium text-slate-400">
                        Phiên bản 1.0.0
                    </p>
                </div>
            </aside>

            {/* ── Main content (Nơi các trang con hiển thị) ──────────── */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                <main className="flex-1 overflow-y-auto p-8 scroll-smooth">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}