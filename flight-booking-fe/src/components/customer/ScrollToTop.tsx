import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const ScrollToTop = () => {
  // Lấy đường dẫn hiện tại (pathname)
  const { pathname } = useLocation();

  // Mỗi khi pathname thay đổi, gọi hàm cuộn lên tọa độ (0, 0)
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth' // Tùy chọn: Thêm hiệu ứng cuộn mượt mà. Xóa dòng này nếu muốn nhảy thẳng lên đầu.
    });
  }, [pathname]);

  // Component này chỉ chạy ngầm, không render ra giao diện
  return null; 
};