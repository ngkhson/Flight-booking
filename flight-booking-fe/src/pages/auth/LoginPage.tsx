import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { jwtDecode } from 'jwt-decode';

function LoginPage() {
    const navigate = useNavigate();
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
            // 1. Gọi API qua apiClient
            const response: any = await apiClient.post('/auth/login', { 
                email, 
                password 
            });

            // 2. Lấy token từ kết quả trả về
            const token = response.result?.token;

            if (!token) {
                throw new Error('Đăng nhập thành công nhưng không tìm thấy mã truy cập (Token).');
            }

            // 3. Lưu token vào localStorage
            localStorage.setItem('token', token);
            
            // 4. Giải mã token để lấy scope (role) và lưu lại
            try {
                const decoded: any = jwtDecode(token);
                // decoded.scope sẽ chứa chuỗi "ROLE_USER ROLE_ADMIN"
                localStorage.setItem('userScope', decoded.scope || '');
            } catch (decodeError) {
                console.error("Lỗi giải mã Token:", decodeError);
            }
            
            // 5. Điều hướng vào trang Dashboard
            navigate('/admin/dashboard', { replace: true });
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Sai thông tin đăng nhập');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-indigo-600 shadow-xl shadow-indigo-200 mb-4 transform hover:rotate-12 transition-transform">
                        <span className="text-white text-3xl">✈️</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Flight Admin</h1>
                    <p className="text-slate-500 mt-2 font-medium">Hệ thống quản lý đặt vé máy bay</p>
                </div>

                <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/60 p-10 border border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800 mb-8">Đăng nhập hệ thống</h2>

                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-3">
                            <span className="text-lg">⚠️</span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Email công việc</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@company.com"
                                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                required
                            />
                        </div>

                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-semibold text-slate-700">Mật khẩu</label>
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Đang xác thực...
                                </>
                            ) : 'Vào hệ thống'}
                        </button>
                    </form>
                </div>
                
                <p className="mt-8 text-center text-sm text-slate-400 font-medium">
                    Liên hệ kỹ thuật nếu bạn quên mật khẩu
                </p>
            </div>
        </div>
    );
}

export default LoginPage;