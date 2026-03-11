import { type ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
    children?: ReactNode;
    allowedRoles?: string[];
}

function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const token = localStorage.getItem('token');
    
    // Lấy chuỗi scope từ localStorage (chứa dữ liệu như: "ROLE_USER ROLE_ADMIN")
    const userScope = localStorage.getItem('userScope') || '';

    // 1. Chưa đăng nhập (không có token) -> Chuyển hướng về trang Login
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // 2. Đã đăng nhập nhưng Route này yêu cầu quyền cụ thể
    if (allowedRoles && allowedRoles.length > 0) {
        
        // Kiểm tra xem chuỗi userScope có chứa ít nhất một quyền hợp lệ không.
        // Ví dụ: allowedRoles = ['ADMIN'] -> kiểm tra xem userScope có chứa 'ROLE_ADMIN' không.
        const hasPermission = allowedRoles.some(role => 
            userScope.includes(`ROLE_${role}`)
        );

        // Nếu không có quyền nào khớp -> Chuyển hướng về trang 403 (Forbidden)
        if (!hasPermission) {
            return <Navigate to="/403" replace />;
        }
    }

    // 3. Hợp lệ toàn bộ -> Cho phép render Component con (children) hoặc Outlet
    return children ? <>{children}</> : <Outlet />;
}

export default ProtectedRoute;