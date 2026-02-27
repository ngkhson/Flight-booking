import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useDispatch } from "react-redux";
import { User, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// 1. Định nghĩa Luật bắt lỗi (Validation Schema) bằng Zod
const passengerSchema = z.object({
  passengers: z.array(
    z.object({
      lastName: z.string().min(2, "Họ phải có ít nhất 2 ký tự"),
      firstName: z.string().min(2, "Tên phải có ít nhất 2 ký tự"),
      gender: z.enum(["MALE", "FEMALE"]),
      dob: z.string().min(1, "Vui lòng nhập ngày sinh"),
    })
  ),
});

type PassengerFormValues = z.infer<typeof passengerSchema>;

export const PassengerForm = () => {
  const dispatch = useDispatch();

  // 2. Khởi tạo Form
  const { register, control, handleSubmit, formState: { errors } } = useForm<PassengerFormValues>({
    resolver: zodResolver(passengerSchema),
    defaultValues: {
      passengers: [{ lastName: "", firstName: "", gender: "MALE", dob: "" }] // Mặc định có 1 form người lớn
    },
  });

  // 3. Quản lý mảng Form động (Dành cho việc thêm/bớt hành khách)
  const { fields, append, remove } = useFieldArray({
    control,
    name: "passengers",
  });

  // 4. Xử lý khi bấm "Tiếp tục"
  const onSubmit = (data: PassengerFormValues) => {
    console.log("Dữ liệu hành khách hợp lệ:", data);
    // Lưu vào Redux và tự động nhảy sang Bước 2 (Chúng ta đã định nghĩa hàm này ở bài trước)
    import("@/store/bookingSlice").then((module) => {
      dispatch(module.savePassengers(data.passengers));
    });
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h3 className="text-xl font-bold text-slate-800 mb-6 border-b pb-4">Thông tin hành khách</h3>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {fields.map((field, index) => (
          <div key={field.id} className="p-5 bg-slate-50 border border-slate-200 rounded-lg relative">
            <h4 className="font-semibold text-blue-600 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Hành khách {index + 1}
            </h4>
            
            {/* Nút xóa hành khách (Không cho xóa nếu chỉ có 1 người) */}
            {fields.length > 1 && (
              <button type="button" onClick={() => remove(index)} className="absolute top-4 right-4 text-red-500 text-sm hover:underline">
                Xóa
              </button>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Họ */}
              <div>
                <label className="text-sm font-medium text-slate-700">Họ (Ví dụ: NGUYEN)</label>
                <Input {...register(`passengers.${index}.lastName` as const)} className="mt-1 uppercase" placeholder="Nhập họ..." />
                {errors.passengers?.[index]?.lastName && <p className="text-red-500 text-xs mt-1">{errors.passengers[index]?.lastName?.message}</p>}
              </div>

              {/* Tên */}
              <div>
                <label className="text-sm font-medium text-slate-700">Tên đệm & Tên (Ví dụ: VAN A)</label>
                <Input {...register(`passengers.${index}.firstName` as const)} className="mt-1 uppercase" placeholder="Nhập tên..." />
                {errors.passengers?.[index]?.firstName && <p className="text-red-500 text-xs mt-1">{errors.passengers[index]?.firstName?.message}</p>}
              </div>

              {/* Giới tính */}
              <div>
                <label className="text-sm font-medium text-slate-700">Giới tính</label>
                <select {...register(`passengers.${index}.gender` as const)} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                </select>
              </div>

              {/* Ngày sinh */}
              <div>
                <label className="text-sm font-medium text-slate-700">Ngày sinh</label>
                <div className="relative mt-1">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input type="date" {...register(`passengers.${index}.dob` as const)} className="pl-10" />
                </div>
                {errors.passengers?.[index]?.dob && <p className="text-red-500 text-xs mt-1">{errors.passengers[index]?.dob?.message}</p>}
              </div>
            </div>
          </div>
        ))}

        {/* Nút thêm hành khách */}
        <Button type="button" variant="outline" onClick={() => append({ lastName: "", firstName: "", gender: "MALE", dob: "" })} className="w-full border-dashed border-2 border-blue-300 text-blue-600 hover:bg-blue-50">
          + Thêm hành khách
        </Button>

        {/* Nút chuyển bước */}
        <div className="flex justify-end pt-4">
          <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-6 text-lg shadow-lg">
            Tiếp tục: Chọn Dịch Vụ
          </Button>
        </div>
      </form>
    </div>
  );
};