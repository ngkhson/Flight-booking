import { useState } from 'react';
import { Users, Minus, Plus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Định nghĩa kiểu dữ liệu cho Hành khách
export interface PassengerState {
  adult: number;
  child: number;
  infant: number;
}

export const PassengerSelector = () => {
  const [passengers, setPassengers] = useState<PassengerState>({
    adult: 1,
    child: 0,
    infant: 0,
  });

  // Hàm xử lý tăng giảm (Có chặn điều kiện logic)
  const updatePassenger = (type: keyof PassengerState, operation: 'add' | 'sub') => {
    setPassengers((prev) => {
      const currentValue = prev[type];
      let newValue = operation === 'add' ? currentValue + 1 : currentValue - 1;

      // Logic cơ bản: Không được âm số người
      if (newValue < 0) newValue = 0;
      // Người lớn tối thiểu phải là 1
      if (type === 'adult' && newValue < 1) newValue = 1;

      return { ...prev, [type]: newValue };
    });
  };

  // Tính tổng số hành khách để hiển thị ra ngoài
  const totalPassengers = passengers.adult + passengers.child + passengers.infant;

  return (
    <div className="flex-1 w-full">
      <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Hành khách</label>
      <Popover>
        {/* Nút bấm để mở Popover */}
        <PopoverTrigger asChild>
          <div className="relative mt-1 cursor-pointer">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 z-10" />
            <div className="flex h-12 w-full items-center rounded-md border border-slate-200 bg-white pl-10 pr-3 text-md shadow-sm hover:bg-slate-50 transition-colors">
              <span className="truncate">
                {totalPassengers} Hành khách
              </span>
            </div>
          </div>
        </PopoverTrigger>

        {/* Nội dung bên trong Popover */}
        <PopoverContent className="w-80 p-4" align="start">
          <div className="space-y-4">
            {/* Hàng 1: Người lớn */}
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-slate-900">Người lớn</p>
                <p className="text-xs text-slate-500">&gt; 12 tuổi</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => updatePassenger('adult', 'sub')} className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100 disabled:opacity-50" disabled={passengers.adult <= 1}>
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-4 text-center font-medium">{passengers.adult}</span>
                <button onClick={() => updatePassenger('adult', 'add')} className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Hàng 2: Trẻ em */}
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-slate-900">Trẻ em</p>
                <p className="text-xs text-slate-500">2 - 12 tuổi</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => updatePassenger('child', 'sub')} className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100 disabled:opacity-50" disabled={passengers.child <= 0}>
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-4 text-center font-medium">{passengers.child}</span>
                <button onClick={() => updatePassenger('child', 'add')} className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Hàng 3: Em bé */}
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-slate-900">Em bé</p>
                <p className="text-xs text-slate-500">&lt; 2 tuổi</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => updatePassenger('infant', 'sub')} className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100 disabled:opacity-50" disabled={passengers.infant <= 0}>
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-4 text-center font-medium">{passengers.infant}</span>
                <button onClick={() => updatePassenger('infant', 'add')} className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};