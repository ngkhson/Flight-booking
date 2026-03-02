import { useState } from 'react';
import { AdvancedSearchWidget } from '../../features/customer/search/AdvancedSearchWidget';
import { FlightCard, type Flight } from '../../features/customer/search/FlightCard';
import { FlightFilter, TIME_BLOCKS } from '../../features/customer/search/FlightFilter'; // Import thêm TIME_BLOCKS

// MOCK_FLIGHTS Giữ nguyên
const MOCK_FLIGHTS: Flight[] = [
  { id: "VN123", airline: "Vietnam Airlines", airlineLogo: "VN", departureTime: "08:30", arrivalTime: "10:40", duration: "2h 10m", durationMinutes: 130, stops: 0, originCode: "HAN", destinationCode: "SGN", price: 1850000, aircraft: "Airbus A321", baggage: "Xách tay 12kg, Ký gửi 23kg", flightClass: "Phổ thông tiêu chuẩn" },
  { id: "VJ456", airline: "Vietjet Air", airlineLogo: "VJ", departureTime: "19:00", arrivalTime: "21:05", duration: "2h 05m", durationMinutes: 125, stops: 0, originCode: "HAN", destinationCode: "SGN", price: 1150000, aircraft: "Airbus A320", baggage: "Xách tay 7kg", flightClass: "Phổ thông (Eco)" },
  { id: "QH789", airline: "Bamboo Airways", airlineLogo: "QH", departureTime: "14:15", arrivalTime: "18:20", duration: "4h 05m", durationMinutes: 245, stops: 1, originCode: "HAN", destinationCode: "SGN", price: 1450000, aircraft: "Boeing 787", baggage: "Xách tay 7kg, Ký gửi 20kg", flightClass: "Phổ thông Plus" },
  { id: "VJ999", airline: "Vietjet Air", airlineLogo: "VJ", departureTime: "05:15", arrivalTime: "07:20", duration: "2h 05m", durationMinutes: 125, stops: 0, originCode: "HAN", destinationCode: "SGN", price: 950000, aircraft: "Airbus A320", baggage: "Xách tay 7kg", flightClass: "Phổ thông (Eco)" }, // Thêm 1 chuyến bay sớm giá rẻ để test Sort
];

export const SearchPage = () => {
  // STATE LỌC
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<number[]>([0, 10000000]);
  const [stops, setStops] = useState<number[]>([]);
  const [maxDuration, setMaxDuration] = useState<number>(48);
  
  // MỚI: State lưu danh sách ID của các khối giờ được chọn (VD: ["0-6", "12-18"])
  const [takeOffBlocks, setTakeOffBlocks] = useState<string[]>([]);
  const [landingBlocks, setLandingBlocks] = useState<string[]>([]);
  
  // MỚI: State Sắp xếp (Mặc định: Giá thấp đến cao)
  const [sortBy, setSortBy] = useState<string>('price_asc');

  // Hàm Helper
  const timeToDecimal = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours + (minutes / 60);
  };

  const handleBlockChange = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (blockId: string, isChecked: boolean) => {
    setter(prev => isChecked ? [...prev, blockId] : prev.filter(id => id !== blockId));
  };

  const handleResetFilters = () => {
    setSelectedAirlines([]); setPriceRange([0, 10000000]); setStops([]);
    setMaxDuration(48); setTakeOffBlocks([]); setLandingBlocks([]);
  };

  // --- LOGIC KIỂM TRA MÚI GIỜ ---
  const isTimeInBlocks = (decimalTime: number, selectedBlocks: string[]) => {
    if (selectedBlocks.length === 0) return true; // Nếu không tick gì -> Bỏ qua lọc giờ
    return selectedBlocks.some(blockId => {
      const block = TIME_BLOCKS.find(b => b.id === blockId);
      if (!block) return false;
      // Dấu < max để tránh 12:00 lọt vào cả 2 mốc "Sáng" và "Chiều"
      return decimalTime >= block.min && decimalTime < (block.max === 24 ? 24.1 : block.max);
    });
  };

  // --- BƯỚC 1: LỌC DỮ LIỆU ---
  const filteredFlights = MOCK_FLIGHTS.filter(flight => {
    const depTime = timeToDecimal(flight.departureTime);
    const arrTime = timeToDecimal(flight.arrivalTime);

    const matchAirline = selectedAirlines.length === 0 || selectedAirlines.includes(flight.airline);
    const matchPrice = flight.price >= priceRange[0] && flight.price <= priceRange[1];
    const matchStops = stops.length === 0 || stops.includes(flight.stops) || (stops.includes(2) && flight.stops >= 2);
    const matchDuration = (flight.durationMinutes / 60) <= maxDuration;
    const matchTakeOff = isTimeInBlocks(depTime, takeOffBlocks);
    const matchLanding = isTimeInBlocks(arrTime, landingBlocks);

    return matchAirline && matchPrice && matchStops && matchDuration && matchTakeOff && matchLanding;
  });

  // --- BƯỚC 2: SẮP XẾP DỮ LIỆU SAU KHI LỌC ---
  const sortedAndFilteredFlights = [...filteredFlights].sort((a, b) => {
    if (sortBy === 'price_asc') return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    if (sortBy === 'time_asc') return timeToDecimal(a.departureTime) - timeToDecimal(b.departureTime);
    if (sortBy === 'time_desc') return timeToDecimal(b.departureTime) - timeToDecimal(a.departureTime);
    if (sortBy === 'duration_asc') return a.durationMinutes - b.durationMinutes;
    return 0;
  });

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <div className="bg-blue-600 pb-16 pt-8">
        <div className="container mx-auto px-4">
          <h2 className="text-white text-2xl font-bold mb-6">Kết quả tìm kiếm chuyến bay</h2>
          <div className="transform translate-y-8">
             <AdvancedSearchWidget />
          </div>
        </div>
      </div>

      <div className="h-16"></div>

      <div className="container mx-auto px-4 mt-8 flex flex-col lg:flex-row gap-8">
        
        {/* BỘ LỌC BÊN TRÁI */}
        <aside className="w-full lg:w-1/4">
          <FlightFilter 
            selectedAirlines={selectedAirlines} onAirlineChange={(a, c) => setSelectedAirlines(p => c ? [...p, a] : p.filter(x => x !== a))}
            priceRange={priceRange} onPriceChange={setPriceRange}
            stops={stops} onStopsChange={(s, c) => setStops(p => c ? [...p, s] : p.filter(x => x !== s))}
            maxDuration={maxDuration} onMaxDurationChange={setMaxDuration}
            takeOffBlocks={takeOffBlocks} onTakeOffBlockChange={handleBlockChange(setTakeOffBlocks)}
            landingBlocks={landingBlocks} onLandingBlockChange={handleBlockChange(setLandingBlocks)}
            resetFilters={handleResetFilters}
          />
        </aside>

        {/* DANH SÁCH & SẮP XẾP BÊN PHẢI */}
        <main className="w-full lg:w-3/4">
          
          {/* THANH TOP BAR: Số lượng chuyến bay & Chức năng Sắp xếp */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm gap-4">
            <h3 className="font-bold text-slate-800">
              Hà Nội (HAN) <span className="text-slate-400 mx-2">→</span> Hồ Chí Minh (SGN)
              <span className="ml-3 text-sm font-normal text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                Hiển thị {sortedAndFilteredFlights.length} kết quả
              </span>
            </h3>

            {/* Khung Sắp Xếp */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-600">Sắp xếp:</span>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block px-3 py-2 cursor-pointer font-medium outline-none"
              >
                <option value="price_asc">Giá: Thấp đến Cao</option>
                <option value="price_desc">Giá: Cao đến Thấp</option>
                <option value="time_asc">Giờ cất cánh: Sớm nhất</option>
                <option value="time_desc">Giờ cất cánh: Muộn nhất</option>
                <option value="duration_asc">Thời gian bay: Ngắn nhất</option>
              </select>
            </div>
          </div>

          {/* RENDER DANH SÁCH SAU KHI ĐÃ SẮP XẾP VÀ LỌC */}
          <div className="space-y-4">
            {sortedAndFilteredFlights.length === 0 ? (
               <div className="text-center py-20 bg-white rounded-xl border border-slate-200 border-dashed">
                 <p className="text-slate-500 text-lg mb-4">Không tìm thấy chuyến bay nào.</p>
                 <button onClick={handleResetFilters} className="text-blue-600 font-bold hover:underline bg-blue-50 px-6 py-2 rounded-full">Xóa bộ lọc</button>
               </div>
            ) : (
              sortedAndFilteredFlights.map((flight) => (
                <FlightCard key={flight.id} flight={flight} />
              ))
            )}
          </div>
        </main>

      </div>
    </div>
  );
};