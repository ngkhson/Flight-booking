import { useState } from 'react';
import { Plane, Clock, Luggage, Info, ChevronDown, ChevronUp, Armchair } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
// Import cả action và interface từ slice
import { selectFlight, type SelectedFlightInfo } from '@/store/bookingSlice';

export interface FlightClass {
  id: string;
  className: string;
  basePrice: number;
  availableSeats: number;
}

export interface Flight {
  id: string;          
  flightCode: string;
  airline: string;
  airlineLogo: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  durationMinutes: number;
  stops: number;
  originCode: string;
  destinationCode: string;
  price: number;
  aircraft: string;
  classes: FlightClass[];
}

export const FlightCard = ({ flight }: { flight: Flight }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  // Hàm xử lý khi nhấn chọn một hạng ghế cụ thể
  const handleSelectClass = (selectedClass: FlightClass) => {
  const bookingData: SelectedFlightInfo = {
    flightId: flight.id,           // Gửi UUID của chuyến bay
    flightCode: flight.flightCode,
    classId: selectedClass.id,     // Gửi UUID của hạng vé
    selectedClassName: selectedClass.className,
    finalPrice: selectedClass.basePrice
  };

  dispatch(selectFlight(bookingData)); 
  navigate('/booking'); 
};

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all mb-4 overflow-hidden">
      <div className="p-5 flex flex-col lg:flex-row items-center justify-between gap-6">
        
        {/* Logo & Airline */}
        <div className="flex items-center gap-3 w-full lg:w-1/4">
          <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center font-bold text-blue-600 border border-blue-100">
            {flight.airlineLogo}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-800">{flight.airline}</span>
            <span className="text-xs text-slate-500">{flight.flightCode} • {flight.aircraft}</span>
          </div>
        </div>

        {/* Schedule */}
        <div className="flex items-center justify-center gap-6 w-full lg:w-2/4">
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-900">{flight.departureTime}</p>
            <p className="text-sm font-semibold text-slate-500 uppercase">{flight.originCode}</p>
          </div>
          
          <div className="flex flex-col items-center px-2 w-40">
            <span className="text-[10px] font-medium text-slate-400 mb-1 uppercase tracking-wider">{flight.duration}</span>
            <div className="w-full h-[1.5px] bg-slate-200 relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                <Plane className="text-blue-500 w-4 h-4" />
              </div>
            </div>
            <span className="text-[10px] text-blue-500 mt-1 font-bold italic">Bay thẳng</span>
          </div>

          <div className="text-left">
            <p className="text-2xl font-bold text-slate-900">{flight.arrivalTime}</p>
            <p className="text-sm font-semibold text-slate-500 uppercase">{flight.destinationCode}</p>
          </div>
        </div>

        {/* Price & Action */}
        <div className="flex flex-col items-end w-full lg:w-1/4 lg:pl-6 lg:border-l border-slate-100">
          <p className="text-xs text-slate-500">Giá chỉ từ</p>
          <p className="text-2xl font-black text-orange-500">
            {flight.price.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-400">đ</span>
          </p>
          <Button 
            onClick={() => setIsExpanded(!isExpanded)}
            className={`w-full mt-2 font-bold transition-all ${
              isExpanded ? "bg-slate-800 hover:bg-slate-900" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isExpanded ? 'Đóng' : 'Chọn chuyến'}
            {isExpanded ? <ChevronUp className="ml-2 w-4 h-4" /> : <ChevronDown className="ml-2 w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Seat Classes Dropdown */}
      {isExpanded && (
        <div className="bg-slate-50 border-t border-slate-100 p-5 animate-in slide-in-from-top duration-300">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-xs text-slate-600">
             <div className="flex items-center gap-2"><Clock size={14}/> {flight.duration}</div>
             <div className="flex items-center gap-2"><Luggage size={14}/> 7kg xách tay</div>
             <div className="flex items-center gap-2"><Info size={14}/> Hỗ trợ đổi vé</div>
             <div className="flex items-center gap-2"><Armchair size={14}/> Hạng ghế linh hoạt</div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {flight.classes.map((cls, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-lg p-4 hover:border-blue-400 transition-all shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase leading-none">
                    {cls.className.replace('_', ' ')}
                  </span>
                  <p className="text-lg font-extrabold text-slate-800 mt-2">
                    {cls.basePrice.toLocaleString('vi-VN')} đ
                  </p>
                  <p className="text-[10px] text-slate-400 italic">Còn {cls.availableSeats} chỗ</p>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => handleSelectClass(cls)}
                  className="mt-4 w-full bg-slate-50 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-100 font-bold text-xs"
                >
                  Chọn
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};