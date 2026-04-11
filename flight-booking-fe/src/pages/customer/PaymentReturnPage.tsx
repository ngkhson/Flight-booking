import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { clearBooking } from '@/store/bookingSlice'; 
import axiosClient from '@/api/axiosClient';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Home, 
  Calendar, 
  Loader2, 
  RefreshCw, 
  ReceiptText 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type PaymentStatus = 'loading' | 'success' | 'vnpay_failed' | 'server_error';

export const PaymentReturnPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [status, setStatus] = useState<PaymentStatus>('loading');
  const [pnrCode, setPnrCode] = useState<string>('');
  const [serverMessage, setServerMessage] = useState<string>('');
  
  // Trích xuất dữ liệu từ URL VNPay trả về
  const vnp_Amount = searchParams.get('vnp_Amount');
  const vnp_TxnRef = searchParams.get('vnp_TxnRef'); // Chính là pnrCode
  const vnp_TransactionNo = searchParams.get('vnp_TransactionNo');
  const vnp_OrderInfo = searchParams.get('vnp_OrderInfo');
  
  const displayAmount = vnp_Amount ? (Number(vnp_Amount) / 100).toLocaleString('vi-VN') : '0';

  // HÀM KIỂM TRA TRẠNG THÁI TỪ BACKEND
  const checkPaymentStatus = async (pnr: string) => {
    try {
      const response: any = await axiosClient.get(`/payments/verify-status/${pnr}`);
      
      const resultStatus = response.result?.status; 
      const resultMessage = response.result?.message;

      setServerMessage(resultMessage || '');

      if (resultStatus === 'SUCCESS') {
        setPnrCode(pnr);
        setStatus('success');
        // Xóa giỏ hàng trong Redux khi mua vé thành công
        dispatch(clearBooking());
      } 
      else if (resultStatus === 'FAILED' || resultStatus === 'CANCELLED') {
        setPnrCode(pnr);
        setStatus('vnpay_failed');
      } 
      else {
        // PENDING hoặc AWAITING_PAYMENT
        setStatus('server_error');
      }
    } catch (error: any) {
      console.error("Lỗi gọi API Verify Status:", error);
      setStatus('server_error');
    }
  };

  // 1. GỌI API KHI VỪA ĐƯỢC VNPAY REDIRECT VỀ
  useEffect(() => {
    if (!vnp_TxnRef) {
      navigate('/');
      return;
    }

    if (searchParams.get('vnp_ResponseCode') !== '00') {
      checkPaymentStatus(vnp_TxnRef); 
      return;
    }

    checkPaymentStatus(vnp_TxnRef);
  }, [searchParams, navigate, vnp_TxnRef]);

  // 2. KHI BẤM NÚT "THỬ KẾT NỐI LẠI"
  const handleRetry = () => {
    if (!vnp_TxnRef) return;
    setStatus('loading');
    
    setTimeout(() => {
      checkPaymentStatus(vnp_TxnRef);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 md:p-10 rounded-3xl shadow-lg max-w-lg w-full text-center border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* ==============================================
            TRẠNG THÁI 1: ĐANG XỬ LÝ
            ============================================== */}
        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-6" />
            <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Đang đồng bộ dữ liệu</h2>
            <p className="text-slate-500">Hệ thống đang kết nối với VNPay để xuất vé. Vui lòng không đóng trình duyệt...</p>
          </div>
        )}

        {/* ==============================================
            TRẠNG THÁI 2: THÀNH CÔNG
            ============================================== */}
        {status === 'success' && (
          <>
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                <CheckCircle className="text-green-500 w-12 h-12" />
              </div>
            </div>
            
            <h1 className="text-3xl font-extrabold mb-2 text-green-600">Thanh toán thành công!</h1>
            <p className="text-slate-500 mb-2">Cảm ơn bạn đã tin tưởng. Vé điện tử đã được gửi vào email của bạn.</p>
            {serverMessage && <p className="text-green-600 font-bold mb-8">{serverMessage}</p>}

            <div className="bg-slate-50 rounded-xl p-5 space-y-3 text-left mb-8 border border-slate-100">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                <span className="text-slate-500 text-sm">Số tiền</span>
                <span className="font-bold text-lg text-slate-800">{displayAmount} đ</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                <span className="text-slate-500 text-sm">Mã đặt chỗ (PNR)</span>
                <span className="font-black text-xl text-blue-600 tracking-wider">{pnrCode}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm">Mã GD VNPay</span>
                <span className="font-medium text-slate-700">{vnp_TransactionNo || 'N/A'}</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button onClick={() => navigate('/my-bookings')} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-md font-bold rounded-xl shadow-md">
                <Calendar className="mr-2 h-5 w-5" /> Quản lý vé của tôi
              </Button>
              <Button onClick={() => navigate('/')} variant="outline" className="w-full h-12 text-md font-bold rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50">
                <Home className="mr-2 h-5 w-5" /> Về trang chủ
              </Button>
            </div>
          </>
        )}

        {/* ==============================================
            TRẠNG THÁI 3: THẤT BẠI TỪ VNPAY
            ============================================== */}
        {status === 'vnpay_failed' && (
          <>
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                <XCircle className="text-red-500 w-12 h-12" />
              </div>
            </div>
            
            <h1 className="text-3xl font-extrabold mb-2 text-red-600">Thanh toán thất bại!</h1>
            <p className="text-slate-500 mb-2">Giao dịch đã bị hủy hoặc xảy ra lỗi trong quá trình xử lý từ ngân hàng.</p>
            {serverMessage && <p className="text-red-500 text-sm font-bold mb-6">{serverMessage}</p>}

            {pnrCode && (
               <div className="bg-red-50 text-red-700 rounded-xl p-4 mb-8 border border-red-100 font-medium flex justify-center items-center gap-2">
                 Mã đặt chỗ (PNR): <span className="font-black text-xl text-red-800 tracking-wider">{pnrCode}</span>
               </div>
            )}

            <div className="space-y-3">
              <Button onClick={() => navigate('/my-bookings')} className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-md font-bold rounded-xl shadow-md">
                <RefreshCw className="mr-2 h-5 w-5" /> Đến trang Quản lý vé để thử lại
              </Button>
              <Button onClick={() => navigate('/')} variant="outline" className="w-full h-12 text-md font-bold rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50">
                <Home className="mr-2 h-5 w-5" /> Về trang chủ
              </Button>
            </div>
          </>
        )}

        {/* ==============================================
            TRẠNG THÁI 4: LỖI KẾT NỐI SERVER
            ============================================== */}
        {status === 'server_error' && (
          <>
            <div className="flex justify-center mb-6 relative">
              <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                <AlertTriangle className="text-orange-500 w-12 h-12" />
              </div>
            </div>
            
            <h1 className="text-3xl font-extrabold mb-2 text-orange-600">Đang chờ xác nhận</h1>
            <p className="text-slate-600 mb-6 text-sm leading-relaxed">
              {serverMessage || "Hệ thống đang gặp độ trễ khi kết nối với VNPay."}
              <strong className="text-orange-600 block mt-2">Nếu thẻ của bạn ĐÃ BỊ TRỪ TIỀN, vui lòng không đặt vé mới và bấm "Thử kết nối lại" sau vài giây!</strong>
            </p>

            <div className="bg-orange-50 rounded-xl p-4 border border-orange-100 mb-8 text-left">
              <p className="text-[11px] font-bold text-orange-600 uppercase mb-3 flex items-center gap-1">
                <ReceiptText size={14} /> Vui lòng lưu lại thông tin này
              </p>
              <div className="flex justify-between items-center pb-2 border-b border-orange-200/50 mb-2">
                <span className="text-slate-600 text-sm">Mã đơn hàng</span>
                <span className="font-bold text-slate-800">{vnp_TxnRef || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-orange-200/50 mb-2">
                <span className="text-slate-600 text-sm">Mã GD VNPay</span>
                <span className="font-bold text-slate-800">{vnp_TransactionNo || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 text-sm">Số tiền</span>
                <span className="font-bold text-slate-800">{displayAmount} đ</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button onClick={handleRetry} className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-md font-bold rounded-xl shadow-md">
                <RefreshCw className="mr-2 h-5 w-5" /> Thử kết nối lại
              </Button>
              <Button onClick={() => navigate('/')} variant="outline" className="w-full h-12 text-md font-bold rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50">
                <Home className="mr-2 h-5 w-5" /> Về trang chủ
              </Button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};