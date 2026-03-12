import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '@/store/authSlice';
import { authApi } from '@/api/authApi';

/**
 * LoginPage — Trang đăng nhập dành cho Admin.
 */
function LoginPage() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Vui lòng nhập đầy đủ email và mật khẩu.');
            return;
        }

        setLoading(true);

        try {
            // Gọi API thực tế giống như bên LoginClient
            const response: any = await authApi.login({ email, password });

            // Bóc tách token và user từ response
            const token = response?.result?.token || response?.data?.token;
            const user = response?.result?.user || response?.data?.user;

            if (token) {
                // Lưu ý: Đổi tên key thành 'accessToken' để đồng bộ với bên Client
                localStorage.setItem('accessToken', token);

                if (user) {
                    // TÙY CHỌN: Bạn có thể thêm lệnh check Role ở đây để chặn user thường đăng nhập vào Admin
                    // if (user.role !== 'ADMIN') {
                    //     throw new Error('Bạn không có quyền truy cập trang quản trị!');
                    // }
                    dispatch(setCredentials(user));
                }

                // Đăng nhập thành công, chuyển hướng vào dashboard
                navigate('/admin/dashboard', { replace: true });
            } else {
                setError('Đăng nhập thành công nhưng không tìm thấy Token từ máy chủ.');
            }
        } catch (err: any) {
            console.error("Lỗi đăng nhập Admin:", err);
            
            // Xử lý hiển thị lỗi chi tiết từ Backend
            const serverMessage = err.response?.data?.message;

            if (err.response?.status === 401) {
                setError("Email hoặc mật khẩu không chính xác.");
            } else if (err.response?.status === 403) {
                setError("Tài khoản của bạn không có quyền truy cập trang này.");
            } else if (serverMessage) {
                setError(serverMessage);
            } else {
                setError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau!');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                {/* Logo / Branding */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 shadow-lg mb-4">
                        <span className="text-white text-2xl">✈️</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">Flight Booking</h1>
                    <p className="text-sm text-gray-500 mt-1">Admin Portal</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-6">Đăng nhập Quản trị</h2>

                    {error && (
                        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@example.com"
                                disabled={loading}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition disabled:bg-gray-100"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Mật khẩu
                            </label>
                            <input
                                id="password"
                                type="password"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                disabled={loading}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition disabled:bg-gray-100"
                            />
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-semibold rounded-lg shadow transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center justify-center"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Đang xử lý...
                                </>
                            ) : (
                                'Đăng nhập'
                            )}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-xs text-gray-400">
                        © {new Date().getFullYear()} Flight Booking System. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;