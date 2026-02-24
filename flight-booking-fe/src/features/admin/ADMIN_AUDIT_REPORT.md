# ADMIN AUDIT REPORT
**Dự án:** Flight Booking — Phân hệ Admin
**Ngày kiểm tra:** 2026-02-24
**Kiểm tra bởi:** Senior Software Auditor / QA Lead
**Branch:** `chore/ndtrung/admin-audit-report`

---

## 🟢 Các hạng mục đã hoàn thành tốt (Good Practices)

### Routing & RBAC
| # | Hạng mục | File | Ghi chú |
|---|---|---|---|
| G1 | Tất cả route `/admin/*` đều wrapped bằng `ProtectedRoute` | `App.tsx:27` | ✅ |
| G2 | Route `/admin/users` có nested `ProtectedRoute allowedRoles={['ADMIN']}` riêng | `App.tsx:41` | ✅ RBAC đúng tầng |
| G3 | Route `/403` public, `/login` public — cấu hình đúng | `App.tsx:20-21` | ✅ |
| G4 | `ProtectedRoute` xử lý đủ 3 case: no-token → `/login`, wrong-role → `/403`, pass → render | `ProtectedRoute.tsx:24-32` | ✅ |
| G5 | `ErrorBoundary` bọc `AdminLayout` — crash isolation tốt | `App.tsx:28-30` | ✅ |

### API Integration
| # | Hạng mục | File | Ghi chú |
|---|---|---|---|
| G6 | `adminApi.ts` khai báo đủ 5 interface mới: `IDashboardStats`, `IFlight`, `IBooking`, `IUser`, `IPage<T>` | `adminApi.ts:6-50` | ✅ |
| G7 | `getDashboardStats`, `getFlights`, `getBookings`, `getUsers`, `updateUserStatus` đều export | `adminApi.ts:64-110` | ✅ |
| G8 | `apiClient` có request interceptor tự động gắn `Authorization: Bearer` | `apiClient.ts:13-25` | ✅ |
| G9 | `apiClient` response interceptor unwrap `response.data` — component nhận data trực tiếp | `apiClient.ts:29-30` | ✅ |
| G10 | `BookingManagement` dùng `IBooking` (`pnr`, `customerName`) — đã đồng bộ type mới | `BookingManagement.tsx:4-9` | ✅ |

### State & Error Handling
| # | Hạng mục | File | Ghi chú |
|---|---|---|---|
| G11 | `AdminDashboard`: `isLoading` state + skeleton cards + spinner text | `AdminDashboard.tsx:95-104` | ✅ |
| G12 | `UserManagement`: `isLoading` + skeleton rows + spinner text | `UserManagement.tsx:52-56` | ✅ |
| G13 | `FlightManagement`: `loading` state + skeleton rows | `FlightManagement.tsx` | ✅ |
| G14 | `BookingManagement`: `loading` state + skeleton rows | `BookingManagement.tsx:134` | ✅ |
| G15 | `UserManagement.handleToggleStatus`: try/catch + per-row spinner `lockingId` | `UserManagement.tsx:136-152` | ✅ |
| G16 | `BookingManagement.StatusDropdown`: optimistic update + rollback on error | `BookingManagement.tsx:87-101` | ✅ |
| G17 | `AdminDashboard` có retry button khi API lỗi | `AdminDashboard.tsx:115-120` | ✅ |
| G18 | `UserManagement` có retry button + nút 🔄 Làm mới ở footer | `UserManagement.tsx` | ✅ |

### UI/UX & Clean Code
| # | Hạng mục | File | Ghi chú |
|---|---|---|---|
| G19 | `AdminLayout` sidebar dùng `key={to}` khi map `navItems` | `AdminLayout.tsx:33` | ✅ |
| G20 | `useCallback` dùng đúng cho `loadStats`, `loadUsers`, `handleToggleStatus` | `AdminDashboard.tsx`, `UserManagement.tsx` | ✅ |
| G21 | `cancelled` flag trong `useEffect` của `BookingManagement` tránh race condition | `BookingManagement.tsx:150-159` | ✅ |
| G22 | `SkeletonRow` component tách biệt — reusable | `BookingManagement.tsx`, `UserManagement.tsx` | ✅ |
| G23 | Toast tự dismiss sau 3–3.5 giây, có nút đóng thủ công | tất cả pages | ✅ |

---

## 🟡 Vấn đề tiềm ẩn / Nợ kỹ thuật

### Y1 — `ProtectedRoute` đọc `userRole` từ `localStorage` với dev default `'ADMIN'`
**File:** `ProtectedRoute.tsx:22`
```ts
const userRole = localStorage.getItem('userRole') ?? 'ADMIN'; // dev default
```
**Vấn đề:** Nếu deploy lên production mà quên remove fallback, **mọi user không có `userRole` trong localStorage đều được đối xử như ADMIN**. Không có cơ chế expire/invalidate role khi token hết hạn.
**Mức độ:** 🟡 Tiềm ẩn leo thang thành 🔴 trong production.

---

### Y2 — `apiClient` đọc từ key `'accessToken'` nhưng `ProtectedRoute` đọc key `'token'`
**Files:** `apiClient.ts:16` vs `ProtectedRoute.tsx:21`
```ts
// apiClient.ts
const token = localStorage.getItem('accessToken');

// ProtectedRoute.tsx
const token = localStorage.getItem('token');
```
**Vấn đề:** Hai key localStorage khác nhau → sau khi login, nếu `LoginPage` lưu vào key `'token'`, thì `apiClient` sẽ **KHÔNG bao giờ gắn `Authorization` header** vì nó đọc `'accessToken'`. Các API call sẽ nhận 401.
**Mức độ:** 🟡 Bug tiềm ẩn (phụ thuộc vào `LoginPage` lưu key nào).

---

### Y3 — `handleLogout` trong `AdminLayout` không xoá token
**File:** `AdminLayout.tsx:13-16`
```ts
const handleLogout = () => {
    // TODO: clear auth tokens
    navigate('/');
};
```
**Vấn đề:** Logout không xoá `localStorage.token` / `localStorage.userRole` → user vẫn còn token, có thể navigate trực tiếp lên `/admin` mà không cần login lại.

---

### Y4 — `console.log` thừa trong production code
**File:** `apiClient.ts:35`
```ts
console.log('Hết phiên đăng nhập, vui lòng login lại!');
```
**Vấn đề:** Log nhạy cảm lộ ra browser console, không phù hợp production. Xử lý 401 bị comment out (`// window.location.href = '/login'`).

---

### Y5 — `adminApi.ts` có legacy types / hàm `@deprecated` nhưng chưa có kế hoạch xoá
**File:** `adminApi.ts:119-165`
**Vấn đề:** `DashboardStats`, `Booking` (legacy), `getLegacyDashboardStats`, `createFlight`, `updateFlight`, `deleteFlight`, `updateBookingStatus` vẫn export. Nếu không xoá, team có thể tiếp tục vô tình import legacy type thay vì `IFlight`/`IBooking`.

---

### Y6 — `FlightManagement` mock-save: `airline` field hardcode `''`
**File:** `FlightManagement.tsx:217`
```ts
saved = { ...normalized, airline: '', id: editTarget?.id ?? String(Date.now()) };
```
**Vấn đề:** Khi backend chưa sẵn sàng và user tạo flight mới ở mock mode, `airline` luôn là chuỗi rỗng → hiển thị sai trên UI sau khi lưu.

---

### Y7 — Thiếu `aria-live` region cho Toast notifications
**Files:** `UserManagement.tsx`, `BookingManagement.tsx`, `AdminDashboard.tsx`
**Vấn đề:** Toast hiện tại không có `role="alert"` hay `aria-live="polite"` → screen reader không đọc thông báo → accessibility gap.

---

### Y8 — `BookingManagement` không refresh từ server sau `updateBookingStatus`
**File:** `BookingManagement.tsx:192-196`
```ts
await updateBookingStatus(id, newStatus);
setBookings((prev) =>
    prev.map((b) => b.id === id ? { ...b, status: newStatus } : b),
);
```
**Vấn đề:** Sau update thành công, chỉ cập nhật local state chứ không `refetch`. Nếu backend có side-effect (e.g. auto-confirm khi đủ ghế), UI sẽ hiển thị state cũ.

---

### Y9 — `FlightManagement` và `BookingManagement` vẫn giữ `MOCK_*` fallback data trong production code
**Vấn đề:** Mock data fallback che giấu lỗi API thực — team khó phân biệt "API đang down" vs "API hoạt động". Nên chuyển sang chỉ hiển thị error state.

---

### Y10 — `AdminDashboard` LineChart dùng hardcode `REVENUE_DATA`
**File:** `AdminDashboard.tsx:16-24`
**Vấn đề:** Không có API cho dữ liệu doanh thu 7 ngày. Chart luôn hiển thị dữ liệu mẫu cố định, sai lệch so với thực tế.

---

## 🔴 Lỗi nghiêm trọng

### R1 — Lỗ hổng bảo mật: RBAC chỉ được ngăn ở tầng UI, không có server-side enforcement
**Files:** `ProtectedRoute.tsx`, `adminApi.ts`
**Mô tả:** `ProtectedRoute` check role từ `localStorage` — đây là **client-side only guard**. Bất kỳ ai cũng có thể mở DevTools, set `localStorage.setItem('userRole', 'ADMIN')` và truy cập toàn bộ `/admin/*`. Backend API (Spring Boot) phải có annotation `@PreAuthorize` hoặc tương đương để enforce RBAC thực sự.
**Mức độ:** 🔴 Security vulnerability — phải fix ở backend.

---

### R2 — `apiClient` 401 handler bị comment out → không auto-logout
**File:** `apiClient.ts:36`
```ts
// window.location.href = '/login';
```
**Mô tả:** Khi token hết hạn, response interceptor ghi log nhưng **không redirect về `/login`**. User vẫn thấy trang admin nhưng mọi API call đều lỗi 401 âm thầm. Đây là lỗ hổng UX nghiêm trọng và tiềm ẩn data leak nếu các call tiếp tục được gửi.

---

### R3 — `ForbiddenPage` (`/403`) có thể truy cập mà không cần authentication
**File:** `App.tsx:21`
```tsx
<Route path="/403" element={<ForbiddenPage />} />
```
**Mô tả:** Route này là public. Không phải lỗi nghiêm trọng về bảo mật, tuy nhiên bất kỳ ai biết URL đều có thể vào `/403` trực tiếp — minor UX issue nhưng phản ánh thiếu sót trong routing design.

---

### R4 — `UserManagement` không có `updateUserRole` API — role change là local-only
**File:** `UserManagement.tsx:134-137`
```ts
const handleChangeRole = useCallback((id: string, role: IUser['role']) => {
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role } : u));
    showToast(`Đã đổi role → ${ROLE_LABELS[role]}.`);
```
**Mô tả:** Thay đổi role **không gọi bất kỳ API nào**, chỉ cập nhật local state. Reload trang → role trở về giá trị cũ. Người dùng lầm tưởng đã thay đổi thành công trong khi thực tế không có gì được lưu.

---

## 📋 Action Plan

### Ưu tiên NGAY (P0 — Security)

| ID | Hành động | File cần sửa |
|---|---|---|
| R1 | Backend: thêm `@PreAuthorize("hasRole('ADMIN')")` trên các endpoint `/admin/**` | Spring Boot controllers |
| R2 | `apiClient.ts`: bỏ comment `window.location.href = '/login'` và sử dụng `router.navigate('/login')` hoặc `localStorage.clear()` trước redirect | `apiClient.ts:36` |
| Y2 | Thống nhất 1 key localStorage: đổi `ProtectedRoute` hoặc `apiClient` về cùng key (đề xuất: `'accessToken'`) | `ProtectedRoute.tsx:21` |
| Y1 | Xoá fallback `?? 'ADMIN'` trong production build; dùng env flag `import.meta.env.DEV` để guard | `ProtectedRoute.tsx:22` |

### Ưu tiên Cao (P1 — Correctness)

| ID | Hành động | File cần sửa |
|---|---|---|
| Y3 | `handleLogout`: thêm `localStorage.removeItem('token'); localStorage.removeItem('userRole');` trước `navigate('/')` | `AdminLayout.tsx:13` |
| R4 | Implement `updateUserRole(userId, role)` trong `adminApi.ts` và gọi trong `handleChangeRole` | `adminApi.ts`, `UserManagement.tsx` |
| Y8 | Sau `updateBookingStatus`, gọi lại `loadBookings()` để sync với server | `BookingManagement.tsx:193` |

### Ưu tiên Trung bình (P2 — Code Quality)

| ID | Hành động | File cần sửa |
|---|---|---|
| Y4 | Thay `console.log` bằng `console.warn` hoặc xoá; unmute 401 redirect | `apiClient.ts:35` |
| Y5 | Xoá toàn bộ section legacy exports trong `adminApi.ts` sau khi verify không còn import | `adminApi.ts:119-165` |
| Y6 | Thêm field `airline` vào `FlightPayload` và form input | `adminApi.ts`, `FlightManagement.tsx` |
| Y9 | Thay mock fallback bằng empty-state + error UI | `FlightManagement.tsx`, `BookingManagement.tsx` |

### Ưu tiên Thấp (P3 — UX & Accessibility)

| ID | Hành động | File cần sửa |
|---|---|---|
| Y7 | Thêm `role="alert"` và `aria-live="polite"` vào Toast container | Tất cả admin pages |
| Y10 | Implement API endpoint `/admin/revenue/daily` hoặc label rõ "Dữ liệu minh họa" trên chart | Backend + `AdminDashboard.tsx` |

---

*Báo cáo tạo tự động ngày 2026-02-24. Không có file nào bị chỉnh sửa trong quá trình audit.*
