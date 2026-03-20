import { useState, useRef, useEffect, useMemo } from 'react';
import { MapPin, Plane, Loader2 } from 'lucide-react';
import axiosClient from '@/api/axiosClient'; // 👈 Import axiosClient của bạn
import { AIRPORT_MAPPING } from '@/constants/airportData';

interface Airport {
  code: string;
  name: string;
  cityCode: string;
  countryCode: string;
  cityName: string;    
  countryName: string; 
}

interface AirportSelectorProps {
  value: string; // Mã sân bay (VD: HKT)
  onChange: (code: string) => void;
  placeholder?: string;
}

export const AirportSelector = ({ value, onChange, placeholder = "Nhập thành phố hoặc mã..." }: AirportSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State lưu dữ liệu thật từ API
  const [airports, setAirports] = useState<Airport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Gọi API lấy danh sách sân bay 1 lần duy nhất khi load component
  useEffect(() => {
    const fetchAirports = async () => {
      setIsLoading(true);
      try {
        const data: any = await axiosClient.get('/v1/airports');
        if (data.code === 1000 && data.result) {
          
          const formattedData = data.result.map((a: any) => {
            // Lấy toàn bộ thông tin dịch thuật theo mã Sân Bay (Ví dụ: 'SGN')
            const mappedInfo = AIRPORT_MAPPING[a.code];

            return {
              ...a,
              // Ưu tiên dùng dữ liệu từ file Map. Nếu Sân bay lạ (chưa có trong Map) thì dùng tạm data gốc của Backend
              cityName: mappedInfo?.city || a.cityCode, 
              countryName: mappedInfo?.country || a.countryCode,
              name: mappedInfo?.name || a.name // Đổi luôn tên tiếng Anh thành tiếng Việt
            };
          });
          
          setAirports(formattedData);
        }
      } catch (error) {
        console.error("Lỗi lấy danh sách sân bay:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAirports();
  }, []);

  // Tìm thông tin sân bay hiện tại đang được chọn
  const selectedAirport = useMemo(() => airports.find(a => a.code === value), [value, airports]);

  // Lọc danh sách dựa trên từ khóa gõ vào
  const filteredAirports = useMemo(() => {
    if (!searchTerm) return airports;
    const lowerTerm = searchTerm.toLowerCase();
    
    return airports.filter(a => 
      a.cityCode.toLowerCase().includes(lowerTerm) || 
      a.code.toLowerCase().includes(lowerTerm) ||
      a.name.toLowerCase().includes(lowerTerm) ||
      a.countryCode.toLowerCase().includes(lowerTerm)
    );
  }, [searchTerm, airports]);

  // Xử lý click ra ngoài để đóng Dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm(''); // Xóa text tìm kiếm đang gõ dở
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: string) => {
    onChange(code);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative mt-1" ref={wrapperRef}>
      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 z-10" />
      
      {/* Ô Input hiển thị */}
      <input
        type="text"
        className="w-full pl-10 pr-10 h-12 text-md font-semibold text-slate-800 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer placeholder:font-normal"
        placeholder={isLoading ? "Đang tải dữ liệu..." : placeholder}
        disabled={isLoading}
        value={isOpen ? searchTerm : (selectedAirport ? `${selectedAirport.cityName} (${selectedAirport.code})` : value)}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setIsOpen(true);
        }}
        onClick={() => setIsOpen(true)}
      />

      {/* Biểu tượng Loading nếu đang lấy data */}
      {isLoading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 w-4 h-4 animate-spin z-10" />
      )}

      {/* Bảng Dropdown xổ xuống */}
      {isOpen && !isLoading && (
        <div className="absolute z-50 w-[120%] sm:w-[150%] min-w-[320px] left-0 mt-1 bg-white rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200 max-h-[360px] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
          {filteredAirports.length > 0 ? (
            <div className="py-2">
              <p className="text-[13px] font-medium text-slate-500 px-4 py-2 border-b border-slate-100 bg-slate-50/50">
                Thành phố hoặc sân bay phổ biến
              </p>
              
              <div className="flex flex-col">
                {filteredAirports.map((airport) => (
                  <div
                    key={airport.code}
                    className="flex items-center px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors group"
                    onClick={() => handleSelect(airport.code)}
                  >
                    {/* Icon máy bay nghiêng chéo y hệt mẫu */}
                    <Plane className="w-5 h-5 text-slate-600 mr-4 shrink-0 transform -rotate-45 group-hover:text-blue-600 transition-colors" fill="currentColor" />
                    
                    <div className="flex-1 min-w-0">
                      {/* DÒNG 1: Tên sân bay + Mã (VD: Sân bay Tân Sơn Nhất SGN) */}
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="font-semibold text-[15px] text-slate-800 group-hover:text-blue-700 truncate">
                          {airport.name}
                        </span>
                        <span className="font-bold text-[13px] text-slate-400 group-hover:text-blue-500 shrink-0">
                          {airport.code}
                        </span>
                      </div>
                      
                      {/* DÒNG 2: Thành phố, Quốc gia (VD: TP HCM, Việt Nam) */}
                      <div className="text-[13px] text-slate-500 truncate group-hover:text-blue-600/70">
                        {airport.cityName}, {airport.countryName}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 flex flex-col items-center">
               <Plane className="w-8 h-8 mb-3 text-slate-300 transform -rotate-45" />
               <p className="font-medium">Không tìm thấy kết quả nào cho "{searchTerm}"</p>
               <p className="text-sm mt-1 text-slate-400">Vui lòng thử tìm kiếm bằng tên thành phố hoặc mã sân bay khác.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};