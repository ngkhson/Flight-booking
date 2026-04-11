import { AdvancedSearchWidget } from '../../features/customer/search/AdvancedSearchWidget';
import { PromoFlightCard, type PromoFlight } from '../../features/customer/landing/PromoFlightCard';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, HeadphonesIcon, CreditCard, Zap,
  MapPin, Calendar, ArrowRight, Mail, Phone, Facebook, Instagram, Twitter, PlaneTakeoff, Loader2, ChevronLeft, ChevronRight
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
  { 
    id: '1', 
    name: "Đà Nẵng, Việt Nam", 
    price: "Vé chỉ từ 599.000 đ", 
    image: "https://tourism.danang.vn/wp-content/uploads/2023/02/tour-du-lich-da-nang-1.jpg" 
  },
  { 
    id: '2', 
    name: "Phú Quốc, Việt Nam", 
    price: "Vé chỉ từ 799.000 đ", 
    image: "https://thoibaotaichinhvietnam.vn/stores/news_dataimages/2024/102024/18/14/phu-quoc20241018144932.1152350.jpg" 
  },
  { 
    id: '3', 
    name: "Vịnh Hạ Long, Việt Nam", 
    price: "Vé chỉ từ 899.000 đ", 
    image: "https://nhandan.vn/special/30-nam-mot-chang-duong-di-san-Vinh-Ha-Long/assets/HLCklusX0n/things-to-do-in-ha-long-bay-banner-1-1920x1080.jpg" 
  },
  {
    id: '4',
    name: 'Hà Nội, Việt Nam',
    price: 'Vé chỉ từ 499.000 đ',
    image: 'https://suckhoedoisong.qltns.mediacdn.vn/Images/thanhloan/2020/11/28/Nam-2030-du-lich-ha-noi-phan-dau-tro-thanh-nganh-kinh-te-mui-nhon-cua-thu-do-19.jpg', // Hình đường phố cổ/lồng đèn
  },
  {
    id: '5',
    name: 'Hồ Chí Minh, Việt Nam',
    price: 'Vé chỉ từ 699.000 đ',
    image: 'https://travel-bus-files.s3.ap-southeast-1.amazonaws.com/images/3601bd2d-4e5c-4a33-bce8-748e684046f3.jpeg', // Hình Landmark 81 / Cảnh đêm
  },
  {
    id: '6',
    name: 'Bali, Indonesia',
    price: 'Vé chỉ từ 3.500.000 đ',
    image: 'https://dulichdaiviet.vn/uploaded/anh-cam-nang-dl/cam-nang-dl-bali/7ngoidenlinhthiengnoitiengnhatbali1.jpg',
  },
  {
    id: '7',
    name: 'Bangkok, Thái Lan',
    price: 'Vé chỉ từ 1.800.000 đ',
    image: 'https://vietlandtravel.vn/upload/images/bangkok-ve-dem.jpg',
  },
  {
    id: '8',
    name: 'Singapore',
    price: 'Vé chỉ từ 2.100.000 đ',
    image: 'https://images.trvl-media.com/place/6047873/15d3ae30-ef33-406e-971f-9520c03f1089.jpg', // Marina Bay Sands
  },
  {
    id: '9',
    name: 'Kuala Lumpur, Malaysia',
    price: 'Vé chỉ từ 1.500.000 đ',
    image: 'https://res.klook.com/image/upload/fl_lossy.progressive,q_60/Mobile/City/o52yyykrizo0b4th1uuk.jpg', // Tháp đôi Petronas
  },
  {
    id: '10',
    name: 'Tokyo, Nhật Bản',
    price: 'Vé chỉ từ 6.500.000 đ',
    image: 'https://ik.imagekit.io/tvlk/blog/2022/06/shutterstock_1396013432.jpg',
  }
];

const MOCK_ARTICLES = [
  {
    id: '1',
    title: 'Cẩm nang du lịch Phú Quốc: Chơi gì, ăn gì, ở đâu?',
    category: 'Kinh Nghiệm',
    date: 'Cập nhật mới nhất',
    image: 'https://cdn.media.dulich24.com.vn/diemden/ao-phu-quoc-3506/phu-quoc.jpg',
    url: 'https://dulichkhampha24.com/kinh-nghiem-du-lich-phu-quoc.html', // Link thật VnExpress
  },
  {
    id: '2',
    title: 'Bản đồ ẩm thực và cẩm nang khám phá thủ đô Hà Nội',
    category: 'Điểm Đến',
    date: 'Cập nhật mới nhất',
    image: 'https://banhtombaloc.vn/medias/2024/05/5.jpg',
    url: 'https://vietnammedia.com.vn/ban-do-food-tour-ha-noi-cam-nang-du-lich-am-thuc-ha-noi', // Link thật VnExpress
  },
  {
    id: '3',
    title: 'Kinh nghiệm du lịch tự túc Bangkok, Thái Lan',
    category: 'Quốc Tế',
    date: 'Cập nhật mới nhất',
    image: 'https://file.hstatic.net/200000561069/article/bangkok-tl_3619350a59554298be1b892c3592c023.jpg',
    url: 'https://phuotvivu.com/blog/kinh-nghiem-du-lich/thai-lan/bangkok/', // Link thật VnExpress
  }
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

  // --- LOGIC CHO CAROUSEL ĐIỂM ĐẾN ---
  const [currentDestIndex, setCurrentDestIndex] = useState(0);

  // Tự động chuyển ảnh sau mỗi 10 giây
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDestIndex((prev) => (prev === MOCK_DESTINATIONS.length - 1 ? 0 : prev + 1));
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const nextDestSlide = () => {
    setCurrentDestIndex((prev) => (prev === MOCK_DESTINATIONS.length - 1 ? 0 : prev + 1));
  };

  const prevDestSlide = () => {
    setCurrentDestIndex((prev) => (prev === 0 ? MOCK_DESTINATIONS.length - 1 : prev - 1));
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

      {/* 3. ĐIỂM ĐẾN PHỔ BIẾN (CAROUSEL) */}
      <section className="bg-slate-50 py-16">
        <div className="container mx-auto px-4">
          
          {/* TIÊU ĐỀ VÀ NÚT ĐƯỢC CĂN GIỮA TOÀN BỘ */}
          <div className="flex flex-col items-center text-center mb-10">
            <h3 className="text-3xl md:text-4xl font-extrabold text-slate-800">
              Điểm Đến Yêu Thích
            </h3>
            <p className="text-slate-500 mt-3 text-lg">
              Cảm hứng cho chuyến đi tiếp theo của bạn
            </p>
            {/* <Button variant="link" className="text-blue-600 font-bold hover:text-blue-800 mt-2 flex">
              Khám phá thêm <ArrowRight className="ml-1 w-4 h-4" />
            </Button> */}
          </div>

          {/* KHUNG SLIDER NHỎ LẠI: 
              - max-w-4xl: Giới hạn chiều rộng tối đa (khoảng 896px)
              - mx-auto: Canh giữa toàn bộ slider
              - h-[350px] md:h-[450px]: Giảm chiều cao so với bản cũ
          */}
          <div className="relative w-full max-w-6xl mx-auto h-[350px] md:h-[450px] rounded-3xl overflow-hidden group shadow-2xl">
            {/* Các lớp ảnh mờ dần */}
            {MOCK_DESTINATIONS.map((dest, index) => (
              <div
                key={dest.id}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  index === currentDestIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
              >
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"></div>
                
                {/* Nội dung trên ảnh được canh giữa */}
                <div className="absolute bottom-0 left-0 w-full p-6 pb-12 md:pb-16 flex flex-col items-center">
                  <h4 className="text-white text-3xl md:text-4xl font-black flex items-center justify-center gap-2 mb-2 tracking-tight drop-shadow-lg text-center">
                    <MapPin className="w-8 h-8 text-orange-500" /> {dest.name}
                  </h4>
                </div>
              </div>
            ))}

            {/* MŨI TÊN CHUYỂN SLIDE MỜ Ở 2 BÊN */}
            <button
              onClick={prevDestSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-white/20 text-white backdrop-blur-md hover:bg-white/40 transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextDestSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-white/20 text-white backdrop-blur-md hover:bg-white/40 transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* DẤU CHẤM TRÒN CHỈ THỊ (DOTS INDICATOR) - ĐƯA RA GIỮA */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {MOCK_DESTINATIONS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentDestIndex(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentDestIndex ? 'bg-orange-500 w-6' : 'bg-white/50 w-2 hover:bg-white'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. TẠI SAO CHỌN CHÚNG TÔI (USPs) */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h3 className="text-3xl font-extrabold text-slate-800">Tại sao chọn STINGAIR?</h3>
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
              // 👇 Thay div bằng thẻ a, thêm href và target="_blank" để mở tab mới
              <a 
                key={article.id} 
                href={article.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100 group cursor-pointer block"
              >
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={article.image} 
                    alt={article.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                  />
                  <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide shadow-sm">
                    {article.category}
                  </span>
                </div>
                <div className="p-6">
                  <p className="text-slate-400 text-sm flex items-center gap-2 mb-3 font-medium">
                    <Calendar className="w-4 h-4" /> {article.date}
                  </p>
                  <h4 className="text-xl font-bold text-slate-800 leading-snug group-hover:text-blue-600 transition-colors">
                    {article.title}
                  </h4>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      

    </div>
  );
};