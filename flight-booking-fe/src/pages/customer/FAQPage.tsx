import React, { useState } from 'react';
import { Search, ChevronDown, MessageCircleQuestion, ChevronRight } from 'lucide-react';

const FAQS = [
  {
    category: "Đặt vé & Thanh toán",
    questions: [
      { q: "Tôi có thể thanh toán vé máy bay bằng những hình thức nào?", a: "BookingFlight hỗ trợ đa dạng phương thức thanh toán bao gồm: Thẻ tín dụng/ghi nợ (Visa, Mastercard, JCB), Thẻ ATM nội địa, Ví điện tử (MoMo, ZaloPay, VNPay) và Chuyển khoản ngân hàng." },
      { q: "Làm sao để biết tôi đã đặt vé thành công?", a: "Sau khi thanh toán thành công, hệ thống sẽ gửi Email xác nhận kèm theo Mã đặt chỗ (PNR) và vé điện tử (PDF) vào email bạn đã đăng ký. Bạn cũng có thể kiểm tra trong mục 'Chuyến bay của tôi' trên website." },
    ]
  },
  {
    category: "Thay đổi & Hoàn hủy",
    questions: [
      { q: "Tôi có thể đổi tên hành khách sau khi đã xuất vé không?", a: "Việc đổi tên phụ thuộc vào điều kiện hạng vé của từng hãng hàng không. Đa số vé khuyến mãi (Promo/Eco) không cho phép đổi tên. Vui lòng liên hệ tổng đài 1900 1234 để được kiểm tra chi tiết." },
    //   { q: "Làm thế nào để hủy vé và yêu cầu hoàn tiền?", a: "Bạn có thể gửi yêu cầu hủy vé trong phần 'Quản lý đặt chỗ'. Tiền hoàn (nếu vé có điều kiện hoàn) sẽ được chuyển về tài khoản ban đầu trong vòng 7-14 ngày làm việc." },
    ]
  },
  {
    category: "Hành lý & Dịch vụ",
    questions: [
      { q: "Bao nhiêu kg hành lý xách tay được mang lên máy bay?", a: "Thông thường mỗi hành khách được mang 1 kiện hành lý xách tay tối đa 7kg (đối với Vietjet, Pacific) hoặc 10kg/12kg (đối với Vietnam Airlines, Bamboo Airways) tùy theo hạng vé." },
    ]
  }
];

export const FAQPage = () => {
  const [openIndex, setOpenIndex] = useState<string | null>("0-0");
  const [searchQuery, setSearchQuery] = useState("");

  const toggleFAQ = (index: string) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Header Banner đồng bộ với InformationPage */}
      <div className="bg-slate-900 pt-16 pb-32 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-white p-4 rounded-2xl shadow-lg">
              <MessageCircleQuestion className="w-10 h-10 text-orange-500" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-8">Câu hỏi thường gặp</h1>
          
          {/* Thanh tìm kiếm */}
          {/* <div className="max-w-2xl mx-auto relative">
            <input 
              type="text" 
              placeholder="Nhập từ khóa tìm kiếm (VD: hoàn vé, hành lý...)" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-12 pr-4 rounded-2xl text-slate-800 shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-500/50 transition-shadow"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          </div> */}
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 -mt-16 max-w-4xl relative z-10">
        <div className="bg-white rounded-3xl p-6 md:p-12 shadow-xl border border-slate-100">
          
          {/* Breadcrumb điều hướng */}
          <div className="flex items-center gap-2 text-sm font-bold text-blue-600 mb-8 border-b border-slate-100 pb-4">
            <span>Trang chủ</span> <ChevronRight size={14} /> <span>Hỗ trợ</span> <ChevronRight size={14} /> <span className="text-slate-500">FAQ</span>
          </div>

          <div className="space-y-10">
            {FAQS.map((group, groupIdx) => {
              // Logic tìm kiếm cơ bản (Lọc các câu hỏi chứa từ khóa)
              const filteredQuestions = group.questions.filter(
                q => q.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
                     q.a.toLowerCase().includes(searchQuery.toLowerCase())
              );

              if (filteredQuestions.length === 0 && searchQuery) return null;

              return (
                <div key={groupIdx}>
                  <h3 className="text-xl font-black text-slate-800 mb-4">{group.category}</h3>
                  <div className="space-y-3">
                    {filteredQuestions.map((faq, qIdx) => {
                      const idx = `${groupIdx}-${qIdx}`;
                      const isOpen = openIndex === idx;
                      return (
                        <div key={idx} className={`border rounded-2xl overflow-hidden transition-all duration-200 ${isOpen ? 'border-blue-200 shadow-md ring-1 ring-blue-100' : 'border-slate-200'}`}>
                          <button 
                            onClick={() => toggleFAQ(idx)}
                            className={`w-full text-left p-5 flex justify-between items-center font-bold ${isOpen ? 'bg-blue-50 text-blue-700' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
                          >
                            <span className="pr-4">{faq.q}</span>
                            <ChevronDown className={`shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-600' : 'text-slate-400'}`} />
                          </button>
                          
                          {/* Nội dung câu trả lời */}
                          <div 
                            className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                          >
                            <div className="overflow-hidden">
                              <div className="p-5 bg-white text-slate-600 leading-relaxed border-t border-blue-50 text-justify">
                                {faq.a}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Khối Box liên hệ hỗ trợ giống InformationPage */}
            <div className="mt-12 pt-8 border-t border-slate-100 bg-blue-50 p-6 rounded-2xl">
              <p className="text-sm text-blue-800 font-medium">
                Bạn không tìm thấy câu trả lời? Vui lòng liên hệ tổng đài CSKH 24/7 của chúng tôi qua hotline <strong className="text-blue-900 font-black">0335 805 021</strong> hoặc email <strong className="text-blue-900 font-black">support@stingair.vn</strong>.
              </p>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};