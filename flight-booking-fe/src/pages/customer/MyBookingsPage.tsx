import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plane, Calendar, Clock, CreditCard, RefreshCw, AlertCircle,
  CheckCircle, Ticket, ChevronRight, X, User, QrCode
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { bookingApi, type MyBookingResponse } from '@/api/bookingApi';

// --- Helpers ---
const STATUS_CONFIG: Record<string, { label: string, color: string, icon: any }> = {
  PENDING: { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
  AWAITING_PAYMENT: { label: 'Chờ thanh toán', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: AlertCircle },
  PAID: { label: 'Đã thanh toán', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: CreditCard },
  CONFIRMED: { label: 'Đã xác nhận', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
  CANCELLED: { label: 'Đã huỷ', color: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle },
  REFUNDED: { label: 'Đã hoàn tiền', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: RefreshCw },
};

const fmtVND = (amount: number) => amount?.toLocaleString('vi-VN') + ' ₫';
// const fmtDateTime = (isoString: string) => {
//   if (!isoString) return '--';
//   const d = new Date(isoString);
//   return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
// };
const fmtTimeOnly = (isoString: string) => {
  if (!isoString) return '--:--';
  const d = new Date(isoString);
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};
const fmtDateOnly = (isoString: string) => {
  if (!isoString) return '--/--/----';
  const d = new Date(isoString);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// --- Component ---
export const MyBookingsPage = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<MyBookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State quản lý Modal Chi tiết vé
  const [selectedTicket, setSelectedTicket] = useState<MyBookingResponse | null>(null);

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const fetchMyBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response: any = await bookingApi.getMyBookings(1, 50);
      const content = response?.result?.content || response?.data?.result?.content || [];
      const sorted = content.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setBookings(sorted);
    } catch (err) {
      console.error("Lỗi lấy danh sách vé:", err);
      setError("Không thể tải danh sách chuyến bay. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const handleRepay = (bookingId: string) => {
    alert(`Tính năng thanh toán lại cho đơn ${bookingId} đang được cập nhật!`);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
            <Ticket className="w-8 h-8 text-blue-600" />
            Chuyến bay của tôi
          </h1>
          <p className="text-slate-500 mt-2">Quản lý và theo dõi các hành trình bạn đã đặt.</p>
        </div>

        {/* Lỗi */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
            <Button variant="outline" size="sm" onClick={fetchMyBookings} className="ml-auto bg-white">Thử lại</Button>
          </div>
        )}

        {/* Danh sách vé */}
        <div className="space-y-6">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm animate-pulse flex flex-col gap-4">
                <div className="h-6 bg-slate-200 rounded w-1/4"></div>
                <div className="h-16 bg-slate-100 rounded w-full"></div>
                <div className="h-10 bg-slate-200 rounded w-1/3 mt-2 self-end"></div>
              </div>
            ))
          ) : bookings.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-sm text-center">
              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Plane className="w-10 h-10 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Bạn chưa có chuyến bay nào</h3>
              <p className="text-slate-500 mb-8 max-w-md mx-auto">Hãy bắt đầu lên kế hoạch cho chuyến đi tiếp theo của bạn ngay hôm nay!</p>
              <Button onClick={() => navigate('/')} className="bg-blue-600 hover:bg-blue-700 px-8 h-12 rounded-xl text-md">
                Tìm chuyến bay ngay
              </Button>
            </div>
          ) : (
            bookings.map((booking) => {
              const status = STATUS_CONFIG[booking.status] || { label: booking.status, color: 'bg-slate-100 text-slate-600', icon: Clock };
              const StatusIcon = status.icon;

              return (
                <div key={booking.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col sm:flex-row">

                  {/* Cột trái: Thông tin chặng bay */}
                  <div className="p-6 flex-1 border-b sm:border-b-0 sm:border-r border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg tracking-wider">
                        PNR: <span className="text-slate-800 font-bold">{booking.pnrCode}</span>
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${status.color}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {status.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-black text-blue-600">{booking.origin}</div>
                      </div>
                      <div className="flex-1 flex flex-col items-center px-4 relative">
                        <span className="text-xs text-slate-400 font-medium mb-1">{booking.flightNumber}</span>
                        <div className="w-full border-t-2 border-dashed border-slate-300 relative">
                          <Plane className="w-5 h-5 text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-1" />
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-black text-blue-600">{booking.destination}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="font-medium">{fmtDateOnly(booking.departureTime)} {fmtTimeOnly(booking.departureTime)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>Ngày đặt: {fmtDateOnly(booking.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cột phải: Giá và Hành động */}
                  <div className="p-6 sm:w-64 bg-slate-50 flex flex-col justify-center items-center sm:items-end text-center sm:text-right">
                    <div className="mb-1 text-sm text-slate-500 font-medium">Tổng thanh toán</div>
                    <div className="text-2xl font-bold text-slate-800 mb-6">{fmtVND(booking.totalAmount)}</div>

                    <div className="w-full flex flex-col gap-2 mt-auto">
                      {booking.status === 'AWAITING_PAYMENT' ? (
                        <>
                          <Button
                            onClick={() => handleRepay(booking.id)}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-sm"
                          >
                            <CreditCard className="w-4 h-4 mr-2" /> Thanh toán
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => navigate(`/verify-payment?pnr=${booking.pnrCode}`)}
                            className="w-full border-orange-200 text-orange-600 hover:bg-orange-50 rounded-xl"
                          >
                            <RefreshCw className="w-4 h-4 mr-2" /> Tra cứu
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          className="w-full text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-xl flex items-center justify-center group"
                          onClick={() => setSelectedTicket(booking)}
                        >
                          Xem chi tiết <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      )}
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>
      </div>

      {/* =========================================
          MODAL CHI TIẾT VÉ (BOARDING PASS) 
          ========================================= */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">

          {/* Vùng bấm ra ngoài để đóng */}
          <div className="absolute inset-0" onClick={() => setSelectedTicket(null)}></div>

          {/* Card Vé */}
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">

            {/* Header Xanh */}
            <div className="bg-blue-600 p-6 text-white flex items-start justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">E-Ticket / Thẻ lên máy bay</p>
                <h3 className="text-2xl font-bold tracking-wider">PNR: {selectedTicket.pnrCode}</h3>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 bg-blue-700/50 hover:bg-blue-700 rounded-full text-white transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chặng bay chi tiết */}
            <div className="p-6 pb-8">
              <div className="flex justify-between items-center mb-8">
                <div className="text-center">
                  <p className="text-3xl font-black text-slate-800">{selectedTicket.origin}</p>
                  <p className="text-xs text-slate-500 font-medium mt-1">Sân bay đi</p>
                </div>

                <div className="flex-1 flex flex-col items-center px-4">
                  <Plane className="w-6 h-6 text-blue-500 mb-1" />
                  <div className="w-full border-t-2 border-slate-200 border-dashed"></div>
                  <p className="text-xs font-bold text-slate-400 mt-2">{selectedTicket.flightNumber}</p>
                </div>

                <div className="text-center">
                  <p className="text-3xl font-black text-slate-800">{selectedTicket.destination}</p>
                  <p className="text-xs text-slate-500 font-medium mt-1">Sân bay đến</p>
                </div>
              </div>

              {/* Lưới thông tin */}
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                <div>
                  <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mb-1">
                    <Calendar className="w-3.5 h-3.5" /> Ngày bay
                  </p>
                  <p className="text-sm font-bold text-slate-800">{fmtDateOnly(selectedTicket.departureTime)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mb-1">
                    <Clock className="w-3.5 h-3.5" /> Giờ khởi hành
                  </p>
                  <p className="text-sm font-bold text-slate-800">{fmtTimeOnly(selectedTicket.departureTime)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mb-1">
                    <User className="w-3.5 h-3.5" /> Trạng thái
                  </p>
                  <p className={`text-sm font-bold ${STATUS_CONFIG[selectedTicket.status]?.color?.split(' ')[1] || 'text-slate-800'}`}>
                    {STATUS_CONFIG[selectedTicket.status]?.label || selectedTicket.status}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mb-1">
                    <CreditCard className="w-3.5 h-3.5" /> Tổng tiền
                  </p>
                  <p className="text-sm font-bold text-blue-600">{fmtVND(selectedTicket.totalAmount)}</p>
                </div>
              </div>
            </div>

            {/* Nét đứt (Cutout effect) */}
            <div className="relative flex items-center px-4">
              <div className="w-6 h-6 bg-slate-900/60 backdrop-blur-sm rounded-full absolute -left-3"></div>
              <div className="w-full border-t-2 border-slate-200 border-dashed"></div>
              <div className="w-6 h-6 bg-slate-900/60 backdrop-blur-sm rounded-full absolute -right-3"></div>
            </div>

            {/* Footer QR Code */}
            <div className="bg-slate-50 p-6 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">Mã đặt chỗ xuất trình tại sân bay</p>
                <p className="text-sm font-bold text-slate-800 tracking-widest">{selectedTicket.pnrCode}</p>
                <p className="text-[10px] text-slate-400 mt-2">Ngày đặt: {fmtDateOnly(selectedTicket.createdAt)}</p>
              </div>
              <div className="w-16 h-16 bg-white border border-slate-200 rounded-lg flex items-center justify-center shadow-sm">
                <QrCode className="w-10 h-10 text-slate-800" />
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};