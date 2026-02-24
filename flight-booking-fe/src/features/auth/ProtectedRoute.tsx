import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
    children: ReactNode;
}

/**
 * ProtectedRoute — HOC bảo vệ các route yêu cầu xác thực.
 * Kiểm tra token trong localStorage; nếu không tồn tại, redirect về /login.
 */
function ProtectedRoute({ children }: ProtectedRouteProps) {
    const token = localStorage.getItem('token');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}

export default ProtectedRoute;
