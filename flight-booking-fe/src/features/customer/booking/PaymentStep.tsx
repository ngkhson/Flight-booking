import { useState } from 'react';
import { useSelector } from 'react-redux';
import { type RootState } from '@/store/store';
import axiosClient from '@/api/axiosClient';
import { bookingApi } from '@/api/bookingApi';
import { Button } from '@/components/ui/button';
import { CreditCard, ShieldCheck, Loader2, Plane, ArrowDownUp, User, Ticket, Calendar } from 'lucide-react';
import { AlertCircle } from 'lucide-react';

interface PaymentStepProps {
  outboundFlight?: any;
  returnFlight?: any;
  isRoundTrip?: boolean;
  finalAmount: number;
}

export const PaymentStep = ({ outboundFlight, returnFlight, isRoundTrip, finalAmount }: PaymentStepProps) => {
  const { searchConfigs, contactInfo, passengers, addons } = useSelector((state: RootState) => state.booking);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 👇 HÀM BÓC TÁCH DỮ LIỆU ĐỒNG NHẤT VỚI SIDEBAR 👇
  const extractFlightInfo = (flight: any, fallbackDate: string | undefined, isReturn: boolean = false) => {
    // Ưu tiên lấy origin/dest từ searchConfigs để chống sai lệch, nếu không có mới lấy từ flight
    const origin = isReturn 
      ? ((searchConfigs as any)?.destination || flight?.origin || flight?.departureAirport || '---')
      : ((searchConfigs as any)?.origin || flight?.origin || flight?.departureAirport || '---');
      
    const dest = isReturn 
      ? ((searchConfigs as any)?.origin || flight?.destination || flight?.arrivalAirport || '---')
      : ((searchConfigs as any)?.destination || flight?.destination || flight?.arrivalAirport || '---');
    
    const code = flight?.flightCode || flight?.flightNumber || flight?.flight?.flightNumber || '---';
    const cls = flight?.selectedClassName || flight?.selectedClassInfo?.className || flight?.classType || 'ECONOMY';
    
    // Tách Giờ và Ngày
    const rawTime = flight?.departureTime || flight?.flight?.departureTime || fallbackDate;
    let time = '--:--';
    let date = '--/--/----';
    
    if (rawTime && typeof rawTime === 'string') {
      if (rawTime.includes('T')) {
        const [d, t] = rawTime.split('T');
        const [y, m, day] = d.split('-');
        const [h, min] = t.split(':');
        time = `${h}:${min}`;
        date = `${day}/${m}/${y}`;
      } else if (rawTime.includes('-')) {
        const [y, m, day] = rawTime.split('-');
        date = `${day}/${m}/${y}`;
      } else if (rawTime.includes(':')) {
        // Trường hợp Backend chỉ trả về Giờ (VD: "15:20")
        time = rawTime;
        // Lấy ngày từ fallbackDate (searchConfigs)
        if (fallbackDate && fallbackDate.includes('-')) {
          const [y, m, day] = fallbackDate.split('-');
          date = `${day}/${m}/${y}`;
        }
      }
    }
    return { origin, dest, code, cls: cls.replace('_', ' '), time, date };
  };

  // Áp dụng hàm bóc tách cho 2 lượt
  const outInfo = extractFlightInfo(outboundFlight, (searchConfigs as any)?.date, false);
  const retInfo = extractFlightInfo(returnFlight, (searchConfigs as any)?.returnDate, true);


  const handleCreateBookingAndPay = async () => {
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const mappedPassengers = passengers.map((p: any) => ({
        firstName: p.fullName?.split(' ').slice(0, -1).join(' ') || p.fullName || "Nguyễn",
        lastName: p.fullName?.split(' ').slice(-1).join(' ') || p.fullName || "A",
        dateOfBirth: p.dob || "2000-01-01",
        gender: p.gender === "Nam" ? "MALE" : "FEMALE",
        type: "ADULT"
      }));

      const mappedAncillaries = addons.map((a: any) => ({
        catalogId: a.service.id,
        passengerIndex: a.passengerIndex,
        segmentNo: a.segmentNo || 1 
      }));

      const flightList = [];
      
      if (outboundFlight) {
        flightList.push({
          flightId: outboundFlight.id || outboundFlight.flightId || "",
          flightClassId: outboundFlight.selectedClassInfo?.id || outboundFlight.classId || ""
        });
      }

      if (isRoundTrip && returnFlight) {
        flightList.push({
          flightId: returnFlight.id || returnFlight.flightId || "",
          flightClassId: returnFlight.selectedClassInfo?.id || returnFlight.classId || ""
        });
      }

      const bookingPayload = {
        contactName: contactInfo?.fullName || contactInfo?.contactName || passengers[0]?.fullName || "Khách hàng",
        contactPhone: contactInfo?.phone || contactInfo?.contactPhone || "0999999999",
        contactEmail: contactInfo?.email || contactInfo?.contactEmail || "email@example.com",
        currency: "VND",
        promotionCode: "", 
        flights: flightList, 
        passengers: mappedPassengers,
        bookingAncillaries: mappedAncillaries
      };

      console.log("👉 Đang tạo Đơn đặt vé (1 PNR chung)...", bookingPayload);
      
      const response: any = await bookingApi.createBooking(bookingPayload);
      
      const mainBookingId = response?.result?.id || response?.id;
      const pnrCode = response?.result?.pnrCode || response?.pnrCode;

      if (!mainBookingId) {
        throw new Error("Không lấy được mã đặt chỗ từ Server.");
      }

      console.log(`👉 Đang tạo link thanh toán VNPay cho PNR: ${pnrCode}`);
      const vnpayRes: any = await axiosClient.get('/payments/create-url', {
        params: {
          bookingId: mainBookingId 
        }
      });


      if (vnpayRes.result) {
        window.location.href = vnpayRes.result;
      } else {
        throw new Error("Không thể tạo link thanh toán VNPay.");
      }

    } catch (error: any) {
      console.error("Lỗi quá trình thanh toán:", error);
      setErrorMsg(error.response?.data?.message || "Đã xảy ra lỗi, vui lòng thử lại!");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!outboundFlight && !finalAmount) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500 bg-white border rounded-2xl shadow-sm">
        <AlertCircle className="w-12 h-12 mb-4 text-orange-400" />
        <p className="font-bold text-lg text-slate-700">Lỗi dữ liệu thanh toán.</p>
        <p className="text-sm mt-2">Vui lòng quay lại tìm chuyến bay mới.</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto bg-white border rounded-2xl shadow-sm overflow-hidden">
      <div className="bg-slate-800 p-6 text-white text-center">
        <h2 className="text-xl font-bold mb-1">Xác nhận thanh toán</h2>
        <p className="text-slate-300 text-sm">Vui lòng kiểm tra kỹ thông tin trước khi thanh toán</p>
      </div>

      <div className="p-6">
        {errorMsg && (
          <div className="p-4 mb-6 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm flex gap-3 items-center">
            <AlertCircle size={18} className="shrink-0" />
            {errorMsg}
          </div>
        )}

        <div className="space-y-4 mb-8">
          <div className="p-4 border-2 border-blue-600 bg-blue-50 rounded-xl flex items-center gap-4 cursor-pointer relative overflow-hidden group hover:bg-blue-100 transition-colors">
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] px-2 py-1 font-bold rounded-bl-lg">KHUYÊN DÙNG</div>
            <CreditCard className="text-blue-600 w-8 h-8" />
            <div className="flex-1">
              <p className="font-bold text-blue-900">Ví VNPay / Thẻ ATM</p>
              <p className="text-xs text-blue-600/80">Quét mã QR, ATM, Thẻ quốc tế Visa/Master</p>
            </div>
            <div className="w-5 h-5 rounded-full border-4 border-blue-600 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-blue-600"></div>
            </div>
          </div>
        </div>

        {/* =======================================
            BẢNG TÓM TẮT HÀNH TRÌNH ĐỒNG BỘ 100% VỚI SIDEBAR
            ======================================= */}
        <div className="bg-slate-50 p-5 rounded-xl mb-8 border border-slate-100 shadow-inner">
          <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-200 pb-3 flex items-center gap-2">
            <Ticket className="text-blue-500 w-5 h-5" /> Tóm tắt hành trình
          </h3>
          
          {/* LƯỢT ĐI */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Plane size={18} className="text-blue-500" />
                <span className="font-bold text-slate-800 uppercase text-sm tracking-wide">
                  {outInfo.origin} ➔ {outInfo.dest}
                </span>
              </div>
              {isRoundTrip && <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded">LƯỢT ĐI</span>}
            </div>
            
            <div className="bg-white p-3 rounded-lg border border-slate-100 flex justify-between items-center ml-6">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Chuyến bay</p>
                <p className="text-sm font-bold text-slate-700">{outInfo.code} <span className="text-[10px] font-normal ml-1">({outInfo.cls})</span></p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5 flex items-center justify-end gap-1"><Calendar size={12}/> Khởi hành</p>
                <p className="text-sm font-bold text-blue-600">
                  {outInfo.time} | {outInfo.date}
                </p>
              </div>
            </div>
          </div>

          {/* LƯỢT VỀ */}
          {isRoundTrip && returnFlight && (
            <div className="mb-4 pt-4 border-t border-dashed border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ArrowDownUp size={18} className="text-orange-500" />
                  <span className="font-bold text-slate-800 uppercase text-sm tracking-wide">
                    {retInfo.origin} ➔ {retInfo.dest}
                  </span>
                </div>
                <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded">LƯỢT VỀ</span>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-100 flex justify-between items-center ml-6">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Chuyến bay</p>
                  <p className="text-sm font-bold text-slate-700">{retInfo.code} <span className="text-[10px] font-normal ml-1">({retInfo.cls})</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5 flex items-center justify-end gap-1"><Calendar size={12}/> Khởi hành</p>
                  <p className="text-sm font-bold text-orange-600">
                    {retInfo.time} | {retInfo.date}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-end border-t border-slate-200 pt-5 mt-4">
            <span className="font-bold text-slate-600 text-sm">Tổng cần thanh toán</span>
            <span className="font-black text-3xl text-orange-500 leading-none">
              {finalAmount.toLocaleString('vi-VN')} <span className="text-xl underline decoration-2">đ</span>
            </span>
          </div>
        </div>

        <Button
          onClick={handleCreateBookingAndPay}
          disabled={isProcessing}
          className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-lg font-bold rounded-xl shadow-lg transition-transform active:scale-95"
        >
          {isProcessing ? (
            <>
              <Loader2 className="animate-spin mr-2" /> Đang khởi tạo giao dịch...
            </>
          ) : (
            "Thanh toán an toàn ngay"
          )}
        </Button>
      </div>
    </div>
  );
};