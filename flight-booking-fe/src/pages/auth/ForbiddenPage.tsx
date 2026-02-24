import { useNavigate } from 'react-router-dom';

/**
 * ForbiddenPage — hiển thị lỗi 403 khi user không có quyền truy cập route.
 */
export default function ForbiddenPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
            {/* Status code */}
            <p className="text-8xl font-extrabold text-indigo-200 select-none leading-none">
                403
            </p>

            {/* Icon */}
            <div className="mt-4 text-5xl">🔒</div>

            {/* Message */}
            <h1 className="mt-4 text-2xl font-bold text-gray-800">
                Truy cập bị từ chối
            </h1>
            <p className="mt-2 text-sm text-gray-500 max-w-sm">
                Bạn không có quyền truy cập trang này. Vui lòng liên hệ quản trị
                viên nếu bạn cho rằng đây là nhầm lẫn.
            </p>

            {/* Actions */}
            <div className="mt-8 flex gap-3">
                <button
                    onClick={() => navigate(-1)}
                    className="px-5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg shadow-sm transition"
                >
                    ← Quay lại
                </button>
                <button
                    onClick={() => navigate('/admin/dashboard', { replace: true })}
                    className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow transition"
                >
                    Về Dashboard
                </button>
            </div>
        </div>
    );
}
