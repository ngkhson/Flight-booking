import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, LogIn, Loader2 } from "lucide-react"; // Import thêm icon Loader2 để làm hiệu ứng xoay
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDispatch } from "react-redux"; // THÊM DÒNG NÀY
import { setCredentials } from "@/store/authSlice"; // THÊM DÒNG NÀY

// Import API đã cấu hình (Đảm bảo bạn đã tạo file này ở các bước trước)
import { authApi } from "@/api/authApi";

// 1. Định nghĩa luật bắt lỗi (Validation)
const loginSchema = z.object({
  email: z.string().email("Vui lòng nhập đúng định dạng email"),
  password: z.string().min(5, "Mật khẩu phải có ít nhất 6 ký tự"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch(); // Khởi tạo dispatch

  // State quản lý lúc đang chờ API và Lỗi từ Backend
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  // 2. Hàm xử lý Gọi API thật
  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setApiError(null);

    try {
      const response: any = await authApi.login(data);

      // AxiosClient của bạn đã bóc tách data, nên cấu trúc sẽ là:
      const token = response?.result?.token;
      const user = response?.result?.user; // BE thường trả về thông tin user đi kèm token

      if (token) {
        localStorage.setItem('accessToken', token);

        // --- LƯU VÀO REDUX Ở ĐÂY ---
        if (user) {
          dispatch(setCredentials(user));
        }
        // ---------------------------

        navigate("/");
      } else {
        setApiError("Không nhận được token từ máy chủ.");
      }

    } catch (error: any) {
      console.error("Lỗi đăng nhập:", error);

      // 1. Kiểm tra xem BE có trả về message cụ thể không
      const serverMessage = error.response?.data?.message;

      // 2. Nếu là lỗi 401 (Unauthorized) - Thường là sai pass hoặc user không tồn tại
      if (error.response?.status === 401) {
        setApiError("Email không tồn tại hoặc mật khẩu không chính xác.");
      }
      // 3. Nếu là lỗi 403 (Forbidden) - Tài khoản bị khóa chẳng hạn
      else if (error.response?.status === 403) {
        setApiError("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin.");
      }
      // 4. Nếu Server sập hoặc lỗi khác
      else if (serverMessage) {
        setApiError(serverMessage);
      } else {
        setApiError("Đã có lỗi xảy ra. Vui lòng thử lại sau!");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 w-full max-w-md">

        <div className="text-center mb-8">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800">Chào mừng trở lại</h2>
          <p className="text-slate-500 mt-2">Đăng nhập để quản lý vé máy bay của bạn</p>
        </div>

        {/* Khu vực hiển thị lỗi từ Backend */}
        {apiError && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center font-medium">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                {...register("email")}
                type="email"
                placeholder="nhap@email.com"
                disabled={isLoading}
                className={`pl-10 h-12 ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
            </div>
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          {/* Mật khẩu */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-semibold text-slate-700">Mật khẩu</label>
              <Link to="/forgot-password" className="text-xs text-blue-600 hover:underline font-medium">
                Quên mật khẩu?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                {...register("password")}
                type="password"
                placeholder="••••••••"
                disabled={isLoading}
                className={`pl-10 h-12 ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          {/* Nút Submit có hiệu ứng Loading */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-md font-bold text-white shadow-md transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              "Đăng nhập"
            )}
          </Button>
        </form>

        <div className="text-center mt-6 text-sm text-slate-600">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-blue-600 font-bold hover:underline">
            Đăng ký ngay
          </Link>
        </div>

      </div>
    </div>
  );
};