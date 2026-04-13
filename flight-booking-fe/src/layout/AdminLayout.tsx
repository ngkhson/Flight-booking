import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Plane, Ticket, Users, LogOut, CreditCard, PackageOpen, Menu, X
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { logoutUser } from '@/store/authSlice'; // Đảm bảo đường dẫn này đúng

const navItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/flights', label: 'Chuyến bay', icon: Plane },
    { to: '/admin/bookings', label: 'Đặt vé', icon: Ticket },
    { to: '/admin/transactions', label: 'Giao dịch', icon: CreditCard }, 
    { to: '/admin/ancillaries', label: 'DV Phụ trợ', icon: PackageOpen },
    { to: '/admin/users', label: 'Người dùng', icon: Users },
];

export default function AdminLayout() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation();

    // State quản lý mở/đóng sidebar trên mobile
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Tự động đóng sidebar khi chuyển trang trên mobile
    useEffect(() => {
        setIsMobileOpen(false);
    }, [location.pathname]);

    const handleLogout = () => {
        dispatch(logoutUser());
        navigate('/admin/login');
    };

    return (
        <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
            
            {/* ── BACKDROP (Chỉ hiện trên mobile khi mở menu) ── */}
            {isMobileOpen && (
                <div 
                    className="fixed inset-0 bg-gray-900/50 z-40 md:hidden transition-opacity"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* ── SIDEBAR ────────────────────────────────────────────── */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 shadow-[2px_0_8px_rgba(0,0,0,0.04)] flex flex-col
                transform transition-transform duration-300 ease-in-out
                md:relative md:translate-x-0 md:flex-shrink-0
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Logo & Nút tắt (Mobile) */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
                            <Plane size={16} className="text-white -rotate-45" />
                        </div>
                        <span className="text-lg font-bold text-gray-900 tracking-tight">
                            Skytix
                        </span>
                    </div>
                    {/* Nút X chỉ hiện trên mobile */}
                    <button 
                        className="md:hidden text-gray-500 hover:text-gray-800"
                        onClick={() => setIsMobileOpen(false)}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1">
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
                <div className="px-3 py-4 border-t border-gray-100 space-y-3 bg-white">
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

            {/* ── KHU VỰC NỘI DUNG CHÍNH ─────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0 h-screen">
                
                {/* ── HEADER MOBILE (Chỉ hiện trên điện thoại) ── */}
                <header className="md:hidden flex items-center justify-between bg-white h-16 px-4 border-b border-gray-200 shadow-sm flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
                            <Plane size={16} className="text-white -rotate-45" />
                        </div>
                        <span className="text-lg font-bold text-gray-900 tracking-tight">Skytix Admin</span>
                    </div>
                    <button 
                        onClick={() => setIsMobileOpen(true)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <Menu size={24} />
                    </button>
                </header>

                {/* ── OUTLET MAIN ── */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}