import { Plane, Clock, Luggage, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
// 1. Thêm import này lên đầu file
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectFlight } from '@/store/bookingSlice';

// 1. Khuôn mẫu dữ liệu cho một chuyến bay
export interface Flight {
  id: string;
  airline: string;
  airlineLogo: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  originCode: string; // VD: HAN
  destinationCode: string; // VD: SGN
  price: number;
  aircraft: string; // VD: Airbus A321
  baggage: string; // VD: 20kg ký gửi, 7kg xách tay
  flightClass: string; // VD: Phổ thông (Eco)
}

// 2. Giao diện thẻ chuyến bay
export const FlightCard = ({ flight }: { flight: Flight }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSelectFlight = () => {
    dispatch(selectFlight(flight.id)); // Lưu ID vào Redux
    navigate('/booking'); // Chuyển sang trang Đặt vé
  };
  return (
    <Accordion type="single" collapsible className="w-full bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow mb-4">
      <AccordionItem value="details" className="border-none">
        
        {/* PHẦN HIỂN THỊ CHÍNH (Luôn hiện) */}
        <div className="p-5 flex flex-col lg:flex-row items-center justify-between gap-6">
          
          {/* 2.1 Logo & Hãng bay */}
          <div className="flex items-center gap-3 w-full lg:w-1/4">
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-blue-600 border border-slate-200">
              {flight.airlineLogo}
            </div>
            <span className="font-semibold text-slate-800">{flight.airline}</span>
          </div>

          {/* 2.2 Thời gian & Hành trình */}
          <div className="flex items-center justify-center gap-4 w-full lg:w-2/4">
            <div className="text-right">
              <p className="text-xl font-bold text-slate-900">{flight.departureTime}</p>
              <p className="text-sm text-slate-500">{flight.originCode}</p>
            </div>
            
            <div className="flex flex-col items-center px-4 w-32">
              <span className="text-xs text-slate-400 mb-1">{flight.duration}</span>
              <div className="w-full h-[1px] bg-slate-300 relative">
                <Plane className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 bg-white px-1" />
              </div>
              <span className="text-xs text-blue-500 mt-1">Bay thẳng</span>
            </div>

            <div className="text-left">
              <p className="text-xl font-bold text-slate-900">{flight.arrivalTime}</p>
              <p className="text-sm text-slate-500">{flight.destinationCode}</p>
            </div>
          </div>

          {/* 2.3 Giá tiền & Nút Đặt */}
          <div className="flex flex-col items-end w-full lg:w-1/4">
            <p className="text-2xl font-extrabold text-orange-500">
              {flight.price.toLocaleString('vi-VN')} <span className="text-sm font-normal text-slate-500 underline decoration-dotted">đ</span>
            </p>
            <Button onClick={handleSelectFlight} className="w-full mt-2 bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-md">
              Chọn vé
            </Button>
          </div>
        </div>

        {/* Nút bấm để xổ xuống xem chi tiết */}
        <div className="px-5 pb-2">
          <AccordionTrigger className="py-2 text-sm text-blue-600 hover:no-underline hover:text-blue-800">
            Xem chi tiết chuyến bay
          </AccordionTrigger>
        </div>

        {/* PHẦN CHI TIẾT (Ẩn/Hiện khi bấm) */}
        <AccordionContent className="bg-slate-50 p-5 border-t border-slate-100 rounded-b-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
            <div className="flex items-start gap-2">
              <Plane className="w-5 h-5 text-slate-400" />
              <div>
                <p className="font-semibold">Máy bay: {flight.aircraft}</p>
                <p className="text-slate-500">Hạng vé: {flight.flightClass}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Luggage className="w-5 h-5 text-slate-400" />
              <div>
                <p className="font-semibold">Hành lý bao gồm</p>
                <p className="text-slate-500">{flight.baggage}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="w-5 h-5 text-slate-400" />
              <div>
                <p className="font-semibold">Thời gian bay dự kiến</p>
                <p className="text-slate-500">{flight.duration} (Không dừng)</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-slate-400" />
              <div>
                <p className="font-semibold">Chính sách hoàn hủy</p>
                <p className="text-slate-500">Thu phí 500.000đ khi đổi chuyến.</p>
              </div>
            </div>
          </div>
        </AccordionContent>
        
      </AccordionItem>
    </Accordion>
  );
};