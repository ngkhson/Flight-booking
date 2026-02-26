import { Outlet } from 'react-router-dom';

export const CustomerLayout = () => {
  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900">
      {/* Header đơn giản */}
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">✈️ UTCBAY</h1>
          <nav className="space-x-4">
            <button className="hover:text-blue-200">Tìm vé</button>
            <button className="hover:text-blue-200">Vé của tôi</button>
            <button className="bg-white text-blue-600 px-4 py-2 rounded font-medium">Đăng nhập</button>
          </nav>
        </div>
      </header>

      {/* Nội dung các trang sẽ được đổ vào đây */}
      <main className="flex-grow bg-slate-50">
        <Outlet /> 
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 text-slate-300 py-6 text-center">
        <p>© 2026 FlightBooking Platform. All rights reserved.</p>
      </footer>
    </div>
  );
};