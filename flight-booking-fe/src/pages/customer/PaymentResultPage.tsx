import { useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, XCircle, AlertTriangle, Home, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDispatch } from 'react-redux';
import { clearBooking } from '@/store/bookingSlice'; 

export const PaymentResultPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  // Kiểm tra xem BE đang đá về đường link nào
  const isSuccess = location.pathname.includes('/payment-success');
  const isFailed = location.pathname.includes('/payment-failed');
  const isError = location.pathname.includes('/payment-error');

  // Lấy dữ liệu từ URL (Tùy thuộc vào link)
  const amountStr = searchParams.get('vnp_Amount');
  const amount = amountStr ? (parseInt(amountStr) / 100) : 0;
  const transactionNo = searchParams.get('vnp_TransactionNo');
  const orderInfo = searchParams.get('vnp_OrderInfo');
  
  const pnrCode = searchParams.get('pnr'); // Dùng cho màn hình thất bại
  const errorMessage = searchParams.get('message'); // Dùng cho màn hình lỗi chữ ký

  useEffect(() => {
    if (isSuccess) {
      // Xóa giỏ hàng nếu thanh toán thành công
      dispatch(clearBooking());
    }
  }, [isSuccess, dispatch]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 md:p-10 rounded-3xl shadow-lg max-w-lg w-full text-center border border-slate-100">
        
        {/* ICON TRẠNG THÁI */}
        <div className="flex justify-center mb-6">
          {isSuccess && (
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
              <CheckCircle className="text-green-500 w-12 h-12" />
            </div>
          )}
          {isFailed && (
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
              <XCircle className="text-red-500 w-12 h-12" />
            </div>
          )}
          {isError && (
            <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
              <AlertTriangle className="text-orange-500 w-12 h-12" />
            </div>
          )}
        </div>

        {/* TIÊU ĐỀ & LỜI NHẮN */}
        <h1 className={`text-3xl font-extrabold mb-2 ${isSuccess ? 'text-green-600' : isFailed ? 'text-red-600' : 'text-orange-600'}`}>
          {isSuccess ? 'Thanh toán thành công!' : isFailed ? 'Thanh toán thất bại!' : 'Lỗi giao dịch!'}
        </h1>
        <p className="text-slate-500 mb-8">
          {isSuccess && 'Cảm ơn bạn đã tin tưởng. Vé điện tử đã được gửi vào email của bạn.'}
          {isFailed && 'Giao dịch đã bị hủy hoặc xảy ra lỗi trong quá trình xử lý từ ngân hàng.'}
          {isError && (errorMessage === 'invalid-signature' ? 'Phát hiện sai lệch chữ ký bảo mật. Giao dịch bị từ chối.' : 'Đã xảy ra lỗi không xác định.')}
        </p>

        {/* CHI TIẾT GIAO DỊCH (Chỉ hiện khi thành công) */}
        {isSuccess && (
          <div className="bg-slate-50 rounded-xl p-5 space-y-3 text-left mb-8 border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <span className="text-slate-500 text-sm">Số tiền</span>
              <span className="font-bold text-lg text-slate-800">
                {amount.toLocaleString('vi-VN')} đ
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <span className="text-slate-500 text-sm">Mã giao dịch</span>
              <span className="font-medium text-slate-700">{transactionNo || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-sm">Nội dung</span>
              <span className="font-medium text-slate-700 truncate max-w-[200px]">
                {orderInfo || 'Thanh toán vé máy bay'}
              </span>
            </div>
          </div>
        )}

        {/* MÃ PNR (Chỉ hiện khi thất bại) */}
        {isFailed && pnrCode && (
           <div className="bg-red-50 text-red-700 rounded-xl p-4 mb-8 border border-red-100 font-medium">
             Mã đặt chỗ (PNR) của bạn: <span className="font-bold">{pnrCode}</span>
           </div>
        )}

        {/* NÚT ĐIỀU HƯỚNG */}
        <div className="space-y-3">
          {isSuccess ? (
            <Button onClick={() => navigate('/my-bookings')} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-md rounded-xl">
              <Calendar className="mr-2 h-5 w-5" /> Quản lý vé của tôi
            </Button>
          ) : (
            <Button onClick={() => navigate(-1)} className="w-full h-12 bg-red-600 hover:bg-red-700 text-md rounded-xl">
              Thử thanh toán lại
            </Button>
          )}
          
          <Button onClick={() => navigate('/')} variant="outline" className="w-full h-12 text-md rounded-xl border-slate-300 text-slate-600">
            <Home className="mr-2 h-5 w-5" /> Về trang chủ
          </Button>
        </div>

      </div>
    </div>
  );
};