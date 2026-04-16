import { useState } from "react";
import { useForm } from "react-hook-form";
import { Lock, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react"; // Bổ sung Eye, EyeOff
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { userApi } from "@/api/userApi";

export const ChangePasswordSection = () => {
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    // 👇 KHAI BÁO STATE ẨN/HIỆN CHO TỪNG Ô 👇
    const [showOldPass, setShowOldPass] = useState(false);
    const [showNewPass, setShowNewPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors }
    } = useForm();

    // Theo dõi mật khẩu mới để kiểm tra khớp
    const newPassword = watch("newPassword");

    const onChangePass = async (data: any) => {
        setLoading(true);
        setErrorMsg("");
        setSuccessMsg("");

        try {
            const payload = {
                oldPassword: data.oldPassword,
                newPassword: data.newPassword,
                confirmPassword: data.confirmPassword,
            };

            const res: any = await userApi.changePassword(payload);

            // Tùy vào cấu trúc trả về của BE, thường là res.code === 1000
            if (res.code === 1000 || res.status === "success") {
                setSuccessMsg("Đổi mật khẩu thành công!");
                reset(); // Xóa trắng form
            }
        } catch (error: any) {
            console.error("Chi tiết lỗi 500:", error.response?.data);

            // Ép hiển thị message từ BE lên UI để đọc
            const backendError = error.response?.data?.message;
            const backendCode = error.response?.data?.code;

            setErrorMsg(`Lỗi ${backendCode}: ${backendError || "Server bị crash (500)"}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-8 rounded-2xl shadow-sm border mt-6">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Lock className="text-red-500" size={20} /> Đổi mật khẩu
            </h3>

            {/* Thông báo lỗi nếu có */}
            {errorMsg && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-center gap-2 text-sm">
                    <AlertCircle size={16} /> {errorMsg}
                </div>
            )}

            {/* Thông báo thành công nếu có */}
            {successMsg && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg text-sm">
                    {successMsg}
                </div>
            )}

            <form onSubmit={handleSubmit(onChangePass)} className="space-y-4 max-w-md">
                {/* 1. MẬT KHẨU CŨ */}
                <div>
                    <label className="text-sm font-medium mb-1 block">Mật khẩu hiện tại</label>
                    <div className="relative">
                        <Input
                            type={showOldPass ? "text" : "password"}
                            {...register("oldPassword", { required: "Vui lòng nhập mật khẩu cũ" })}
                            placeholder="••••••••"
                            className={`h-11 pr-10 ${errors.oldPassword ? 'border-red-500' : ''}`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowOldPass(!showOldPass)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            tabIndex={-1}
                        >
                            {showOldPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* 2. MẬT KHẨU MỚI */}
                <div>
                    <label className="text-sm font-medium mb-1 block">Mật khẩu mới</label>
                    <div className="relative">
                        <Input
                            type={showNewPass ? "text" : "password"}
                            {...register("newPassword", {
                                required: "Vui lòng nhập mật khẩu mới",
                                minLength: { value: 6, message: "Mật khẩu phải ít nhất 6 ký tự" }
                            })}
                            placeholder="••••••••"
                            className={`h-11 pr-10 ${errors.newPassword ? 'border-red-500' : ''}`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowNewPass(!showNewPass)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            tabIndex={-1}
                        >
                            {showNewPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                    {errors.newPassword && <p className="text-red-500 text-xs mt-1">{(errors.newPassword as any).message}</p>}
                </div>

                {/* 3. XÁC NHẬN MẬT KHẨU MỚI */}
                <div>
                    <label className="text-sm font-medium mb-1 block">Xác nhận mật khẩu mới</label>
                    <div className="relative">
                        <Input
                            type={showConfirmPass ? "text" : "password"}
                            {...register("confirmPassword", {
                                required: "Vui lòng xác nhận lại mật khẩu",
                                validate: value => value === newPassword || "Mật khẩu xác nhận không khớp"
                            })}
                            placeholder="••••••••"
                            className={`h-11 pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPass(!showConfirmPass)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            tabIndex={-1}
                        >
                            {showConfirmPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                    {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{(errors.confirmPassword as any).message}</p>}
                </div>

                <Button
                    type="submit"
                    disabled={loading}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-6 h-11"
                >
                    {loading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang xử lý...</>
                    ) : (
                        "Cập nhật mật khẩu"
                    )}
                </Button>
            </form>
        </div>
    );
};