import { NavLink, Outlet, useNavigate } from 'react-router-dom';

const navItems = [
    { to: '/admin/dashboard', label: '📊 Dashboard' },
    { to: '/admin/flights', label: '✈️ Chuyến bay' },
    { to: '/admin/bookings', label: '🎟️ Đặt vé' },
    { to: '/admin/users', label: '👥 Người dùng' },
];

export default function AdminLayout() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            {/* Sidebar */}
            <aside className="w-64 flex-shrink-0 bg-gray-900 text-white flex flex-col shadow-xl">
                {/* Logo */}
                <div className="h-16 flex items-center px-6 border-b border-gray-700">
                    <span className="text-xl font-bold tracking-tight">
                        ✈️ FlightBook Admin
                    </span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-1">
                    {navItems.map(({ to, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                [
                                    'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150',
                                    isActive
                                        ? 'bg-indigo-600 text-white'
                                        : 'text-gray-300 hover:bg-gray-800 hover:text-white',
                                ].join(' ')
                            }
                        >
                            {label}
                        </NavLink>
                    ))}
                </nav>

                {/* Version badge */}
                <div className="px-6 py-4 text-xs text-gray-500 border-t border-gray-700">
                    v1.0.0
                </div>
            </aside>

            {/* Right panel */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Topbar */}
                <header className="h-16 flex-shrink-0 bg-white shadow flex items-center justify-between px-6">
                    <p className="text-gray-700 font-medium">Xin chào, Admin 👋</p>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 text-sm font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 active:bg-red-700 transition-colors duration-150"
                    >
                        Logout
                    </button>
                </header>

                {/* Main scrollable content */}
                <main className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
