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
| `src/pages/admin/AdminDashboard.tsx` | Tạo mới → Cập nhật (API) |
| `src/App.tsx` | Cập nhật |
| `vite.config.ts` | Cập nhật |
| `src/index.css` | Cập nhật |
| `src/features/auth/ProtectedRoute.tsx` | Tạo mới |
| `src/pages/auth/LoginPage.tsx` | Tạo mới |
| `src/components/common/ErrorBoundary.tsx` | Tạo mới |
| `src/features/admin/services/adminApi.ts` | Tạo mới |
| `src/pages/admin/FlightsPage.tsx` | Tạo mới |
| `src/pages/admin/BookingsPage.tsx` | Tạo mới |

---

## 🔧 Ghi chú kỹ thuật

- Sử dụng **React Router v6** — nested routes với `<Outlet />` để render sub-pages bên trong `AdminLayout`.
- Layout dùng `h-screen flex` để chiếm toàn màn hình; sidebar `w-64 flex-shrink-0`; main content `flex-1 overflow-y-auto`.
- **Tailwind CSS v4** cấu hình qua `@tailwindcss/vite` plugin (không cần `tailwind.config.js`), import bằng `@import "tailwindcss"` trong `index.css`.
- `NavLink` tự động gán active class `bg-indigo-600` khi route khớp.
- Placeholder routes `/admin/flights` và `/admin/bookings` đã có sẵn, sẵn sàng thay bằng page component thực.

---

## 🚀 Next Steps

- [x] **Auth Guard** — Tạo `ProtectedRoute` component, redirect về `/login` nếu chưa xác thực (kiểm tra JWT trong localStorage/cookie).
- [x] **Login Page** — Xây dựng trang `/login` với form đăng nhập, gọi API auth.
- [x] **API Integration** — Kết nối Dashboard với backend qua `getDashboardStats()`; graceful fallback khi backend chưa sẵn sàng.
- [x] **Flights Management** — Hiện thực trang `/admin/flights`: bảng dữ liệu + search + status badge.
- [x] **Bookings Management** — Hiện thực trang `/admin/bookings`: bảng dữ liệu + lọc trạng thái.
- [x] **Error Boundary** — `ErrorBoundary` class component bọc `AdminLayout`; nút "Try Again" reset state.

---

## 🔧 Ghi chú kỹ thuật (Auth)

- Đã triển khai `ProtectedRoute` dựa trên `localStorage`.
- Đã tích hợp `ProtectedRoute` và `LoginPage` vào `App.tsx`.

---

## 🔧 Ghi chú kỹ thuật (API & Error Handling)

- `adminApi.ts` export 3 hàm typed: `getDashboardStats()`, `getFlights()`, `getBookings()` — tất cả dùng `apiClient` (axios instance đã cấu hình interceptor).
- `AdminDashboard` gọi API trong `useEffect` với cleanup flag để tránh setState sau unmount.
- `ErrorBoundary` dùng `getDerivedStateFromError` + `componentDidCatch`; sẵn sàng tích hợp Sentry.
- `FlightsPage` và `BookingsPage` gọi API thực và hiển thị skeleton loading; fallback hiển thị mock data kèm warning banner khi API lỗi.
