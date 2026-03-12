import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { type RootState } from "@/store/store";
import { updateUser } from "@/store/authSlice"; // <--- Đổi thành updateUser
import { userApi } from "@/api/userApi";
import { User, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChangePasswordSection } from "./ChangePasswordSection"; // Giữ nguyên import của bạn

export const ProfilePage = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // 1. LẤY THÊM HÀM 'reset' TỪ useForm
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      fullName: user?.fullName || "",
      phone: user?.phone || "",
      email: user?.email || "",
    },
  });

  // 2. THÊM useEffect ĐỂ ÉP FORM TỰ ĐIỀN DATA KHI REDUX TẢI XONG USER
  useEffect(() => {
    if (user) {
      reset({
        fullName: user.fullName || "",
        phone: user.phone || "",
        email: user.email || "",
      });
    }
  }, [user, reset]);

  const onUpdateProfile = async (data: any) => {
    setLoading(true);
    setMessage({ type: "", text: "" }); // Reset thông báo cũ
    try {
      const res: any = await userApi.updateProfile({ 
        fullName: data.fullName, 
        phone: data.phone 
      });
      
      if (res.code === 0 || res.code === 1000) { // Đề phòng BE trả về 0 hoặc 1000
        // 3. GỌI updateUser ĐỂ ĐỔI TÊN TRÊN HEADER NGAY LẬP TỨC
        dispatch(updateUser(res.result)); 
        setMessage({ type: "success", text: "Cập nhật thông tin thành công!" });
      } else {
        setMessage({ type: "error", text: res.message || "Cập nhật thất bại!" });
      }
    } catch (error) {
      console.error("Lỗi cập nhật profile:", error);
      setMessage({ type: "error", text: "Đã xảy ra lỗi hệ thống, vui lòng thử lại sau!" });
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
              {user?.fullName?.charAt(0).toUpperCase() || "U"}
            </span>
          </div>
          <h2 className="font-bold text-xl">{user?.fullName || "Người dùng"}</h2>
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
                  <Input {...register("fullName")} className="h-11" placeholder="Nhập họ và tên" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Email (Không thể thay đổi)</label>
                  <Input {...register("email")} disabled className="h-11 bg-slate-50 text-slate-500" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Số điện thoại</label>
                  <Input {...register("phone")} className="h-11" placeholder="Nhập số điện thoại" />
                </div>
              </div>
              <Button disabled={loading} className="bg-blue-600 hover:bg-blue-700 px-8 h-11 mt-6">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
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