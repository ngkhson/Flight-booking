import { useState, useRef, useEffect, useMemo } from 'react';
import { MapPin, Plane, Loader2 } from 'lucide-react';
import axiosClient from '@/api/axiosClient';
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

// Hàm dọn dẹp chuỗi: Xóa dấu tiếng Việt và đưa về chữ thường
const removeAccents = (str: string) => {
  if (!str) return '';
  return str
    .normalize('NFD') 
    .replace(/[\u0300-\u036f]/g, '') 
    .toLowerCase(); 
};

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
        // 1. Gọi trang đầu tiên để lấy data và biết tổng số trang
        const firstPageRes: any = await axiosClient.get('/v1/airports?page=1');
        
        if (firstPageRes.code === 1000 && firstPageRes.result) {
          const { totalPages, data: firstPageData } = firstPageRes.result;
          let allAirports = [...firstPageData]; 

          // 2. Nếu có nhiều hơn 1 trang, gọi nốt các trang còn lại CÙNG LÚC
          if (totalPages > 1) {
            const promises = [];
            for (let i = 2; i <= totalPages; i++) {
              promises.push(axiosClient.get(`/v1/airports?page=${i}`));
            }

            const remainingPagesRes = await Promise.all(promises);

            remainingPagesRes.forEach((res: any) => {
              if (res.code === 1000 && res.result && res.result.data) {
                allAirports = [...allAirports, ...res.result.data];
              }
            });
          }

          // 3. Map dữ liệu kết hợp với File Map nội bộ
          const formattedData = allAirports.map((a: any) => {
            const mappedInfo = AIRPORT_MAPPING[a.code];
            return {
              ...a,
              cityName: mappedInfo?.city || a.cityCode, 
              countryName: mappedInfo?.country || a.countryCode,
              name: mappedInfo?.name || a.name 
            };
          });
          
          setAirports(formattedData);
        }
      } catch (error) {
        console.error("Lỗi gom danh sách sân bay:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAirports();
  }, []);

  // Tìm thông tin sân bay hiện tại đang được chọn
  const selectedAirport = useMemo(() => airports.find(a => a.code === value), [value, airports]);

  // Lọc danh sách thông minh (Không phân biệt hoa thường, không phân biệt dấu)
  const filteredAirports = useMemo(() => {
    if (!searchTerm) return airports;
    
    const term = removeAccents(searchTerm.trim());

    return airports.filter((airport) => {
      const safeCode = removeAccents(airport.code);
      const safeName = removeAccents(airport.name);
      const safeCity = removeAccents(airport.cityName);
      const safeCountry = removeAccents(airport.countryName);

      return (
        safeCode.includes(term) || 
        safeName.includes(term) || 
        safeCity.includes(term) || 
        safeCountry.includes(term)
      );
    });
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
          if (!isOpen) setIsOpen(true);
        }}
        onClick={() => setIsOpen(true)}
      />

      {/* Biểu tượng Loading nếu đang lấy data */}
      {isLoading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 w-4 h-4 animate-spin z-10" />
      )}

      {/* Bảng Dropdown xổ xuống (Đã fix lỗi z-index và làm lại UI) */}
      {isOpen && !isLoading && (
        <div className="absolute z-[100] w-[120%] sm:w-[150%] min-w-[320px] left-0 mt-2 bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] border border-slate-200 max-h-[360px] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
          
          {filteredAirports.length > 0 ? (
            <div className="py-2">
              <div className="sticky top-0 bg-slate-50/95 backdrop-blur-sm z-10 border-b border-slate-100 px-4 py-2.5">
                <p className="text-[13px] font-bold text-slate-500 uppercase tracking-wide">
                  Thành phố hoặc sân bay
                </p>
              </div>
              
              <div className="flex flex-col">
                {filteredAirports.map((airport) => (
                  <div
                    key={airport.code}
                    className="flex items-center px-4 py-3.5 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors group"
                    onClick={() => handleSelect(airport.code)}
                  >
                    {/* Icon máy bay */}
                    <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center mr-4 shrink-0 transition-colors">
                      <Plane className="w-4 h-4 text-slate-500 transform -rotate-45 group-hover:text-blue-600 transition-colors" fill="currentColor" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      {/* DÒNG 1: Tên sân bay + Mã */}
                      <div className="flex items-baseline justify-between gap-2 mb-1">
                        <span className="font-bold text-[15px] text-slate-800 group-hover:text-blue-700 truncate">
                          {airport.name}
                        </span>
                        <span className="font-black text-[13px] text-slate-400 group-hover:text-blue-600 shrink-0 bg-slate-100 group-hover:bg-blue-100 px-1.5 py-0.5 rounded">
                          {airport.code}
                        </span>
                      </div>
                      
                      {/* DÒNG 2: Thành phố, Quốc gia */}
                      <div className="text-[13px] text-slate-500 truncate group-hover:text-blue-600/80 font-medium">
                        {airport.cityName}, {airport.countryName}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Trạng thái Empty (Không tìm thấy) */
            <div className="p-10 text-center flex flex-col items-center justify-center bg-slate-50/50 h-full">
               <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                 <Plane className="w-8 h-8 text-slate-300 transform -rotate-45" />
               </div>
               <p className="font-bold text-slate-700 text-base">Không tìm thấy "{searchTerm}"</p>
               <p className="text-sm mt-1.5 text-slate-500 max-w-[250px]">
                 Vui lòng kiểm tra lại lỗi chính tả hoặc thử tìm bằng mã sân bay (VD: HAN, SGN).
               </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};