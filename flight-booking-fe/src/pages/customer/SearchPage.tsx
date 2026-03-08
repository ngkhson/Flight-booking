import { useState } from 'react';
import { AdvancedSearchWidget } from '../../features/customer/search/AdvancedSearchWidget';
import { FlightCard, type Flight } from '../../features/customer/search/FlightCard';
import { FlightFilter, TIME_BLOCKS } from '../../features/customer/search/FlightFilter';
import { flightApi } from '@/api/flightApi';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns'; // Đảm bảo đã cài date-fns

export const SearchPage = () => {
  const [apiFlights, setApiFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // --- STATE LỌC ---
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<number[]>([0, 20000000]); // Tăng max price lên cho thực tế
  const [stops, setStops] = useState<number[]>([]);
  const [maxDuration, setMaxDuration] = useState<number>(48);
  const [takeOffBlocks, setTakeOffBlocks] = useState<string[]>([]);
  const [landingBlocks, setLandingBlocks] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('price_asc');

  // --- HÀM GỌI API ---
  const handleFetchFlights = async (searchParams: any) => {
    setLoading(true);
    setHasSearched(true);
    try {
      const res: any = await flightApi.searchFlights(searchParams);

      if (res.code === 1000 && res.result) {
        const mappedFlights = res.result.map((item: any) => {
          // 1. Tìm giá thấp nhất để hiển thị ra màn hình lọc
          const minPrice = item.classes && item.classes.length > 0
            ? Math.min(...item.classes.map((c: any) => c.basePrice))
            : 0;

          // 2. Parse thời gian từ chuỗi ISO của Backend
          const depDate = new Date(item.departureTime);
          const arrDate = new Date(item.arrivalTime);

          return {
            id: item.flightNumber,
            flightNumber: item.flightNumber,
            airline: item.airlineName,
            airlineLogo: item.airlineName.toLowerCase().includes("vietnam") ? "VN" : "VJ",
            departureTime: format(depDate, "HH:mm"),
            arrivalTime: format(arrDate, "HH:mm"),
            originCode: item.origin,
            destinationCode: item.destination,
            price: minPrice, // Giá hiển thị nhỏ nhất
            classes: item.classes, // Đẩy nguyên mảng classes vào để FlightCard xử lý
            durationMinutes: Math.floor((arrDate.getTime() - depDate.getTime()) / 60000),
            stops: 0,
            aircraft: "Airbus A321", // Giả định
          };
        });
        setApiFlights(mappedFlights);
      }
    } catch (error: any) {
      console.error("Lỗi search:", error);
      // Nếu lỗi 404 hoặc bất kỳ lỗi nào, reset mảng về rỗng để UI hiện "Không tìm thấy"
      setApiFlights([]);
      // Bạn có thể thông báo cho người dùng
      // alert("Không tìm thấy chuyến bay nào trong ngày này");
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIC LỌC (Giữ nguyên logic của bạn nhưng dùng data sạch) ---
  const timeToDecimal = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours + (minutes / 60);
  };

  const isTimeInBlocks = (decimalTime: number, selectedBlocks: string[]) => {
    if (selectedBlocks.length === 0) return true;
    return selectedBlocks.some(blockId => {
      const block = TIME_BLOCKS.find(b => b.id === blockId);
      return block ? (decimalTime >= block.min && decimalTime < (block.max === 24 ? 24.1 : block.max)) : false;
    });
  };

  const filteredFlights = apiFlights.filter(flight => {
    const depTime = timeToDecimal(flight.departureTime);
    const arrTime = timeToDecimal(flight.arrivalTime);
    return (
      (selectedAirlines.length === 0 || selectedAirlines.includes(flight.airline)) &&
      (flight.price >= priceRange[0] && flight.price <= priceRange[1]) &&
      (stops.length === 0 || stops.includes(flight.stops)) &&
      ((flight.durationMinutes / 60) <= maxDuration) &&
      isTimeInBlocks(depTime, takeOffBlocks) &&
      isTimeInBlocks(arrTime, landingBlocks)
    );
  });

  const sortedFlights = [...filteredFlights].sort((a, b) => {
    if (sortBy === 'price_asc') return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    if (sortBy === 'time_asc') return timeToDecimal(a.departureTime) - timeToDecimal(b.departureTime);
    return 0;
  });

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <div className="bg-blue-600 pb-16 pt-8">
        <div className="container mx-auto px-4 text-center sm:text-left">
          <h2 className="text-white text-2xl font-bold mb-6">Chuyến bay từ {apiFlights[0]?.originCode || '...'} đến {apiFlights[0]?.destinationCode || '...'}</h2>
          <div className="transform translate-y-8">
            <AdvancedSearchWidget onSearch={handleFetchFlights} loading={loading} />
          </div>
        </div>
      </div>

      <div className="h-16"></div>

      <div className="container mx-auto px-4 mt-8 flex flex-col lg:flex-row gap-8">
        <aside className="w-full lg:w-1/4">
          <FlightFilter
            selectedAirlines={selectedAirlines}
            onAirlineChange={(a, c) => setSelectedAirlines(p => c ? [...p, a] : p.filter(x => x !== a))}
            priceRange={priceRange} onPriceChange={setPriceRange}
            stops={stops} onStopsChange={(s, c) => setStops(p => c ? [...p, s] : p.filter(x => x !== s))}
            maxDuration={maxDuration} onMaxDurationChange={setMaxDuration}
            takeOffBlocks={takeOffBlocks} onTakeOffBlockChange={(id, c) => setTakeOffBlocks(p => c ? [...p, id] : p.filter(x => x !== id))}
            landingBlocks={landingBlocks} onLandingBlockChange={(id, c) => setLandingBlocks(p => c ? [...p, id] : p.filter(x => x !== id))}
            resetFilters={() => {
              setSelectedAirlines([]);
              setPriceRange([0, 10000000]);
              setTakeOffBlocks([]);
              setLandingBlocks([]);
            }}
          />
        </aside>

        <main className="w-full lg:w-3/4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-sm border">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
              <p className="text-slate-500 font-medium">Đang tìm kiếm lịch trình bay...</p>
            </div>
          ) : !hasSearched ? (
            <div className="text-center py-20 bg-white rounded-xl border-dashed border-2 flex flex-col items-center">
              <div className="bg-blue-50 p-4 rounded-full mb-4">
                <Loader2 className="w-8 h-8 text-blue-400" />
              </div>
              <p className="text-slate-500 text-lg">Chào bạn, vui lòng nhập thông tin để tìm kiếm chuyến bay phù hợp nhất!</p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl border shadow-sm">
                <h3 className="font-bold text-slate-800 tracking-tight">
                  Hiển thị <span className="text-blue-600">{sortedFlights.length}</span> chuyến bay
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Sắp xếp:</span>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-slate-50 border p-2 rounded-lg text-sm font-semibold outline-none focus:ring-2 ring-blue-500">
                    <option value="price_asc">Giá thấp nhất</option>
                    <option value="price_desc">Giá cao nhất</option>
                    <option value="time_asc">Giờ bay sớm nhất</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                {sortedFlights.length === 0 ? (
                  <div className="bg-white p-12 text-center rounded-xl border">
                    <p className="text-slate-400">Rất tiếc, không có chuyến bay nào phù hợp với tiêu chí lọc của bạn.</p>
                    <button onClick={() => setSelectedAirlines([])} className="mt-4 text-blue-600 font-bold">Xóa tất cả bộ lọc</button>
                  </div>
                ) : (
                  sortedFlights.map((flight) => (
                    <FlightCard key={flight.id} flight={flight} />
                  ))
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};