import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDispatch, useSelector } from "react-redux";
import { savePassengers, saveContactInfo } from "@/store/bookingSlice";
import { User, Mail, Baby, Users, Info } from "lucide-react";
import { type RootState } from "@/store/store";

// Schema cho từng loại khách
const personSchema = z.object({
  fullName: z.string().min(5, "Họ tên quá ngắn"),
  gender: z.enum(["Nam", "Nữ"]),
  dob: z.string().min(1, "Vui lòng chọn ngày sinh"),
  idCard: z.string().min(9, "CCCD/Hộ chiếu không hợp lệ"),
});

const contactSchema = z.object({
  contactName: z.string().min(5, "Họ tên quá ngắn"),
  contactEmail: z.string().email("Email sai định dạng"),
  contactPhone: z.string().min(10, "SĐT sai định dạng"),
});

const bookingSchema = z.object({
  contact: contactSchema,
  adults: z.array(personSchema),
  children: z.array(personSchema),
  infants: z.array(personSchema),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

export const PassengerForm = () => {
  const dispatch = useDispatch();
  // Giả sử bạn lấy số lượng từ Redux searchConfigs
  const { searchConfigs } = useSelector((state: RootState) => state.booking);

  const { register, handleSubmit } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      contact: { contactName: "", contactEmail: "", contactPhone: "" },
      // Khởi tạo mảng dựa trên số lượng khách đã tìm kiếm
      adults: Array(searchConfigs.adults).fill({ fullName: "", gender: "Nam", dob: "", idCard: "" }),
      children: Array(searchConfigs.children).fill({ fullName: "", gender: "Nam", dob: "", idCard: "" }),
      infants: Array(searchConfigs.infants).fill({ fullName: "", gender: "Nam", dob: "", idCard: "" }),
    }
  });

  const onSubmit: SubmitHandler<BookingFormValues> = (data) => {
    dispatch(saveContactInfo(data.contact));
    dispatch(savePassengers([...data.adults, ...data.children, ...data.infants]));
  };

  // Hàm render Form cho từng cá nhân
  const renderPersonForm = (type: 'adults' | 'children' | 'infants', index: number, title: string) => (
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
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500">HỌ TÊN</label>
          <Input {...register(`${type}.${index}.fullName` as const)} placeholder="NGUYEN VAN A" className="uppercase" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500">GIỚI TÍNH</label>
          <select {...register(`${type}.${index}.gender` as const)} className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm">
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500">NGÀY SINH</label>
          <Input type="date" {...register(`${type}.${index}.dob` as const)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase">
            {type === 'adults' ? 'Số CCCD' : 'CCCD Người giám hộ'}
          </label>
          <Input {...register(`${type}.${index}.idCard` as const)} placeholder="Nhập số định danh" />
        </div>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* 1. THÔNG TIN LIÊN HỆ */}
      <section className="bg-blue-50 p-6 rounded-xl border border-blue-200 space-y-4">
        <h2 className="text-lg font-bold text-blue-900 flex items-center gap-2">
          <Mail className="w-5 h-5" /> Thông tin liên hệ (Nhận vé)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input {...register("contact.contactName")} placeholder="Họ tên người nhận vé" />
          <Input {...register("contact.contactEmail")} placeholder="Email nhận vé" />
          <Input {...register("contact.contactPhone")} placeholder="Số điện thoại" />
        </div>
      </section>

      {/* 2. DANH SÁCH HÀNH KHÁCH */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Users className="w-5 h-5" /> Thông tin hành khách
        </h2>

        {/* Render lần lượt Người lớn -> Trẻ em -> Em bé */}
        {Array(searchConfigs.adults).fill(0).map((_, i) => renderPersonForm('adults', i, 'Người lớn'))}
        {Array(searchConfigs.children).fill(0).map((_, i) => renderPersonForm('children', i, 'Trẻ em'))}
        {Array(searchConfigs.infants).fill(0).map((_, i) => renderPersonForm('infants', i, 'Em bé'))}
      </div>

      <div className="bg-orange-50 p-4 rounded-lg flex items-start gap-3 border border-orange-100">
        <Info className="text-orange-500 shrink-0" size={20} />
        <p className="text-xs text-orange-800">
          Bằng cách nhấn tiếp tục, bạn xác nhận rằng tất cả thông tin hành khách là chính xác và trùng khớp với giấy tờ tùy thân.
        </p>
      </div>

      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-14 text-lg font-bold">
        Xác nhận & Chọn dịch vụ bổ sung
      </Button>
    </form>
  );
};