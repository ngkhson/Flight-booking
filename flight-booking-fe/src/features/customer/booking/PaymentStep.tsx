import { useState } from 'react';
import { useSelector } from 'react-redux';
import { type RootState } from '@/store/store';
import axiosClient from '@/api/axiosClient';
import { bookingApi } from '@/api/bookingApi'; // Đảm bảo import API này
import { Button } from '@/components/ui/button';
import { CreditCard, ShieldCheck, Loader2, Plane, ArrowDownUp, User } from 'lucide-react';
import { AlertCircle } from 'lucide-react';

interface PaymentStepProps {
  outboundFlight?: any;
  returnFlight?: any;
  isRoundTrip?: boolean;
  finalAmount: number;
}

export const PaymentStep = ({ outboundFlight, returnFlight, isRoundTrip, finalAmount }: PaymentStepProps) => {
  // Lấy data từ Redux để chuẩn bị payload
  const { contactInfo, passengers, addons } = useSelector((state: RootState) => state.booking);

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCreateBookingAndPay = async () => {
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      // 1. FORMAT LẠI DATA HÀNH KHÁCH VÀ DỊCH VỤ
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
        segmentNo: 1
      }));

      // 👇 2. ĐƯA PAYLOAD VỀ ĐÚNG CHUẨN BACKEND YÊU CẦU
      const outboundPayload = {
        contactName: contactInfo?.fullName || contactInfo?.contactName || passengers[0]?.fullName || "Khách hàng",
        contactPhone: contactInfo?.phone || contactInfo?.contactPhone || "0999999999",
        contactEmail: contactInfo?.email || contactInfo?.contactEmail || "email@example.com",
        currency: "VND",
        promotionCode: "",
        // Đưa flightId vào mảng flights giống như bạn đã từng làm thành công ở ServiceSelection
        flights: [
          {
            flightId: outboundFlight.id || outboundFlight.flightId || "",
            flightClassId: outboundFlight.selectedClassInfo?.id || outboundFlight.classId || ""
          }
        ],
        passengers: mappedPassengers,
        bookingAncillaries: mappedAncillaries
      };

      console.log("👉 Payload Chiều ĐI:", JSON.stringify(outboundPayload, null, 2));
      const reqOutbound = bookingApi.createBooking(outboundPayload);
      let reqReturn = null;

      // 👇 3. PAYLOAD CHIỀU VỀ (Nếu có)
      if (isRoundTrip && returnFlight) {
        const returnPayload = {
          contactName: contactInfo?.fullName || contactInfo?.contactName || passengers[0]?.fullName || "Khách hàng",
          contactPhone: contactInfo?.phone || contactInfo?.contactPhone || "0999999999",
          contactEmail: contactInfo?.email || contactInfo?.contactEmail || "email@example.com",
          currency: "VND",
          promotionCode: "",
          flights: [
            {
              flightId: returnFlight.id || returnFlight.flightId || "",
              flightClassId: returnFlight.selectedClassInfo?.id || returnFlight.classId || ""
            }
          ],
          passengers: mappedPassengers,
          bookingAncillaries: [] // Tạm để rỗng dịch vụ chiều về
        };
        console.log("👉 Payload Chiều VỀ:", JSON.stringify(returnPayload, null, 2));
        reqReturn = bookingApi.createBooking(returnPayload);
      }

      // 4. BẮN API SONG SONG VÀ XỬ LÝ VNPay
      const responses = await Promise.all([reqOutbound, reqReturn].filter(Boolean));

      const primaryBooking: any = responses[0];
      const secondaryBooking: any = responses[1]; // Lấy thêm data vé về

      const mainBookingId = primaryBooking?.result?.id || primaryBooking?.id;
      const returnBookingId = secondaryBooking?.result?.id || secondaryBooking?.id;

      if (!mainBookingId) {
        throw new Error("Không lấy được mã đặt chỗ từ Server.");
      }

      // 👇 BỔ SUNG LẠI ĐOẠN NÀY: GHÉP 2 ID VÉ BẰNG DẤU PHẨY 👇
      const combinedBookingIds = isRoundTrip && returnBookingId
        ? `${mainBookingId},${returnBookingId}`
        : mainBookingId;

      console.log(`👉 Đang tạo link VNPay cho các vé: ${combinedBookingIds}`);

      const vnpayRes: any = await axiosClient.get('/payments/create-url', {
        params: {
          bookingId: combinedBookingIds, // 👈 Truyền chuỗi ID ghép vào đây
          amount: finalAmount
          // LƯU Ý: Không cần truyền orderInfo ở đây nữa vì Backend Java của bạn đã tự tạo chữ THANHTOAN_VE_PNR1_PNR2 rồi!
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

  // Fallback an toàn nếu chưa chọn chuyến bay
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

        <div className="bg-slate-50 p-5 rounded-xl mb-8 border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Tóm tắt hành trình</h3>

          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <Plane size={16} className="text-slate-400" />
              <span className="text-slate-600 text-sm">Chiều đi:</span>
            </div>
            <span className="font-bold text-slate-800">{outboundFlight?.flightCode || outboundFlight?.flightNumber}</span>
          </div>

          {isRoundTrip && returnFlight && (
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <ArrowDownUp size={16} className="text-slate-400" />
                <span className="text-slate-600 text-sm">Chiều về:</span>
              </div>
              <span className="font-bold text-slate-800">{returnFlight?.flightCode || returnFlight?.flightNumber}</span>
            </div>
          )}

          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <User size={16} className="text-slate-400" />
              <span className="text-slate-600 text-sm">Hành khách:</span>
            </div>
            <span className="font-bold text-slate-800">{contactInfo?.fullName || "Khách"}</span>
          </div>

          <div className="flex justify-between text-xl border-t border-slate-200 pt-4 mt-2">
            <span className="font-bold text-slate-800">Tổng cần thanh toán:</span>
            <span className="font-black text-orange-500">
              {finalAmount.toLocaleString()} đ
            </span>
          </div>
        </div>

        <Button
          onClick={handleCreateBookingAndPay}
          disabled={isProcessing}
          className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-lg font-bold rounded-xl shadow-lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="animate-spin mr-2" /> Đang khởi tạo giao dịch...
            </>
          ) : (
            "Thanh toán an toàn ngay"
          )}
        </Button>

        <div className="mt-5 flex items-center justify-center gap-2 text-green-600 text-xs font-medium bg-green-50 py-2 rounded-lg">
          <ShieldCheck size={16} />
          Thông tin của bạn được mã hóa an toàn 256-bit
        </div>
      </div>
    </div>
  );
};