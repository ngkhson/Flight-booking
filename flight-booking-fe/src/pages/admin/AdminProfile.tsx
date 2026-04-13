import { useState, useEffect, FormEvent } from 'react';
import { User, Lock, Eye, EyeOff, Save, KeyRound } from 'lucide-react';
import AdminHeader from '../../components/admin/layout/AdminHeader';
import { getMyProfile, updateMyProfile, changeMyPassword } from '../../features/admin/services/adminApi';

export default function AdminProfile() {
    // ─── STATES THÔNG TIN CÁ NHÂN ───
    const [isFetching, setIsFetching] = useState(true);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({
        fullName: '',
        email: '',
        phone: '',
        roleName: 'ADMIN'
    });

    // ─── STATES ĐỔI MẬT KHẨU ───
    const [isChangingPass, setIsChangingPass] = useState(false);
    const [passForm, setPassForm] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    // States ẩn/hiện mật khẩu
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // ─── TOAST NOTIFICATION ───
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    // ─── FETCH DỮ LIỆU BAN ĐẦU ───
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res: any = await getMyProfile();
                const data = res?.result || res?.data || res;

                setProfileForm({
                    fullName: data?.fullName || '',
                    email: data?.email || '',
                    phone: data?.phone || '',
                    roleName: data?.roles?.[0]?.name || 'ADMIN'
                });
            } catch (error) {
                console.error("Lỗi lấy thông tin profile:", error);
                showToast("Không thể lấy thông tin cá nhân lúc này.", "error");
            } finally {
                setIsFetching(false);
            }
        };
        fetchProfile();
    }, []);

    // ─── HANDLER: CẬP NHẬT THÔNG TIN ───
    const handleUpdateProfile = async (e: FormEvent) => {
        e.preventDefault();

        // Validate sđt theo Regex BE yêu cầu (Bắt đầu bằng 0, tổng 10 số)
        const phoneRegex = /^0\d{9}$/;
        if (!phoneRegex.test(profileForm.phone)) {
            showToast("Số điện thoại không hợp lệ! Vui lòng nhập 10 số và bắt đầu bằng số 0.", "error");
            return;
        }

        setIsSavingProfile(true);
        try {
            await updateMyProfile({
                fullName: profileForm.fullName,
                phone: profileForm.phone
            });
            showToast("Đã cập nhật thông tin cá nhân thành công!");
        } catch (error: any) {
            const msg = error.response?.data?.message || "Lỗi khi cập nhật thông tin!";
            showToast(msg, "error");
        } finally {
            setIsSavingProfile(false);
        }
    };

    // ─── HANDLER: ĐỔI MẬT KHẨU ───
    const handleChangePassword = async (e: FormEvent) => {
        e.preventDefault();

        // Validate phía FE trước
        if (passForm.newPassword.length < 6) {
            showToast("Mật khẩu mới phải có ít nhất 6 ký tự.", "error");
            return;
        }
        if (passForm.newPassword !== passForm.confirmPassword) {
            showToast("Mật khẩu xác nhận không khớp!", "error");
            return;
        }

        setIsChangingPass(true);
        try {
            await changeMyPassword({
                oldPassword: passForm.oldPassword,
                newPassword: passForm.newPassword,
                confirmPassword: passForm.confirmPassword
            });

            showToast("Đổi mật khẩu thành công!");
            // Reset form mật khẩu
            setPassForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
            setShowOld(false); setShowNew(false); setShowConfirm(false);

        } catch (error: any) {
            const msg = error.response?.data?.message || "Đổi mật khẩu thất bại. Kiểm tra lại mật khẩu cũ!";
            showToast(msg, "error");
        } finally {
            setIsChangingPass(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] pb-10 space-y-6">
            <AdminHeader title="Cài đặt tài khoản" />

            {/* TOAST HIỂN THỊ THÔNG BÁO */}
            {toast && (
                <div className={`fixed top-5 right-5 z-[100] px-4 py-3 rounded-xl shadow-lg text-sm font-medium border animate-in slide-in-from-right-2 ${toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                    {toast.type === 'success' ? '✅ ' : '❌ '} {toast.msg}
                </div>
            )}

            {isFetching ? (
                <div className="flex items-center justify-center p-20 text-indigo-600">
                    <span className="inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* CỘT TRÁI: THÔNG TIN CÁ NHÂN */}
                    <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                <User size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Thông tin cá nhân</h2>
                                <p className="text-xs text-gray-500">Cập nhật họ tên, số điện thoại của bạn</p>
                            </div>
                        </div>

                        <form onSubmit={handleUpdateProfile} className="p-6 space-y-5">
                            {/* Avatar ảo */}
                            <div className="flex items-center gap-4 mb-6 p-4 bg-indigo-50/50 rounded-xl border border-indigo-50">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-inner">
                                    {profileForm.fullName.charAt(0).toUpperCase() || 'A'}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">{profileForm.fullName || 'Quản trị viên'}</h3>
                                    <p className="text-sm text-gray-500">{profileForm.email}</p>
                                    <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase rounded">
                                        {profileForm.roleName}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Họ và tên <span className="text-red-500">*</span></label>
                                <input
                                    required
                                    type="text"
                                    minLength={2}
                                    maxLength={50}
                                    value={profileForm.fullName}
                                    onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Email (Không thể thay đổi)</label>
                                <input
                                    disabled
                                    type="email"
                                    value={profileForm.email}
                                    className="w-full px-4 py-2.5 border border-gray-200 bg-gray-100 text-gray-500 rounded-xl text-sm cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Số điện thoại <span className="text-red-500">*</span></label>
                                <input
                                    required
                                    type="text"
                                    value={profileForm.phone}
                                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value.replace(/\D/g, '') })} // Chỉ cho nhập số
                                    placeholder="0912345678"
                                    maxLength={10}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                />
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isSavingProfile}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-md disabled:bg-indigo-400"
                                >
                                    <Save size={18} />
                                    {isSavingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* CỘT PHẢI: ĐỔI MẬT KHẨU */}
                    <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden h-fit">
                        <div className="p-6 border-b border-gray-100 flex items-center gap-3 bg-orange-50/30">
                            <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                                <Lock size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Đổi mật khẩu</h2>
                                <p className="text-xs text-gray-500">Cập nhật mật khẩu đăng nhập</p>
                            </div>
                        </div>

                        <form onSubmit={handleChangePassword} className="p-6 space-y-5">
                            {/* Mật khẩu cũ */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Mật khẩu hiện tại <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <input
                                        required
                                        type={showOld ? "text" : "password"}
                                        value={passForm.oldPassword}
                                        onChange={(e) => setPassForm({ ...passForm, oldPassword: e.target.value })}
                                        className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                                    />
                                    <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Mật khẩu mới */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Mật khẩu mới <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <input
                                        required
                                        type={showNew ? "text" : "password"}
                                        value={passForm.newPassword}
                                        onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                                        placeholder="Tối thiểu 6 ký tự"
                                        className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                                    />
                                    <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Xác nhận mật khẩu mới */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Xác nhận mật khẩu mới <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <input
                                        required
                                        type={showConfirm ? "text" : "password"}
                                        value={passForm.confirmPassword}
                                        onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })}
                                        className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                                    />
                                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isChangingPass}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition shadow-md disabled:bg-orange-300 w-full justify-center"
                                >
                                    <KeyRound size={18} />
                                    {isChangingPass ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                                </button>
                            </div>
                        </form>
                    </div>

                </div>
            )}
        </div>
    );
}