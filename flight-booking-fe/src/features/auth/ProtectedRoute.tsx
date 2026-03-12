import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { type RootState } from '@/store/store';

interface ProtectedRouteProps {
    allowedRoles?: string[];
    children: React.ReactNode;
}

export default function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
    const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
    const location = useLocation();

    // 1. Chưa đăng nhập -> Đá ra trang login Admin (kèm theo link cũ để sau khi login xong quay lại)
    if (!isAuthenticated || !user) {
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    // 2. Đã đăng nhập nhưng kiểm tra xem có đúng Quyền (Role) không
    if (allowedRoles && allowedRoles.length > 0) {
        // Lấy tên Role đầu tiên của user (hoặc map qua mảng roles)
        const userRoles = user.roles?.map((r: any) => r.name) || [];
        
        const hasRequiredRole = allowedRoles.some(role => userRoles.includes(role));

        // Nếu không có quyền -> Đá sang trang 403 (Cấm truy cập)
        if (!hasRequiredRole) {
            return <Navigate to="/403" replace />;
        }
    }

    // 3. Hợp lệ -> Cho phép đi tiếp vào giao diện Admin
    return <>{children}</>;
}