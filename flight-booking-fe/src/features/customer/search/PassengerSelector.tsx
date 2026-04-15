import { Users, Minus, Plus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface PassengerState {
  adult: number;
  child: number;
  infant: number;
}

interface Props {
  value: PassengerState;
  onChange: (value: PassengerState) => void;
}

export const PassengerSelector = ({ value, onChange }: Props) => {
  const updatePassenger = (type: keyof PassengerState, operation: 'add' | 'sub') => {
    // Tách riêng 3 biến ra để dễ thao tác
    let { adult, child, infant } = value;

    if (type === 'adult') {
      adult = operation === 'add' ? adult + 1 : adult - 1;
      if (adult < 1) adult = 1; // Tối thiểu 1 người lớn
      
      // 👇 BẢO VỆ DỮ LIỆU: Nếu giảm người lớn, tự động ép số em bé giảm theo nếu vượt quá
      if (infant > adult) infant = adult; 
      
    } else if (type === 'child') {
      child = operation === 'add' ? child + 1 : child - 1;
      if (child < 0) child = 0;
      
    } else if (type === 'infant') {
      infant = operation === 'add' ? infant + 1 : infant - 1;
      if (infant < 0) infant = 0;
      if (infant > adult) infant = adult; // An toàn thêm 1 lớp nữa
    }

    // Đẩy cả cục object mới lên cho form tổng nhận
    onChange({ adult, child, infant });
  };

  const totalPassengers = value.adult + value.child + value.infant;

  return (
    <div className="flex-1 w-full text-left">
      <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Hành khách</label>
      <Popover>
        <PopoverTrigger asChild>
          <div className="relative mt-1 cursor-pointer">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 z-10" />
            <div className="flex h-12 w-full items-center rounded-md border border-slate-200 bg-white pl-10 pr-3 text-md shadow-sm hover:bg-slate-50 transition-colors">
              <span className="truncate">{totalPassengers} Hành khách</span>
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="start">
          <div className="space-y-4">
            {(['adult', 'child', 'infant'] as const).map((type) => (
              <div key={type} className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-slate-900">
                    {type === 'adult' ? 'Người lớn' : type === 'child' ? 'Trẻ em' : 'Em bé'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {type === 'adult' ? '> 12 tuổi' : type === 'child' ? '2 - 12 tuổi' : '< 2 tuổi'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  
                  {/* 👇 NÚT TRỪ 👇 */}
                  <button 
                    onClick={() => updatePassenger(type, 'sub')} 
                    className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={type === 'adult' ? value.adult <= 1 : value[type] <= 0}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  
                  <span className="w-4 text-center font-medium">{value[type]}</span>
                  
                  {/* 👇 NÚT CỘNG 👇 */}
                  <button 
                    onClick={() => updatePassenger(type, 'add')} 
                    className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    // KHÓA NÚT CỘNG NẾU LÀ EM BÉ VÀ SỐ EM BÉ ĐÃ ĐẠT BẰNG SỐ NGƯỜI LỚN
                    disabled={type === 'infant' && value.infant >= value.adult}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  
                </div>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};