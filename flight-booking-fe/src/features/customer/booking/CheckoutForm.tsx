import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Wallet, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const CheckoutForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleBack = () => {
    import("@/store/bookingSlice").then((module) => {
      dispatch(module.prevStep());
    });
  };

  const handlePayment = () => {
    // GIẢ LẬP GỌI API THANH TOÁN VNPay THÀNH CÔNG
    alert("🚀 Đang chuyển hướng sang cổng thanh toán VNPay...");
    
    // Sau khi thanh toán xong -> Xóa dữ liệu Redux và về Trang chủ (hoặc trang Lịch sử vé)
    import("@/store/bookingSlice").then((module) => {
      dispatch(module.clearBooking());
      alert("✅ Đặt vé thành công! Cảm ơn quý khách.");
      navigate('/');
    });
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h3 className="text-xl font-bold text-slate-800 mb-6 border-b pb-4 flex items-center">
        <CreditCard className="w-6 h-6 mr-2 text-blue-600" />
        Phương thức thanh toán
      </h3>
      
      <div className="space-y-4 mb-8">
        {/* Lựa chọn 1: VNPay */}
        <label className="flex items-center justify-between p-4 border-2 border-blue-600 bg-blue-50 rounded-xl cursor-pointer">
          <div className="flex items-center gap-3">
            <input type="radio" name="payment" defaultChecked className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-bold text-slate-800">Thanh toán qua VNPAY</p>
              <p className="text-sm text-slate-500">Quét mã QR qua ứng dụng ngân hàng</p>
            </div>
          </div>
          <Wallet className="w-8 h-8 text-blue-600" />
        </label>

        {/* Lựa chọn 2: Thẻ tín dụng */}
        <label className="flex items-center justify-between p-4 border border-slate-200 hover:bg-slate-50 rounded-xl cursor-pointer">
          <div className="flex items-center gap-3">
            <input type="radio" name="payment" className="w-5 h-5" />
            <div>
              <p className="font-bold text-slate-800">Thẻ Visa / Mastercard</p>
              <p className="text-sm text-slate-500">Thanh toán quốc tế</p>
            </div>
          </div>
          <CreditCard className="w-8 h-8 text-slate-400" />
        </label>
      </div>

      <div className="bg-green-50 p-4 rounded-lg flex items-start gap-3 mb-8 border border-green-200">
        <ShieldCheck className="w-6 h-6 text-green-600 shrink-0" />
        <p className="text-sm text-green-800">
          Giao dịch của bạn được mã hóa và bảo mật 100%. Thông tin thẻ không được lưu trữ trên hệ thống của chúng tôi.
        </p>
      </div>

      {/* Các nút điều hướng */}
      <div className="flex justify-between items-center pt-4 border-t border-slate-100">
        <Button variant="ghost" onClick={handleBack} className="text-slate-500 hover:text-slate-800">
          Quay lại Chọn dịch vụ
        </Button>
        <Button onClick={handlePayment} className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-6 text-lg shadow-lg">
          Thanh toán ngay
        </Button>
      </div>
    </div>
  );
};
