import { useSelector, useDispatch } from 'react-redux';
import { type RootState } from '@/store/store';
import { Briefcase, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { saveAddons } from '@/store/bookingSlice';
import { BAGGAGE_OPTIONS } from '@/constants/baggage';

export const BaggageSelection = () => {
  const dispatch = useDispatch();
  const { passengers, selectedFlight } = useSelector((state: RootState) => state.booking);
  
  // Lưu lựa chọn hành lý: { indexHanhKhach: idGoiHanhLy }
  const [selections, setSelections] = useState<Record<number, string>>(
    passengers.reduce((acc, _, i) => ({ ...acc, [i]: 'bg-0' }), {})
  );

  const handleSelect = (passengerIndex: number, baggageId: string) => {
    setSelections(prev => ({ ...prev, [passengerIndex]: baggageId }));
  };

  const calculateAddonTotal = () => {
    return Object.values(selections).reduce((total, id) => {
      const option = BAGGAGE_OPTIONS.find(opt => opt.id === id);
      return total + (option?.price || 0);
    }, 0);
  };

  const handleConfirm = () => {
    const selectedAddons = Object.entries(selections).map(([index, id]) => ({
      passengerIndex: Number(index),
      baggage: BAGGAGE_OPTIONS.find(opt => opt.id === id)
    }));
    dispatch(saveAddons(selectedAddons));
  };

  return (
    <div className="space-y-8">
      <div className="bg-blue-50 p-4 rounded-lg flex items-center gap-3">
        <Briefcase className="text-blue-600" />
        <div>
          <h3 className="font-bold text-blue-900 text-lg">Hành lý ký gửi</h3>
          <p className="text-sm text-blue-700 font-medium">Mua trước để tiết kiệm lên đến 40% so với mua tại sân bay</p>
        </div>
      </div>

      <div className="space-y-6">
        {passengers.map((p, idx) => (
          <div key={idx} className="border rounded-xl p-5 bg-white shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                {idx + 1}
              </div>
              <span className="font-bold text-slate-800 uppercase">{p.fullName}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {BAGGAGE_OPTIONS.map((option) => {
                const isSelected = selections[idx] === option.id;
                return (
                  <div
                    key={option.id}
                    onClick={() => handleSelect(idx, option.id)}
                    className={`cursor-pointer p-4 rounded-lg border-2 transition-all flex flex-col justify-between h-24 ${
                      isSelected 
                        ? 'border-blue-600 bg-blue-50' 
                        : 'border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className={`text-sm font-bold ${isSelected ? 'text-blue-700' : 'text-slate-600'}`}>
                        {option.weight} kg
                      </span>
                      {isSelected && <CheckCircle2 size={18} className="text-blue-600" />}
                    </div>
                    <div className="text-right">
                      <p className={`text-xs ${isSelected ? 'text-blue-600' : 'text-slate-400'}`}>
                        {option.price === 0 ? 'Miễn phí' : `+${option.price.toLocaleString()} đ`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="sticky bottom-0 bg-white p-4 border-t flex items-center justify-between mt-10">
        <div>
          <p className="text-sm text-slate-500">Tiền dịch vụ thêm</p>
          <p className="text-xl font-bold text-blue-600">+{calculateAddonTotal().toLocaleString()} đ</p>
        </div>
        <Button onClick={handleConfirm} className="bg-blue-600 hover:bg-blue-700 px-10 h-12 font-bold text-lg">
          Tiếp tục thanh toán
        </Button>
      </div>
    </div>
  );
};