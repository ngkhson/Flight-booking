import { useState } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale'; // Import tiếng Việt cho ngày tháng
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export const FlightDatePicker = () => {
  const [date, setDate] = useState<Date>();

  return (
    <div className="flex-1 w-full">
      <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Ngày đi</label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full h-12 justify-start text-left font-normal mt-1 text-md border-slate-200 shadow-sm hover:bg-slate-50",
              !date && "text-slate-500"
            )}
          >
            <CalendarIcon className="mr-2 h-5 w-5 text-slate-400" />
            {date ? format(date, "dd/MM/yyyy", { locale: vi }) : <span>Chọn ngày bay</span>}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            initialFocus
            // Logic: Chặn không cho chọn ngày trong quá khứ
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};