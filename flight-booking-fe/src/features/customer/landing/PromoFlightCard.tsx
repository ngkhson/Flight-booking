import { Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Định nghĩa khuôn mẫu dữ liệu cho 1 chuyến bay khuyến mãi
export interface PromoFlight {
  id: string;
  origin: string;
  destination: string;
  date: string;
  price: number;
  originalPrice: number;
  airline: string;
  imageUrl: string;
}

// Component Thẻ chuyến bay nhận vào props là thông tin chuyến bay (flight)
export const PromoFlightCard = ({ flight }: { flight: PromoFlight }) => {
  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-slate-200 group cursor-pointer">
      {/* Phần Hình ảnh địa điểm */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={flight.imageUrl}
          alt={flight.destination}
          className="w-full h-48 object-cover rounded-t-xl"
          onError={(e) => {
            // Nếu ảnh gốc lỗi, nhảy về ảnh mặc định
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80';
          }}
        />
        <Badge className="absolute top-3 right-3 bg-red-500 text-white hover:bg-red-600 border-none shadow-md">
          Giảm {(100 - (flight.price / flight.originalPrice) * 100).toFixed(0)}%
        </Badge>
        <Badge className="absolute top-3 left-3 bg-white/90 text-slate-800 hover:bg-white border-none shadow-md backdrop-blur-sm">
          {flight.airline}
        </Badge>
      </div>

      {/* Phần Thông tin chi tiết */}
      <CardContent className="p-5">
        <h4 className="text-xl font-bold text-slate-800 mb-1">
          {flight.origin} ✈ {flight.destination}
        </h4>

        <div className="flex items-center text-slate-500 text-sm mt-2 mb-4">
          <Calendar className="w-4 h-4 mr-2 text-blue-500" />
          <span>
            Khởi hành: {new Date(flight.date).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })}
          </span>
        </div>

        <div className="flex items-end justify-between mt-auto pt-4 border-t border-slate-100">
          <div>
            <p className="text-xs text-slate-400 line-through mb-0.5">
              {flight.originalPrice.toLocaleString('vi-VN')} VND
            </p>
            <p className="text-xl font-extrabold text-blue-600">
              {flight.price.toLocaleString('vi-VN')} <span className="text-sm font-normal text-slate-500">VND</span>
            </p>
          </div>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 font-semibold shadow-md">
            Đặt ngay
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};