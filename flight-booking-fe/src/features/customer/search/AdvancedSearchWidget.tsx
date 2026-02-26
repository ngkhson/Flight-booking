import { MapPin, Calendar, Users, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PassengerSelector } from './PassengerSelector';
import { FlightDatePicker } from './FlightDatePicker';

export const AdvancedSearchWidget = () => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl mx-auto flex flex-col md:flex-row gap-4 items-center text-left transform translate-y-8">
      
      {/* 1. Điểm đi */}
      <div className="flex-1 w-full">
        <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Điểm đi</label>
        <div className="relative mt-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input placeholder="Hà Nội (HAN)" className="pl-10 h-12 text-md" />
        </div>
      </div>

      {/* 2. Điểm đến */}
      <div className="flex-1 w-full">
        <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Điểm đến</label>
        <div className="relative mt-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input placeholder="Hồ Chí Minh (SGN)" className="pl-10 h-12 text-md" />
        </div>
      </div>

      {/* 3. Ngày bay */}
      {/* <div className="flex-1 w-full">
        <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Ngày đi</label>
        <div className="relative mt-1">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input type="date" className="flex h-12 w-full rounded-md border border-input bg-transparent px-3 py-1 text-md shadow-sm transition-colors pl-10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
        </div>
      </div> */}
      <FlightDatePicker />

      {/* 4. Hành khách */}
      {/* <div className="flex-1 w-full">
        <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Hành khách</label>
        <div className="relative mt-1">
          <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input placeholder="1 Người lớn" className="pl-10 h-12 text-md cursor-pointer" readOnly />
        </div>
      </div> */}
      <PassengerSelector />

      {/* 5. Nút Tìm kiếm */}
      <div className="w-full md:w-auto mt-5 md:mt-0">
        <Button className="w-full md:w-auto h-12 px-8 bg-blue-600 hover:bg-blue-700 text-md font-bold text-white shadow-lg">
          <Search className="w-5 h-5 mr-2" />
          Tìm Chuyến
        </Button>
      </div>
      
    </div>
  );
};