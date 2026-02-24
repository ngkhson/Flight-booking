import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layout/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import LoginPage from './pages/auth/LoginPage';
import ProtectedRoute from './features/auth/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect root to admin dashboard */}
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />

        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Admin routes — protected by ProtectedRoute, wrapped by AdminLayout */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          {/* Placeholder routes for future features */}
          <Route
            path="flights"
            element={
              <div className="text-gray-500 text-sm">
                ✈️ Flights management — coming soon
              </div>
            }
          />
          <Route
            path="bookings"
            element={
              <div className="text-gray-500 text-sm">
                🎟️ Bookings management — coming soon
              </div>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
