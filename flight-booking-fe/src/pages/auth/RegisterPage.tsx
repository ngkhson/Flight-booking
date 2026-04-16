import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Phone, UserPlus, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { userApi } from "@/api/userApi";

// 1. Định nghĩa luật bắt lỗi
const registerSchema = z.object({
  fullName: z.string().min(2, "Họ tên phải có ít nhất 2 ký tự"),
  email: z.string().email("Vui lòng nhập đúng định dạng email"),
  phone: z.string().min(10, "Số điện thoại không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  // 2. Hàm xử lý đăng ký
  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setApiError(null);

    try {
      const response: any = await userApi.register(data);

      if (response.code === 1000) {
        alert("Đăng ký tài khoản thành công! Hãy đăng nhập nhé.");
        navigate("/login"); // Đăng ký xong đá về trang đăng nhập
      }
    } catch (error: any) {
      console.error("Lỗi đăng ký:", error);
      // Lấy message lỗi từ BE trả về (ví dụ: Email đã tồn tại)
      setApiError(error.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800">Tạo tài khoản mới</h2>
          <p className="text-slate-500 mt-2">Tham gia cùng chúng tôi để đặt vé nhanh hơn</p>
        </div>

        {apiError && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center font-medium">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1">Họ và tên</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input {...register("fullName")} placeholder="Nguyễn Văn A" disabled={isLoading} className="pl-10 h-12" />
            </div>
            {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input {...register("email")} type="email" placeholder="example@gmail.com" disabled={isLoading} className="pl-10 h-12" />
            </div>
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1">Số điện thoại</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input {...register("phone")} placeholder="0987xxxxxx" disabled={isLoading} className="pl-10 h-12" />
            </div>
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1">Mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input 
                {...register("password")} 
                type={showPassword ? "text" : "password"} // 👈 CẬP NHẬT TYPE Ở ĐÂY
                placeholder="••••••••" 
                disabled={isLoading} 
                // 👇 Thêm pr-10 để chữ không bị đè lên icon con mắt ở góc phải
                className={`pl-10 pr-10 h-12 ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`} 
              />
              
              {/* 👇 NÚT ẨN/HIỆN MẬT KHẨU 👇 */}
              <button
                type="button" // Bắt buộc phải là type="button" để không tự động submit form
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <Button type="submit" disabled={isLoading} className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold shadow-md mt-4">
            {isLoading ? <Loader2 className="animate-spin" /> : "Đăng ký ngay"}
          </Button>
        </form>

        <div className="text-center mt-6 text-sm text-slate-600">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-green-600 font-bold hover:underline">Đăng nhập</Link>
        </div>
      </div>
    </div>
  );
};