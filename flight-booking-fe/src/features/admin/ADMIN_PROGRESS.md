# Admin Progress Log

## 📅 Ngày thực hiện
2026-02-24

## ✅ Task
**Setup Admin Foundation & Layout**

---

## 📁 Các file đã tạo / chỉnh sửa

| File | Hành động |
|---|---|
| `src/layout/AdminLayout.tsx` | Tạo mới |
| `src/pages/admin/AdminDashboard.tsx` | Tạo mới |
| `src/App.tsx` | Cập nhật |
| `vite.config.ts` | Cập nhật |
| `src/index.css` | Cập nhật |

---

## 🔧 Ghi chú kỹ thuật

- Sử dụng **React Router v6** — nested routes với `<Outlet />` để render sub-pages bên trong `AdminLayout`.
- Layout dùng `h-screen flex` để chiếm toàn màn hình; sidebar `w-64 flex-shrink-0`; main content `flex-1 overflow-y-auto`.
- **Tailwind CSS v4** cấu hình qua `@tailwindcss/vite` plugin (không cần `tailwind.config.js`), import bằng `@import "tailwindcss"` trong `index.css`.
- `NavLink` tự động gán active class `bg-indigo-600` khi route khớp.
- Placeholder routes `/admin/flights` và `/admin/bookings` đã có sẵn, sẵn sàng thay bằng page component thực.

---

## 🚀 Next Steps

- [ ] **Auth Guard** — Tạo `ProtectedRoute` component, redirect về `/login` nếu chưa xác thực (kiểm tra JWT trong localStorage/cookie).
- [ ] **Login Page** — Xây dựng trang `/login` với form đăng nhập, gọi API auth.
- [ ] **API Integration** — Kết nối Dashboard với backend (tổng vé, doanh thu thực từ API).
- [ ] **Flights Management** — Hiện thực trang `/admin/flights` (CRUD chuyến bay).
- [ ] **Bookings Management** — Hiện thực trang `/admin/bookings` (xem, cập nhật trạng thái đặt vé).
- [ ] **Error Boundary** — Bọc routes bằng Error Boundary để xử lý lỗi render.
