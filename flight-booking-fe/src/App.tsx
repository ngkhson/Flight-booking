import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layout/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import FlightManagement from './pages/admin/FlightManagement';
import BookingManagement from './pages/admin/BookingManagement';
import UserManagement from './pages/admin/UserManagement';
import LoginPage from './pages/auth/LoginPage';
import ForbiddenPage from './pages/auth/ForbiddenPage';
import ProtectedRoute from './features/auth/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import { CustomerLayout } from './layout/CustomerLayout';
import { HomePage } from './pages/customer/HomePage';
import { SearchPage } from './pages/customer/SearchPage';
import { BookingPage } from './pages/customer/BookingPage'; // <-- 1. Import trang mới
import { MyBookingsPage } from './pages/customer/MyBookingsPage';
import { LoginClient } from './pages/auth/LoginClient';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ProfilePage } from "@/features/customer/profile/ProfilePage";
import { PaymentResultPage } from './pages/customer/PaymentResultPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect root to admin dashboard */}
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />

        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        {/* <Route path="/login" element={<LoginClient />} /> */}
        <Route path="/403" element={<ForbiddenPage />} />

        {/* Admin routes — protected + error-safe */}
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
          <Route
            path="users"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
        </Route>
        {/* Tuyến đường dành cho Khách hàng (FE 1 quản lý) */}
        <Route path="/" element={<CustomerLayout />}>
          <Route index element={<HomePage />} />
          {/* Sau này thêm: <Route path="search" element={<SearchPage />} /> */}
          <Route path="search" element={<SearchPage />} />
          <Route path="booking" element={<BookingPage />} />
          <Route path="my-bookings" element={<MyBookingsPage />} />
          <Route path="login" element={<LoginClient />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/payment-success" element={<PaymentResultPage />} />
          <Route path="/payment-failed" element={<PaymentResultPage />} />
          <Route path="/payment-error" element={<PaymentResultPage />} />
        </Route>

        {/* Tuyến đường dành cho Admin (FE 2 sẽ vào đây làm việc sau) */}
        <Route path="/admin" element={<div>Trang Admin (Đang xây dựng)</div>} />

        {/* Bắt lỗi trang không tồn tại */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
