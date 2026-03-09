import { useSelector, useDispatch } from 'react-redux';
import { type RootState } from '@/store/store';
import { ChevronLeft, Plane, User, CreditCard, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { prevStep } from '@/store/bookingSlice';
import { PassengerForm } from "@/features/customer/booking/PassengerForm";
import { BaggageSelection } from "@/features/customer/booking/BaggageSelection";

export const BookingPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Lấy dữ liệu tập trung từ Redux
  const {
    selectedFlight,
    currentStep,
    totalAmount,
    searchConfigs,
    addons
  } = useSelector((state: RootState) => state.booking);

  const totalPax = searchConfigs.adults + searchConfigs.children + searchConfigs.infants;

  if (!selectedFlight) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <p className="text-slate-500 mb-4">Bạn chưa chọn chuyến bay nào.</p>
        <Button onClick={() => navigate('/search')}>Quay lại tìm kiếm</Button>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* STEPS INDICATOR */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => currentStep === 1 ? navigate(-1) : dispatch(prevStep())}
            className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-medium transition-colors"
          >
            <ChevronLeft size={20} /> Quay lại
          </button>

          <div className="flex items-center gap-4 md:gap-8">
            <StepItem icon={<User size={16} />} label="Thông tin" active={currentStep >= 1} />
            <div className="w-8 md:w-12 h-[1px] bg-slate-200" />
            <StepItem icon={<ShieldCheck size={16} />} label="Dịch vụ" active={currentStep >= 2} />
            <div className="w-8 md:w-12 h-[1px] bg-slate-200" />
            <StepItem icon={<CreditCard size={16} />} label="Thanh toán" active={currentStep >= 3} />
          </div>

          <div className="hidden lg:block text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Tổng thanh toán</span>
            <span className="text-xl font-black text-orange-500">{totalAmount.toLocaleString('vi-VN')} đ</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-8 flex flex-col lg:flex-row gap-8">
        {/* CỘT TRÁI: FORM NHẬP LIỆU */}
        <main className="w-full lg:w-2/3">
          {currentStep === 1 && (
            <div className="space-y-6">
              <section className="bg-white p-6 rounded-xl border shadow-sm">
                <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <User className="text-blue-600" /> Thông tin đặt chỗ
                </h2>
                <PassengerForm key={totalPax} />
              </section>
            </div>
          )}

          {currentStep === 2 && (
            <section className="bg-white p-6 rounded-xl border shadow-sm">
              <BaggageSelection />
            </section>
          )}
        </main>

        {/* CỘT PHẢI: TÓM TẮT CHI TIẾT GIÁ */}
        <aside className="w-full lg:w-1/3">
          <div className="bg-white rounded-xl border shadow-sm sticky top-24 overflow-hidden">
            <div className="bg-slate-800 p-4 text-white">
              <h3 className="font-bold flex items-center gap-2">
                <Plane size={18} className="text-blue-400" /> Chi tiết chuyến bay
              </h3>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex justify-between items-start pb-4 border-b">
                <div>
                  <p className="font-black text-lg text-slate-800 uppercase">{selectedFlight.flightId}</p>
                  <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-bold uppercase">
                    {selectedFlight.selectedClassName.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 uppercase font-bold">Ngày khởi hành</p>
                  <p className="font-bold text-slate-700">07/04/2026</p>
                </div>
              </div>

              {/* TÓM TẮT GIÁ THEO ĐOÀN KHÁCH */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase">Chi tiết giá vé</p>

                {searchConfigs.adults > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Người lớn (x{searchConfigs.adults})</span>
                    <span className="font-semibold">{(selectedFlight.finalPrice * searchConfigs.adults).toLocaleString('vi-VN')} đ</span>
                  </div>
                )}

                {searchConfigs.children > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Trẻ em (x{searchConfigs.children})</span>
                    <span className="font-semibold">{(selectedFlight.finalPrice * searchConfigs.children).toLocaleString('vi-VN')} đ</span>
                  </div>
                )}

                {searchConfigs.infants > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Em bé (x{searchConfigs.infants})</span>
                    <span className="font-semibold">{(selectedFlight.finalPrice * 0.1 * searchConfigs.infants).toLocaleString('vi-VN')} đ</span>
                  </div>
                )}

                {/* Hiển thị tiền hành lý nếu có */}
                {addons.length > 0 && (
                  <div className="flex justify-between text-sm text-blue-600 font-medium bg-blue-50 p-2 rounded">
                    <span>Hành lý ký gửi thêm</span>
                    <span>
                      {addons.reduce((sum, a) => sum + (a.baggage?.price || 0), 0).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-sm text-green-600">
                  <span>Thuế & phí sân bay</span>
                  <span className="italic">Đã bao gồm</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-900 mt-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800 uppercase">Tổng cộng</span>
                  <div className="text-right">
                    <p className="font-black text-2xl text-orange-500">
                      {totalAmount.toLocaleString('vi-VN')} đ
                    </p>
                    <p className="text-[10px] text-slate-400 italic">Giá đã bao gồm VAT</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

const StepItem = ({ icon, label, active }: { icon: any, label: string, active: boolean }) => (
  <div className={`flex items-center gap-2 ${active ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${active ? 'border-blue-600 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white'}`}>
      {icon}
    </div>
    <span className="text-xs md:text-sm hidden sm:block">{label}</span>
  </div>
);