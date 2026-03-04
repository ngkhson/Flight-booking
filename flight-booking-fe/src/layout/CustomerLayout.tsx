import { Outlet, Link } from 'react-router-dom'; // Thêm import Link

export const CustomerLayout = () => {
  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          {/* Bấm vào Logo để về Trang chủ */}
          <Link to="/" className="text-2xl font-bold tracking-tight hover:opacity-90">
            ✈️ FlightBooking
          </Link>
          
          <nav className="space-x-6 flex items-center">
            {/* Sử dụng Link thay cho button */}
            <Link to="/search" className="font-medium hover:text-blue-200 transition-colors">
              Tìm vé
            </Link>
            <Link to="/my-bookings" className="font-medium hover:text-blue-200 transition-colors">
              Vé của tôi
            </Link>
            
            {/* Nút đăng nhập */}
            <Link to="/login" className="bg-white text-blue-600 px-5 py-2 rounded-full font-bold shadow-sm hover:bg-blue-50 transition-colors">
              Đăng nhập
            </Link>
          </nav>
        </div>
      </header>

      {/* Nội dung các trang */}
      <main className="flex-grow bg-slate-50">
        <Outlet /> 
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 text-slate-300 py-8 text-center">
        <p className="font-medium mb-2">✈️ FlightBooking Platform</p>
        <p className="text-sm text-slate-500">© 2026 Đồ án môn học. All rights reserved.</p>
      </footer>
    </div>
  );
};