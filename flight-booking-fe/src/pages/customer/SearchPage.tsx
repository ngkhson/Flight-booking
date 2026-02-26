import { AdvancedSearchWidget } from '../../features/customer/search/AdvancedSearchWidget';

export const SearchPage = () => {
  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Header thu nhỏ chứa thanh tìm kiếm */}
      <div className="bg-blue-600 pb-16 pt-8">
        <div className="container mx-auto px-4">
          <h2 className="text-white text-2xl font-bold mb-6">Kết quả tìm kiếm chuyến bay</h2>
          {/* Tái sử dụng lại Thanh tìm kiếm nhưng chỉnh CSS lại một chút cho gọn */}
          <div className="transform translate-y-8">
             <AdvancedSearchWidget />
          </div>
        </div>
      </div>

      {/* Khoảng trống bù lại cho Widget bị đẩy xuống */}
      <div className="h-16"></div>

      {/* Khung chứa nội dung chính: Chia 2 cột */}
      <div className="container mx-auto px-4 mt-8 flex flex-col lg:flex-row gap-8">
        
        {/* CỘT TRÁI: Bộ lọc (Client-side Filter - Task 2.3) */}
        <aside className="w-full lg:w-1/4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm sticky top-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
              <h3 className="font-bold text-lg text-slate-800">Bộ lọc</h3>
              <button className="text-sm text-blue-600 hover:underline">Xóa lọc</button>
            </div>
            
            {/* Chỗ này bài sau chúng ta sẽ code các Checkbox và Slider giá */}
            <div className="text-slate-500 text-sm py-4 border-2 border-dashed border-slate-200 rounded text-center">
              Khung Bộ Lọc (Sẽ code tiếp)
            </div>
          </div>
        </aside>

        {/* CỘT PHẢI: Danh sách chuyến bay (Flight List - Task 2.2) */}
        <main className="w-full lg:w-3/4">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 text-xl">Hà Nội (HAN) → Hồ Chí Minh (SGN)</h3>
            <span className="text-slate-500">Hiển thị 15 chuyến bay</span>
          </div>

          <div className="space-y-4">
            {/* Chỗ này bài sau chúng ta sẽ code các Thẻ Chuyến Bay (FlightCard) */}
            <div className="h-32 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 border-dashed border-2">
              Khung Thẻ Chuyến Bay 1 (Sẽ code tiếp)
            </div>
            <div className="h-32 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 border-dashed border-2">
              Khung Thẻ Chuyến Bay 2 (Sẽ code tiếp)
            </div>
          </div>
        </main>

      </div>
    </div>
  );
};