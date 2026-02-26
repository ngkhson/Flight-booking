import { useState } from 'react';
import { AdvancedSearchWidget } from '../../features/customer/search/AdvancedSearchWidget';
import { FlightCard, type Flight } from '../../features/customer/search/FlightCard';
import { FlightFilter } from '../../features/customer/search/FlightFilter'; // <-- Import Bộ lọc

// DỮ LIỆU ẢO (Mock Data)
const MOCK_FLIGHTS: Flight[] = [
  {
    id: "VN123", airline: "Vietnam Airlines", airlineLogo: "VN",
    departureTime: "08:00", arrivalTime: "10:10", duration: "2h 10m",
    originCode: "HAN", destinationCode: "SGN", price: 1850000,
    aircraft: "Airbus A321", baggage: "Xách tay 12kg, Ký gửi 23kg", flightClass: "Phổ thông tiêu chuẩn"
  },
  {
    id: "VJ456", airline: "Vietjet Air", airlineLogo: "VJ",
    departureTime: "09:30", arrivalTime: "11:35", duration: "2h 05m",
    originCode: "HAN", destinationCode: "SGN", price: 1150000,
    aircraft: "Airbus A320", baggage: "Xách tay 7kg", flightClass: "Phổ thông (Eco)"
  },
  {
    id: "QH789", airline: "Bamboo Airways", airlineLogo: "QH",
    departureTime: "14:15", arrivalTime: "16:20", duration: "2h 05m",
    originCode: "HAN", destinationCode: "SGN", price: 1450000,
    aircraft: "Boeing 787", baggage: "Xách tay 7kg, Ký gửi 20kg", flightClass: "Phổ thông Plus"
  }
];

export const SearchPage = () => {
  // --- STATE QUẢN LÝ BỘ LỌC ---
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(5000000); // Mặc định 5 triệu

  // --- LOGIC CẬP NHẬT BỘ LỌC ---
  const handleAirlineChange = (airline: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedAirlines(prev => [...prev, airline]); // Thêm vào mảng
    } else {
      setSelectedAirlines(prev => prev.filter(a => a !== airline)); // Xóa khỏi mảng
    }
  };

  const handleResetFilters = () => {
    setSelectedAirlines([]);
    setMaxPrice(5000000);
  };

  // --- LOGIC LỌC DỮ LIỆU CHÍNH (Chạy ngay lập tức mỗi khi state đổi) ---
  const filteredFlights = MOCK_FLIGHTS.filter(flight => {
    // 1. Lọc Hãng bay (Nếu mảng rỗng tức là chưa chọn hãng nào -> Hiển thị tất cả)
    const matchAirline = selectedAirlines.length === 0 || selectedAirlines.includes(flight.airline);
    // 2. Lọc Giá tiền
    const matchPrice = flight.price <= maxPrice;

    return matchAirline && matchPrice;
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
        
        {/* CỘT BỘ LỌC */}
        <aside className="w-full lg:w-1/4">
          <FlightFilter 
            selectedAirlines={selectedAirlines}
            onAirlineChange={handleAirlineChange}
            maxPrice={maxPrice}
            onPriceChange={setMaxPrice}
            resetFilters={handleResetFilters}
          />
        </aside>

        {/* CỘT DANH SÁCH CHUYẾN BAY */}
        <main className="w-full lg:w-3/4">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 text-xl">
              Hà Nội (HAN) <span className="text-slate-400 mx-2">→</span> Hồ Chí Minh (SGN)
            </h3>
            <span className="text-slate-500 font-medium bg-white px-3 py-1 rounded-full shadow-sm border border-slate-200">
              Hiển thị {filteredFlights.length} chuyến bay
            </span>
          </div>

          <div className="space-y-4">
            {/* Cảnh báo nếu lọc quá tay không còn chuyến nào */}
            {filteredFlights.length === 0 ? (
               <div className="text-center py-20 bg-white rounded-xl border border-slate-200 border-dashed">
                 <p className="text-slate-500 text-lg">Không tìm thấy chuyến bay nào phù hợp với bộ lọc.</p>
                 <button onClick={handleResetFilters} className="mt-4 text-blue-600 font-medium hover:underline">Xóa bộ lọc ngay</button>
               </div>
            ) : (
              // In ra danh sách đã lọc
              filteredFlights.map((flight) => (
                <FlightCard key={flight.id} flight={flight} />
              ))
            )}
          </div>
        </main>

      </div>
    </div>
  );
};