import { useState } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// KHAI BÁO PROPS: Component này sẽ nhận vào Tiêu đề và Trạng thái khóa
interface Props {
  label: string;
  disabledState?: boolean; 
}

export const FlightDatePicker = ({ label, disabledState = false }: Props) => {
  const [date, setDate] = useState<Date>();

  return (
    <div className={`flex-1 w-full transition-opacity duration-300 ${disabledState ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
      <label className="text-xs font-semibold text-slate-500 uppercase ml-1">{label}</label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            disabled={disabledState}
            className={cn(
              "w-full h-12 justify-start text-left font-normal mt-1 text-md border-slate-200 shadow-sm hover:bg-slate-50",
              !date && "text-slate-500"
            )}
          >
            <CalendarIcon className="mr-2 h-5 w-5 text-slate-400" />
            {date ? format(date, "dd/MM/yyyy", { locale: vi }) : <span>Chọn {label.toLowerCase()}</span>}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            initialFocus
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};