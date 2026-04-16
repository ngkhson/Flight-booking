import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plane, Calendar, Clock, CreditCard, RefreshCw, AlertCircle,
  CheckCircle, Ticket, ChevronRight, X, User, QrCode, Loader2, ChevronDown, Search, Users, Tag, Edit2, Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { bookingApi } from '@/api/bookingApi';
import axiosClient from '@/api/axiosClient';

// --- Helpers ---
const STATUS_CONFIG: Record<string, { label: string, color: string, icon: any }> = {
  AWAITING_PAYMENT: { label: 'Chờ thanh toán', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: AlertCircle },
  CONFIRMED: { label: 'Đã xác nhận', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
  CANCELLED: { label: 'Đã huỷ', color: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle },
};

const fmtVND = (amount: number) => amount ? Math.floor(amount).toLocaleString('vi-VN') + ' ₫' : '--- ₫';
const fmtTimeOnly = (isoString: string) => {
  if (!isoString) return '--:--';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};
const fmtDateOnly = (isoString: string) => {
  if (!isoString) return '--/--/----';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

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

// ==========================================
// COMPONENT CON: MODAL SỬA THÔNG TIN
// ==========================================
const EditPassengerModal = ({ pnrCode, passenger, onClose, onSuccess }: any) => {
  const [loading, setLoading] = useState(false);

  // 👇 HÀM ÉP KIỂU NGÀY THÁNG VỀ CHUẨN YYYY-MM-DD CHO THẺ <input type="date"> 👇
  const formatDateForInput = (dateStr: string) => {
    if (!dateStr) return '';
    // Nếu đã chuẩn YYYY-MM-DD rồi thì cắt lấy 10 ký tự đầu (đề phòng có giờ phút T00:00:00 phía sau)
    if (dateStr.includes('-')) return dateStr.substring(0, 10);

    // Nếu backend trả DD/MM/YYYY thì lộn ngược lại
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return '';
  };

  // 👇 TÌM CHÍNH XÁC ID VÀ CÁC TRƯỜNG DỮ LIỆU CỦA BACKEND 👇
  const actualPassengerId = passenger.id || passenger.passengerId || passenger.uuid;

  const [formData, setFormData] = useState({
    firstName: passenger.firstName || '',
    lastName: passenger.lastName || '',
    // Dự phòng backend dùng chữ dateOfBirth thay vì dob
    dob: formatDateForInput(passenger.dob || passenger.dateOfBirth),
    // Dự phòng backend dùng chữ sex, và ép tất cả về CHỮ HOA để match với thẻ select
    gender: (passenger.gender || passenger.sex || 'MALE').toUpperCase()
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Chặn ngay từ đầu nếu không tìm thấy ID
    if (!actualPassengerId) {
      alert("Lỗi dữ liệu: Không tìm thấy ID của hành khách này!");
      console.error("Dữ liệu passenger bị thiếu ID:", passenger);
      return;
    }

    setLoading(true);
    try {
      const res: any = await bookingApi.updatePassenger(pnrCode, actualPassengerId, formData);
      if (res.code === 0 || res.code === 1000) {
        alert('Cập nhật thông tin hành khách thành công!');
        onSuccess();
        onClose();
      } else {
        alert(res.message || 'Có lỗi xảy ra!');
      }
    } catch (error) {
      console.error(error);
      alert('Thông tin không hợp lệ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
        <div className="flex justify-between items-center p-5 border-b border-slate-100">
          <h3 className="font-bold text-lg text-slate-800">Sửa thông tin hành khách</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Họ (Last Name)</label>
              <input type="text" required className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value.toUpperCase() })} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tên (First Name)</label>
              <input type="text" required className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value.toUpperCase() })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ngày sinh</label>
              <input type="date" required className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.dob} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Giới tính</label>
              <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
              </select>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full mt-6 bg-blue-600 hover:bg-blue-700 font-bold">
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : <span className="flex items-center gap-2"><Save size={16} /> Lưu thay đổi</span>}
          </Button>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// COMPONENT CHÍNH
// ==========================================
export const MyBookingsPage = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [isFetchingDetail, setIsFetchingDetail] = useState(false);
  const [processingPaymentId, setProcessingPaymentId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // 👇 STATE QUẢN LÝ POPUP SỬA HÀNH KHÁCH 👇
  const [editingPassenger, setEditingPassenger] = useState<any>(null);

  const fetchMyBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response: any = await bookingApi.getMyBookings(1, 1000);
      if (response.code === 1000 && response.result) {
        const content = response.result.data || response.result.content || [];
        setBookings(content);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách vé:", err);
      setError("Không thể tải danh sách chuyến bay. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

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

  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      const matchStatus = filterStatus === 'ALL' || booking.status === filterStatus;
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

  // 👇 KIỂM TRA XEM CHUYẾN BAY ĐÃ CẤT CÁNH CHƯA 👇
  const firstFlightTime = modalFlights[0]?.departureTime;
  const canEditPassengers = firstFlightTime ? new Date().getTime() < new Date(firstFlightTime).getTime() : false;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
            <Ticket className="w-8 h-8 text-blue-600" /> Chuyến bay của tôi
          </h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 flex items-center gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
            <Button variant="outline" size="sm" onClick={() => fetchMyBookings()} className="ml-auto bg-white">Thử lại</Button>
          </div>
        )}

        {!loading && bookings.length > 0 && (
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input type="text" placeholder="Tìm mã PNR, tên sân bay, số hiệu..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 h-12 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow text-slate-700 shadow-sm" />
            </div>
            <div className="md:w-56 shrink-0">
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-700 shadow-sm font-medium cursor-pointer appearance-none" style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}>
                <option value="ALL">Tất cả trạng thái</option>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm animate-pulse h-48"></div>)
          ) : bookings.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-sm text-center">
              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Plane className="w-10 h-10 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Bạn chưa có chuyến bay nào</h3>
              <Button onClick={() => navigate('/')} className="bg-blue-600 hover:bg-blue-700 px-8 h-12 rounded-xl text-md mt-4">Tìm chuyến bay ngay</Button>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="bg-slate-100/50 p-10 rounded-3xl border border-slate-200 border-dashed text-center">
              <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-700 mb-2">Không tìm thấy vé phù hợp</h3>
              <p className="text-slate-500">Thử thay đổi từ khóa, điều chỉnh bộ lọc, hoặc bấm "Xem thêm vé" bên dưới để tìm trong lịch sử cũ hơn.</p>
              <Button variant="outline" onClick={() => { setSearchTerm(''); setFilterStatus('ALL'); }} className="mt-4 bg-white">Xóa bộ lọc</Button>
            </div>
          ) : (
            <>
              {filteredBookings.map((booking) => {
                const status = STATUS_CONFIG[booking.status] || { label: booking.status, color: 'bg-slate-100 text-slate-600', icon: Clock };
                const StatusIcon = status.icon;
                const flightList = getDetailedFlights(booking);

                return (
                  <div key={booking.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col md:flex-row">
                    <div className="p-6 flex-1 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
                            PNR: <span className="text-slate-800 font-bold tracking-wider">{booking.pnrCode}</span>
                          </span>
                          {flightList.length > 1 && (
                            <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1.5 rounded border border-orange-100">Khứ hồi</span>
                          )}
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${status.color}`}>
                          <StatusIcon className="w-4 h-4" /> {status.label}
                        </span>
                      </div>

                      <div className="space-y-6">
                        {flightList.map((flight: any, idx: number) => (
                          <div key={idx} className="relative">
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <div className="text-left flex-1 min-w-0">
                                {flightList.length > 1 && <div className={`text-[10px] font-bold uppercase mb-1 ${idx === 0 ? 'text-blue-500' : 'text-orange-500'}`}>{idx === 0 ? 'Lượt đi' : 'Lượt về'}</div>}
                                <div className="text-[22px] sm:text-[26px] font-black text-blue-600 leading-tight break-words">{flight.origin}</div>
                              </div>
                              <div className="w-20 sm:w-28 flex flex-col items-center px-2 flex-shrink-0">
                                <span className="text-xs text-slate-400 mb-1">{flight.flightNumber}</span>
                                <div className="w-full border-t border-dashed border-slate-300 relative">
                                  <Plane className="w-4 h-4 text-blue-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-0.5" />
                                </div>
                              </div>
                              <div className="text-right flex-1 min-w-0">
                                {flightList.length > 1 && <div className="text-[10px] font-bold uppercase mb-1 text-transparent select-none">.</div>}
                                <div className="text-[22px] sm:text-[26px] font-black text-blue-600 leading-tight break-words">{flight.destination}</div>
                              </div>
                            </div>
                            <div className="flex justify-between items-center text-sm mt-4">
                              <div className="flex items-center gap-2 text-slate-700">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <span className="font-medium">{fmtDateOnly(flight.departureTime)} {fmtTimeOnly(flight.departureTime)}</span>
                              </div>
                            </div>
                            {idx === 0 && flightList.length > 1 && <div className="border-b border-dashed border-slate-200 mt-6 mb-4"></div>}
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 pt-4 text-sm text-slate-400 flex items-center gap-2">
                        Ngày đặt: {fmtDateOnly(booking.createdAt)}
                      </div>
                    </div>

                    <div className="p-6 md:w-64 bg-white flex flex-col justify-center items-center">
                      <div className="mb-2 text-sm text-slate-500 font-medium">Tổng thanh toán</div>
                      <div className="text-[28px] font-black text-slate-800 mb-8 border-b-2 border-slate-800 inline-block pb-0.5">
                        {Math.floor(booking.totalAmount || 0).toLocaleString('vi-VN')} <span className="underline decoration-2">đ</span>
                      </div>
                      <div className="w-full mt-auto">
                        {['AWAITING_PAYMENT', 'PENDING'].includes(booking.status) ? (
                          <Button onClick={() => handleRepay(booking.id)} disabled={processingPaymentId === booking.id} className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-sm mb-2">
                            {processingPaymentId === booking.id ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang kết nối...</> : "Thanh toán ngay"}
                          </Button>
                        ) : (
                          <Button variant="ghost" className="w-full text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-xl flex items-center justify-center font-bold" onClick={() => handleViewDetails(booking)} disabled={isFetchingDetail}>
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

      {/* MODAL CHI TIẾT VÉ VÀ HÀNH KHÁCH */}
      {selectedTicket && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setSelectedTicket(null)}></div>

          <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="bg-blue-600 p-6 text-white flex items-start justify-between relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">E-Ticket / Thẻ lên máy bay</p>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-bold tracking-wider">PNR: {selectedTicket.pnrCode}</h3>
                  {modalFlights.length > 1 && <span className="text-[10px] uppercase font-bold bg-white text-blue-600 px-2 py-0.5 rounded shadow-sm">Khứ hồi</span>}
                </div>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="p-1.5 bg-blue-700/50 hover:bg-blue-700 rounded-full text-white transition-colors z-10">
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
                    <div><p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mb-1"><Calendar className="w-3.5 h-3.5" /> Ngày bay</p><p className="text-sm font-bold text-slate-800">{fmtDateOnly(flight.departureTime)}</p></div>
                    <div><p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mb-1"><Clock className="w-3.5 h-3.5" /> Giờ khởi hành</p><p className="text-sm font-bold text-slate-800">{fmtTimeOnly(flight.departureTime)}</p></div>
                    <div><p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mb-1"><User className="w-3.5 h-3.5" /> Trạng thái</p><p className={`text-sm font-bold ${STATUS_CONFIG[selectedTicket.status]?.color?.split(' ')[1] || 'text-slate-800'}`}>{STATUS_CONFIG[selectedTicket.status]?.label || selectedTicket.status}</p></div>
                    <div><p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mb-1"><CreditCard className="w-3.5 h-3.5" /> Tiền vé chặng này</p><p className="text-sm font-bold text-blue-600">{flight.price ? fmtVND(flight.price) : '---'}</p></div>
                  </div>

                  {idx === 0 && modalFlights.length > 1 && <div className="border-b-2 border-slate-100 my-6"></div>}
                </div>
              ))}

              {/* =========================================
                  PHẦN 2: THÔNG TIN HÀNH KHÁCH & NÚT SỬA
                  ========================================= */}
              {selectedTicket.passengers && selectedTicket.passengers.length > 0 && (
                <div className="mt-8 border-t-2 border-slate-100 pt-6">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-blue-600" /> Hành khách & Chi tiết giá vé
                  </h4>

                  <div className="space-y-3">
                    {selectedTicket.passengers.map((passenger: any, pIdx: number) => (

                      console.log(`Dữ liệu hành khách ${pIdx}:`, passenger),

                      <div key={pIdx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm">

                        <div className="flex justify-between items-start mb-3 pb-3 border-b border-slate-200">
                          <div>
                            <div className="flex items-center gap-3">
                              <p className="font-black text-slate-800 uppercase tracking-wide">
                                {passenger.lastName} {passenger.firstName}
                              </p>

                              {/* 👇 NÚT SỬA CHỈ HIỆN KHI CHƯA BAY 👇 */}
                              {canEditPassengers && (
                                <button
                                  onClick={() => setEditingPassenger(passenger)}
                                  className="text-[10px] bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold px-2 py-1 rounded flex items-center gap-1 transition-colors"
                                >
                                  <Edit2 size={12} /> Sửa
                                </button>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              {/* Kiểm tra an toàn cả gender và giới tính */}
                              Giới tính: {passenger.gender === 'FEMALE' ? 'Nữ' : 'Nam'}
                              {' '}• Ngày sinh: {fmtDateOnly(passenger.dateOfBirth || passenger.dob)}
                            </p>
                          </div>
                          <span className="text-[10px] uppercase font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                            {passenger.type === 'ADULT' ? 'Người lớn' : passenger.type === 'CHILD' ? 'Trẻ em' : 'Em bé'}
                          </span>
                        </div>

                        {passenger.tickets && passenger.tickets.map((ticket: any, tIdx: number) => (
                          <div key={tIdx} className={`text-xs ${tIdx > 0 ? 'mt-4 pt-4 border-t border-slate-200 border-dashed' : ''}`}>
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex flex-col gap-1">
                                <span className="font-bold text-slate-700 text-sm">Chuyến bay: {ticket.flightNumber}</span>
                                <span className="text-slate-500">Hạng: <strong className="text-slate-700">{ticket.classType.replace('_', ' ')}</strong></span>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] text-slate-400 block mb-0.5 font-medium">Giá vé chặng này</span>
                                <span className="font-black text-blue-600 text-sm">{fmtVND(ticket.totalAmount)}</span>
                              </div>
                            </div>

                            {ticket.ancillaries && ticket.ancillaries.length > 0 ? (
                              <div className="flex flex-col gap-1.5 mt-2.5">
                                {ticket.ancillaries.map((anc: any, aIdx: number) => (
                                  <div key={aIdx} className="flex justify-between items-center bg-white border border-slate-100 px-2.5 py-1.5 rounded-md shadow-sm">
                                    <div className="flex items-center gap-1.5 text-slate-600">
                                      <Tag className="w-3 h-3 text-orange-500" />
                                      <span className="font-medium text-[11px]">{anc.catalogName}</span>
                                    </div>
                                    <span className="font-bold text-[10px] text-orange-500">+{fmtVND(anc.amount)}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-slate-400 italic text-[10px] mt-1.5">Không có dịch vụ bổ sung</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
            </div>

          </div>
        </div>
      )}

      {/* GỌI MODAL SỬA LÊN MÀN HÌNH */}
      {editingPassenger && (
        <EditPassengerModal
          pnrCode={selectedTicket.pnrCode}
          passenger={editingPassenger}
          onClose={() => setEditingPassenger(null)}
          onSuccess={() => handleViewDetails(selectedTicket)}
        />
      )}
    </div>
  );
};