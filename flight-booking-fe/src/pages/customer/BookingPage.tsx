import { useSelector } from 'react-redux';
import { type RootState } from '../../store/store';
import { PassengerForm } from '../../features/customer/booking/PassengerForm';
import { ServiceForm } from '../../features/customer/booking/ServiceForm';
import { CheckoutForm } from '../../features/customer/booking/CheckoutForm'; // Mới
import { BookingSummary } from '../../features/customer/booking/BookingSummary'; // Mới
import { Check } from 'lucide-react';

export const BookingPage = () => {
  const currentStep = useSelector((state: RootState) => state.booking.currentStep);

  const steps = [
    { id: 1, name: 'Hành khách' },
    { id: 2, name: 'Dịch vụ' },
    { id: 3, name: 'Thanh toán' },
  ];

  return (
    <div className="bg-slate-50 min-h-screen pb-20 pt-8">
      <div className="container mx-auto px-4 max-w-5xl">
        
        {/* 1. THANH TIẾN TRÌNH (STEPPER) */}
        <div className="mb-8 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 z-0 rounded"></div>
            {steps.map((step) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center w-1/3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${
                    isActive ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 
                    isCompleted ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {isCompleted ? <Check className="w-5 h-5" /> : step.id}
                  </div>
                  <span className={`mt-2 text-sm font-semibold ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-500' : 'text-slate-500'}`}>
                    {step.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. NỘI DUNG TỪNG BƯỚC */}
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Cột chính (Bên trái) */}
          <div className="w-full lg:w-2/3">
            {currentStep === 1 && <PassengerForm />}
            {currentStep === 2 && <ServiceForm />}
            {currentStep === 3 && <CheckoutForm />} {/* <-- Lắp Bước 3 vào đây */}
          </div>

          {/* Cột phụ (Bên phải - Tóm tắt đơn hàng) */}
          <div className="w-full lg:w-1/3">
            <BookingSummary /> {/* <-- Lắp Bảng tóm tắt vào đây */}
          </div>
          
        </div>

      </div>
    </div>
  );
};