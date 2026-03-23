import { useState, useRef, useEffect } from 'react';
import { LogOut, User } from 'lucide-react'; 
import { useNavigate } from 'react-router-dom';

export default function AdminHeader({ title = "Tổng quan hệ thống" }: { title?: string }) {
    const navigate = useNavigate();
    
    // States quản lý trạng thái mở/đóng menu profile
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    // Ref để bắt sự kiện click ra ngoài menu profile
    const profileRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ─── Các hàm xử lý sự kiện ──────────────
    const handleLogout = () => {
        setIsProfileOpen(false);
        // localStorage.removeItem('token'); // Xoá token nếu có
        navigate('/login');
    };

    const handleGoToProfile = () => {
        setIsProfileOpen(false);
        navigate('/profile'); 
    };

    return (
        <div className="flex items-center justify-between gap-4 mb-8 relative z-50">
            {/* TIÊU ĐỀ TRANG */}
            <h1 className="text-2xl font-bold text-gray-900 whitespace-nowrap">{title}</h1>
            
            <div className="flex items-center shrink-0">
                {/* MENU TÀI KHOẢN ADMIN */}
                <div className="relative" ref={profileRef}>
                    <div 
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-xl px-3 py-2 cursor-pointer hover:bg-indigo-50 hover:border-indigo-200 transition shadow-sm"
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-inner">
                            AD
                        </div>
                        <div className="hidden sm:block">
                            <p className="text-sm font-bold text-gray-800 leading-tight">Admin</p>
                        </div>
                    </div>

                    {/* DROPDOWN MENU */}
                    {isProfileOpen && (
                        <div className="absolute right-0 top-[calc(100%+8px)] w-48 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 p-1">
                            <div className="px-4 py-3 border-b border-gray-100 mb-1">
                                <p className="text-xs text-gray-500">Đăng nhập với tư cách</p>
                                <p className="text-sm font-bold text-gray-900 truncate">admin@system.com</p>
                            </div>
                            
                            <button 
                                onClick={handleGoToProfile}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 rounded-lg transition font-medium"
                            >
                                <User size={16} /> Thông tin cá nhân
                            </button>

                            <div className="h-[1px] bg-gray-100 my-1 mx-2"></div>
                            
                            <button 
                                onClick={handleLogout}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition font-bold"
                            >
                                <LogOut size={16} /> Đăng xuất
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}