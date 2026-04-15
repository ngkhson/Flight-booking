import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';

// Layouts
import AdminLayout from './layout/AdminLayout';
import { CustomerLayout } from './layout/CustomerLayout';
import { ScrollToTop } from './components/customer/ScrollToTop';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import FlightManagement from './pages/admin/FlightManagement';
import BookingManagement from './pages/admin/BookingManagement';
import UserManagement from './pages/admin/UserManagement';
import TransactionManagement from './pages/admin/TransactionManagement';
import AncillaryManagement from './pages/admin/AncillaryManagement';
import AdminProfile from './pages/admin/AdminProfile';

// Customer Pages
import { HomePage } from './pages/customer/HomePage';
import { SearchPage } from './pages/customer/SearchPage';
import { BookingPage } from './pages/customer/BookingPage';
import { MyBookingsPage } from './pages/customer/MyBookingsPage';
import { ProfilePage } from "@/features/customer/profile/ProfilePage";
import { PaymentResultPage } from './pages/customer/PaymentResultPage';
import { VerifyPaymentPage } from './pages/customer/VerifyPaymentPage';
import { PromotionsPage } from './pages/customer/PromotionsPage';
import { AboutPage } from './pages/customer/AboutPage';
import { FAQPage } from './pages/customer/FAQPage';
import { InformationPage } from './pages/customer/InformationPage';

// Auth Pages
import { LoginClient } from './pages/auth/LoginClient'; 
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';

// Protections & Errors
import ProtectedRoute from './features/auth/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';

// 👇 1. TẠO BỘ BẢO VỆ DÀNH RIÊNG CHO KHÁCH HÀNG 👇
const ClientProtectedRoute = () => {
  const isAuthenticated = !!localStorage.getItem('accessToken');
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* ==========================================
            1. PHÂN HỆ KHÁCH HÀNG (Dùng CustomerLayout) 
            ========================================== */}
        <Route path="/" element={<CustomerLayout />}>
          
          {/* 🟢 LUỒNG CÔNG KHAI (Không cần đăng nhập) */}
          <Route index element={<HomePage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="promotions" element={<PromotionsPage />} />
          <Route path="/gioi-thieu" element={<AboutPage />} />
          <Route path="/cau-hoi-thuong-gap" element={<FAQPage />} />
          <Route path="/info/:slug" element={<InformationPage />} />
          
          <Route path="login" element={<LoginClient />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          
          <Route path="payment-success" element={<PaymentResultPage />} />
          <Route path="payment-failed" element={<PaymentResultPage />} />
          <Route path="payment-error" element={<PaymentResultPage />} />
          <Route path="verify-payment" element={<VerifyPaymentPage />} />

          {/*LUỒNG BẢO MẬT (Phải đăng nhập mới được vào) */}
          <Route element={<ClientProtectedRoute />}>
            <Route path="booking" element={<BookingPage />} />
            <Route path="my-bookings" element={<MyBookingsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
          
        </Route>


        {/* ==========================================
            2. PHÂN HỆ ADMIN (AUTH & PROTECTED)
            ========================================== */}
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
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="flights" element={<FlightManagement />} />
          <Route path="bookings" element={<BookingManagement />} />
          <Route path="ancillaries" element={<AncillaryManagement />} />
          <Route path="transactions" element={<TransactionManagement />} />
          <Route path="profile" element={<AdminProfile />} />

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
        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;