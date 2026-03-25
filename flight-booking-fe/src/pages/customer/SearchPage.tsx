import { useMemo, useState, useEffect } from 'react';
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
  const [outboundFlight, setOutboundFlight] = useState<any>(null);

  // ==========================================
  // 1. TÍNH TOÁN DỮ LIỆU ĐỘNG TỪ API FLIGHTS
  // ==========================================
  
  // Quét danh sách các hãng bay có chuyến
  const availableAirlines = useMemo(() => {
    if (!apiFlights.length) return [];
    const airlines = apiFlights.map((f) => f.airline);
    return Array.from(new Set(airlines)); // Lọc trùng lặp
  }, [apiFlights]);

  // Quét tìm giá rẻ nhất và đắt nhất
  const { minPriceLimit, maxPriceLimit } = useMemo(() => {
    if (!apiFlights.length) return { minPriceLimit: 0, maxPriceLimit: 20000000 };
    const prices = apiFlights.map((f) => f.price);
    const min = Math.floor(Math.min(...prices) / 100000) * 100000; // Làm tròn xuống hàng trăm ngàn
    const max = Math.ceil(Math.max(...prices) / 100000) * 100000;  // Làm tròn lên hàng trăm ngàn
    return { minPriceLimit: min, maxPriceLimit: max };
  }, [apiFlights]);

  // Quét tìm thời gian bay lâu nhất
  const maxDurationLimit = useMemo(() => {
    if (!apiFlights.length) return 48;
    const maxMins = Math.max(...apiFlights.map((f) => f.durationMinutes));
    return Math.ceil(maxMins / 60); // Đổi ra giờ làm tròn lên
  }, [apiFlights]);


  // --- STATE LỌC ---
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(20000000);
  const [stops, setStops] = useState<number[]>([]);
  const [maxDuration, setMaxDuration] = useState<number>(48);
  const [takeOffBlocks, setTakeOffBlocks] = useState<string[]>([]);
  const [landingBlocks, setLandingBlocks] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('price_asc');

  // ==========================================
  // 2. TỰ ĐỘNG CẬP NHẬT THANH TRƯỢT KHI CÓ DATA MỚI
  // ==========================================
  useEffect(() => {
    if (apiFlights.length > 0) {
      setMaxPrice(maxPriceLimit);
      setMaxDuration(maxDurationLimit);
    }
  }, [apiFlights, minPriceLimit, maxPriceLimit, maxDurationLimit]);

  // Hàm Reset Bộ Lọc đã được nâng cấp (Lấy giá trị động)
  const resetFilters = () => {
    setSelectedAirlines([]);
    setMaxPrice(maxPriceLimit);
    setStops([]);
    setMaxDuration(maxDurationLimit);
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

  const handleNewSearch = (params: any) => {
    setCurrentSearchParams(params);
    setStep(1); 
    setOutboundFlight(null); 
    handleFetchFlightsForStep(params, 1);
  };

  const handleFetchFlightsForStep = async (searchParams: any, targetStep: number) => {
    setLoading(true);
    setHasSearched(true);
    resetFilters(); 

    try {
      const origin = targetStep === 1 ? searchParams.origin : searchParams.destination;
      const destination = targetStep === 1 ? searchParams.destination : searchParams.origin;
      const date = targetStep === 1 ? searchParams.date : searchParams.returnDate;

      const apiPayload = { ...searchParams, origin, destination, date };
      const res: any = await flightApi.searchFlights(apiPayload);

      // 🚀 BỘ HÚT DỮ LIỆU AN TOÀN ĐỂ XUYÊN QUA LỚP PHÂN TRANG (PAGERESPONSE)
      let flightArray: any[] = [];
      if (res && res.code === 1000) {
        if (Array.isArray(res.result)) {
          flightArray = res.result;
        } else if (res.result && Array.isArray(res.result.data)) {
          flightArray = res.result.data; // Lấy từ PageResponse.data
        } else if (res.result && Array.isArray(res.result.content)) {
          flightArray = res.result.content; // Lấy từ PageResponse.content
        }
      } else if (Array.isArray(res)) {
        flightArray = res;
      } else if (res && Array.isArray(res.data)) {
        flightArray = res.data;
      }

      // CHẠY HÀM MAP TRÊN MẢNG AN TOÀN
      const mappedFlights = flightArray.map((item: any, index: number) => {
        const minPrice = item.classes && item.classes.length > 0
          ? Math.min(...item.classes.map((c: any) => c.basePrice)) : 0;
        const depDate = new Date(item.departureTime);
        const arrDate = new Date(item.arrivalTime);

        // Tính tổng số phút bay
        const totalMinutes = isNaN(arrDate.getTime()) ? 0 : Math.floor((arrDate.getTime() - depDate.getTime()) / 60000);

        // 🚀 THÊM LOGIC ĐỔI RA CHUỖI "Xh Ym" Ở ĐÂY
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const durationString = `${hours}h ${minutes}m`;

        return {
          id: item.id || item.flightNumber || `fallback-${index}`,
          flightCode: item.flightNumber || item.flightCode || 'N/A',
          airline: item.airlineName || item.airline || 'N/A',
          airlineLogo: (item.airlineName || '').toLowerCase().includes("vietnam") ? "VN" : "VJ",
          departureTime: isNaN(depDate.getTime()) ? "00:00" : format(depDate, "HH:mm"),
          arrivalTime: isNaN(arrDate.getTime()) ? "00:00" : format(arrDate, "HH:mm"),
          originCode: item.origin || 'N/A',
          destinationCode: item.destination || 'N/A',
          price: minPrice,
          classes: item.classes || [],

          durationMinutes: totalMinutes,
          duration: durationString, // <--- THÊM DÒNG NÀY VÀO ĐỂ FIX LỖI

          stops: item.stops || 0,
          aircraft: item.aircraft || "Airbus A321",
        };
      });

      setApiFlights(mappedFlights);

    } catch (error: any) {
      console.error("Lỗi search:", error);
      setApiFlights([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFlight = (flight: Flight, selectedClassInfo?: any) => {
    const selectedFlightData = { ...flight, selectedClassInfo };

    if (currentSearchParams?.tripType === 'round-trip' && step === 1) {
      setOutboundFlight(selectedFlightData);
      setStep(2);
      window.scrollTo(0, 0); 
      handleFetchFlightsForStep(currentSearchParams, 2);
    } else {
      dispatch(resetStep());
      navigate('/booking', { 
        state: { 
          outboundFlight: step === 1 ? selectedFlightData : outboundFlight, 
          returnFlight: step === 2 ? selectedFlightData : null,
          isRoundTrip: currentSearchParams?.tripType === 'round-trip',
          passengers: currentSearchParams?.passengers,
          rawPassengers: currentSearchParams?.rawPassengers,
          returnDate: currentSearchParams?.returnDate // Gửi ngày về sang trang booking
        }
      });
    }
  };

  // --- LOGIC LỌC ---
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
      (flight.price <= maxPrice) &&
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

  const currentOrigin = step === 1 ? currentSearchParams?.origin : currentSearchParams?.destination;
  const currentDest = step === 1 ? currentSearchParams?.destination : currentSearchParams?.origin;

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <section className="bg-blue-600 py-24 text-center text-white relative z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500 to-blue-700 opacity-90"></div>

        <div className="container mx-auto px-4 relative z-10 text-center sm:text-left">
          
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
        <aside className="w-full lg:w-1/4 relative z-0">
          {/* ==========================================
              3. TRUYỀN PROPS ĐỘNG XUỐNG COMPONENT LỌC
              ========================================== */}
          <FlightFilter
            availableAirlines={availableAirlines}
            minPriceLimit={minPriceLimit}
            maxPriceLimit={maxPriceLimit}
            maxDurationLimit={maxDurationLimit}
            
            selectedAirlines={selectedAirlines} onAirlineChange={(a, c) => setSelectedAirlines(p => c ? [...p, a] : p.filter(x => x !== a))}
            maxPrice={maxPrice} 
            onPriceChange={setMaxPrice}
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
                    <button onClick={resetFilters} className="mt-4 text-blue-600 font-bold hover:underline">Xóa tất cả bộ lọc</button>
                  </div>
                ) : (
                  sortedFlights.map((flight) => (
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