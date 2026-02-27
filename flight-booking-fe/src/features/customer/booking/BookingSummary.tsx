import { useSelector } from 'react-redux';
import { type RootState } from '@/store/store';
import { Plane, Users, Luggage } from 'lucide-react';

export const BookingSummary = () => {
  // Lấy dữ liệu từ Redux
  const { passengers, addons } = useSelector((state: RootState) => state.booking);

  // VÌ CHƯA CÓ API BACKEND, CHÚNG TA GIẢ LẬP GIÁ VÉ CƠ BẢN LÀ 1.850.000đ
  const FLIGHT_PRICE = 1850000;
  
  // Tính toán
  const passengerCount = passengers.length > 0 ? passengers.length : 1;
  const flightTotal = FLIGHT_PRICE * passengerCount;
  
  // Tính tổng tiền hành lý (Lấy giá gói hành lý nhân với số lượng hành khách)
  const addonPrice = addons.length > 0 ? addons[0].price : 0;
  const addonsTotal = addonPrice * passengerCount;

  const grandTotal = flightTotal + addonsTotal;

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 sticky top-4">
      <h3 className="font-bold text-lg text-slate-800 border-b pb-3 mb-4">Tóm tắt chuyến bay</h3>
      
      {/* Thông tin chuyến bay */}
      <div className="mb-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2 font-semibold text-slate-800 mb-2">
          <Plane className="w-4 h-4 text-blue-600" />
          Hà Nội (HAN) ✈ Hồ Chí Minh (SGN)
        </div>
        <p className="text-sm text-slate-500">Khởi hành: 08:00 - 10:10</p>
        <p className="text-sm text-slate-500">Vietnam Airlines • Phổ thông</p>
      </div>

      {/* Chi tiết giá */}
      <div className="space-y-3 mb-4 pb-4 border-b border-slate-100 text-sm">
        <div className="flex justify-between items-center">
          <span className="flex items-center text-slate-600">
            <Users className="w-4 h-4 mr-2" />
            Vé máy bay (x{passengerCount})
          </span>
          <span className="font-semibold text-slate-800">{flightTotal.toLocaleString('vi-VN')} đ</span>
        </div>
        
        {addonsTotal > 0 && (
          <div className="flex justify-between items-center text-blue-700">
            <span className="flex items-center">
              <Luggage className="w-4 h-4 mr-2" />
              Hành lý (x{passengerCount})
            </span>
            <span className="font-semibold">{addonsTotal.toLocaleString('vi-VN')} đ</span>
          </div>
        )}
        
        <div className="flex justify-between items-center text-slate-500 text-xs">
          <span>Thuế & Phí dịch vụ</span>
          <span>Đã bao gồm</span>
        </div>
      </div>

      {/* Tổng cộng */}
      <div className="flex justify-between items-end">
        <span className="font-bold text-slate-800">Tổng thanh toán:</span>
        <span className="text-2xl font-extrabold text-orange-500">
          {grandTotal.toLocaleString('vi-VN')} <span className="text-sm font-normal text-slate-500 underline decoration-dotted">đ</span>
        </span>
      </div>
    </div>
  );
};