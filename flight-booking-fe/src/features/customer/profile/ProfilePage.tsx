import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { type RootState } from "@/store/store";
import { setCredentials } from "@/store/authSlice";
import { userApi } from "@/api/userApi";
import { User, Phone, Mail, Lock, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChangePasswordSection } from "./ChangePasswordSection";

export const ProfilePage = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const { register, handleSubmit } = useForm({
    defaultValues: {
      fullName: user?.fullName || "",
      phone: user?.phone || "",
      email: user?.email || "",
    },
  });

  const onUpdateProfile = async (data: any) => {
    setLoading(true);
    try {
      const res: any = await userApi.updateProfile({ 
        fullName: data.fullName, 
        phone: data.phone 
      });
      if (res.code === 1000) {
        dispatch(setCredentials(res.result)); // Cập nhật lại Redux để Header đổi tên ngay
        setMessage({ type: "success", text: "Cập nhật thông tin thành công!" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Cập nhật thất bại!" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Cài đặt tài khoản</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar tóm tắt */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border h-fit text-center">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-md">
            <span className="text-3xl font-bold text-blue-600">
              {user?.fullName?.charAt(0).toUpperCase()}
            </span>
          </div>
          <h2 className="font-bold text-xl">{user?.fullName}</h2>
          <p className="text-slate-500 text-sm">{user?.email}</p>
        </div>

        {/* Form chính */}
        <div className="md:col-span-2 space-y-6">
          {message.text && (
            <div className={`p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              <CheckCircle size={18} /> {message.text}
            </div>
          )}

          <div className="bg-white p-8 rounded-2xl shadow-sm border">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <User className="text-blue-600" size={20} /> Thông tin cá nhân
            </h3>
            <form onSubmit={handleSubmit(onUpdateProfile)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Họ và tên</label>
                  <Input {...register("fullName")} className="h-11" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Email (Không thể thay đổi)</label>
                  <Input {...register("email")} disabled className="h-11 bg-slate-50" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Số điện thoại</label>
                  <Input {...register("phone")} className="h-11" />
                </div>
              </div>
              <Button disabled={loading} className="bg-blue-600 hover:bg-blue-700 px-8 h-11">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Lưu thay đổi
              </Button>
            </form>
          </div>

          {/* Phần đổi mật khẩu */}
          <ChangePasswordSection />
        </div>
      </div>
    </div>
  );
};