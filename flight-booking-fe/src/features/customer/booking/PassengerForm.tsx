import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDispatch, useSelector } from "react-redux";
import { savePassengers, saveContactInfo } from "@/store/bookingSlice";
import { User, Mail, Baby, Users, Info } from "lucide-react";
import { type RootState } from "@/store/store";

// --- 1. HÀM TÍNH TUỔI ---
const calculateAge = (dobString: string) => {
  if (!dobString) return 0;
  const dob = new Date(dobString);
  const today = new Date(); // Có thể thay bằng ngày bay (flightDate) nếu bạn muốn chính xác tuyệt đối theo chuẩn hàng không
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
};

// --- 2. TÁCH SCHEMA CHO TỪNG ĐỐI TƯỢNG ---
const basePersonSchema = {
  fullName: z.string().min(5, "Họ tên quá ngắn"),
  gender: z.enum(["Nam", "Nữ"]),
  idCard: z.string().min(9, "CCCD/Hộ chiếu không hợp lệ"),
};

const adultSchema = z.object({
  ...basePersonSchema,
  dob: z.string().min(1, "Vui lòng chọn ngày sinh").refine((date) => calculateAge(date) >= 12, {
    message: "Người lớn phải từ 12 tuổi trở lên",
  }),
});

const childSchema = z.object({
  ...basePersonSchema,
  dob: z.string().min(1, "Vui lòng chọn ngày sinh").refine((date) => {
    const age = calculateAge(date);
    return age >= 2 && age < 12;
  }, {
    message: "Trẻ em phải từ 2 đến dưới 12 tuổi",
  }),
});

const infantSchema = z.object({
  ...basePersonSchema,
  dob: z.string().min(1, "Vui lòng chọn ngày sinh").refine((date) => calculateAge(date) < 2, {
    message: "Em bé phải dưới 2 tuổi",
  }),
});

const contactSchema = z.object({
  contactName: z.string().min(5, "Họ tên quá ngắn"),
  contactEmail: z.string().email("Email sai định dạng"),
  contactPhone: z.string().min(10, "SĐT sai định dạng"),
});

const bookingSchema = z.object({
  contact: contactSchema,
  adults: z.array(adultSchema),
  children: z.array(childSchema),
  infants: z.array(infantSchema),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

// --- 3. COMPONENT CHÍNH ---
interface PassengerFormProps {
  adultsCount?: number;
  childrenCount?: number;
  infantsCount?: number;
}

export const PassengerForm = ({ adultsCount, childrenCount, infantsCount }: PassengerFormProps) => {
  const dispatch = useDispatch();
  const { searchConfigs } = useSelector((state: RootState) => state.booking);

  // Ưu tiên số lượng từ Props truyền vào (nếu có), nếu không lấy từ Redux
  const nAdults = adultsCount ?? searchConfigs.adults;
  const nChildren = childrenCount ?? searchConfigs.children;
  const nInfants = infantsCount ?? searchConfigs.infants;

  const { register, handleSubmit, formState: { errors } } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      contact: { contactName: "", contactEmail: "", contactPhone: "" },
      adults: Array(nAdults).fill({ fullName: "", gender: "Nam", dob: "", idCard: "" }),
      children: Array(nChildren).fill({ fullName: "", gender: "Nam", dob: "", idCard: "" }),
      infants: Array(nInfants).fill({ fullName: "", gender: "Nam", dob: "", idCard: "" }),
    }
  });

  const onSubmit: SubmitHandler<BookingFormValues> = (data) => {
    dispatch(saveContactInfo(data.contact));
    dispatch(savePassengers([...data.adults, ...data.children, ...data.infants]));
    console.log("Validate thành công, dữ liệu:", data);
    // Chuyển sang bước tiếp theo (Dịch vụ) ở đây
  };

  // --- 4. HÀM RENDER Ô NHẬP LIỆU CÓ HIỂN THỊ LỖI ---
  const renderPersonForm = (type: 'adults' | 'children' | 'infants', index: number, title: string) => {
    // Lấy object lỗi của cá nhân hiện tại
    const personErrors = errors[type]?.[index];

    return (
      <div key={`${type}-${index}`} className="p-6 border border-slate-200 rounded-xl bg-white shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="font-bold text-slate-700 flex items-center gap-2">
            {type === 'adults' ? <User size={18} /> : <Baby size={18} />} {title} #{index + 1}
          </h3>
          {(type === 'children' || type === 'infants') && (
            <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-1 rounded font-bold">
              Dùng CCCD người giám hộ
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* HỌ TÊN */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">HỌ TÊN</label>
            <Input 
              {...register(`${type}.${index}.fullName` as const)} 
              placeholder="NGUYEN VAN A" 
              className={`uppercase ${personErrors?.fullName ? 'border-red-500 focus-visible:ring-red-500' : ''}`} 
            />
            {personErrors?.fullName && <p className="text-[10px] text-red-500">{personErrors.fullName.message}</p>}
          </div>

          {/* GIỚI TÍNH */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">GIỚI TÍNH</label>
            <select 
              {...register(`${type}.${index}.gender` as const)} 
              className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
            >
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
            </select>
          </div>

          {/* NGÀY SINH - Nơi Validate Tuổi */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">NGÀY SINH</label>
            <Input 
              type="date" 
              {...register(`${type}.${index}.dob` as const)} 
              
              // 👇 1. CHẶN TRÀN 6 SỐ VÀ CHẶN CHỌN NGÀY TƯƠNG LAI
              min="1900-01-01" 
              max={new Date().toISOString().split("T")[0]} 
              
              // 👇 2. CHẶN GÕ CHỮ/KÝ TỰ LẠ TỪ BÀN PHÍM (Bảo vệ thêm)
              onKeyDown={(e) => {
                const invalidChars = ["-", "+", "e", "E", ".", ","];
                if (invalidChars.includes(e.key)) {
                  e.preventDefault();
                }
              }}
              
              className={personErrors?.dob ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {personErrors?.dob && <p className="text-[10px] text-red-500 font-bold">{personErrors.dob.message}</p>}
          </div>

          {/* SỐ CCCD / HỘ CHIẾU */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">
              {type === 'adults' ? 'Số CCCD / Hộ chiếu' : 'CCCD Người giám hộ'}
            </label>
            <Input 
              {...register(`${type}.${index}.idCard` as const)} 
              placeholder="Nhập số định danh" 
              
              // 👇 1. GIỚI HẠN TỐI ĐA 12 KÝ TỰ (Độ dài chuẩn của CCCD)
              maxLength={12} 
              
              // 👇 2. TỰ ĐỘNG XÓA KÝ TỰ ĐẶC BIỆT & VIẾT HOA HỘ CHIẾU
              onInput={(e) => {
                // Hộ chiếu có thể có chữ (VD: B1234567) nên cho phép a-z, A-Z và số 0-9
                e.currentTarget.value = e.currentTarget.value
                  .replace(/[^a-zA-Z0-9]/g, '') // Xóa khoảng trắng và ký tự lạ (!@#$...)
                  .toUpperCase();               // Tự động viết hoa chữ cái của hộ chiếu
              }}
              
              className={personErrors?.idCard ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {personErrors?.idCard && <p className="text-[10px] text-red-500">{personErrors.idCard.message}</p>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* THÔNG TIN LIÊN HỆ */}
      <section className="bg-blue-50 p-6 rounded-xl border border-blue-200 space-y-4">
        <h2 className="text-lg font-bold text-blue-900 flex items-center gap-2">
          <Mail className="w-5 h-5" /> Thông tin liên hệ (Nhận vé)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Input {...register("contact.contactName")} placeholder="Họ tên người nhận vé" className={errors.contact?.contactName ? 'border-red-500' : ''} />
            {errors.contact?.contactName && <p className="text-[10px] text-red-500">{errors.contact.contactName.message}</p>}
          </div>
          <div className="space-y-1">
            <Input {...register("contact.contactEmail")} placeholder="Email nhận vé" className={errors.contact?.contactEmail ? 'border-red-500' : ''} />
            {errors.contact?.contactEmail && <p className="text-[10px] text-red-500">{errors.contact.contactEmail.message}</p>}
          </div>
          <div className="space-y-1">
            <Input {...register("contact.contactPhone")} placeholder="Số điện thoại" className={errors.contact?.contactPhone ? 'border-red-500' : ''} />
            {errors.contact?.contactPhone && <p className="text-[10px] text-red-500">{errors.contact.contactPhone.message}</p>}
          </div>
        </div>
      </section>

      {/* DANH SÁCH HÀNH KHÁCH */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Users className="w-5 h-5" /> Thông tin hành khách
        </h2>
        {Array(nAdults).fill(0).map((_, i) => renderPersonForm('adults', i, 'Người lớn'))}
        {Array(nChildren).fill(0).map((_, i) => renderPersonForm('children', i, 'Trẻ em'))}
        {Array(nInfants).fill(0).map((_, i) => renderPersonForm('infants', i, 'Em bé'))}
      </div>

      <div className="bg-orange-50 p-4 rounded-lg flex items-start gap-3 border border-orange-100">
        <Info className="text-orange-500 shrink-0" size={20} />
        <p className="text-xs text-orange-800">
          Bằng cách nhấn tiếp tục, bạn xác nhận rằng tất cả thông tin hành khách là chính xác và trùng khớp với giấy tờ tùy thân.
        </p>
      </div>

      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-14 text-lg font-bold">
        Xác nhận & Chuyển bước thanh toán
      </Button>
    </form>
  );
};