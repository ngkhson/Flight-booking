import { useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PassengerSelector, type PassengerState } from './PassengerSelector';
import { FlightDatePicker } from './FlightDatePicker';
import { format } from 'date-fns';
import { useDispatch } from 'react-redux';
import { setSearchConfigs } from '@/store/bookingSlice';

interface Props {
  onSearch: (params: any) => void;
  loading?: boolean;
}

export const AdvancedSearchWidget = ({ onSearch, loading }: Props) => {
  const [tripType, setTripType] = useState<'one-way' | 'round-trip'>('one-way');
  const [origin, setOrigin] = useState("HAN");
  const [destination, setDestination] = useState("SGN");
  const [departureDate, setDepartureDate] = useState<Date | undefined>(new Date());
  const [passengers, setPassengers] = useState<PassengerState>({ adult: 1, child: 0, infant: 0 });
  const dispatch = useDispatch();

  const handleSearch = () => {
    const payload = {
      origin,
      destination,
      date: departureDate ? format(departureDate, "yyyy-MM-dd") : "",
      passengers: passengers.adult + passengers.child // API thường chỉ tính người chiếm chỗ
    };
    onSearch(payload);

    dispatch(setSearchConfigs({
      adults: passengers.adult,
      children: passengers.child,
      infants: passengers.infant
    }));
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow-2xl border border-slate-200 w-full max-w-6xl mx-auto text-left transform translate-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 pb-4 border-b border-slate-100 gap-4">
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
            <input type="radio" checked={tripType === 'one-way'} onChange={() => setTripType('one-way')} className="w-4 h-4" />
            Một chiều
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
            <input type="radio" checked={tripType === 'round-trip'} onChange={() => setTripType('round-trip')} className="w-4 h-4" />
            Khứ hồi
          </label>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-3 items-end">
        <div className="flex flex-col md:flex-row flex-1 gap-2 w-full">
           <div className="flex-1">
             <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Điểm đi</label>
             <div className="relative mt-1">
               <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
               <Input value={origin} onChange={(e) => setOrigin(e.target.value.toUpperCase())} className="pl-10 h-12 text-md uppercase" />
             </div>
           </div>
           <div className="flex-1">
             <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Điểm đến</label>
             <div className="relative mt-1">
               <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
               <Input value={destination} onChange={(e) => setDestination(e.target.value.toUpperCase())} className="pl-10 h-12 text-md uppercase" />
             </div>
           </div>
        </div>

        <div className="flex flex-1 gap-2 w-full">
          <FlightDatePicker label="Ngày đi" value={departureDate} onChange={setDepartureDate} />
          <FlightDatePicker label="Ngày về" disabledState={tripType === 'one-way'} value={undefined} onChange={() => {}} />
        </div>

        <div className="w-full lg:w-56">
          <PassengerSelector value={passengers} onChange={setPassengers} />
        </div>

        <Button onClick={handleSearch} disabled={loading} className="w-full lg:w-auto h-12 px-8 bg-orange-500 hover:bg-orange-600 font-bold">
          {loading ? "Đang tìm..." : "Tìm Chuyến"}
        </Button>
      </div>
    </div>
  );
};