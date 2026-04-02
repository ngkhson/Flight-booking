import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plane, Calendar, Clock, CreditCard, RefreshCw, AlertCircle, 
  CheckCircle, Ticket, ChevronRight, X, User, QrCode, Loader2, ChevronDown, Search 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { bookingApi } from '@/api/bookingApi'; 
import axiosClient from '@/api/axiosClient';

// --- Helpers ---
const STATUS_CONFIG: Record<string, { label: string, color: string, icon: any }> = {
  // PENDING: { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
  AWAITING_PAYMENT: { label: 'Chờ thanh toán', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: AlertCircle },
  // PAID: { label: 'Đã thanh toán', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: CreditCard },
  CONFIRMED: { label: 'Đã xác nhận', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
  CANCELLED: { label: 'Đã huỷ', color: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle },
  // REFUNDED: { label: 'Đã hoàn tiền', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: RefreshCw },
};

const fmtVND = (amount: number) => amount ? amount.toLocaleString('vi-VN') + ' ₫' : '--- ₫';
const fmtTimeOnly = (isoString: string) => {
  if (!isoString) return '--:--';
  const d = new Date(isoString);
  if(isNaN(d.getTime())) return isoString;
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};
const fmtDateOnly = (isoString: string) => {
  if (!isoString) return '--/--/----';
  const d = new Date(isoString);
  if(isNaN(d.getTime())) return isoString;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Hàm bỏ dấu tiếng Việt để tìm kiếm thông minh hơn
const removeAccents = (str: string) => {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
};

const getDetailedFlights = (booking: any) => {
  if (booking.passengers && booking.passengers[0]?.tickets?.length > 0) {
    return booking.passengers[0].tickets.map((t: any) => ({
      origin: t.departureAirport,
      destination: t.arrivalAirport,
      flightNumber: t.flightNumber,
      departureTime: t.departureTime,
      price: t.totalAmount, 
      classType: t.classType,
    }));
  }
  const flightArray = booking.flights || booking.bookingFlights || booking.flightList;
  if (flightArray && Array.isArray(flightArray) && flightArray.length > 0) {
    return flightArray.map((item: any) => {
      const f = item.flight || item; 
      return {
        origin: f.origin || booking.origin,
        destination: f.destination || booking.destination,
        flightNumber: f.flightNumber || f.flightCode || booking.flightNumber,
        departureTime: f.departureTime || booking.departureTime,
        price: null,
      };
    });
  }
  return [{
    origin: booking.origin,
    destination: booking.destination,
    flightNumber: booking.flightNumber,
    departureTime: booking.departureTime,
    price: booking.totalAmount,
    classType: 'ECONOMY'
  }];
};

export const MyBookingsPage = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [loading, setLoading] = useState(true); 

  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [isFetchingDetail, setIsFetchingDetail] = useState(false);
  const [processingPaymentId, setProcessingPaymentId] = useState<string | null>(null);

  // 👇 THÊM STATE CHO TÌM KIẾM & LỌC 👇
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // useEffect(() => {
  //   fetchMyBookings(1, false);
  // }, []);

  const fetchMyBookings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // ĐIỂM MẤU CHỐT: Yêu cầu Backend trả luôn 1000 vé ở trang 1
      const response: any = await bookingApi.getMyBookings(1, 1000); 
      
      if (response.code === 1000 && response.result) {
        // Trích xuất mảng data
        const content = response.result.data || response.result.content || [];
        // Ghi đè toàn bộ vé vào state
        setBookings(content);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách vé:", err);
      setError("Không thể tải danh sách chuyến bay. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  // Sửa lại cái useEffect gọi API lần đầu
  useEffect(() => {
    fetchMyBookings();
  }, []);

  const handleViewDetails = async (booking: any) => {
    setIsFetchingDetail(true);
    try {
      const response: any = await bookingApi.getBookingById(booking.id);
      const fullData = response.result || response.data?.result;
      if (fullData) {
        setSelectedTicket({ ...booking, ...fullData });
      } else {
        setSelectedTicket(booking);
      }
    } catch (error) {
      console.error("Lỗi lấy chi tiết vé:", error);
      setSelectedTicket(booking); 
    } finally {
      setIsFetchingDetail(false);
    }
  };

  const handleRepay = async (bookingId: string) => {
    try {
      setProcessingPaymentId(bookingId); 
      const vnpayRes: any = await axiosClient.get('/payments/create-url', {
        params: { bookingId }
      });

      if (vnpayRes.result) {
        window.location.href = vnpayRes.result;
      } else {
        alert("Không thể tạo link thanh toán lúc này. Vui lòng thử lại sau.");
      }
    } catch (error: any) {
      console.error("Lỗi gọi thanh toán:", error);
      alert(error.response?.data?.message || "Đã xảy ra lỗi kết nối với cổng thanh toán!");
    } finally {
      setProcessingPaymentId(null);
    }
  };

  // 👇 HÀM LỌC DỮ LIỆU TỰ ĐỘNG (useMemo) 👇
  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      // 1. Lọc theo trạng thái
      const matchStatus = filterStatus === 'ALL' || booking.status === filterStatus;

      // 2. Lọc theo từ khóa (Mã PNR, Điểm đi, Điểm đến, Số hiệu)
      const term = removeAccents(searchTerm.trim());
      const flightList = getDetailedFlights(booking);
      
      const searchString = removeAccents(`
        ${booking.pnrCode || ''} 
        ${flightList.map((f: any) => `${f.origin} ${f.destination} ${f.flightNumber}`).join(' ')}
      `);
      
      const matchSearch = !term || searchString.includes(term);

      return matchStatus && matchSearch;
    });
  }, [bookings, searchTerm, filterStatus]);

  const modalFlights = selectedTicket ? getDetailedFlights(selectedTicket) : [];

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
            <Ticket className="w-8 h-8 text-blue-600" />
            Chuyến bay của tôi
          </h1>
        </div>

        {/* Lỗi */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 flex items-center gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
            <Button variant="outline" size="sm" onClick={() => fetchMyBookings()} className="ml-auto bg-white">Thử lại</Button>
          </div>
        )}

        {/* 👇 THANH TÌM KIẾM VÀ LỌC 👇 */}
        {!loading && bookings.length > 0 && (
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Tìm mã PNR, tên sân bay, số hiệu..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 h-12 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow text-slate-700 shadow-sm"
              />
            </div>
            
            <div className="md:w-56 shrink-0">
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-700 shadow-sm font-medium cursor-pointer appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
              >
                <option value="ALL">Tất cả trạng thái</option>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Danh sách vé */}
        <div className="space-y-6">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm animate-pulse h-48"></div>
            ))
          ) : bookings.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-sm text-center">
              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Plane className="w-10 h-10 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Bạn chưa có chuyến bay nào</h3>
              <Button onClick={() => navigate('/')} className="bg-blue-600 hover:bg-blue-700 px-8 h-12 rounded-xl text-md mt-4">
                Tìm chuyến bay ngay
              </Button>
            </div>
          ) : filteredBookings.length === 0 ? (
            /* HIỂN THỊ KHI TÌM KIẾM/LỌC KHÔNG RA KẾT QUẢ */
            <div className="bg-slate-100/50 p-10 rounded-3xl border border-slate-200 border-dashed text-center">
              <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-700 mb-2">Không tìm thấy vé phù hợp</h3>
              <p className="text-slate-500">Thử thay đổi từ khóa, điều chỉnh bộ lọc, hoặc bấm "Xem thêm vé" bên dưới để tìm trong lịch sử cũ hơn.</p>
              <Button variant="outline" onClick={() => { setSearchTerm(''); setFilterStatus('ALL'); }} className="mt-4 bg-white">
                Xóa bộ lọc
              </Button>
            </div>
          ) : (
            <>
              {filteredBookings.map((booking) => {
                const status = STATUS_CONFIG[booking.status] || { label: booking.status, color: 'bg-slate-100 text-slate-600', icon: Clock };
                const StatusIcon = status.icon;
                const flightList = getDetailedFlights(booking);
                

                return (
                  <div key={booking.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col md:flex-row">
                    {/* ====== CỘT TRÁI: THÔNG TIN CHUYẾN BAY ====== */}
                    <div className="p-6 flex-1 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                           <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
                             PNR: <span className="text-slate-800 font-bold tracking-wider">{booking.pnrCode}</span>
                           </span>
                           {flightList.length > 1 && (
                             <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1.5 rounded border border-orange-100">
                               Khứ hồi
                             </span>
                           )}
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${status.color}`}>
                          <StatusIcon className="w-4 h-4" />
                          {status.label}
                        </span>
                      </div>

                      <div className="space-y-6">
                        {flightList.map((flight: any, idx: number) => (
                          <div key={idx} className="relative">
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <div className="text-left flex-1 min-w-0">
                                {flightList.length > 1 && (
                                  <div className={`text-[10px] font-bold uppercase mb-1 ${idx === 0 ? 'text-blue-500' : 'text-orange-500'}`}>
                                    {idx === 0 ? 'Lượt đi' : 'Lượt về'}
                                  </div>
                                )}
                                <div className="text-[22px] sm:text-[26px] font-black text-blue-600 leading-tight break-words">
                                  {flight.origin}
                                </div>
                              </div>

                              <div className="w-20 sm:w-28 flex flex-col items-center px-2 flex-shrink-0">
                                <span className="text-xs text-slate-400 mb-1">{flight.flightNumber}</span>
                                <div className="w-full border-t border-dashed border-slate-300 relative">
                                  <Plane className="w-4 h-4 text-blue-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-0.5" />
                                </div>
                              </div>

                              <div className="text-right flex-1 min-w-0">
                                {flightList.length > 1 && (
                                  <div className="text-[10px] font-bold uppercase mb-1 text-transparent select-none">.</div>
                                )}
                                <div className="text-[22px] sm:text-[26px] font-black text-blue-600 leading-tight break-words">
                                  {flight.destination}
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-between items-center text-sm mt-4">
                              <div className="flex items-center gap-2 text-slate-700">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <span className="font-medium">{fmtDateOnly(flight.departureTime)} {fmtTimeOnly(flight.departureTime)}</span>
                              </div>
                            </div>

                            {idx === 0 && flightList.length > 1 && (
                              <div className="border-b border-dashed border-slate-200 mt-6 mb-4"></div>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 pt-4 text-sm text-slate-400 flex items-center gap-2">
                        Ngày đặt: {fmtDateOnly(booking.createdAt)}
                      </div>
                    </div>

                    {/* ====== CỘT PHẢI: TỔNG TIỀN ====== */}
                    <div className="p-6 md:w-64 bg-white flex flex-col justify-center items-center">
                      <div className="mb-2 text-sm text-slate-500 font-medium">Tổng thanh toán</div>
                      <div className="text-[28px] font-black text-slate-800 mb-8 border-b-2 border-slate-800 inline-block pb-0.5">
                        {booking.totalAmount?.toLocaleString('vi-VN')} <span className="underline decoration-2">đ</span>
                      </div>

                      <div className="w-full mt-auto">
                        {['AWAITING_PAYMENT', 'PENDING'].includes(booking.status) ? (
                          <>
                            <Button 
                              onClick={() => handleRepay(booking.id)} 
                              disabled={processingPaymentId === booking.id}
                              className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-sm mb-2"
                            >
                              {processingPaymentId === booking.id ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang kết nối...</>
                              ) : (
                                "Thanh toán ngay"
                              )}
                            </Button>
                            {/* <Button 
                              variant="ghost"
                              onClick={() => navigate(`/verify-payment?pnr=${booking.pnrCode}`)} 
                              className="w-full text-slate-500 hover:bg-slate-50"
                            >
                              Kiểm tra trạng thái
                            </Button> */}
                          </>
                        ) : (
                          <Button 
                            variant="ghost" 
                            className="w-full text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-xl flex items-center justify-center font-bold"
                            onClick={() => handleViewDetails(booking)}
                            disabled={isFetchingDetail}
                          >
                            {isFetchingDetail ? 'Đang tải...' : 'Xem chi tiết'} <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

            </>
          )}

        </div>
      </div>

      {/* MODAL CHI TIẾT VÉ (Giữ nguyên) */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setSelectedTicket(null)}></div>
          
          <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="bg-blue-600 p-6 text-white flex items-start justify-between relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">E-Ticket / Thẻ lên máy bay</p>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-bold tracking-wider">PNR: {selectedTicket.pnrCode}</h3>
                  {modalFlights.length > 1 && (
                     <span className="text-[10px] uppercase font-bold bg-white text-blue-600 px-2 py-0.5 rounded shadow-sm">Khứ hồi</span>
                  )}
                </div>
              </div>
              <button 
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 bg-blue-700/50 hover:bg-blue-700 rounded-full text-white transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto shrink p-6 pb-4">
              {modalFlights.map((flight: any, idx: number) => (
                <div key={idx}>
                  {modalFlights.length > 1 && (
                    <div className="mb-4 text-center">
                      <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${idx === 0 ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                        {idx === 0 ? '✈ Chặng Đi' : '✈ Chặng Về'}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center mb-8">
                    <div className="text-center flex-1">
                      <p className="text-2xl sm:text-3xl font-black text-slate-800 break-words">{flight.origin}</p>
                      <p className="text-xs text-slate-500 font-medium mt-1">Sân bay đi</p>
                    </div>
                    
                    <div className="w-20 flex flex-col items-center px-2 flex-shrink-0">
                      <Plane className={`w-6 h-6 mb-1 ${idx === 0 ? 'text-blue-500' : 'text-orange-500'}`} />
                      <div className="w-full border-t-2 border-slate-200 border-dashed"></div>
                      <p className="text-xs font-bold text-slate-400 mt-2">{flight.flightNumber}</p>
                    </div>

                    <div className="text-center flex-1">
                      <p className="text-2xl sm:text-3xl font-black text-slate-800 break-words">{flight.destination}</p>
                      <p className="text-xs text-slate-500 font-medium mt-1">Sân bay đến</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-y-6 gap-x-8 mb-2">
                    <div>
                      <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mb-1">
                        <Calendar className="w-3.5 h-3.5" /> Ngày bay
                      </p>
                      <p className="text-sm font-bold text-slate-800">{fmtDateOnly(flight.departureTime)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mb-1">
                        <Clock className="w-3.5 h-3.5" /> Giờ khởi hành
                      </p>
                      <p className="text-sm font-bold text-slate-800">{fmtTimeOnly(flight.departureTime)}</p>
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
                        <CreditCard className="w-3.5 h-3.5" /> Tiền vé chặng này
                      </p>
                      <p className="text-sm font-bold text-blue-600">
                        {flight.price ? fmtVND(flight.price) : '---'}
                      </p>
                    </div>
                  </div>

                  {idx === 0 && modalFlights.length > 1 && (
                    <div className="border-b-2 border-slate-100 my-6"></div>
                  )}
                </div>
              ))}
            </div>

            <div className="relative flex items-center px-4 shrink-0">
              <div className="w-6 h-6 bg-slate-900/60 backdrop-blur-sm rounded-full absolute -left-3"></div>
              <div className="w-full border-t-2 border-slate-200 border-dashed"></div>
              <div className="w-6 h-6 bg-slate-900/60 backdrop-blur-sm rounded-full absolute -right-3"></div>
            </div>

            <div className="bg-slate-50 p-6 flex items-center justify-between shrink-0">
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">Tổng tiền thanh toán</p>
                <p className="text-lg font-black text-orange-600 tracking-widest">{fmtVND(selectedTicket.totalAmount)}</p>
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