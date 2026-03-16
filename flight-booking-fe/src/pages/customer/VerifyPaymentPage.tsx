import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Loader2, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { paymentApi } from '@/api/paymentApi'; // Đảm bảo import đúng đường dẫn

export const VerifyPaymentPage = () => {
  const [searchParams] = useSearchParams();
  const [pnrCode, setPnrCode] = useState(searchParams.get('pnr') || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ status: string; message: string } | null>(null);

  // Nếu trên URL có sẵn ?pnr=... thì tự động tra cứu luôn khi vừa vào trang
  useEffect(() => {
    if (searchParams.get('pnr')) {
      handleVerify(searchParams.get('pnr') as string);
    }
  }, [searchParams]);

  const handleVerify = async (codeToVerify: string) => {
    if (!codeToVerify.trim()) return;
    
    setLoading(true);
    setResult(null);
    
    try {
      const response: any = await paymentApi.verifyPaymentStatus(codeToVerify.toUpperCase());
      
      // Giả sử API trả về dạng { code: 0, result: { status: "SUCCESS", message: "..." } }
      if (response.code === 0 || response.code === 1000) {
        setResult(response.result);
      } else {
        setResult({ status: 'ERROR', message: response.message || 'Không tìm thấy thông tin đơn hàng.' });
      }
    } catch (error) {
      setResult({ status: 'ERROR', message: 'Lỗi kết nối đến máy chủ. Vui lòng thử lại sau.' });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerify(pnrCode);
  };

  // Hàm render Icon và màu sắc tùy theo trạng thái
  const renderStatus = () => {
    if (!result) return null;

    switch (result.status) {
      case 'SUCCESS':
      case 'CONFIRMED':
        return (
          <div className="bg-green-50 border border-green-200 text-green-700 p-6 rounded-2xl flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
            <CheckCircle className="w-16 h-16 mb-4 text-green-500" />
            <h3 className="text-xl font-bold mb-2">Thanh toán thành công!</h3>
            <p className="font-medium">{result.message}</p>
          </div>
        );
      case 'FAILED':
      case 'CANCELLED':
        return (
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
            <XCircle className="w-16 h-16 mb-4 text-red-500" />
            <h3 className="text-xl font-bold mb-2">Thanh toán thất bại</h3>
            <p className="font-medium">{result.message}</p>
          </div>
        );
      case 'PENDING':
      case 'AWAITING_PAYMENT':
        return (
          <div className="bg-orange-50 border border-orange-200 text-orange-700 p-6 rounded-2xl flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
            <Clock className="w-16 h-16 mb-4 text-orange-500" />
            <h3 className="text-xl font-bold mb-2">Đang chờ xử lý</h3>
            <p className="font-medium">{result.message}</p>
          </div>
        );
      default:
        return (
          <div className="bg-slate-50 border border-slate-200 text-slate-700 p-6 rounded-2xl flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
            <AlertCircle className="w-16 h-16 mb-4 text-slate-500" />
            <h3 className="text-xl font-bold mb-2">Trạng thái: {result.status}</h3>
            <p className="font-medium">{result.message}</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Tra cứu Thanh toán</h1>
          <p className="text-slate-500 text-sm mt-2">
            Nhập mã đặt chỗ (PNR) để kiểm tra trạng thái vé của bạn ngay lập tức.
          </p>
        </div>

        <form onSubmit={onSubmit} className="mb-8">
          <div className="flex gap-2">
            <Input 
              type="text" 
              placeholder="VD: PNR123456" 
              value={pnrCode}
              onChange={(e) => setPnrCode(e.target.value.toUpperCase())}
              className="h-12 uppercase font-medium tracking-wider"
              required
            />
            <Button 
              type="submit" 
              disabled={loading || !pnrCode} 
              className="h-12 px-6 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Kiểm tra'}
            </Button>
          </div>
        </form>

        {/* Khu vực hiển thị kết quả */}
        {renderStatus()}

      </div>
    </div>
  );
};