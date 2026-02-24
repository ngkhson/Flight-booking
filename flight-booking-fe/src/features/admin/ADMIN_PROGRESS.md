# Admin Progress Log

## 📅 Ngày thực hiện
2026-02-24

## ✅ Task
**Setup Admin Foundation & Layout**

---

## 📁 Các file đã tạo / chỉnh sửa

| File | Hành động |
|---|---|
| `src/layout/AdminLayout.tsx` | Tạo mới → Cập nhật (sidebar nav) |
| `src/pages/admin/AdminDashboard.tsx` | Tạo mới → Cập nhật (API + LineChart) |
| `src/App.tsx` | Cập nhật |
| `vite.config.ts` | Cập nhật |
| `src/index.css` | Cập nhật |
| `src/features/auth/ProtectedRoute.tsx` | Tạo mới → Cập nhật (RBAC allowedRoles) |
| `src/pages/auth/LoginPage.tsx` | Tạo mới |
| `src/pages/auth/ForbiddenPage.tsx` | Tạo mới |
| `src/components/common/ErrorBoundary.tsx` | Tạo mới |
| `src/features/admin/services/adminApi.ts` | Tạo mới → Cập nhật (CRUD flights + booking status) |
| `src/pages/admin/FlightsPage.tsx` | Tạo mới (read-only, không còn route) |
| `src/pages/admin/BookingsPage.tsx` | Tạo mới (read-only, không còn route) |
| `src/pages/admin/FlightManagement.tsx` | Tạo mới (CRUD đầy đủ) |
| `src/pages/admin/BookingManagement.tsx` | Tạo mới (cập nhật trạng thái) |
| `src/pages/admin/UserManagement.tsx` | Tạo mới (RBAC + lock/unlock) |

---

## 🚀 Next Steps

- [x] **Auth Guard** — `ProtectedRoute` component, redirect về `/login` nếu chưa xác thực.
- [x] **Login Page** — Trang `/login` với form đăng nhập, gọi API auth.
- [x] **API Integration** — Kết nối Dashboard với backend qua `getDashboardStats()`; graceful fallback.
- [x] **Flights Management** — Trang `/admin/flights`: bảng CRUD + modal form + validation + API.
- [x] **Bookings Management** — Trang `/admin/bookings`: inline dropdown đổi trạng thái + API.
- [x] **Error Boundary** — `ErrorBoundary` class component bọc `AdminLayout`.
- [x] **RBAC** — `ProtectedRoute` với `allowedRoles[]`; trang 403 `ForbiddenPage`.
- [x] **User Management** — Trang `/admin/users` (ADMIN-only): phân quyền + lock/unlock tài khoản.
- [x] **Revenue Chart** — `LineChart` (recharts) doanh thu 7 ngày, responsive + custom Tooltip.
- [x] **API Integration (all pages)** — Đã hoàn tất tích hợp adminApi cho toàn bộ các trang CRUD (Dashboard, FlightManagement, BookingManagement, UserManagement). `IFlight`, `IBooking`, `IUser` thay thế toàn bộ legacy types.

---

## 🔧 Ghi chú kỹ thuật

- **Recharts** — `LineChart` với `ResponsiveContainer` (100% width), dual `YAxis` (doanh thu trái / số vé phải), `CustomTooltip` định dạng VND, `CartesianGrid` dọc ẩn.
- `adminApi.ts` export đầy đủ: `getDashboardStats`, `getFlights`, `createFlight`, `updateFlight`, `deleteFlight`, `getBookings`, `updateBookingStatus`.
- `ProtectedRoute` — kiểm tra `localStorage.token` + `localStorage.userRole` (dev default `'ADMIN'`).
- Route `/admin/users` dùng nested `ProtectedRoute allowedRoles={['ADMIN']}` bên trong outer guard.
