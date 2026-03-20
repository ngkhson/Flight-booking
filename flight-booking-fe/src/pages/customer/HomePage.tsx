import { AdvancedSearchWidget } from '../../features/customer/search/AdvancedSearchWidget';
import { PromoFlightCard, type PromoFlight } from '../../features/customer/landing/PromoFlightCard';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

// DỮ LIỆU ẢO (Mock Data) - Sẽ thay bằng API của BE sau này
const MOCK_PROMO_FLIGHTS: PromoFlight[] = [
  {
    id: "f1",
    origin: "Hà Nội",
    destination: "Phú Quốc",
    date: "15/05/2026",
    price: 990000,
    originalPrice: 1500000,
    airline: "Vietnam Airlines",
    imageUrl: "https://images.unsplash.com/photo-1576485290814-1c72aa4faa8e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" // Ảnh biển Phú Quốc
  },
  {
    id: "f2",
    origin: "Hồ Chí Minh",
    destination: "Đà Nẵng",
    date: "20/05/2026",
    price: 650000,
    originalPrice: 1200000,
    airline: "Vietjet Air",
    imageUrl: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" // Ảnh Cầu Vàng
  },
  {
    id: "f3",
    origin: "Hà Nội",
    destination: "Đà Lạt",
    date: "10/06/2026",
    price: 850000,
    originalPrice: 1400000,
    airline: "Bamboo Airways",
    imageUrl: "https://images.unsplash.com/photo-1583417646961-081cb9656847?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" // Ảnh Đà Lạt
  }
];

export const HomePage = () => {

  const navigate = useNavigate(); // <--- 2. KHỞI TẠO NAVIGATE

  // 3. TẠO HÀM XỬ LÝ KHI BẤM TÌM KIẾM
  const handleSearch = (searchParams: any) => {
    // Chuyển hướng người dùng sang trang /search 
    // (Tùy chọn: bạn có thể truyền kèm state để trang Search tự động lấy dữ liệu)
    navigate('/search', { state: searchParams }); 
  };

  return (
    <div>
      {/* Hero Banner Section */}
      <section className="bg-blue-600 py-24 text-center text-white relative">
        {/* Lớp phủ mờ (Optional: Thêm ảnh nền mờ phía sau nếu thích) */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500 to-blue-700 opacity-90"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 drop-shadow-lg">Khám phá thế giới cùng chúng tôi</h2>
          <p className="text-lg md:text-xl mb-12 opacity-90 drop-shadow-md">Đặt vé máy bay giá rẻ, trải nghiệm chuyến bay tuyệt vời nhất.</p>
          
          {/* Widget Tìm kiếm đã hoàn thiện */}
          <div className="text-slate-900">
            <AdvancedSearchWidget onSearch={handleSearch} />
          </div>
        </div>
      </section>

      {/* Khoảng trống bù lại cho Widget */}
      <div className="h-16"></div>

      {/* SECTION: VÉ RẺ TRONG THÁNG */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h3 className="text-3xl font-extrabold text-slate-800">Khuyến Mãi Phổ Biến</h3>
          <p className="text-slate-500 mt-2">Nhanh tay đặt ngay những chuyến bay giá tốt nhất trong tháng</p>
        </div>
        
        {/* Đổ dữ liệu từ mảng MOCK_PROMO_FLIGHTS ra màn hình */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {MOCK_PROMO_FLIGHTS.map((flight) => (
            <PromoFlightCard key={flight.id} flight={flight} />
          ))}
        </div>
        
        <div className="text-center mt-10">
          <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg rounded-full shadow-sm">
            Xem thêm tất cả chuyến bay
          </Button>
        </div>
      </section>
      
    </div>
  );
};