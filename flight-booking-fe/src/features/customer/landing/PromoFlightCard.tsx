import React, { useState, useMemo } from 'react';
import { Calendar, Clock, Users, X, Check, Tag, Plane } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { getAirportImage, DEFAULT_FLIGHT_IMAGE } from '@/constants/airportImages';
import { AIRPORT_MAPPING } from '@/constants/airportData';

export interface PromoFlight {
  id: string;
  origin: string;
  destination: string;
  date: string;
  price: number;
  originalPrice: number;
  airline: string;
  imageUrl: string;
  classes?: any[]; // Mảng hạng vé từ API
}

export const PromoFlightCard = ({ flight }: { flight: PromoFlight }) => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [passengers, setPassengers] = useState({ adults: 1, children: 0, infants: 0 });

  // 👇 HÀM CHUYỂN ĐỔI MÃ SÂN BAY THÀNH TÊN THÀNH PHỐ 👇
  const getCityName = (code: string) => {
    if (!code) return '';
    const cleanCode = code.trim().toUpperCase();
    // Lấy tên thành phố từ mapping, nếu không có mã đó trong data thì trả về lại mã gốc để fallback
    return AIRPORT_MAPPING[cleanCode]?.city || code; 
  };

  // Lấy danh sách hạng vé từ API hoặc mặc định
  const availableClasses = useMemo(() => {
    return flight.classes && flight.classes.length > 0
      ? flight.classes
      : [{ className: 'ECONOMY', basePrice: flight.price }];
  }, [flight.classes, flight.price]);

  const [selectedClass, setSelectedClass] = useState(availableClasses[0].className);

  // Tính toán giá hiển thị trong Popup
  const priceInfo = useMemo(() => {
    const classData = availableClasses.find((c: any) => c.className === selectedClass);
    const unitPrice = classData?.basePrice || flight.price;
    const total = (unitPrice * passengers.adults) +
      (unitPrice * 0.75 * passengers.children) +
      (unitPrice * 0.1 * passengers.infants);
    return { unitPrice, total };
  }, [selectedClass, passengers, availableClasses]);

  const handleBooking = () => {
    const classInfo = availableClasses.find((c: any) => c.className === selectedClass);
    const stateData = {
      outboundFlight: {
        ...flight,
        selectedClassName: selectedClass,
        selectedClassInfo: { id: classInfo?.id, className: selectedClass, basePrice: priceInfo.unitPrice }
      },
      isRoundTrip: false,
      searchConfigs: {
        ...passengers,
        seatClass: selectedClass,
        origin: flight.origin,
        destination: flight.destination,
        date: flight.date
      }
    };
    navigate('/booking', { state: stateData });
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-slate-200 group cursor-pointer">
        <div className="relative h-48 overflow-hidden">
          <img
            src={flight.imageUrl || getAirportImage(flight.destination)}
            alt={flight.destination}
            className="w-full h-48 object-cover rounded-t-xl group-hover:scale-110 transition-transform duration-500"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== DEFAULT_FLIGHT_IMAGE) {
                target.src = DEFAULT_FLIGHT_IMAGE;
              }
            }}
          />
          <Badge className="absolute top-3 right-3 bg-red-500 text-white">
            Giảm {(100 - (flight.price / flight.originalPrice) * 100).toFixed(0)}%
          </Badge>
          <Badge className="absolute top-3 left-3 bg-white/90 text-slate-800 backdrop-blur-sm">
            {flight.airline}
          </Badge>

          {/* Cập nhật UI hiển thị trên ảnh */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4">
            <p className="text-[10px] text-white/80 font-bold uppercase tracking-widest">
              Từ {getCityName(flight.origin)}
            </p>
            <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">
              {getCityName(flight.destination)}
            </h3>
          </div>
        </div>

        <CardContent className="p-5">
          <h4 className="text-xl font-bold text-slate-800 mb-1 flex items-center gap-2">
            {getCityName(flight.origin)} <Plane size={16} className="text-blue-500" /> {getCityName(flight.destination)}
          </h4>
          <div className="flex items-center text-slate-500 text-sm mt-2 mb-4">
            <Calendar className="w-4 h-4 mr-2 text-blue-500" />
            <span>{new Date(flight.date).toLocaleDateString('vi-VN')}</span>
          </div>

          <div className="flex items-end justify-between mt-auto pt-4 border-t border-slate-100">
            <div>
              <p className="text-xs text-slate-400 line-through">{flight.originalPrice.toLocaleString()} VND</p>
              <p className="text-xl font-extrabold text-blue-600">{flight.price.toLocaleString()} VND</p>
            </div>
            <Button onClick={() => setShowModal(true)} size="sm" className="bg-blue-600 hover:bg-blue-700">Đặt ngay</Button>
          </div>
        </CardContent>
      </Card>

      {/* MODAL NÂNG CẤP */}
      {showModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl">Tùy chọn hành trình</h3>
                <X className="cursor-pointer text-slate-400" onClick={() => setShowModal(false)} />
              </div>

              {/* Thông tin chuyến bay */}
              <div className="flex gap-2 mb-6">
                <Badge variant="outline" className="flex gap-1 items-center border-blue-200 text-blue-600">
                  <Calendar size={12} /> {new Date(flight.date).toLocaleDateString('vi-VN')}
                </Badge>
                <Badge variant="outline" className="flex gap-1 items-center border-orange-200 text-orange-600">
                  <Clock size={12} /> {new Date(flight.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </Badge>
              </div>

              {/* 3 LOẠI KHÁCH */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <Counter label="Người lớn" val={passengers.adults} min={1} onChange={(v: number) => setPassengers({ ...passengers, adults: v })} />
                <Counter label="Trẻ em" val={passengers.children} min={0} onChange={(v: number) => setPassengers({ ...passengers, children: v })} />
                <Counter label="Em bé" val={passengers.infants} min={0} onChange={(v: number) => setPassengers({ ...passengers, infants: v })} />
              </div>

              {/* 4 HẠNG VÉ TỪ API */}
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-3 flex items-center gap-1"><Tag size={12} /> Hạng vé khả dụng</p>
              <div className="grid grid-cols-2 gap-2 mb-6">
                {availableClasses.map((cls: any) => (
                  <button key={cls.className} onClick={() => setSelectedClass(cls.className)}
                    className={`flex flex-col items-start p-3 rounded-xl border-2 transition-all ${selectedClass === cls.className ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-100 text-slate-500'
                      }`}>
                    <span className="text-[10px] font-bold uppercase">{cls.className.replace('_', ' ')}</span>
                    <span className="text-xs font-bold">{cls.basePrice.toLocaleString()}đ</span>
                  </button>
                ))}
              </div>

              <div className="bg-slate-900 rounded-2xl p-4 mb-4 text-white flex justify-between items-center">
                <span className="text-xs opacity-70">Tổng cộng ({passengers.adults + passengers.children + passengers.infants} khách)</span>
                <span className="text-xl font-black text-orange-400">{priceInfo.total.toLocaleString()} đ</span>
              </div>

              <Button onClick={handleBooking} className="w-full bg-blue-600 py-6 rounded-2xl font-bold text-lg">Xác nhận thanh toán</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const Counter = ({ label, val, min, onChange }: any) => (
  <div className="bg-slate-50 p-2 rounded-xl border text-center">
    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">{label}</p>
    <div className="flex items-center justify-between">
      <button onClick={() => val > min && onChange(val - 1)} className="w-6 h-6 bg-white rounded-full shadow-sm border">-</button>
      <span className="font-bold text-sm">{val}</span>
      <button onClick={() => onChange(val + 1)} className="w-6 h-6 bg-white rounded-full shadow-sm border">+</button>
    </div>
  </div>
);