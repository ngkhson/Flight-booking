import { Outlet, Link, useLocation } from 'react-router-dom';
import { useLogout } from '@/hooks/useLogout';
import { LogOut, User, Ticket, MapPin, Mail, Phone, PlaneTakeoff, Menu, X } from 'lucide-react'; // Đã thêm Menu, X
import { type RootState } from '@/store/store';
import { useEffect, useState } from "react"; // Đã thêm useState
import { useDispatch, useSelector } from "react-redux";
import { setCredentials } from "@/store/authSlice";
import { userApi } from "@/api/userApi";

export const CustomerLayout = () => {
  const logout = useLogout();
  const dispatch = useDispatch();
  const location = useLocation();

  const { user } = useSelector((state: RootState) => state.auth);
  const isAuthenticated = !!localStorage.getItem('accessToken');
  const token = localStorage.getItem('accessToken');

  // 👇 STATE QUẢN LÝ ĐÓNG/MỞ MENU MOBILE 👇
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Đóng menu mobile mỗi khi chuyển trang
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (token && !user) {
      const fetchUserInfo = async () => {
        try {
          const res: any = await userApi.getMyInfo();
          if (res.code === 1000) {
            dispatch(setCredentials(res.result));
          }
        } catch (error) {
          console.error("Không thể lấy thông tin user", error);
        }
      };
      fetchUserInfo();
    }
  }, [token, user, dispatch]);

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900">
      {/* Cần thêm relative vào header để menu mobile thả xuống chuẩn xác */}
      <header className="bg-blue-600 text-white p-4 shadow-md sticky top-0 z-50 relative">
        <div className="container mx-auto flex justify-between items-center">
          
          <Link to="/" className="text-2xl font-bold tracking-tight hover:opacity-90 flex items-center gap-2">
            ✈️ STINGAIR
          </Link>

          {/* 👇 GIAO DIỆN DESKTOP (Ẩn trên màn hình nhỏ bằng hidden md:flex) 👇 */}
          <nav className="hidden md:flex space-x-6 items-center">
            <Link to="/search" className="font-medium hover:text-blue-200 transition-colors">
              Tìm vé
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center gap-6">
                <Link to="/my-bookings" className="font-medium hover:text-blue-200 transition-colors flex items-center gap-1">
                  <Ticket size={18} /> Vé của tôi
                </Link>

                <Link
                  to="/profile"
                  className="flex items-center gap-3 bg-blue-700 px-4 py-1.5 rounded-lg border border-blue-500 hover:bg-blue-800 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center border border-blue-300">
                    <User size={18} className="text-white" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs text-blue-200 leading-none">Tài khoản</span>
                    <span className="text-sm font-bold leading-tight uppercase">
                      {user?.fullName || "Khách hàng"}
                    </span>
                  </div>
                </Link>

                <button
                  onClick={logout}
                  className="flex items-center gap-2 text-blue-100 hover:text-white font-semibold transition-colors"
                >
                  <LogOut size={18} /> Đăng xuất
                </button>
              </div>
            ) : (
              <Link to="/login" className="bg-white text-blue-600 px-6 py-2 rounded-full font-bold shadow-sm hover:bg-blue-50 transition-colors">
                Đăng nhập
              </Link>
            )}
          </nav>

          {/* 👇 NÚT HAMBURGER DÀNH CHO MOBILE (Ẩn trên màn hình to bằng md:hidden) 👇 */}
          <button 
            className="md:hidden text-white p-2 hover:bg-blue-700 rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* 👇 GIAO DIỆN MOBILE MENU (Chỉ hiện khi isMobileMenuOpen = true) 👇 */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-blue-700 shadow-xl border-t border-blue-600 md:hidden flex flex-col animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col p-4 space-y-4">
              <Link to="/search" className="text-lg font-medium text-white hover:text-blue-200 py-2 border-b border-blue-600/50">
                Tìm vé
              </Link>

              {isAuthenticated ? (
                <>
                  <Link to="/my-bookings" className="flex items-center gap-2 text-lg font-medium text-white hover:text-blue-200 py-2 border-b border-blue-600/50">
                    <Ticket size={20} /> Vé của tôi
                  </Link>
                  
                  <Link to="/profile" className="flex items-center gap-3 text-lg font-medium text-white hover:text-blue-200 py-2 border-b border-blue-600/50">
                    <User size={20} /> Tài khoản ({user?.fullName || "Khách hàng"})
                  </Link>

                  <button
                    onClick={() => { setIsMobileMenuOpen(false); logout(); }}
                    className="flex items-center gap-2 text-lg text-blue-100 hover:text-white font-semibold py-2 text-left"
                  >
                    <LogOut size={20} /> Đăng xuất
                  </button>
                </>
              ) : (
                <Link to="/login" className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold shadow-sm text-center mt-2">
                  Đăng nhập
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-grow bg-slate-50">
        <Outlet />
      </main>

      <footer className="bg-slate-900 text-slate-300 pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 border-b border-slate-800 pb-12 mb-8">
            {/* Cột 1: Thông tin */}
            <div>
              <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
                <PlaneTakeoff className="text-orange-500" /> STINGAIR
              </h2>
              <p className="text-slate-400 leading-relaxed mb-6">
                Nền tảng đặt vé máy bay trực tuyến hàng đầu Việt Nam. Mang thế giới đến gần bạn hơn bằng những chuyến bay an toàn và tiết kiệm.
              </p>
            </div>

            {/* Cột 2: Về chúng tôi */}
            <div>
              <h4 className="text-white font-bold text-lg mb-6">Về chúng tôi</h4>
              <ul className="space-y-4">
                <li><Link to="/gioi-thieu" className="hover:text-blue-400">Giới thiệu công ty</Link></li>
                <li><Link to="/info/chinh-sach-bao-mat" className="hover:text-white transition-colors">Chính sách bảo mật</Link></li>
                <li><Link to="/info/dieu-khoan-su-dung" className="hover:text-white transition-colors">Điều khoản sử dụng</Link></li>
              </ul>
            </div>

            {/* Cột 3: Hỗ trợ */}
            <div>
              <h4 className="text-white font-bold text-lg mb-6">Hỗ trợ khách hàng</h4>
              <ul className="space-y-4">
                <li><Link to="/info/huong-dan-dat-ve" className="hover:text-white transition-colors">Hướng dẫn đặt vé</Link></li>
                <li><Link to="/cau-hoi-thuong-gap" className="hover:text-blue-400">Câu hỏi thường gặp (FAQ)</Link></li>
                <li><Link to="/info/quy-dinh-hanh-ly" className="hover:text-white transition-colors">Quy định hành lý</Link></li>
              </ul>
            </div>

            {/* Cột 4: Liên hệ */}
            <div>
              <h4 className="text-white font-bold text-lg mb-6">Liên hệ</h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                  <span>Số 3 Cầu Giấy, Phường Láng, TP. Hà Nội</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-slate-500 shrink-0" />
                  <span>0335 805 021 (24/7)</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-slate-500 shrink-0" />
                  <span>support@stingair.vn</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="text-center text-slate-500 text-sm">
            <p>&copy; {new Date().getFullYear()} STINGAIR. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};