import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { type RootState } from '@/store/store';
import { Briefcase, Utensils, Loader2, PlaneTakeoff, PlaneLanding, ArrowLeft } from 'lucide-react';
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
  const { passengers } = useSelector((state: RootState) => state.booking); // KHÔNG LẤY searchConfigs NỮA
  
  const isRoundTrip = location.state?.isRoundTrip || false;

  const [services, setServices] = useState<{ baggages: AncillaryService[], meals: AncillaryService[] }>({
    baggages: [],
    meals: []
  });
  const [loading, setLoading] = useState(true);
  const [selections, setSelections] = useState<Record<number, Record<number, Record<string, string>>>>({});
  
  // State quản lý luồng: 1 (Chiều đi), 2 (Chiều về)
  const [activeSegment, setActiveSegment] = useState<number>(1);

  // 👇 LỌC HÀNH KHÁCH HỢP LỆ (Bỏ qua Em bé - INFANT)
  const eligiblePax = passengers ? passengers.filter((p: any) => {
    // Nếu có type đã được lưu từ lúc submit Form thì dùng luôn
    if (p.type && p.type === 'INFANT') return false;
    
    // Nếu không có type, tính tuổi từ ngày sinh (dob)
    if (p.dob) {
      const dob = new Date(p.dob);
      const age = new Date().getFullYear() - dob.getFullYear();
      if (age < 2) return false;
    }
    
    return true; // Người lớn và Trẻ em được giữ lại
  }) : [];

  // 👇 LƯU Ý: Phải dùng Index GỐC của hành khách trong mảng passengers 
  // để Backend biết dịch vụ thuộc về ai. 
  // mapEligibleToOriginal là một mảng phụ trợ lưu lại vị trí gốc của các eligiblePax
  const mapEligibleToOriginal = passengers ? passengers.reduce((acc: number[], p: any, idx: number) => {
    if (p.type !== 'INFANT') {
      const dob = p.dob ? new Date(p.dob) : null;
      if (!dob || (new Date().getFullYear() - dob.getFullYear() >= 2)) {
         acc.push(idx);
      }
    }
    return acc;
  }, []) : [];


  useEffect(() => {
    if (eligiblePax.length > 0 && Object.keys(selections).length === 0) {
      const initial: Record<number, Record<number, Record<string, string>>> = {};
      // Khởi tạo state bằng originalIndex (vị trí gốc) thay vì thứ tự của mảng đã lọc
      mapEligibleToOriginal.forEach((originalIdx) => {
        initial[originalIdx] = {
          1: { BAGGAGE: 'none', MEAL: 'none' },
          2: { BAGGAGE: 'none', MEAL: 'none' }
        };
      });
      setSelections(initial);
    }
  }, [eligiblePax.length, isRoundTrip, mapEligibleToOriginal]);

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

  const handleSelect = (originalIdx: number, type: 'BAGGAGE' | 'MEAL', sId: string) => {
    setSelections(prev => ({
      ...prev,
      [originalIdx]: {
        ...prev[originalIdx],
        [activeSegment]: {
          ...prev[originalIdx][activeSegment],
          [type]: sId
        }
      }
    }));
  };

  const onConfirm = () => {
    const finalAddons: any[] = [];
    
    Object.entries(selections).forEach(([pIdx, segmentData]) => {
      Object.entries(segmentData).forEach(([segmentNo, types]) => {
        if (!isRoundTrip && segmentNo === '2') return;

        Object.entries(types).forEach(([type, sId]) => {
          if (sId !== 'none') {
            const serviceList = type === 'BAGGAGE' ? services.baggages : services.meals;
            const found = serviceList.find(s => s.id === sId);
            if (found) {
              finalAddons.push({
                passengerIndex: Number(pIdx), // Đây đã là ID gốc của hành khách
                segmentNo: Number(segmentNo),
                type,
                service: found
              });
            }
          }
        });
      });
    });

    dispatch(saveAddons(finalAddons));
    dispatch(nextStep());
  };

  const handleNextSegment = () => {
    window.scrollTo(0, 0); 
    setActiveSegment(2);
  };

  const calculateCurrentTotal = () => {
    let total = 0;
    Object.values(selections).forEach(segmentData => {
      Object.entries(segmentData).forEach(([segmentNo, types]) => {
        if (!isRoundTrip && segmentNo === '2') return;

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
      
      {/* 🚀 TIÊU ĐỀ HƯỚNG DẪN LUỒNG 🚀 */}
      {isRoundTrip && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full ${activeSegment === 1 ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-500'}`}>
              {activeSegment === 1 ? <PlaneTakeoff size={24} /> : <PlaneLanding size={24} />}
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-800">
                {activeSegment === 1 ? 'Chọn dịch vụ cho chiều đi' : 'Chọn dịch vụ cho chiều về'}
              </h3>
              <p className="text-sm text-slate-500 font-medium">
                Bước {activeSegment} / 2
              </p>
            </div>
          </div>
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
          {eligiblePax.map((p: any, idx: number) => {
            const originalIdx = mapEligibleToOriginal[idx];
            return (
              <ServiceCard
                key={originalIdx}
                passengerName={p.fullName || `Hành khách ${originalIdx + 1}`}
                options={services.baggages}
                selectedId={selections[originalIdx]?.[activeSegment]?.['BAGGAGE'] || 'none'}
                onSelect={(id: string) => handleSelect(originalIdx, 'BAGGAGE', id)}
              />
            );
          })}
        </TabsContent>

        {/* Nội dung Suất ăn */}
        <TabsContent value="meal" className="mt-6 space-y-6">
          {eligiblePax.map((p: any, idx: number) => {
             const originalIdx = mapEligibleToOriginal[idx];
             return (
              <ServiceCard
                key={originalIdx}
                passengerName={p.fullName || `Hành khách ${originalIdx + 1}`}
                options={services.meals}
                selectedId={selections[originalIdx]?.[activeSegment]?.['MEAL'] || 'none'}
                onSelect={(id: string) => handleSelect(originalIdx, 'MEAL', id)}
              />
            );
          })}
        </TabsContent>
      </Tabs>

      {/* Box Tính tiền */}
      <div className="sticky bottom-0 bg-white p-4 border rounded-xl shadow-[0_-4px_10px_rgba(0,0,0,0.05)] flex justify-between items-center z-10">
        <div>
          <p className="text-xs text-slate-500 uppercase font-bold">Tổng dịch vụ</p>
          <p className="text-xl font-black text-blue-600">
            +{calculateCurrentTotal().toLocaleString()} đ
          </p>
        </div>
        
        <div className="flex gap-3">
          {isRoundTrip && activeSegment === 2 && (
            <Button 
              variant="outline" 
              onClick={() => setActiveSegment(1)} 
              className="h-12 px-4 font-bold border-slate-300 text-slate-600"
            >
              <ArrowLeft size={18} className="mr-2" /> Quay lại
            </Button>
          )}

          {isRoundTrip && activeSegment === 1 ? (
            <Button onClick={handleNextSegment} className="bg-orange-500 hover:bg-orange-600 h-12 px-8 font-bold text-white">
              Tiếp tục
            </Button>
          ) : (
            <Button onClick={onConfirm} className="bg-blue-600 hover:bg-blue-700 h-12 px-8 font-bold text-white">
              Xác nhận thanh toán
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// ... (Component ServiceCard giữ nguyên)
const ServiceCard = ({ passengerName, options, selectedId, onSelect }: any) => (
  <div className="border rounded-xl p-4 bg-white shadow-sm">
    <p className="text-sm font-bold text-slate-500 mb-3 uppercase border-b pb-2">Hành khách: <span className="text-slate-800">{passengerName}</span></p>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
      <div
        onClick={() => onSelect('none')}
        className={`p-3 border-2 rounded-lg cursor-pointer text-center text-sm font-bold transition-all flex items-center justify-center ${selectedId === 'none' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 hover:bg-slate-50 text-slate-500'}`}
      >
        Không chọn
      </div>
      {options.map((opt: any) => (
        <div
          key={opt.id}
          onClick={() => onSelect(opt.id)}
          className={`p-3 border-2 rounded-lg cursor-pointer transition-all flex flex-col justify-center ${selectedId === opt.id ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
        >
          <p className={`text-sm font-bold truncate ${selectedId === opt.id ? 'text-blue-800' : 'text-slate-700'}`}>{opt.name}</p>
          <p className="text-xs text-orange-600 font-black mt-1">+{opt.price.toLocaleString()} đ</p>
        </div>
      ))}
    </div>
  </div>
);