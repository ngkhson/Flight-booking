import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";

// Định nghĩa các luồng dữ liệu (Props) truyền từ trang cha (SearchPage) xuống
interface FlightFilterProps {
  selectedAirlines: string[];
  onAirlineChange: (airline: string, isChecked: boolean) => void;
  maxPrice: number;
  onPriceChange: (price: number) => void;
  resetFilters: () => void;
}

const AIRLINES = ["Vietnam Airlines", "Vietjet Air", "Bamboo Airways"];

export const FlightFilter = ({ 
  selectedAirlines, 
  onAirlineChange, 
  maxPrice, 
  onPriceChange,
  resetFilters 
}: FlightFilterProps) => {
  
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm sticky top-4">
      {/* Header Bộ lọc */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
        <h3 className="font-bold text-lg text-slate-800">Bộ lọc</h3>
        <button 
          onClick={resetFilters}
          className="text-sm text-blue-600 hover:underline font-medium"
        >
          Xóa lọc
        </button>
      </div>

      {/* 1. Lọc theo Hãng bay */}
      <div className="mb-6">
        <h4 className="font-semibold text-slate-800 mb-3">Hãng hàng không</h4>
        <div className="space-y-3">
          {AIRLINES.map((airline) => (
            <div key={airline} className="flex items-center space-x-2">
              <Checkbox 
                id={`airline-${airline}`} 
                checked={selectedAirlines.includes(airline)}
                onCheckedChange={(checked) => onAirlineChange(airline, checked as boolean)}
              />
              <label 
                htmlFor={`airline-${airline}`} 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-600 cursor-pointer"
              >
                {airline}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Lọc theo Giá tiền */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-semibold text-slate-800">Giá tối đa</h4>
          <span className="text-sm font-bold text-blue-600">
            {maxPrice.toLocaleString('vi-VN')} đ
          </span>
        </div>
        
        {/* Slider kéo giá (Bước nhảy 100k, max 5 triệu) */}
        <Slider
          defaultValue={[5000000]}
          value={[maxPrice]}
          max={5000000}
          step={100000}
          onValueChange={(vals) => onPriceChange(vals[0])}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-2">
          <span>0 đ</span>
          <span>5.000.000 đ</span>
        </div>
      </div>

    </div>
  );
};