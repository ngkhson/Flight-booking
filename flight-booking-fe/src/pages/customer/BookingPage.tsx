import { useSelector, useDispatch } from 'react-redux';
import { type RootState } from '@/store/store';
import { ChevronLeft, Plane, User, CreditCard, ShieldCheck, ArrowDownUp, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { prevStep } from '@/store/bookingSlice';
import { PassengerForm } from "@/features/customer/booking/PassengerForm";
import { ServiceSelection } from "@/features/customer/booking/ServiceSelection";
import { PaymentStep } from '@/features/customer/booking/PaymentStep';

export const BookingPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  // 1. NHẬN DỮ LIỆU TỪ STATE (Ưu tiên dữ liệu truyền từ Promo Card hoặc SearchPage)
  const { 
    outboundFlight, 
    returnFlight, 
    isRoundTrip, 
    searchConfigs: promoConfigs 
  } = location.state || {};

  // 2. LẤY DỮ LIỆU TỪ REDUX
  const reduxBooking = useSelector((state: RootState) => state.booking);
  
  // 3. HỢP NHẤT CẤU HÌNH (Ưu tiên State > Redux)
  const currentConfigs = promoConfigs || reduxBooking.searchConfigs;
  
  const adults = currentConfigs.adults || 1;
  const children = currentConfigs.children || 0;
  const infants = currentConfigs.infants || 0;
  const seatClass = currentConfigs.seatClass || 'ECONOMY';
  const totalPax = adults + children + infants;

  const { currentStep, addons } = reduxBooking;

  // XÁC ĐỊNH VÉ ĐANG THANH TOÁN
  const primaryFlight = outboundFlight || reduxBooking.selectedFlight;

  // 4. TÍNH TIỀN (Áp dụng tỷ lệ: NL 100%, TE 75%, EB 10%)
  const calcFlightPrice = (flight: any) => {
    if (!flight) return 0;
    const basePrice = flight.selectedClassInfo?.basePrice || flight.finalPrice || flight.price || 0;
    return (basePrice * adults) + (basePrice * 0.75 * children) + (basePrice * 0.1 * infants);
  };

  const ticketTotal = calcFlightPrice(primaryFlight) + calcFlightPrice(returnFlight);
  const addonsTotal = addons.reduce((sum, a) => sum + a.service.price, 0); 
  const taxAndFee = ticketTotal * 0.1; // Thuế phí 10%
  const grandTotal = ticketTotal + addonsTotal + taxAndFee;

  // Helper định dạng ngày giờ
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "---";
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "--:--";
    return new Date(dateStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  if (!primaryFlight) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center">
          <Plane className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 mb-6 font-bold">Bạn chưa chọn chuyến bay nào.</p>
          <Button className="rounded-xl px-8" onClick={() => navigate('/')}>Quay lại trang chủ</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* STEPS INDICATOR */}
      <div className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => currentStep === 1 ? navigate(-1) : dispatch(prevStep())}
            className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-bold transition-colors"
          >
            <ChevronLeft size={20} /> Quay lại
          </button>

          <div className="flex items-center gap-4 md:gap-8">
            <StepItem icon={<User size={16} />} label="Thông tin" active={currentStep >= 1} />
            <div className={`w-8 md:w-12 h-[2px] ${currentStep >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`} />
            <StepItem icon={<ShieldCheck size={16} />} label="Dịch vụ" active={currentStep >= 2} />
            <div className={`w-8 md:w-12 h-[2px] ${currentStep >= 3 ? 'bg-blue-600' : 'bg-slate-200'}`} />
            <StepItem icon={<CreditCard size={16} />} label="Thanh toán" active={currentStep >= 3} />
          </div>

          <div className="hidden lg:block text-right">
            <span className="text-[10px] text-slate-400 uppercase font-black block leading-none mb-1">Tổng thanh toán</span>
            <span className="text-2xl font-black text-orange-500">{grandTotal.toLocaleString('vi-VN')} đ</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-8 flex flex-col lg:flex-row gap-8">
        {/* CỘT TRÁI: FORM NHẬP LIỆU */}
        <main className="w-full lg:w-2/3">
          {currentStep === 1 && (
            <div className="space-y-6">
              <section className="bg-white p-6 rounded-3xl border shadow-sm">
                <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                  <User className="text-blue-600" /> Thông tin hành khách ({totalPax})
                </h2>
                {/* Dùng key={totalPax} để buộc React re-render lại form khi số khách thay đổi */}
                <PassengerForm 
        key={totalPax} 
        adultsCount={adults} 
        childrenCount={children} 
        infantsCount={infants} 
      />
              </section>
            </div>
          )}

          {currentStep === 2 && (
            <section className="bg-white p-6 rounded-3xl border shadow-sm">
              <ServiceSelection />
            </section>
          )}

          {currentStep === 3 && (
            <PaymentStep 
              outboundFlight={primaryFlight} 
              returnFlight={returnFlight} 
              isRoundTrip={isRoundTrip}
              finalAmount={grandTotal}
            />
          )}
        </main>

        {/* CỘT PHẢI: TÓM TẮT CHI TIẾT GIÁ */}
        <aside className="w-full lg:w-1/3">
          <div className="bg-white rounded-3xl border shadow-sm sticky top-24 overflow-hidden">
            <div className="bg-slate-900 p-5 text-white">
              <h3 className="font-bold flex items-center justify-between">
                <span className="flex items-center gap-2 uppercase tracking-tight text-sm">
                   <Plane size={18} className="text-blue-400" /> Chi tiết chuyến bay
                </span>
                {isRoundTrip && <span className="bg-orange-500 text-[10px] px-2 py-1 rounded font-black uppercase">Khứ hồi</span>}
              </h3>
            </div>

            <div className="p-6 space-y-6">
              {/* THÔNG TIN CHUYẾN ĐI */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                   <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-black uppercase">Lượt đi</span>
                   <span className="text-slate-400 font-bold flex items-center gap-1">
                      <Calendar size={12} /> {formatDate(currentConfigs.date)}
                   </span>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="font-black text-2xl text-slate-800 uppercase">{primaryFlight.flightCode || primaryFlight.flightNumber}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-black uppercase">
                        {seatClass.replace('_', ' ')}
                      </span>
                      {/* <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                        <Clock size={12} /> {formatTime(currentConfigs.date)}
                      </span> */}
                    </div>
                  </div>
                  {/* <div className="text-right">
                    <p className="text-sm font-black text-slate-800 uppercase">{primaryFlight.origin} → {primaryFlight.destination}</p>
                  </div> */}
                </div>
              </div>

              {/* THÔNG TIN CHUYẾN VỀ (NẾU CÓ) */}
              {isRoundTrip && returnFlight && (
                <div className="pt-6 border-t border-dashed space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded font-black uppercase">Lượt về</span>
                    <span className="text-slate-400 font-bold flex items-center gap-1">
                      <Calendar size={12} /> {formatDate(currentConfigs.returnDate)}
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="font-black text-2xl text-slate-800 uppercase">{returnFlight.flightCode || returnFlight.flightNumber}</p>
                      <span className="text-[10px] bg-orange-500 text-white px-2 py-0.5 rounded-full font-black uppercase inline-block mt-1">
                        {(returnFlight.selectedClassName || 'ECONOMY').replace('_', ' ')}
                      </span>
                    </div>
                    {/* <div className="text-right text-sm font-black text-slate-800 uppercase">{returnFlight.origin} → {returnFlight.destination}</div> */}
                  </div>
                </div>
              )}

              {/* BẢNG GIÁ VÉ VÀ DỊCH VỤ BỔ SUNG */}
              <div className="pt-6 border-t space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chi tiết giá vé</p>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Tiền vé ({adults} NL, {children} TE, {infants} EB)</span>
                  <span className="font-bold text-slate-800">{ticketTotal.toLocaleString('vi-VN')} đ</span>
                </div>

                {/* 👇 KHU VỰC HIỂN THỊ DỊCH VỤ BỔ SUNG ĐƯỢC BỔ SUNG VÀO ĐÂY 👇 */}
                {addons && addons.length > 0 && (
                  <div className="space-y-2 border-t border-slate-100 pt-2 mt-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Dịch vụ bổ sung</p>
                    
                    {addons.some((a: any) => a.type === 'BAGGAGE') && (
                      <div className="flex justify-between text-sm text-slate-600">
                        <span>Hành lý ký gửi</span>
                        <span className="font-semibold text-slate-800">
                          {addons.filter((a: any) => a.type === 'BAGGAGE').reduce((s: number, a: any) => s + a.service.price, 0).toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    )}
                    
                    {addons.some((a: any) => a.type === 'MEAL') && (
                      <div className="flex justify-between text-sm text-slate-600">
                        <span>Suất ăn trên mây</span>
                        <span className="font-semibold text-slate-800">
                          {addons.filter((a: any) => a.type === 'MEAL').reduce((s: number, a: any) => s + a.service.price, 0).toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    )}
                  </div>
                )}
                {/* 👆 KẾT THÚC KHU VỰC DỊCH VỤ BỔ SUNG 👆 */}

                <div className="flex justify-between text-sm text-slate-500 border-t border-slate-100 pt-2 mt-2">
                  <span>Thuế & phí (10%)</span>
                  <span className="font-bold text-slate-800">{taxAndFee.toLocaleString('vi-VN')} đ</span>
                </div>

                <div className="pt-4 border-t-2 border-slate-900 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-slate-800 uppercase text-sm">Tổng cộng</span>
                    <div className="text-right">
                      <p className="font-black text-2xl text-orange-500 leading-none">
                        {grandTotal.toLocaleString('vi-VN')} đ
                      </p>
                      <p className="text-[10px] text-slate-400 italic mt-1 font-bold">Giá cuối cùng (đã gồm VAT)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

const StepItem = ({ icon, label, active }: { icon: any, label: string, active: boolean }) => (
  <div className={`flex flex-col items-center gap-1 transition-all ${active ? 'scale-110' : 'opacity-40'}`}>
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border-2 transition-all ${active ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-400'}`}>
      {icon}
    </div>
    <span className={`text-[10px] font-black uppercase hidden md:block ${active ? 'text-blue-600' : 'text-slate-400'}`}>{label}</span>
  </div>
);