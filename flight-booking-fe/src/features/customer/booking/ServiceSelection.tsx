import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { type RootState } from '@/store/store';
import { Briefcase, Utensils, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axiosClient from '@/api/axiosClient';
import { saveAddons, setBookingResult, nextStep } from '@/store/bookingSlice';

interface AncillaryService {
  id: string;
  code: string;
  type: 'BAGGAGE' | 'MEAL';
  name: string;
  price: number;
}

export const ServiceSelection = () => {
  const dispatch = useDispatch();
  const { 
    passengers, 
    searchConfigs, 
    selectedFlight, 
    contactInfo 
  } = useSelector((state: RootState) => state.booking);

  const [services, setServices] = useState<{ baggages: AncillaryService[], meals: AncillaryService[] }>({
    baggages: [],
    meals: []
  });
  const [loading, setLoading] = useState(true);
  const [selections, setSelections] = useState<Record<number, Record<string, string>>>({});

  // Đặt cái này bên trong Component
  const eligiblePax = passengers ? passengers.slice(0, searchConfigs.adults + searchConfigs.children) : [];

  // Khởi tạo selections an toàn hơn
  useEffect(() => {
    if (eligiblePax.length > 0 && Object.keys(selections).length === 0) {
      const initial: Record<number, Record<string, string>> = {};
      eligiblePax.forEach((_, idx) => {
        initial[idx] = { BAGGAGE: 'none', MEAL: 'none' };
      });
      setSelections(initial);
    }
  }, [eligiblePax]);

  useEffect(() => {
    const fetchServices = async () => {
      try {

        const response: any = await axiosClient.get('/ancillary-catalogs');

        const allServices = response.result;

        if (Array.isArray(allServices)) {
          setServices({
            baggages: allServices.filter((s: any) => s.type === 'BAGGAGE'),
            meals: allServices.filter((s: any) => s.type === 'MEAL')
          });
        }
      } catch (error) {
        console.error("Lỗi 401 hoặc lỗi mạng:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const handleSelect = (pIdx: number, type: 'BAGGAGE' | 'MEAL', sId: string) => {
    setSelections(prev => ({
      ...prev,
      [pIdx]: { ...prev[pIdx], [type]: sId }
    }));
  };

  const onConfirm = async () => {
    // TẠO finalAddons TRƯỚC
    const finalAddons: any[] = [];
    Object.entries(selections).forEach(([pIdx, types]) => {
      Object.entries(types).forEach(([type, sId]) => {
        if (sId !== 'none') {
          const serviceList = type === 'BAGGAGE' ? services.baggages : services.meals;
          const found = serviceList.find(s => s.id === sId);
          if (found) {
            finalAddons.push({
              passengerIndex: Number(pIdx),
              type,
              service: found
            });
          }
        }
      });
    });

    // Cập nhật addons vào Redux (để hiển thị cột bên phải)
    dispatch(saveAddons(finalAddons));

    // BẮT ĐẦU GỌI API TẠO ĐƠN
    setLoading(true);
    try {
      const bookingPayload = {
        contactName: contactInfo?.contactName || passengers[0]?.fullName || "Khách hàng",
        contactEmail: contactInfo?.contactEmail || "email@example.com",
        contactPhone: contactInfo?.contactPhone || "0999999999",
        currency: "VND",
        promotionCode: "", 
        flights: [
          {
            // Sửa lỗi ở đây: Đảm bảo lấy ID từ selectedFlight (nếu null thì dùng string rỗng để tránh văng app)
            flightId: selectedFlight?.flightId || "", 
            flightClassId: selectedFlight?.classId || "" 
          }
        ],
        passengers: passengers.map((p: any) => ({
          firstName: p.fullName.split(' ').slice(0, -1).join(' ') || p.fullName, // Tách họ
          lastName: p.fullName.split(' ').slice(-1).join(' ') || p.fullName,      // Tách tên
          dateOfBirth: p.dob || "2000-01-01",
          gender: p.gender === "Nam" ? "MALE" : "FEMALE",
          type: "ADULT" // Tạm fix cứng, bạn có thể map từ logic độ tuổi nếu cần
        })),
        
        // 3. SỬA CHỮ `addons.map` THÀNH `finalAddons.map`
        bookingAncillaries: finalAddons.map((a: any) => ({
          catalogId: a.service.id,
          passengerIndex: a.passengerIndex,
          segmentNo: 1 
        }))
      };

      console.log("✈️ ĐÂY LÀ DỮ LIỆU PAYLOAD GỬI LÊN BE:", JSON.stringify(bookingPayload, null, 2));

      const response: any = await axiosClient.post('/bookings', bookingPayload);

      if (response.code === 0 || response.code === 1000) {
        // Lưu kết quả BE trả về
        dispatch(setBookingResult({
          bookingId: response.result.id,
          pnrCode: response.result.pnrCode,
          totalAmount: response.result.totalAmount
        }));
        
        // Chuyển sang Step 3
        dispatch(nextStep());
      }
    } catch (error) {
      console.error("Lỗi tạo đơn hàng:", error);
      alert("Lỗi kết nối. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600" /></div>;

  console.log("flightId đang gửi:", selectedFlight?.flightId);
  // Em bé không chọn dịch vụ
  // const eligiblePax = passengers.slice(0, searchConfigs.adults + searchConfigs.children);

  const calculateCurrentTotal = () => {
    return Object.values(selections).reduce((sum, types) => {
      let s = 0;
      // Tìm trong danh sách hành lý
      if (types['BAGGAGE'] && types['BAGGAGE'] !== 'none') {
        const b = services.baggages.find(i => i.id === types['BAGGAGE']);
        if (b) s += b.price;
      }
      // Tìm trong danh sách suất ăn
      if (types['MEAL'] && types['MEAL'] !== 'none') {
        const m = services.meals.find(i => i.id === types['MEAL']);
        if (m) s += m.price;
      }
      return sum + s;
    }, 0);
  };



  return (
    <div className="space-y-6">
      <Tabs defaultValue="baggage" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-14 bg-slate-100 p-1">
          <TabsTrigger value="baggage" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-600 font-bold">
            <Briefcase size={18} /> Hành lý
          </TabsTrigger>
          <TabsTrigger value="meal" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-600 font-bold">
            <Utensils size={18} /> Suất ăn
          </TabsTrigger>
        </TabsList>

        <TabsContent value="baggage" className="mt-6 space-y-6">
          {eligiblePax.map((p, idx) => (
            <ServiceCard
              key={idx}
              passengerName={p.fullName}
              options={services.baggages}
              selectedId={selections[idx]?.['BAGGAGE'] || 'none'}
              onSelect={(id: string) => handleSelect(idx, 'BAGGAGE', id)}
            />
          ))}
        </TabsContent>

        <TabsContent value="meal" className="mt-6 space-y-6">
          {eligiblePax.map((p, idx) => (
            <ServiceCard
              key={idx}
              passengerName={p.fullName}
              options={services.meals}
              selectedId={selections[idx]?.['MEAL'] || 'none'}
              onSelect={(id: string) => handleSelect(idx, 'MEAL', id)}
            />
          ))}
        </TabsContent>
      </Tabs>

      <div className="sticky bottom-0 bg-white p-4 border rounded-xl shadow-[0_-4px_10px_rgba(0,0,0,0.05)] flex justify-between items-center">
        <div>
          <p className="text-xs text-slate-500 uppercase font-bold">Dịch vụ đã chọn</p>
          <p className="text-xl font-black text-blue-600">
            {/* Hàm tính nhanh tổng tiền addon tại chỗ để hiển thị */}
            +{calculateCurrentTotal().toLocaleString()} đ
          </p>
        </div>
        <Button onClick={onConfirm} className="bg-blue-600 hover:bg-blue-700 h-12 px-8 font-bold">
          Tiếp tục thanh toán
        </Button>
      </div>
    </div>
  );
};

// Component con để render từng dòng chọn dịch vụ
const ServiceCard = ({ passengerName, options, selectedId, onSelect }: any) => (
  <div className="border rounded-xl p-4 bg-white">
    <p className="text-sm font-bold text-slate-500 mb-3 uppercase">Hành khách: {passengerName}</p>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
      <div
        onClick={() => onSelect('none')}
        className={`p-3 border rounded-lg cursor-pointer text-center text-xs font-bold transition-all ${selectedId === 'none' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-100'}`}
      >
        Không chọn
      </div>
      {options.map((opt: any) => (
        <div
          key={opt.id}
          onClick={() => onSelect(opt.id)}
          className={`p-3 border rounded-lg cursor-pointer transition-all flex flex-col justify-center ${selectedId === opt.id ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-slate-200'}`}
        >
          <p className="text-xs font-bold truncate">{opt.name}</p>
          <p className="text-[10px] text-blue-500 font-bold">+{opt.price.toLocaleString()} đ</p>
        </div>
      ))}
    </div>
  </div>
);