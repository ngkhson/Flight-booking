import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { ShieldCheck, FileText, BookOpen, Briefcase, ChevronRight } from 'lucide-react';

// 1. KHO DỮ LIỆU CHỨA NỘI DUNG CÁC TRANG
const PAGE_CONTENT: Record<string, any> = {
  'chinh-sach-bao-mat': {
    title: 'Chính sách bảo mật',
    icon: <ShieldCheck className="w-10 h-10 text-blue-500" />,
    updatedAt: '15/03/2026',
    sections: [
      {
        h: '1. Mục đích thu thập thông tin',
        p: 'BookingFlight thu thập thông tin cá nhân của bạn (Họ tên, Email, Số điện thoại, CCCD/Hộ chiếu) nhằm mục đích xử lý việc đặt vé máy bay, liên hệ hỗ trợ khi có thay đổi về chuyến bay và cải thiện chất lượng dịch vụ.'
      },
      {
        h: '2. Bảo mật dữ liệu',
        p: 'Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn bằng các biện pháp an ninh mạng tiên tiến nhất. Dữ liệu thanh toán được mã hóa chuẩn quốc tế PCI-DSS và không lưu trữ trực tiếp trên máy chủ của chúng tôi.'
      },
      {
        h: '3. Chia sẻ thông tin',
        p: 'Thông tin của hành khách chỉ được chia sẻ cho các Hãng hàng không và đối tác cung cấp dịch vụ liên quan trực tiếp đến chuyến bay của bạn. Chúng tôi tuyệt đối không bán hoặc trao đổi dữ liệu cho bên thứ ba vì mục đích thương mại.'
      }
    ]
  },
  'dieu-khoan-su-dung': {
    title: 'Điều khoản sử dụng',
    icon: <FileText className="w-10 h-10 text-orange-500" />,
    updatedAt: '10/01/2026',
    sections: [
      {
        h: '1. Chấp thuận điều khoản',
        p: 'Bằng việc truy cập và sử dụng nền tảng BookingFlight, bạn đồng ý tuân thủ các điều khoản và điều kiện được quy định tại đây. Nếu không đồng ý, vui lòng ngừng sử dụng dịch vụ.'
      },
      {
        h: '2. Trách nhiệm của người dùng',
        p: 'Khách hàng có trách nhiệm cung cấp thông tin cá nhân, giấy tờ tùy thân chính xác khi đặt vé. Mọi thiệt hại phát sinh do việc cung cấp sai thông tin (sai tên, sai ngày sinh...) sẽ do khách hàng tự chịu trách nhiệm.'
      },
      {
        h: '3. Quy định về giá và thanh toán',
        p: 'Giá vé hiển thị đã bao gồm thuế và phí sân bay. Tuy nhiên, giá vé có thể thay đổi liên tục theo hệ thống của Hãng hàng không cho đến khi bạn hoàn tất việc thanh toán và nhận được mã PNR.'
      }
    ]
  },
  'huong-dan-dat-ve': {
    title: 'Hướng dẫn đặt vé',
    icon: <BookOpen className="w-10 h-10 text-green-500" />,
    updatedAt: '20/02/2026',
    sections: [
      {
        h: 'Bước 1: Tìm kiếm chuyến bay',
        p: 'Tại trang chủ, chọn loại vé (Một chiều/Khứ hồi), nhập Điểm đi, Điểm đến, Ngày khởi hành và Số lượng hành khách. Sau đó nhấn nút "Tìm kiếm".'
      },
      {
        h: 'Bước 2: Lựa chọn chuyến bay & Dịch vụ',
        p: 'So sánh giá vé, giờ bay của các hãng. Bấm "Đặt ngay" vào chuyến bay ưng ý. Hệ thống sẽ chuyển sang giao diện điền thông tin hành khách và cho phép bạn mua thêm Hành lý ký gửi hoặc Suất ăn.'
      },
      {
        h: 'Bước 3: Thanh toán và Nhận vé',
        p: 'Kiểm tra kỹ lại thông tin hành trình. Chọn phương thức thanh toán phù hợp (VNPay, Thẻ ATM, Visa). Ngay sau khi thanh toán thành công, vé điện tử sẽ được gửi trực tiếp vào Email của bạn.'
      }
    ]
  },
  'quy-dinh-hanh-ly': {
    title: 'Quy định hành lý',
    icon: <Briefcase className="w-10 h-10 text-purple-500" />,
    updatedAt: '05/03/2026',
    sections: [
      {
        h: '1. Hành lý xách tay',
        p: 'Mỗi hành khách (trừ em bé dưới 2 tuổi) được phép mang 1 kiện hành lý xách tay chính và 1 túi xách nhỏ. Tổng trọng lượng không vượt quá 7kg (với Vietjet, Pacific) hoặc 10kg/12kg (với Vietnam Airlines, Bamboo). Kích thước tối đa kiện chính là 56cm x 36cm x 23cm.'
      },
      {
        h: '2. Hành lý ký gửi',
        p: 'Hành lý ký gửi không được bao gồm trong các hạng vé phổ thông tiết kiệm. Bạn cần mua thêm trong quá trình đặt vé. Trọng lượng mỗi kiện không được vượt quá 32kg để đảm bảo an toàn lao động cho nhân viên sân bay.'
      },
      {
        h: '3. Vật phẩm cấm mang lên máy bay',
        p: 'Tuyệt đối không mang các chất dễ cháy nổ, vũ khí, chất độc hại, pin sạc dự phòng dung lượng lớn (để trong hành lý ký gửi). Chất lỏng mang theo người không được vượt quá 100ml mỗi lọ.'
      }
    ]
  }
};

// 2. COMPONENT RENDER GIAO DIỆN CHUNG
export const InformationPage = () => {
  // Lấy slug từ URL (VD: /info/chinh-sach-bao-mat)
  const { slug } = useParams<{ slug: string }>();
  
  // Tìm dữ liệu tương ứng, nếu URL bậy bạ thì báo lỗi hoặc Redirect
  const data = slug ? PAGE_CONTENT[slug] : null;

  if (!data) {
    return <Navigate to="/" replace />; // Trở về trang chủ nếu không tìm thấy trang
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Header Banner */}
      <div className="bg-slate-900 pt-16 pb-24 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-white p-4 rounded-2xl shadow-lg">
              {data.icon}
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-4">{data.title}</h1>
          <p className="text-slate-400 text-sm">Cập nhật lần cuối: {data.updatedAt}</p>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 -mt-12 max-w-4xl">
        <div className="bg-white rounded-3xl p-6 md:p-12 shadow-xl border border-slate-100">
          
          <div className="flex items-center gap-2 text-sm font-bold text-blue-600 mb-8 border-b border-slate-100 pb-4">
            <span>Trang chủ</span> <ChevronRight size={14} /> <span>Thông tin</span> <ChevronRight size={14} /> <span className="text-slate-500">{data.title}</span>
          </div>

          <div className="space-y-10">
            {data.sections.map((sec: any, idx: number) => (
              <section key={idx}>
                <h2 className="text-xl font-black text-slate-800 mb-4">{sec.h}</h2>
                <p className="text-slate-600 leading-relaxed text-justify">
                  {sec.p}
                </p>
              </section>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-slate-100 bg-blue-50 p-6 rounded-2xl">
            <p className="text-sm text-blue-800 font-medium">
              Bạn cần hỗ trợ thêm? Vui lòng liên hệ tổng đài CSKH 24/7 của chúng tôi qua hotline <strong className="text-blue-900 font-black">1900 1234</strong> hoặc email <strong className="text-blue-900 font-black">support@bookingflight.vn</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};