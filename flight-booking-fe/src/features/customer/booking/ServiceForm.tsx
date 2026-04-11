import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Luggage, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Dữ liệu ảo (Mock) cho các gói hành lý
const BAGGAGE_OPTIONS = [
  { id: 'bag_0', label: 'Không mang hành lý ký gửi', weight: '0kg', price: 0 },
  { id: 'bag_20', label: 'Gói Tiết Kiệm', weight: '20kg', price: 250000 },
  { id: 'bag_30', label: 'Gói Tiêu Chuẩn', weight: '30kg', price: 400000 },
  { id: 'bag_40', label: 'Gói Gia Đình', weight: '40kg', price: 550000 },
];

export const ServiceForm = () => {
  const dispatch = useDispatch();
  
  // Trạng thái lưu trữ gói hành lý đang được chọn (Mặc định chọn gói 0kg)
  const [selectedBaggage, setSelectedBaggage] = useState(BAGGAGE_OPTIONS[0]);

  const handleContinue = () => {
    // Lưu gói hành lý vào Redux và chuyển sang Bước 3
    import("@/store/bookingSlice").then((module) => {
      dispatch(module.saveAddons([selectedBaggage]));
    });
  };

  const handleBack = () => {
    // Gọi action lùi lại Bước 1
    import("@/store/bookingSlice").then((module) => {
      dispatch(module.prevStep());
    });
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h3 className="text-xl font-bold text-slate-800 mb-6 border-b pb-4 flex items-center">
        <Luggage className="w-6 h-6 mr-2 text-blue-600" />
        Hành lý ký gửi
      </h3>
      
      {/* Lưới hiển thị các thẻ Hành lý */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {BAGGAGE_OPTIONS.map((option) => {
          const isSelected = selectedBaggage.id === option.id;
          
          return (
            <div 
              key={option.id}
              onClick={() => setSelectedBaggage(option)}
              className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                isSelected 
                  ? 'border-blue-600 bg-blue-50 shadow-md transform scale-[1.02]' 
                  : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
              }`}
            >
              {/* Icon Tích xanh hiển thị khi được chọn */}
              {isSelected && (
                <CheckCircle2 className="absolute top-4 right-4 text-blue-600 w-6 h-6" />
              )}
              
              <h4 className="font-bold text-slate-800 text-lg">{option.weight}</h4>
              <p className="text-sm text-slate-500 mb-3">{option.label}</p>
              <p className={`font-extrabold ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>
                {option.price === 0 ? 'Miễn phí' : `+ ${option.price.toLocaleString('vi-VN')} đ`}
              </p>
            </div>
          );
        })}
      </div>

      {/* Các nút điều hướng */}
      <div className="flex justify-between items-center pt-4 border-t border-slate-100">
        <Button variant="ghost" onClick={handleBack} className="text-slate-500 hover:text-slate-800">
          Quay lại Bước 1
        </Button>
        <Button onClick={handleContinue} className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-6 text-lg shadow-lg">
          Tiếp tục: Thanh Toán
        </Button>
      </div>
    </div>
  );
};