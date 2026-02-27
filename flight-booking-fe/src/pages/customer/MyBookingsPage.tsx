import { Plane, CalendarDays, Ticket, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Dữ liệu ảo: Lịch sử đặt vé của khách hàng
const MOCK_HISTORY = [
  {
    bookingCode: "VNP88X2",
    origin: "Hà Nội (HAN)",
    destination: "Hồ Chí Minh (SGN)",
    date: "15/05/2026",
    totalAmount: 2250000,
    status: "PAID", // Đã thanh toán
    airline: "Vietnam Airlines",
  },
  {
    bookingCode: "VJ99Y3",
    origin: "Đà Nẵng (DAD)",
    destination: "Hà Nội (HAN)",
    date: "20/06/2026",
    totalAmount: 1150000,
    status: "PENDING", // Chờ thanh toán
    airline: "Vietjet Air",
  },
  {
    bookingCode: "BB44Z1",
    origin: "Phú Quốc (PQC)",
    destination: "Hồ Chí Minh (SGN)",
    date: "10/04/2026",
    totalAmount: 1800000,
    status: "CANCELLED", // Đã hủy
    airline: "Bamboo Airways",
  }
];

export const MyBookingsPage = () => {
  // Hàm trợ giúp để render màu sắc Badge dựa trên trạng thái
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <Badge className="bg-green-500 hover:bg-green-600 text-white border-none shadow-sm px-3 py-1 text-sm">Đã thanh toán</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white border-none shadow-sm px-3 py-1 text-sm">Chờ thanh toán</Badge>;
      case "CANCELLED":
        return <Badge className="bg-red-500 hover:bg-red-600 text-white border-none shadow-sm px-3 py-1 text-sm">Đã hủy</Badge>;
      default:
        return <Badge>Không xác định</Badge>;
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20 pt-10">
      <div className="container mx-auto px-4 max-w-4xl">
        
        <div className="flex items-center gap-3 mb-8">
          <Ticket className="w-8 h-8 text-blue-600" />
          <h2 className="text-3xl font-extrabold text-slate-800">Vé của tôi</h2>
        </div>

        <div className="space-y-6">
          {MOCK_HISTORY.map((booking) => (
            <div key={booking.bookingCode} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
              {/* Header của thẻ vé */}
              <div className="bg-slate-100/50 px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500 font-medium">Mã đặt chỗ:</span>
                  <span className="font-bold text-slate-800 tracking-wider bg-slate-200 px-2 py-0.5 rounded text-sm">
                    {booking.bookingCode}
                  </span>
                </div>
                <div>{renderStatusBadge(booking.status)}</div>
              </div>

              {/* Nội dung chính của thẻ vé */}
              <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                
                {/* Hành trình */}
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-4 mb-2">
                    <span className="font-bold text-lg text-slate-800">{booking.origin}</span>
                    <ArrowRight className="w-5 h-5 text-slate-400" />
                    <span className="font-bold text-lg text-slate-800">{booking.destination}</span>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm text-slate-600">
                    <span className="flex items-center">
                      <CalendarDays className="w-4 h-4 mr-2 text-slate-400" />
                      {booking.date}
                    </span>
                    <span className="flex items-center">
                      <Plane className="w-4 h-4 mr-2 text-slate-400" />
                      {booking.airline}
                    </span>
                  </div>
                </div>

                {/* Giá tiền & Hành động */}
                <div className="flex flex-col md:items-end w-full md:w-auto gap-3">
                  <div className="text-right w-full">
                    <p className="text-sm text-slate-500 mb-1">Tổng tiền</p>
                    <p className="text-xl font-extrabold text-orange-500">
                      {booking.totalAmount.toLocaleString('vi-VN')} đ
                    </p>
                  </div>
                  <Button variant="outline" className="w-full md:w-auto border-blue-600 text-blue-600 hover:bg-blue-50">
                    Xem chi tiết
                  </Button>
                </div>

              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};