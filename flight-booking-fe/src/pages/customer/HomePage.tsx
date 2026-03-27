import { AdvancedSearchWidget } from '../../features/customer/search/AdvancedSearchWidget';
import { PromoFlightCard, type PromoFlight } from '../../features/customer/landing/PromoFlightCard';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, HeadphonesIcon, CreditCard, Zap,
  MapPin, Calendar, ArrowRight, Mail, Phone, Facebook, Instagram, Twitter, PlaneTakeoff, Loader2
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { flightApi } from '@/api/flightApi';
import { getAirportImage } from '@/constants/airportImages';

// ==========================================
// 1. MOCK DATA (Dữ liệu giả lập)
// ==========================================

// const MOCK_PROMO_FLIGHTS: PromoFlight[] = [
//   { id: "f1", origin: "Hà Nội", destination: "Phú Quốc", date: "15/05/2026", price: 990000, originalPrice: 1500000, airline: "Vietnam Airlines", imageUrl: "https://images.unsplash.com/photo-1576485290814-1c72aa4faa8e?auto=format&fit=crop&w=800&q=80" },
//   { id: "f2", origin: "Hồ Chí Minh", destination: "Đà Nẵng", date: "20/05/2026", price: 650000, originalPrice: 1200000, airline: "Vietjet Air", imageUrl: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=800&q=80" },
//   { id: "f3", origin: "Hà Nội", destination: "Đà Lạt", date: "10/06/2026", price: 850000, originalPrice: 1400000, airline: "Bamboo Airways", imageUrl: "https://images.unsplash.com/photo-1583417646961-081cb9656847?auto=format&fit=crop&w=800&q=80" }
// ];

const MOCK_DESTINATIONS = [
  { id: 1, name: "Đà Nẵng", price: "Từ 599.000đ", image: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=600&q=80", colSpan: "md:col-span-2 md:row-span-2" },
  { id: 2, name: "Phú Quốc", price: "Từ 799.000đ", image: "https://images.unsplash.com/photo-1576485290814-1c72aa4faa8e?auto=format&fit=crop&w=600&q=80", colSpan: "md:col-span-1 md:row-span-1" },
  { id: 3, name: "Vịnh Hạ Long", price: "Từ 899.000đ", image: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80", colSpan: "md:col-span-1 md:row-span-1" },
  { id: 4, name: "Bangkok", price: "Từ 1.299.000đ", image: "https://images.unsplash.com/photo-1508009603885-247a505b822d?auto=format&fit=crop&w=600&q=80", colSpan: "md:col-span-2 md:row-span-1" },
];

const MOCK_ARTICLES = [
  { id: 1, title: "Bí kíp xếp hành lý siêu gọn cho chuyến đi 5 ngày", date: "24/03/2026", category: "Cẩm nang", image: "https://images.unsplash.com/photo-1551524164-687a54483750?auto=format&fit=crop&w=600&q=80" },
  { id: 2, title: "Top 10 bãi biển hoang sơ đẹp nhất Châu Á 2026", date: "20/03/2026", category: "Điểm đến", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80" },
  { id: 3, title: "Ăn gì ở Đà Lạt? Bản đồ ẩm thực mới nhất", date: "15/03/2026", category: "Ẩm thực", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80" }
];

const DESTINATION_IMAGES: Record<string, string> = {
  'PQC': 'https://images.unsplash.com/photo-1576485290814-1c72aa4faa8e?auto=format&fit=crop&w=800&q=80',
  'DAD': 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=800&q=80',
  'DLI': 'https://images.unsplash.com/photo-1583417646961-081cb9656847?auto=format&fit=crop&w=800&q=80',
  'SGN': 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=800&q=80',
  'HAN': 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=800&q=80',
};
const DEFAULT_IMG = "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80";


// ==========================================
// 2. COMPONENT CHÍNH
// ==========================================

export const HomePage = () => {
  const navigate = useNavigate();

  // 👇 1. KHAI BÁO STATE QUẢN LÝ DỮ LIỆU 👇
  const [promoFlights, setPromoFlights] = useState<PromoFlight[]>([]);
  const [loadingPromo, setLoadingPromo] = useState(true);

  // 👇 2. GỌI API LẤY 3 CHUYẾN BAY MỚI NHẤT 👇
  useEffect(() => {
  const fetchHomePromotions = async () => {
    try {
      const priorityCodes = ['HAN', 'DAD', 'PQC'];

      const getCleanCode = (str: string): string => {
        if (!str) return "";
        const match = str.match(/\(([A-Z]{3})\)/);
        if (match) return match[1];
        return str.trim().toUpperCase().slice(-3);
      };

      const res: any = await flightApi.getAllFlights(1, 30);
      const flightArray: any[] = res.result?.data || res.result?.content || res.result || [];

      const finalPromos: any[] = [];
      const seenCities = new Set<string>();

      if (flightArray.length > 0) {
        // --- BƯỚC A: Ưu tiên 3 địa điểm fix sẵn ---
        priorityCodes.forEach((pCode) => {
          const foundFlight = flightArray.find((f: any) => getCleanCode(f.destination) === pCode);

          if (foundFlight && !seenCities.has(getCleanCode(foundFlight.destination))) {
            const minPrice = foundFlight.classes?.length > 0
              ? Math.min(...foundFlight.classes.map((c: any) => c.basePrice)) : 0;

            finalPromos.push({
              ...foundFlight,
              date: foundFlight.departureTime, // 👇 ĐẢM BẢO CÓ TRƯỜNG NÀY
              price: minPrice,
              originalPrice: minPrice * 1.2,
              imageUrl: getAirportImage(pCode)
            });
            seenCities.add(getCleanCode(foundFlight.destination));
          }
        });

        // --- BƯỚC B: Fallback lấy thêm các chuyến khác ---
        if (finalPromos.length < 3) {
          for (const item of flightArray) {
            if (finalPromos.length >= 3) break;
            const destCode = getCleanCode(item.destination);
            
            if (!seenCities.has(destCode)) {
              const minPrice = item.classes?.length > 0
                ? Math.min(...item.classes.map((c: any) => c.basePrice)) : 0;

              finalPromos.push({
                ...item,
                date: item.departureTime, // 👇 ĐẢM BẢO CÓ TRƯỜNG NÀY
                price: minPrice,
                originalPrice: minPrice * 1.2,
                imageUrl: getAirportImage(destCode)
              });
              seenCities.add(destCode);
            }
          }
        }
      }
      setPromoFlights(finalPromos);
    } catch (error) {
      console.error("Lỗi fetch promo:", error);
    } finally {
      setLoadingPromo(false);
    }
  };

  fetchHomePromotions();
}, []);

  const handleSearch = (searchParams: any) => {
    navigate('/search', { state: searchParams });
  };

  return (
    <div className="bg-white">
      {/* 1. HERO SECTION (Khu vực trung tâm) */}
      <section className="bg-blue-600 pt-24 pb-32 text-center text-white relative">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500 to-blue-800 opacity-90"></div>
        {/* Họa tiết nền trang trí (Tùy chọn) */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay"></div>

        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-4xl md:text-6xl font-extrabold mb-6 drop-shadow-lg tracking-tight">Khám phá thế giới cùng chúng tôi</h2>
          <p className="text-lg md:text-xl mb-12 opacity-90 drop-shadow-md font-medium">Đặt vé máy bay giá rẻ, trải nghiệm chuyến bay tuyệt vời nhất chỉ với vài cú click.</p>

          <div className="text-slate-900 max-w-7xl mx-auto">
            <AdvancedSearchWidget onSearch={handleSearch} />
          </div>
        </div>
      </section>

      {/* Khoảng trống bù lại cho Widget Search trồi lên */}
      <div className="h-20"></div>

      {/* 2. PROMO FLIGHTS (Khuyến mãi lấy từ Database thật) */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-extrabold text-slate-800">Ưu Đãi Đặc Biệt Tháng Này</h3>
          <p className="text-slate-500 mt-3 text-lg">Săn vé máy bay giá hời đến những địa điểm hot nhất</p>
        </div>

        {/* 👇 LOGIC HIỂN THỊ THÔNG MINH 👇 */}
        {loadingPromo ? (
          // Khung Loading khi đang gọi API
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
            <p className="text-slate-500 font-medium">Đang tải ưu đãi hot nhất...</p>
          </div>
        ) : promoFlights.length > 0 ? (
          // Hiển thị danh sách vé khi có data
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {promoFlights.map((flight) => (
              <PromoFlightCard key={flight.id} flight={flight} />
            ))}
          </div>
        ) : (
          // Hiển thị nếu mảng rỗng
          <div className="text-center bg-slate-50 p-10 rounded-2xl border shadow-sm">
            <p className="text-slate-500 text-lg">Hiện tại chưa có ưu đãi nào. Vui lòng quay lại sau!</p>
          </div>
        )}

        <div className="text-center mt-12">
          {/* 👇 THÊM onClick ĐỂ CHUYỂN TRANG 👇 */}
          <Button
            onClick={() => navigate('/promotions')}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-6 text-base font-bold rounded-full shadow-sm transition-all hover:shadow-md"
          >
            Xem tất cả ưu đãi <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* 3. ĐIỂM ĐẾN PHỔ BIẾN */}
      <section className="bg-slate-50 py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-10">
            <div>
              <h3 className="text-3xl font-extrabold text-slate-800">Điểm Đến Yêu Thích</h3>
              <p className="text-slate-500 mt-3 text-lg">Cảm hứng cho chuyến đi tiếp theo của bạn</p>
            </div>
            <Button variant="link" className="text-blue-600 font-bold hidden md:flex hover:text-blue-800">
              Khám phá thêm <ArrowRight className="ml-1 w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-auto md:h-[500px]">
            {MOCK_DESTINATIONS.map((dest) => (
              <div
                key={dest.id}
                className={`relative rounded-2xl overflow-hidden cursor-pointer group shadow-md ${dest.colSpan}`}
              >
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-6">
                  <h4 className="text-white text-2xl font-bold flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-orange-400" /> {dest.name}
                  </h4>
                  <p className="text-white/80 font-medium mt-1">{dest.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. TẠI SAO CHỌN CHÚNG TÔI (USPs) */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h3 className="text-3xl font-extrabold text-slate-800">Tại sao chọn BookingFlight?</h3>
          <p className="text-slate-500 mt-3 text-lg">Những lý do khiến hàng triệu khách hàng tin tưởng chúng tôi</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="flex flex-col items-center text-center group">
            <div className="w-20 h-20 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 mb-6 group-hover:-translate-y-2 transition-transform duration-300">
              <Zap size={40} strokeWidth={1.5} />
            </div>
            <h4 className="text-xl font-bold text-slate-800 mb-3">Đặt vé siêu tốc</h4>
            <p className="text-slate-500 leading-relaxed">Hệ thống tìm kiếm thông minh giúp bạn so sánh và đặt vé chỉ trong 3 phút.</p>
          </div>

          <div className="flex flex-col items-center text-center group">
            <div className="w-20 h-20 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-500 mb-6 group-hover:-translate-y-2 transition-transform duration-300">
              <ShieldCheck size={40} strokeWidth={1.5} />
            </div>
            <h4 className="text-xl font-bold text-slate-800 mb-3">Minh bạch giá cả</h4>
            <p className="text-slate-500 leading-relaxed">Không phí ẩn, không phụ thu bất hợp lý. Giá bạn thấy chính là giá bạn trả.</p>
          </div>

          <div className="flex flex-col items-center text-center group">
            <div className="w-20 h-20 rounded-2xl bg-green-100 flex items-center justify-center text-green-600 mb-6 group-hover:-translate-y-2 transition-transform duration-300">
              <CreditCard size={40} strokeWidth={1.5} />
            </div>
            <h4 className="text-xl font-bold text-slate-800 mb-3">Thanh toán an toàn</h4>
            <p className="text-slate-500 leading-relaxed">Bảo mật tuyệt đối thông tin thẻ với công nghệ mã hóa tiêu chuẩn quốc tế.</p>
          </div>

          <div className="flex flex-col items-center text-center group">
            <div className="w-20 h-20 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600 mb-6 group-hover:-translate-y-2 transition-transform duration-300">
              <HeadphonesIcon size={40} strokeWidth={1.5} />
            </div>
            <h4 className="text-xl font-bold text-slate-800 mb-3">Hỗ trợ 24/7</h4>
            <p className="text-slate-500 leading-relaxed">Đội ngũ CSKH chuyên nghiệp luôn sẵn sàng đồng hành cùng bạn mọi lúc mọi nơi.</p>
          </div>
        </div>
      </section>

      {/* 6. BÀI VIẾT MỚI NHẤT (Blog) */}
      <section className="bg-slate-50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-extrabold text-slate-800">Cẩm Nang Du Lịch</h3>
            <p className="text-slate-500 mt-3 text-lg">Mẹo hay và thông tin hữu ích cho chuyến đi của bạn</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {MOCK_ARTICLES.map(article => (
              <div key={article.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow border border-slate-100 group cursor-pointer">
                <div className="relative h-48 overflow-hidden">
                  <img src={article.image} alt={article.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">
                    {article.category}
                  </span>
                </div>
                <div className="p-6">
                  <p className="text-slate-400 text-sm flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4" /> {article.date}
                  </p>
                  <h4 className="text-xl font-bold text-slate-800 leading-snug group-hover:text-blue-600 transition-colors">
                    {article.title}
                  </h4>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. FOOTER (Chân trang) */}
      <footer className="bg-slate-900 text-slate-300 pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 border-b border-slate-800 pb-12 mb-8">

            {/* Cột 1: Thông tin */}
            <div>
              <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
                <PlaneTakeoff className="text-orange-500" /> BookingFlight
              </h2>
              <p className="text-slate-400 leading-relaxed mb-6">
                Nền tảng đặt vé máy bay trực tuyến hàng đầu Việt Nam. Mang thế giới đến gần bạn hơn bằng những chuyến bay an toàn và tiết kiệm.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"><Facebook size={18} /></a>
                <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-pink-600 hover:text-white transition-colors"><Instagram size={18} /></a>
                <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-400 hover:text-white transition-colors"><Twitter size={18} /></a>
              </div>
            </div>

            {/* Cột 2: Về chúng tôi */}
            <div>
              <h4 className="text-white font-bold text-lg mb-6">Về chúng tôi</h4>
              <ul className="space-y-4">
                <li><a href="#" className="hover:text-white transition-colors">Giới thiệu công ty</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cơ hội việc làm</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Chính sách bảo mật</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Điều khoản sử dụng</a></li>
              </ul>
            </div>

            {/* Cột 3: Hỗ trợ */}
            <div>
              <h4 className="text-white font-bold text-lg mb-6">Hỗ trợ khách hàng</h4>
              <ul className="space-y-4">
                <li><a href="#" className="hover:text-white transition-colors">Hướng dẫn đặt vé</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Câu hỏi thường gặp (FAQ)</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Quy định hành lý</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Gửi yêu cầu hỗ trợ</a></li>
              </ul>
            </div>

            {/* Cột 4: Liên hệ */}
            <div>
              <h4 className="text-white font-bold text-lg mb-6">Liên hệ</h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                  <span>Tầng 12, Tòa nhà Landmark, 72 Tôn Thất Thuyết, Cầu Giấy, Hà Nội</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-slate-500 shrink-0" />
                  <span>1900 1234 (24/7)</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-slate-500 shrink-0" />
                  <span>support@bookingflight.vn</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="text-center text-slate-500 text-sm">
            <p>&copy; {new Date().getFullYear()} BookingFlight. Tất cả các quyền được bảo lưu.</p>
          </div>
        </div>
      </footer>

    </div>
  );
};