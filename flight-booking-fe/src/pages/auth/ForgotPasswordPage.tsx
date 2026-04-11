import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authApi } from "@/api/authApi";

const forgotSchema = z.object({
  email: z.string().email("Vui lòng nhập đúng định dạng email"),
});

export const ForgotPasswordPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false); // Trạng thái gửi mail thành công
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: { email: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const res: any = await authApi.forgotPassword(data.email);
      if (res.code === 1000) {
        setIsSent(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Email không tồn tại trong hệ thống!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl border w-full max-w-md">
        
        {!isSent ? (
          <>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-extrabold text-slate-800">Quên mật khẩu?</h2>
              <p className="text-slate-500 mt-2">Nhập email để nhận hướng dẫn khôi phục</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <Input 
                    {...register("email")}
                    placeholder="example@gmail.com" 
                    className="pl-10 h-12"
                    disabled={isLoading}
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message as string}</p>}
              </div>

              <Button disabled={isLoading} className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-bold">
                {isLoading ? <Loader2 className="animate-spin mr-2" /> : "Gửi yêu cầu"}
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Đã gửi mail!</h2>
            <p className="text-slate-500 mt-2 mb-6">
              Vui lòng kiểm tra hòm thư của bạn để tiếp tục đặt lại mật khẩu.
            </p>
            <Button variant="outline" className="w-full h-12" onClick={() => setIsSent(false)}>
              Gửi lại mail khác
            </Button>
          </div>
        )}

        <div className="text-center mt-6">
          <Link to="/login" className="text-sm text-blue-600 font-medium flex items-center justify-center gap-1 hover:underline">
            <ArrowLeft size={16} /> Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
};