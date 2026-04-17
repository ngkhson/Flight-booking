import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";

export const TIME_BLOCKS = [
  { id: "0-6", label: "00:00 - 06:00 (Sáng sớm)", min: 0, max: 6 },
  { id: "6-12", label: "06:00 - 12:00 (Sáng)", min: 6, max: 12 },
  { id: "12-18", label: "12:00 - 18:00 (Chiều)", min: 12, max: 18 },
  { id: "18-24", label: "18:00 - 24:00 (Tối)", min: 18, max: 24 },
];

const STOP_OPTIONS = [
  { value: 0, label: "Bay thẳng" },
  { value: 1, label: "1 điểm dừng" },
  { value: 2, label: "2+ điểm dừng" },
];

interface FlightFilterProps {
  availableAirlines: string[];
  minPriceLimit: number;
  maxPriceLimit: number;
  maxDurationLimit: number;

  selectedAirlines: string[];
  onAirlineChange: (airline: string, isChecked: boolean) => void;

  // 👇 Đổi priceRange (mảng) thành maxPrice (số)
  maxPrice: number;
  onPriceChange: (val: number) => void;

  stops: number[];
  onStopsChange: (stop: number, isChecked: boolean) => void;
  maxDuration: number;
  onMaxDurationChange: (val: number) => void;
  takeOffBlocks: string[];
  onTakeOffBlockChange: (blockId: string, isChecked: boolean) => void;
  landingBlocks: string[];
  onLandingBlockChange: (blockId: string, isChecked: boolean) => void;
  resetFilters: () => void;
}

export const FlightFilter = (props: FlightFilterProps) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm sticky top-4 max-h-[85vh] flex flex-col overflow-hidden">

      {/* HEADER */}
      <div className="flex justify-between items-center px-5 pt-5 pb-4 border-b border-slate-100 bg-white shrink-0 z-10">
        <h3 className="font-bold text-lg text-slate-800">Bộ lọc chi tiết</h3>
        <button onClick={props.resetFilters} className="text-sm text-blue-600 hover:underline font-medium">Xóa lọc</button>
      </div>

      <div className="p-5 pt-4 overflow-y-auto custom-scrollbar flex-1">

        {/* 1. SỐ ĐIỂM DỪNG */}
        <div className="mb-6 pb-6 border-b border-slate-100">
          <h4 className="font-semibold text-slate-800 mb-3">Số điểm dừng</h4>
          <div className="space-y-3">
            {STOP_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox id={`stop-${option.value}`} checked={props.stops.includes(option.value)} onCheckedChange={(c) => props.onStopsChange(option.value, c as boolean)} />
                <label htmlFor={`stop-${option.value}`} className="text-sm text-slate-600 cursor-pointer">{option.label}</label>
              </div>
            ))}
          </div>
        </div>

        {/* 2. HÃNG HÀNG KHÔNG (Động) */}
        <div className="mb-6 pb-6 border-b border-slate-100">
          <h4 className="font-semibold text-slate-800 mb-3">Hãng hàng không</h4>
          {props.availableAirlines.length === 0 ? (
            <p className="text-xs text-slate-400">Đang tải dữ liệu...</p>
          ) : (
            <div className="space-y-3">
              {props.availableAirlines.map((airline) => (
                <div key={airline} className="flex items-center space-x-2">
                  <Checkbox id={`airline-${airline}`} checked={props.selectedAirlines.includes(airline)} onCheckedChange={(c) => props.onAirlineChange(airline, c as boolean)} />
                  <label htmlFor={`airline-${airline}`} className="text-sm text-slate-600 cursor-pointer">{airline}</label>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. KHOẢNG GIÁ TIỀN (Lọc Giá Tối Đa) */}
        <div className="mb-6 pb-6 border-b border-slate-100">
          <h4 className="font-semibold text-slate-800 mb-4">Giá tiền tối đa</h4>
          <Slider
            value={[props.maxPrice]}
            min={props.minPriceLimit}
            max={props.maxPriceLimit}
            step={100000}
            onValueChange={(val) => props.onPriceChange(val[0])}
            className="w-full"
          />
          <div className="text-right text-xs font-bold text-blue-600 mt-3">
            Dưới {props.maxPrice?.toLocaleString('vi-VN')} đ
          </div>
        </div>

        {/* 4. GIỜ CẤT CÁNH */}
        <div className="mb-6 pb-6 border-b border-slate-100">
          <h4 className="font-semibold text-slate-800 mb-3">Giờ cất cánh</h4>
          <div className="space-y-3">
            {TIME_BLOCKS.map((block) => (
              <div key={`takeoff-${block.id}`} className="flex items-center space-x-2">
                <Checkbox id={`takeoff-${block.id}`} checked={props.takeOffBlocks.includes(block.id)} onCheckedChange={(c) => props.onTakeOffBlockChange(block.id, c as boolean)} />
                <label htmlFor={`takeoff-${block.id}`} className="text-sm text-slate-600 cursor-pointer">{block.label}</label>
              </div>
            ))}
          </div>
        </div>

        {/* 5. GIỜ HẠ CÁNH */}
        <div className="mb-6 pb-6 border-b border-slate-100">
          <h4 className="font-semibold text-slate-800 mb-3">Giờ hạ cánh</h4>
          <div className="space-y-3">
            {TIME_BLOCKS.map((block) => (
              <div key={`landing-${block.id}`} className="flex items-center space-x-2">
                <Checkbox id={`landing-${block.id}`} checked={props.landingBlocks.includes(block.id)} onCheckedChange={(c) => props.onLandingBlockChange(block.id, c as boolean)} />
                <label htmlFor={`landing-${block.id}`} className="text-sm text-slate-600 cursor-pointer">{block.label}</label>
              </div>
            ))}
          </div>
        </div>

        {/* 6. THỜI GIAN BAY TỐI ĐA (Động) */}
        <div className="mb-2">
          <h4 className="font-semibold text-slate-800 mb-4">Thời gian bay tối đa</h4>
          <Slider
            value={[props.maxDuration]}
            min={1}
            max={props.maxDurationLimit}
            step={1}
            onValueChange={(val) => props.onMaxDurationChange(val[0])}
            className="w-full"
          />
          <div className="text-right text-xs font-bold text-blue-600 mt-3">Dưới {props.maxDuration} giờ bay</div>
        </div>
      </div>
    </div>
  );
};