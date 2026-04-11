import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux"; // THÊM DÒNG NÀY
import { clearBooking } from "@/store/bookingSlice";
import { logoutUser } from "@/store/authSlice"; // Đảm bảo import đúng action logout

export const useLogout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch(); // Bây giờ useDispatch đã tồn tại để sử dụng

  const logout = () => {
    // 1. Xóa Token khỏi localStorage
    localStorage.removeItem("accessToken");

    // 2. Reset toàn bộ Store Redux về trạng thái ban đầu
    dispatch(clearBooking());
    dispatch(logoutUser()); 

    // 3. Điều hướng
    navigate("/login");
  };

  return logout;
};