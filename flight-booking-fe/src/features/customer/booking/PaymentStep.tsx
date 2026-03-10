import { useState } from 'react';
import { useSelector } from 'react-redux';
import { type RootState } from '@/store/store';
import axiosClient from '@/api/axiosClient';
import { Button } from '@/components/ui/button';
import { CreditCard, ShieldCheck, Loader2 } from 'lucide-react';
import { AlertCircle } from 'lucide-react';

export const PaymentStep = () => {
  const { bookingResult } = useSelector((state: RootState) => state.booking);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // THÊM ĐOẠN NÀY ĐỂ FIX LỖI TYPESCRIPT
  if (!bookingResult) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500 bg-white border rounded-2xl shadow-sm">
        <AlertCircle className="w-12 h-12 mb-4 text-orange-400" />
        <p className="font-bold text-lg text-slate-700">Đang xử lý đơn hàng...</p>
        <p className="text-sm mt-2">Nếu quá lâu, vui lòng quay lại bước trước và thử lại.</p>
      </div>
    );
  }

  const handleVNPayPayment = async () => {
    setIsRedirecting(true);
    try {
      // Gọi API lấy URL VNPay
      // Truyền pnrCode để BE biết thanh toán cho đơn hàng nào
      const response: any = await axiosClient.get('/payments/create-url', {
        params: {
          bookingId: bookingResult.bookingId,
          amount: bookingResult.totalAmount
        }
      });

      if (response.result) {
        // Chuyển hướng sang trang VNPay
        window.location.href = response.result;
      }
    } catch (error) {
      console.error("Lỗi tạo link VNPay:", error);
    } finally {
      setIsRedirecting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white border rounded-2xl shadow-sm">
      <h2 className="text-xl font-bold mb-6">Thanh toán vé máy bay</h2>
      
      <div className="space-y-4 mb-8">
        <div className="p-4 border-2 border-blue-600 bg-blue-50 rounded-xl flex items-center gap-4">
          <CreditCard className="text-blue-600" />
          <div className="flex-1">
            <p className="font-bold">Cổng thanh toán VNPay</p>
            <p className="text-xs text-slate-500">Hỗ trợ ATM, Thẻ quốc tế, QR Code</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 p-4 rounded-xl mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-slate-500">Mã đơn hàng (PNR):</span>
          <span className="font-bold font-mono">{bookingResult.pnrCode}</span>
        </div>
        <div className="flex justify-between text-lg border-t pt-2">
          <span className="font-bold">Tổng thanh toán:</span>
          <span className="font-black text-blue-600">
            {bookingResult.totalAmount.toLocaleString()} đ
          </span>
        </div>
      </div>

      <Button 
        onClick={handleVNPayPayment}
        disabled={isRedirecting}
        className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-lg font-bold"
      >
        {isRedirecting ? <Loader2 className="animate-spin mr-2" /> : null}
        Thanh toán qua VNPay
      </Button>
      
      <div className="mt-4 flex items-center justify-center gap-2 text-green-600 text-sm">
        <ShieldCheck size={16} />
        Giao dịch được bảo mật bởi VNPay
      </div>
    </div>
  );
};