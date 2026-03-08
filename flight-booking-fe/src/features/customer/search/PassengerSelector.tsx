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
    const currentValue = value[type];
    let newValue = operation === 'add' ? currentValue + 1 : currentValue - 1;

    if (newValue < 0) newValue = 0;
    if (type === 'adult' && newValue < 1) newValue = 1;

    onChange({ ...value, [type]: newValue });
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
                  <button 
                    onClick={() => updatePassenger(type, 'sub')} 
                    className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100 disabled:opacity-50"
                    disabled={type === 'adult' ? value.adult <= 1 : value[type] <= 0}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-4 text-center font-medium">{value[type]}</span>
                  <button onClick={() => updatePassenger(type, 'add')} className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100">
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