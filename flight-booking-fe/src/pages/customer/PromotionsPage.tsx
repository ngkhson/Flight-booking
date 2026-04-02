import { useEffect, useState } from 'react';
import { flightApi } from '@/api/flightApi';
import { PromoFlightCard, type PromoFlight } from '@/features/customer/landing/PromoFlightCard';
import { Loader2, Tag, ChevronDown, Plane } from 'lucide-react';
// 👇 SỬ DỤNG HÀM NÀY ĐỂ LẤY ẢNH CHUẨN
import { getAirportImage } from '@/constants/airportImages';

export const PromotionsPage = () => {
  const [promoFlights, setPromoFlights] = useState<PromoFlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchFlights = async (page: number, isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      const res: any = await flightApi.getAllFlights(page, 12);

      if (res.code === 1000 && res.result) {
        if (res.result.totalPages) setTotalPages(res.result.totalPages);

        const flightArray = Array.isArray(res.result.data)
          ? res.result.data
          : (Array.isArray(res.result) ? res.result : []);

        if (flightArray.length > 0) {
          const mappedData = flightArray.map((item: any) => {
            const minPrice = item.classes && item.classes.length > 0
              ? Math.min(...item.classes.map((c: any) => c.basePrice))
              : 0;

            const destinationCode = item.destination?.includes('(')
              ? item.destination.split('(')[1].replace(')', '').trim()
              : item.destination;

            return {
              ...item,
              id: item.id,
              origin: item.origin,
              destination: item.destination,
              date: item.departureTime,
              price: minPrice,
              originalPrice: minPrice + (minPrice * 0.2),
              airline: item.airlineName,
              // 👇 THAY THẾ TOÀN BỘ LOGIC LẤY ẢNH TẠI ĐÂY
              // imageUrl: getAirportImage(item.destination)
              imageUrl: getAirportImage(destinationCode),
              classes: item.classes
            };
          });

          if (isLoadMore) {
            setPromoFlights(prev => [...prev, ...mappedData]);
          } else {
            setPromoFlights(mappedData);
          }
        }
      }
    } catch (error) {
      console.error("Lỗi tải danh sách chuyến bay:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchFlights(1, false);
  }, []);

  const handleLoadMore = () => {
    if (currentPage < totalPages) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchFlights(nextPage, true);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      {/* HEADER BANNER */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 pt-20 pb-16 text-center text-white relative overflow-hidden">
        <Plane className="absolute -top-10 -right-10 w-64 h-64 text-white opacity-10 rotate-45" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
            <Tag className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Khám phá mọi điểm đến</h1>
          <p className="text-lg opacity-90 max-w-2xl mx-auto font-medium">
            Hàng trăm chặng bay nội địa và quốc tế với mức giá tốt nhất đang chờ bạn. Đặt ngay hôm nay!
          </p>
        </div>
      </section>

      {/* BODY CONTENT */}
      <section className="container mx-auto px-4 mt-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
            <p className="text-slate-500 font-medium text-lg">Đang tải dữ liệu chuyến bay...</p>
          </div>
        ) : promoFlights.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {promoFlights.map((flight) => (
                <PromoFlightCard key={flight.id} flight={flight} />
              ))}
            </div>

            {currentPage < totalPages && (
              <div className="text-center mt-16">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="bg-white border-2 border-slate-200 text-slate-700 hover:border-blue-600 hover:text-blue-600 font-bold px-8 py-3 rounded-full shadow-sm transition-all flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {loadingMore ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ChevronDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                  )}
                  {loadingMore ? 'Đang tải thêm...' : `Xem thêm chuyến bay (Trang ${currentPage}/${totalPages})`}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white p-12 text-center rounded-2xl border shadow-sm max-w-2xl mx-auto mt-10">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plane className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Chưa có chuyến bay nào</h3>
            <p className="text-slate-500">Hệ thống đang cập nhật lịch bay mới. Vui lòng quay lại sau nhé!</p>
          </div>
        )}
      </section>
    </div>
  );
};