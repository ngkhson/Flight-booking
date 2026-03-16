import { useState, useEffect } from 'react';
import { AdvancedSearchWidget } from '../../features/customer/search/AdvancedSearchWidget';
import { FlightCard, type Flight } from '../../features/customer/search/FlightCard';
import { FlightFilter, TIME_BLOCKS } from '../../features/customer/search/FlightFilter';
import { flightApi } from '@/api/flightApi';
import { Loader2, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { resetStep } from '@/store/bookingSlice';

export const SearchPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [apiFlights, setApiFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // --- THÊM STATE QUẢN LÝ KHỨ HỒI ---
  const [currentSearchParams, setCurrentSearchParams] = useState<any>(null);
  const [step, setStep] = useState(1); // 1 = Chọn chiều đi, 2 = Chọn chiều về
  const [outboundFlight, setOutboundFlight] = useState<any>(null); // Lưu vé chiều đi khách đã chọn

  // --- STATE LỌC ---
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<number[]>([0, 20000000]);
  const [stops, setStops] = useState<number[]>([]);
  const [maxDuration, setMaxDuration] = useState<number>(48);
  const [takeOffBlocks, setTakeOffBlocks] = useState<string[]>([]);
  const [landingBlocks, setLandingBlocks] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('price_asc');

  // Hàm Reset Bộ Lọc (Dùng khi lật trang Đi <-> Về)
  const resetFilters = () => {
    setSelectedAirlines([]);
    setPriceRange([0, 20000000]);
    setStops([]);
    setTakeOffBlocks([]);
    setLandingBlocks([]);
  };

  useEffect(() => {
    if (location.state) {
      setCurrentSearchParams(location.state);
      handleFetchFlightsForStep(location.state, 1);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Hàm bắt sự kiện khi user nhấn nút "Tìm kiếm" ở Widget trên đầu trang
  const handleNewSearch = (params: any) => {
    setCurrentSearchParams(params);
    setStep(1); // Đặt lại về bước 1
    setOutboundFlight(null); // Xoá vé đã chọn
    handleFetchFlightsForStep(params, 1);
  };

  // --- HÀM GỌI API THÔNG MINH (Xử lý cả chiều đi & về) ---
  const handleFetchFlightsForStep = async (searchParams: any, targetStep: number) => {
    setLoading(true);
    setHasSearched(true);
    resetFilters(); // Mỗi lần tìm chuyến mới thì làm sạch bộ lọc

    try {
      // ⚡ Đảo ngược Điểm đi/đến và Ngày bay nếu đang ở Bước 2 (Chiều về)
      const origin = targetStep === 1 ? searchParams.origin : searchParams.destination;
      const destination = targetStep === 1 ? searchParams.destination : searchParams.origin;
      const date = targetStep === 1 ? searchParams.date : searchParams.returnDate;

      // Tạo payload gọi API cho đúng chặng
      const apiPayload = { ...searchParams, origin, destination, date };

      const res: any = await flightApi.searchFlights(apiPayload);

      if (res.code === 1000 && res.result) {
        const mappedFlights = res.result.map((item: any) => {
          const minPrice = item.classes && item.classes.length > 0
            ? Math.min(...item.classes.map((c: any) => c.basePrice)) : 0;
          const depDate = new Date(item.departureTime);
          const arrDate = new Date(item.arrivalTime);

          return {
            id: item.id,
            flightCode: item.flightNumber,
            airline: item.airlineName,
            airlineLogo: item.airlineName.toLowerCase().includes("vietnam") ? "VN" : "VJ",
            departureTime: format(depDate, "HH:mm"),
            arrivalTime: format(arrDate, "HH:mm"),
            originCode: item.origin,
            destinationCode: item.destination,
            price: minPrice,
            classes: item.classes,
            durationMinutes: Math.floor((arrDate.getTime() - depDate.getTime()) / 60000),
            stops: 0,
            aircraft: "Airbus A321",
          };
        });
        setApiFlights(mappedFlights);
      }
    } catch (error: any) {
      console.error("Lỗi search:", error);
      setApiFlights([]);
    } finally {
      setLoading(false);
    }
  };

  // --- XỬ LÝ KHI NGƯỜI DÙNG BẤM "CHỌN CHUYẾN BAY" ---
  const handleSelectFlight = (flight: Flight, selectedClassInfo?: any) => {
    // Gắn thêm thông tin Hạng vé/Giá vé mà người dùng chọn trong Card vào object Flight
    const selectedFlightData = { ...flight, selectedClassInfo };

    if (currentSearchParams?.tripType === 'round-trip' && step === 1) {
      // Đã chọn xong chiều đi -> Lưu lại và Lật sang Bước 2
      setOutboundFlight(selectedFlightData);
      setStep(2);
      window.scrollTo(0, 0); // Cuộn màn hình lên trên cùng
      handleFetchFlightsForStep(currentSearchParams, 2);
    } else {
      dispatch(resetStep());
      // Nếu là vé 1 chiều, HOẶC đã chọn xong chiều về -> Đẩy sang trang Thanh toán
      navigate('/booking', { 
        state: { 
          outboundFlight: step === 1 ? selectedFlightData : outboundFlight, 
          returnFlight: step === 2 ? selectedFlightData : null,
          isRoundTrip: currentSearchParams?.tripType === 'round-trip',
          passengers: currentSearchParams?.passengers,
          rawPassengers: currentSearchParams?.rawPassengers
        } 
      });
    }
  };

  // --- LOGIC LỌC (Giữ nguyên của bạn) ---
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

  // Lấy thông tin điểm đi/đến hiện tại để hiển thị trên Header
  const currentOrigin = step === 1 ? currentSearchParams?.origin : currentSearchParams?.destination;
  const currentDest = step === 1 ? currentSearchParams?.destination : currentSearchParams?.origin;

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <section className="bg-blue-600 py-24 text-center text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500 to-blue-700 opacity-90"></div>
        
        <div className="container mx-auto px-4 relative z-10 text-center sm:text-left">
          
          {/* HEADER HIỂN THỊ TRẠNG THÁI KHỨ HỒI */}
          <div className="mb-6 flex flex-col items-center sm:items-start">
            <h2 className="text-white text-3xl font-bold flex items-center gap-3">
              {step === 2 && (
                <button 
                  onClick={() => { setStep(1); handleFetchFlightsForStep(currentSearchParams, 1); }}
                  className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition"
                  title="Quay lại chuyến đi"
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
              )}
              {currentOrigin || '...'} ✈ {currentDest || '...'}
            </h2>
            
            {currentSearchParams?.tripType === 'round-trip' && (
              <div className="mt-3 inline-block bg-orange-500 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-md">
                Bước {step} / 2: Chọn chuyến {step === 1 ? 'ĐI' : 'VỀ'}
              </div>
            )}
          </div>

          <div className="text-slate-900">
            <AdvancedSearchWidget onSearch={handleNewSearch} loading={loading} />
          </div>
        </div>
      </section>

      <div className="h-16"></div>

      <div className="container mx-auto px-4 mt-8 flex flex-col lg:flex-row gap-8">
        <aside className="w-full lg:w-1/4">
          <FlightFilter
            selectedAirlines={selectedAirlines} onAirlineChange={(a, c) => setSelectedAirlines(p => c ? [...p, a] : p.filter(x => x !== a))}
            priceRange={priceRange} onPriceChange={setPriceRange}
            stops={stops} onStopsChange={(s, c) => setStops(p => c ? [...p, s] : p.filter(x => x !== s))}
            maxDuration={maxDuration} onMaxDurationChange={setMaxDuration}
            takeOffBlocks={takeOffBlocks} onTakeOffBlockChange={(id, c) => setTakeOffBlocks(p => c ? [...p, id] : p.filter(x => x !== id))}
            landingBlocks={landingBlocks} onLandingBlockChange={(id, c) => setLandingBlocks(p => c ? [...p, id] : p.filter(x => x !== id))}
            resetFilters={resetFilters}
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
              <div className="bg-blue-50 p-4 rounded-full mb-4"><Loader2 className="w-8 h-8 text-blue-400" /></div>
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
                    <button onClick={resetFilters} className="mt-4 text-blue-600 font-bold">Xóa tất cả bộ lọc</button>
                  </div>
                ) : (
                  sortedFlights.map((flight) => (
                    // Truyền hàm handleSelectFlight xuống component FlightCard
                    <FlightCard 
                      key={flight.id} 
                      flight={flight} 
                      onSelect={(classInfo) => handleSelectFlight(flight, classInfo)} 
                    />
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