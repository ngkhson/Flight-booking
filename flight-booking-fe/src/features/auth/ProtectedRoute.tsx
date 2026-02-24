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
 * 1. Nếu không có token           → redirect /login
 * 2. Nếu có allowedRoles nhưng:
 *      - userRole null / không khớp → redirect /403
 * 3. Còn lại                       → render children
 *
 * Token key : localStorage 'token'
 * Role key  : localStorage 'userRole'
 * Không có giá trị mặc định — phải được set bởi LoginPage sau khi xác thực.
 */
function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');

    // 1. Chưa đăng nhập
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // 2. Đã đăng nhập nhưng role không hợp lệ hoặc không nằm trong danh sách cho phép
    if (allowedRoles && allowedRoles.length > 0) {
        if (!userRole || !allowedRoles.includes(userRole)) {
            return <Navigate to="/403" replace />;
        }
    }

    return <>{children}</>;
}

export default ProtectedRoute;
