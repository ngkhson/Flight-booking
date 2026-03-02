import { useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { PassengerSelector } from './PassengerSelector';
import { FlightDatePicker } from './FlightDatePicker';

export const AdvancedSearchWidget = () => {
  // STATE ĐIỀU KHIỂN LOẠI CHUYẾN ĐI VÀ HẠNG VÉ
  const [tripType, setTripType] = useState<'one-way' | 'round-trip'>('one-way');
  const [flightClass, setFlightClass] = useState('Phổ thông');

  return (
    <div className="bg-white p-5 rounded-xl shadow-2xl border border-slate-200 w-full max-w-6xl mx-auto text-left transform translate-y-8">
      
      {/* --- DÒNG 1: TÙY CHỌN LOẠI CHUYẾN ĐI & HẠNG VÉ --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 pb-4 border-b border-slate-100 gap-4">
        
        {/* Khứ hồi / Một chiều (Radio Buttons) */}
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium hover:text-blue-600">
            <input 
              type="radio" 
              name="tripType" 
              className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
              checked={tripType === 'one-way'} 
              onChange={() => setTripType('one-way')} 
            />
            Một chiều
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium hover:text-blue-600">
            <input 
              type="radio" 
              name="tripType" 
              className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
              checked={tripType === 'round-trip'} 
              onChange={() => setTripType('round-trip')} 
            />
            Khứ hồi
          </label>
        </div>

        {/* Hạng vé (Select Dropdown) */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-slate-500">Hạng vé:</label>
          <select 
            value={flightClass}
            onChange={(e) => setFlightClass(e.target.value)}
            className="font-bold text-slate-800 bg-transparent border-none focus:ring-0 cursor-pointer outline-none hover:text-blue-600 transition-colors"
          >
            <option value="Phổ thông">Phổ thông</option>
            <option value="Phổ thông đặc biệt">Phổ thông đặc biệt</option>
            <option value="Thương gia">Thương gia</option>
            <option value="Hạng nhất">Hạng nhất</option>
          </select>
        </div>
      </div>

      {/* --- DÒNG 2: FORM NHẬP LIỆU CHÍNH --- */}
      <div className="flex flex-col lg:flex-row gap-3 items-end">
        
        {/* 1. Điểm đi & Điểm đến */}
        <div className="flex flex-col md:flex-row flex-1 gap-2 w-full">
           <div className="flex-1">
             <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Điểm đi</label>
             <div className="relative mt-1">
               <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
               <Input placeholder="Hà Nội (HAN)" className="pl-10 h-12 text-md" />
             </div>
           </div>
           <div className="flex-1">
             <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Điểm đến</label>
             <div className="relative mt-1">
               <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
               <Input placeholder="Hồ Chí Minh (SGN)" className="pl-10 h-12 text-md" />
             </div>
           </div>
        </div>

        {/* 2. Ngày đi & Ngày về */}
        <div className="flex flex-1 gap-2 w-full mt-2 lg:mt-0">
          <FlightDatePicker label="Ngày đi" />
          
          {/* Mấu chốt ở đây: Nếu tripType là one-way thì disabled ô Ngày Về */}
          <FlightDatePicker label="Ngày về" disabledState={tripType === 'one-way'} />
        </div>

        {/* 3. Hành khách */}
        <div className="w-full lg:w-56 mt-2 lg:mt-0">
          <PassengerSelector />
        </div>

        {/* 4. Nút Tìm kiếm */}
        <div className="w-full lg:w-auto mt-4 lg:mt-0">
          <Button className="w-full lg:w-auto h-12 px-8 bg-orange-500 hover:bg-orange-600 text-md font-bold text-white shadow-lg">
            <Search className="w-5 h-5 mr-2" />
            Tìm Chuyến
          </Button>
        </div>
        
      </div>
    </div>
  );
};