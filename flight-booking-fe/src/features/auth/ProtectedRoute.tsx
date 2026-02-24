import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
    children: ReactNode;
    /** Danh sách role được phép truy cập. Nếu không truyền → chỉ kiểm tra token. */
    allowedRoles?: string[];
}

/**
 * ProtectedRoute — HOC bảo vệ route theo xác thực + phân quyền (RBAC).
 *
 * 1. Nếu không có token  → redirect /login
 * 2. Nếu có allowedRoles nhưng userRole không khớp → redirect /403
 * 3. Còn lại → render children
 *
 * userRole được đọc từ localStorage key 'userRole'.
 * Trong môi trường dev, giá trị mặc định là 'ADMIN' nếu chưa set.
 */
function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole') ?? 'ADMIN'; // dev default

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        return <Navigate to="/403" replace />;
    }

    return <>{children}</>;
}

export default ProtectedRoute;
