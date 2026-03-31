import React from 'react';
import { Target, Eye, ShieldCheck, HeartHandshake, Plane, Globe } from 'lucide-react';

export const AboutPage = () => {
  const coreValues = [
    { icon: <ShieldCheck size={32} />, title: 'An toàn là trên hết', desc: 'Mọi chuyến bay đối tác đều đạt chuẩn an toàn quốc tế.' },
    { icon: <HeartHandshake size={32} />, title: 'Tận tâm phục vụ', desc: 'Hỗ trợ khách hàng 24/7 với sự nhiệt tình và chuyên nghiệp nhất.' },
    { icon: <Globe size={32} />, title: 'Mạng lưới toàn cầu', desc: 'Kết nối bạn đến hơn 200 quốc gia và vùng lãnh thổ.' },
    { icon: <Plane size={32} />, title: 'Trải nghiệm tối ưu', desc: 'Giao diện đặt vé nhanh chóng, tiện lợi chỉ với 3 bước.' },
  ];

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Hero Banner */}
      <div className="relative h-[40vh] bg-slate-900 flex items-center justify-center overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1920&q=80" 
          alt="Flight" 
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">Về BookingFlight</h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Nền tảng đặt vé máy bay trực tuyến hàng đầu Việt Nam. Chúng tôi mang thế giới đến gần bạn hơn bằng những chuyến bay an toàn và tiết kiệm.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-12 max-w-5xl">
        {/* Vission & Mission */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-start hover:shadow-md transition-shadow">
            <div className="bg-orange-100 text-orange-600 p-4 rounded-2xl mb-6">
              <Target size={32} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-4">Sứ mệnh</h2>
            <p className="text-slate-600 leading-relaxed">
              BookingFlight ra đời với sứ mệnh đơn giản hóa quá trình di chuyển của con người. Chúng tôi ứng dụng công nghệ hiện đại nhất để giúp hàng triệu khách hàng tìm kiếm, so sánh và đặt vé máy bay với mức giá tốt nhất, minh bạch nhất.
            </p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-start hover:shadow-md transition-shadow">
            <div className="bg-blue-100 text-blue-600 p-4 rounded-2xl mb-6">
              <Eye size={32} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-4">Tầm nhìn</h2>
            <p className="text-slate-600 leading-relaxed">
              Trở thành siêu ứng dụng du lịch số 1 Đông Nam Á vào năm 2030. Không chỉ dừng lại ở vé máy bay, chúng tôi hướng tới việc cung cấp một hệ sinh thái du lịch toàn diện bao gồm khách sạn, tour và xe đưa đón.
            </p>
          </div>
        </div>

        {/* Core Values */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-slate-800">Giá trị cốt lõi</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {coreValues.map((val, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center group hover:-translate-y-1 transition-transform">
              <div className="text-blue-600 flex justify-center mb-4 group-hover:scale-110 transition-transform">
                {val.icon}
              </div>
              <h3 className="font-bold text-slate-800 mb-2">{val.title}</h3>
              <p className="text-sm text-slate-500">{val.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};