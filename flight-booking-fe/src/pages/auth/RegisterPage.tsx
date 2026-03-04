import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// 1. Schema Đăng ký (Có check khớp mật khẩu)
const registerSchema = z.object({
  fullName: z.string().min(2, "Họ tên phải có ít nhất 2 ký tự"),
  email: z.string().email("Vui lòng nhập đúng định dạng email"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"], // Chỉ định lỗi sẽ hiển thị ở ô Confirm Password
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export const RegisterPage = () => {
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterFormValues) => {
    console.log("Dữ liệu đăng ký:", data);
    alert("Đăng ký thành công! Đang chuyển hướng về trang Đăng nhập...");
    navigate("/login");
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 px-4 py-10">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 w-full max-w-md">
        
        <div className="text-center mb-8">
          <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-orange-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800">Tạo tài khoản mới</h2>
          <p className="text-slate-500 mt-2">Trở thành thành viên để nhận nhiều ưu đãi</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          {/* Họ và tên */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1">Họ và tên</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input 
                {...register("fullName")} 
                placeholder="Nguyễn Văn A" 
                className={`pl-10 h-12 ${errors.fullName ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input 
                {...register("email")} 
                type="email" 
                placeholder="nhap@email.com" 
                className={`pl-10 h-12 ${errors.email ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          {/* Mật khẩu */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1">Mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input 
                {...register("password")} 
                type="password" 
                placeholder="••••••••" 
                className={`pl-10 h-12 ${errors.password ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          {/* Nhập lại Mật khẩu */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1">Xác nhận mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input 
                {...register("confirmPassword")} 
                type="password" 
                placeholder="••••••••" 
                className={`pl-10 h-12 ${errors.confirmPassword ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>

          {/* Nút Submit */}
          <Button type="submit" className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-md font-bold text-white shadow-md mt-2">
            Đăng ký tài khoản
          </Button>
        </form>

        <div className="text-center mt-6 text-sm text-slate-600">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-blue-600 font-bold hover:underline">
            Đăng nhập
          </Link>
        </div>

      </div>
    </div>
  );
};