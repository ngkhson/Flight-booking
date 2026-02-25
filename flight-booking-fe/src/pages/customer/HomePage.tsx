import { AdvancedSearchWidget } from '../../features/customer/search/AdvancedSearchWidget';

export const HomePage = () => {
  return (
    <div>
      {/* Hero Banner Section */}
      <section className="bg-blue-600 py-24 text-center text-white relative">
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4">Khám phá thế giới cùng chúng tôi</h2>
          <p className="text-lg md:text-xl mb-12 opacity-90">Đặt vé máy bay giá rẻ, trải nghiệm chuyến bay tuyệt vời nhất.</p>
          
          {/* Nhúng Widget tìm kiếm vào đây */}
          <AdvancedSearchWidget />
        </div>
      </section>

      {/* Khoảng trống để bù lại phần widget bị đẩy xuống (translate-y-8) */}
      <div className="h-16"></div>

      {/* Section Vé rẻ trong tháng (Task 1.3) */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-2xl font-bold mb-6 text-slate-800">Khuyến mãi phổ biến</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Placeholder cho các card khuyến mãi */}
          <div className="h-48 bg-slate-200 rounded-xl animate-pulse"></div>
          <div className="h-48 bg-slate-200 rounded-xl animate-pulse"></div>
          <div className="h-48 bg-slate-200 rounded-xl animate-pulse"></div>
        </div>
      </section>
    </div>
  );
};