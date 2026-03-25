import { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PassengerSelector, type PassengerState } from './PassengerSelector';
import { FlightDatePicker } from './FlightDatePicker';
import { format } from 'date-fns';
import { useDispatch } from 'react-redux';
import { setSearchConfigs } from '@/store/bookingSlice';
import { useLocation } from 'react-router-dom';
import { AirportSelector } from './AirportSelector';

interface Props {
  onSearch: (params: any) => void;
  loading?: boolean;
}

export const AdvancedSearchWidget = ({ onSearch, loading }: Props) => {
  const location = useLocation();
  const [tripType, setTripType] = useState<'one-way' | 'round-trip'>('one-way');
  const [origin, setOrigin] = useState("HKT");
  const [destination, setDestination] = useState("KUL");

  const [departureDate, setDepartureDate] = useState<Date | undefined>(new Date());
  const [returnDate, setReturnDate] = useState<Date | undefined>(); // 👈 1. Thêm state quản lý ngày về

  const [passengers, setPassengers] = useState<PassengerState>({ adult: 1, child: 0, infant: 0 });
  const dispatch = useDispatch();

  const handleSearch = () => {
    if (tripType === 'round-trip') {
      if (!returnDate) {
        alert("Vui lòng chọn ngày về!");
        return;
      }
      if (departureDate && returnDate < departureDate) {
        alert("Ngày về không được trước ngày khởi hành!");
        return;
      }
    }

    const payload = {
      origin,
      destination,
      date: departureDate ? format(departureDate, "yyyy-MM-dd") : "",
      tripType, 
      returnDate: (tripType === 'round-trip' && returnDate) ? format(returnDate, "yyyy-MM-dd") : "",
      passengers: passengers.adult + passengers.child,
      rawPassengers: passengers
    };

    onSearch(payload);

    dispatch(setSearchConfigs({
      origin: payload.origin,             
      destination: payload.destination,
      adults: passengers.adult,
      children: passengers.child,
      infants: passengers.infant,
      date: payload.date,
      returnDate: payload.returnDate
    }));
  };

  useEffect(() => {
    if (location.state) {
      if (location.state.origin) setOrigin(location.state.origin);
      if (location.state.destination) setDestination(location.state.destination);

      // 2. Khôi phục Ngày bay (Phải biến chuỗi "YYYY-MM-DD" ngược lại thành Object Date)
      if (location.state.date) {
        setDepartureDate(new Date(location.state.date));
      }

      // 👈 3. Khôi phục trạng thái Khứ hồi và Ngày về khi ấn Back từ trang trong
      if (location.state.tripType) {
        setTripType(location.state.tripType);
      }
      if (location.state.returnDate) {
        setReturnDate(new Date(location.state.returnDate));
      }

      if (location.state.rawPassengers) {
        setPassengers(location.state.rawPassengers);
      }

      // Khôi phục số lượng khách (Vì bạn dùng chung 1 Object nên phải set kiểu này)
      // Lưu ý: Trong handleSearch bạn chỉ truyền 'passengers' là TỔNG SỐ KHÁCH.
      // Nếu bạn muốn chia lại chính xác người lớn/trẻ em, cách tốt nhất là 
      // đọc ngược từ Redux ra (vì lúc ở HomePage bạn đã dispatch lên Redux rồi).
    }
  }, [location.state]);

  // Hàm tiện ích: Khi chuyển từ Khứ hồi -> Một chiều thì xoá luôn ngày về cho sạch
  const handleTripTypeChange = (type: 'one-way' | 'round-trip') => {
    setTripType(type);
    if (type === 'one-way') {
      setReturnDate(undefined);
    }
  };

  // return (
  //   <div className="bg-white p-5 rounded-xl shadow-2xl border border-slate-200 w-full max-w-6xl mx-auto text-left transform translate-y-8">
  //     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 pb-4 border-b border-slate-100 gap-4">
  //       <div className="flex gap-6">
  //         <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
  //           <input 
  //             type="radio" 
  //             checked={tripType === 'one-way'} 
  //             onChange={() => handleTripTypeChange('one-way')} 
  //             className="w-4 h-4" 
  //           />
  //           Một chiều
  //         </label>
  //         <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
  //           <input 
  //             type="radio" 
  //             checked={tripType === 'round-trip'} 
  //             onChange={() => handleTripTypeChange('round-trip')} 
  //             className="w-4 h-4" 
  //           />
  //           Khứ hồi
  //         </label>
  //       </div>
  //     </div>

  //     <div className="flex flex-col lg:flex-row gap-3 items-end">
  //       <div className="flex flex-col md:flex-row flex-1 gap-2 w-full">
  //         <div className="flex-1">
  //           <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Điểm đi</label>
  //           {/* 👇 Thay Input bằng AirportSelector 👇 */}
  //           <AirportSelector 
  //             value={origin} 
  //             onChange={setOrigin} 
  //             placeholder="Chọn điểm khởi hành"
  //           />
  //         </div>
  //         <div className="flex-1">
  //           <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Điểm đến</label>
  //           {/* 👇 Thay Input bằng AirportSelector 👇 */}
  //           <AirportSelector 
  //             value={destination} 
  //             onChange={setDestination} 
  //             placeholder="Chọn điểm đến"
  //           />
  //         </div>
  //       </div>

  //       <div className="flex flex-1 gap-2 w-full">
  //         <FlightDatePicker 
  //           label="Ngày đi" 
  //           value={departureDate} 
  //           onChange={setDepartureDate} 
  //         />
  //         {/* 👈 4. Gắn state returnDate vào Component Picker */}
  //         <FlightDatePicker 
  //           label="Ngày về" 
  //           disabledState={tripType === 'one-way'} 
  //           value={returnDate} 
  //           onChange={setReturnDate} 
  //         />
  //       </div>

  //       <div className="w-full lg:w-56">
  //         <PassengerSelector value={passengers} onChange={setPassengers} />
  //       </div>

  //       <Button onClick={handleSearch} disabled={loading} className="w-full lg:w-auto h-12 px-8 bg-orange-500 hover:bg-orange-600 font-bold">
  //         {loading ? "Đang tìm..." : "Tìm Chuyến"}
  //       </Button>
  //     </div>
  //   </div>
  // );
  return (
    <div className="bg-white p-5 rounded-xl shadow-2xl border border-slate-200 w-full max-w-[1200px] mx-auto text-left transform translate-y-8">
      {/* KHỐI RADIO BUTTON (MỘT CHIỀU / KHỨ HỒI) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 pb-4 border-b border-slate-100 gap-4">
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
            <input 
              type="radio" 
              checked={tripType === 'one-way'} 
              onChange={() => handleTripTypeChange('one-way')} 
              className="w-4 h-4 text-blue-600 focus:ring-blue-500" 
            />
            Một chiều
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
            <input 
              type="radio" 
              checked={tripType === 'round-trip'} 
              onChange={() => handleTripTypeChange('round-trip')} 
              className="w-4 h-4 text-blue-600 focus:ring-blue-500" 
            />
            Khứ hồi
          </label>
        </div>
      </div>

      {/* KHỐI TÌM KIẾM CHÍNH */}
      <div className="flex flex-col lg:flex-row gap-3 items-end w-full">
        
        {/* 👇 KHU VỰC SÂN BAY: Cho flex-[2] để nó rộng gấp đôi các ô khác 👇 */}
        <div className="flex flex-col md:flex-row gap-2 w-full lg:flex-[2] relative z-50">
          <div className="flex-1">
            <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Điểm đi</label>
            <AirportSelector 
              value={origin} 
              onChange={setOrigin} 
              placeholder="Chọn điểm khởi hành"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Điểm đến</label>
            <AirportSelector 
              value={destination} 
              onChange={setDestination} 
              placeholder="Chọn điểm đến"
            />
          </div>
        </div>

        {/* 👇 KHU VỰC NGÀY THÁNG: Cho flex-[1.2] để nó gọn lại một chút 👇 */}
        <div className="flex flex-row gap-2 w-full lg:flex-[1.2] relative z-40">
          <div className="flex-1">
             <FlightDatePicker 
               label="Ngày đi" 
               value={departureDate} 
               onChange={setDepartureDate} 
             />
          </div>
          <div className="flex-1">
             <FlightDatePicker 
               label="Ngày về" 
               disabledState={tripType === 'one-way'} 
               value={returnDate} 
               onChange={setReturnDate} 
             />
          </div>
        </div>

        {/* 👇 KHU VỰC HÀNH KHÁCH: Cho flex-1 (chuẩn) 👇 */}
        <div className="w-full lg:flex-1 relative z-30">
          <PassengerSelector value={passengers} onChange={setPassengers} />
        </div>

        {/* 👇 NÚT TÌM KIẾM: Ép kích thước cố định để không bị biến dạng 👇 */}
        <div className="w-full lg:w-auto shrink-0 relative z-10">
          <Button 
            onClick={handleSearch} 
            disabled={loading} 
            className="w-full lg:w-[140px] h-12 bg-orange-500 hover:bg-orange-600 font-bold text-white rounded-lg shadow-md transition-all active:scale-95"
          >
            {loading ? "Đang tìm..." : "Tìm Chuyến"}
          </Button>
        </div>

      </div>
    </div>
  );
};