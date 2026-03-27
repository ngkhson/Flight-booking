import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import AdminLayout from './layout/AdminLayout';
import { CustomerLayout } from './layout/CustomerLayout';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import FlightManagement from './pages/admin/FlightManagement';
import BookingManagement from './pages/admin/BookingManagement';
import UserManagement from './pages/admin/UserManagement';
// 🚀 IMPORT TRANG QUẢN LÝ GIAO DỊCH MỚI TẠO
import TransactionManagement from './pages/admin/TransactionManagement';
import AncillaryManagement from './pages/admin/AncillaryManagement';

// Customer Pages
import { HomePage } from './pages/customer/HomePage';
import { SearchPage } from './pages/customer/SearchPage';
import { BookingPage } from './pages/customer/BookingPage';
import { MyBookingsPage } from './pages/customer/MyBookingsPage';
import { ProfilePage } from "@/features/customer/profile/ProfilePage";
import { PaymentResultPage } from './pages/customer/PaymentResultPage';
import { VerifyPaymentPage } from './pages/customer/VerifyPaymentPage';
import { PromotionsPage } from './pages/customer/PromotionsPage';

// Auth Pages
// import LoginPage from './pages/auth/LoginPage'; // Admin Login
import { LoginClient } from './pages/auth/LoginClient'; // Customer Login
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';

// Protections & Errors
import ProtectedRoute from './features/auth/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ==========================================
            1. PHÂN HỆ KHÁCH HÀNG (Dùng CustomerLayout) 
            ========================================== */}
        <Route path="/" element={<CustomerLayout />}>
          <Route index element={<HomePage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="booking" element={<BookingPage />} />
          <Route path="my-bookings" element={<MyBookingsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="promotions" element={<PromotionsPage />} />

          {/* Auth Khách hàng */}
          <Route path="login" element={<LoginClient />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />

          {/* Thanh toán VNPay */}
          <Route path="payment-success" element={<PaymentResultPage />} />
          <Route path="payment-failed" element={<PaymentResultPage />} />
          <Route path="payment-error" element={<PaymentResultPage />} />
          <Route path="verify-payment" element={<VerifyPaymentPage />} />
        </Route>


        {/* ==========================================
            2. PHÂN HỆ ADMIN (AUTH & PROTECTED)
            ========================================== */}
        {/* Đổi đường dẫn Login của Admin thành /admin/login để không trùng với Khách */}
        {/* <Route path="/admin/login" element={<LoginPage />} /> */}
        {/* <Route path="/403" element={<ForbiddenPage />} /> */}

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'ACCOUNTANT']}>
              <ErrorBoundary>
                <AdminLayout />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        >
          {/* Vào thẳng /admin sẽ tự động đá sang /admin/dashboard */}
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="flights" element={<FlightManagement />} />
          <Route path="bookings" element={<BookingManagement />} />
          <Route path="ancillaries" element={<AncillaryManagement />} />
          
          {/* 🚀 ROUTE GIAO DỊCH (Cho phép Admin và Kế toán xem) */}
          <Route path="transactions" element={<TransactionManagement />} />

          {/* Phân quyền UserManagement chỉ dành riêng cho ADMIN */}
          <Route
            path="users"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
        </Route>


        {/* ==========================================
            3. TRANG KHÔNG TỒN TẠI (404 CATCH-ALL)
            ========================================== */}
        {/* Nếu gõ bậy bạ trên URL, tự động đá về Trang chủ Khách hàng */}
        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;