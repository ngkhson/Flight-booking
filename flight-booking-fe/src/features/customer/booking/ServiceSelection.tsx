import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { type RootState } from '@/store/store';
import { Briefcase, Utensils, Loader2, PlaneTakeoff, PlaneLanding } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axiosClient from '@/api/axiosClient';
import { saveAddons, nextStep } from '@/store/bookingSlice';
import { useLocation } from 'react-router-dom';

interface AncillaryService {
  id: string;
  code: string;
  type: 'BAGGAGE' | 'MEAL';
  name: string;
  price: number;
}

export const ServiceSelection = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { passengers, searchConfigs } = useSelector((state: RootState) => state.booking);
  
  // Xác định xem có phải là vé Khứ hồi không (thông qua location.state từ trang Search truyền sang)
  const isRoundTrip = location.state?.isRoundTrip || false;

  const [services, setServices] = useState<{ baggages: AncillaryService[], meals: AncillaryService[] }>({
    baggages: [],
    meals: []
  });
  const [loading, setLoading] = useState(true);
  
  // State nâng cấp: Chứa data của Lượt đi (segment 1) và Lượt về (segment 2)
  const [selections, setSelections] = useState<Record<number, Record<number, Record<string, string>>>>({});
  
  // State tab hiện tại (1: Lượt đi, 2: Lượt về)
  const [activeSegment, setActiveSegment] = useState<number>(1);

  const eligiblePax = passengers ? passengers.slice(0, searchConfigs.adults + searchConfigs.children) : [];

  // Khởi tạo trạng thái ban đầu là 'none' cho tất cả hành khách, cho CẢ 2 LƯỢT
  useEffect(() => {
    if (eligiblePax.length > 0 && Object.keys(selections).length === 0) {
      const initial: Record<number, Record<number, Record<string, string>>> = {};
      eligiblePax.forEach((_, idx) => {
        initial[idx] = {
          1: { BAGGAGE: 'none', MEAL: 'none' }, // Lượt đi
          2: { BAGGAGE: 'none', MEAL: 'none' }  // Lượt về
        };
      });
      setSelections(initial);
    }
  }, [eligiblePax, isRoundTrip]);

  // Gọi API lấy danh sách Dịch vụ
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
        console.error("Lỗi lấy danh sách dịch vụ:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  // Xử lý khi người dùng click chọn dịch vụ (Lưu kèm Segment)
  const handleSelect = (pIdx: number, type: 'BAGGAGE' | 'MEAL', sId: string) => {
    setSelections(prev => ({
      ...prev,
      [pIdx]: {
        ...prev[pIdx],
        [activeSegment]: {
          ...prev[pIdx][activeSegment],
          [type]: sId
        }
      }
    }));
  };

  // HÀM CHỐT DỊCH VỤ VÀ CHUYỂN BƯỚC
  const onConfirm = async () => {
    const finalAddons: any[] = [];
    
    // Quét qua toàn bộ lựa chọn: Hành khách -> Lượt bay -> Loại dịch vụ
    Object.entries(selections).forEach(([pIdx, segmentData]) => {
      Object.entries(segmentData).forEach(([segmentNo, types]) => {
        
        // Bỏ qua segment 2 nếu khách chỉ đi 1 chiều
        if (!isRoundTrip && segmentNo === '2') return;

        Object.entries(types).forEach(([type, sId]) => {
          if (sId !== 'none') {
            const serviceList = type === 'BAGGAGE' ? services.baggages : services.meals;
            const found = serviceList.find(s => s.id === sId);
            if (found) {
              finalAddons.push({
                passengerIndex: Number(pIdx),
                segmentNo: Number(segmentNo), // Đẩy SegmentNo vào mảng để gửi BE
                type,
                service: found
              });
            }
          }
        });
      });
    });

    // 1. Lưu Dịch vụ vào Redux
    dispatch(saveAddons(finalAddons));

    // 2. Chuyển thẳng sang Bước 3 (PaymentStep)
    dispatch(nextStep());
  };

  // Tính tổng tiền cả đi lẫn về
  const calculateCurrentTotal = () => {
    let total = 0;
    Object.values(selections).forEach(segmentData => {
      Object.entries(segmentData).forEach(([segmentNo, types]) => {
        if (!isRoundTrip && segmentNo === '2') return; // Bỏ qua chiều về nếu 1 chiều

        if (types['BAGGAGE'] && types['BAGGAGE'] !== 'none') {
          const b = services.baggages.find(i => i.id === types['BAGGAGE']);
          if (b) total += b.price;
        }
        if (types['MEAL'] && types['MEAL'] !== 'none') {
          const m = services.meals.find(i => i.id === types['MEAL']);
          if (m) total += m.price;
        }
      });
    });
    return total;
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-6">
      
      {/* 🚀 CHỌN LƯỢT BAY (CHỈ HIỂN THỊ NẾU LÀ KHỨ HỒI) 🚀 */}
      {isRoundTrip && (
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveSegment(1)}
            className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeSegment === 1 ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:bg-slate-200/50'
            }`}
          >
            <PlaneTakeoff size={18} /> Chuyến Đi
          </button>
          <button
            onClick={() => setActiveSegment(2)}
            className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeSegment === 2 ? 'bg-white text-orange-500 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:bg-slate-200/50'
            }`}
          >
            <PlaneLanding size={18} /> Chuyến Về
          </button>
        </div>
      )}

      {/* Tabs Hành lý / Suất ăn */}
      <Tabs defaultValue="baggage" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-14 bg-slate-100 p-1">
          <TabsTrigger value="baggage" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-600 font-bold">
            <Briefcase size={18} /> Hành lý
          </TabsTrigger>
          <TabsTrigger value="meal" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-600 font-bold">
            <Utensils size={18} /> Suất ăn
          </TabsTrigger>
        </TabsList>

        {/* Nội dung Hành lý */}
        <TabsContent value="baggage" className="mt-6 space-y-6">
          {eligiblePax.map((p, idx) => (
            <ServiceCard
              key={idx}
              passengerName={p.fullName || `Hành khách ${idx + 1}`}
              options={services.baggages}
              // 👇 Đọc ID đang được chọn dựa trên activeSegment 👇
              selectedId={selections[idx]?.[activeSegment]?.['BAGGAGE'] || 'none'}
              onSelect={(id: string) => handleSelect(idx, 'BAGGAGE', id)}
            />
          ))}
        </TabsContent>

        {/* Nội dung Suất ăn */}
        <TabsContent value="meal" className="mt-6 space-y-6">
          {eligiblePax.map((p, idx) => (
            <ServiceCard
              key={idx}
              passengerName={p.fullName || `Hành khách ${idx + 1}`}
              options={services.meals}
              // 👇 Đọc ID đang được chọn dựa trên activeSegment 👇
              selectedId={selections[idx]?.[activeSegment]?.['MEAL'] || 'none'}
              onSelect={(id: string) => handleSelect(idx, 'MEAL', id)}
            />
          ))}
        </TabsContent>
      </Tabs>

      {/* Box Tính tiền dính ở đáy */}
      <div className="sticky bottom-0 bg-white p-4 border rounded-xl shadow-[0_-4px_10px_rgba(0,0,0,0.05)] flex justify-between items-center z-10">
        <div>
          <p className="text-xs text-slate-500 uppercase font-bold">Dịch vụ đã chọn</p>
          <p className="text-xl font-black text-blue-600">
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

// Component con để render từng dòng chọn dịch vụ (GIỮ NGUYÊN)
const ServiceCard = ({ passengerName, options, selectedId, onSelect }: any) => (
  <div className="border rounded-xl p-4 bg-white">
    <p className="text-sm font-bold text-slate-500 mb-3 uppercase">Hành khách: {passengerName}</p>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
      <div
        onClick={() => onSelect('none')}
        className={`p-3 border rounded-lg cursor-pointer text-center text-xs font-bold transition-all flex items-center justify-center ${selectedId === 'none' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-100 hover:bg-slate-50'}`}
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