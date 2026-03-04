# 📋 Admin Portal — Feature Inventory

> **Generated:** 2026-02-25  
> **Scope:** `src/pages/admin/`, `src/features/admin/`, `src/App.tsx`, `src/layout/AdminLayout.tsx`, `src/features/auth/ProtectedRoute.tsx`  
> **Mode:** READ-ONLY analysis — zero code changes made.

---

## 1. 🗺️ Sitemap & Routing

### Route Map

| Route                  | Component            | Allowed Roles          | Auth Required | Notes                                    |
| ---------------------- | -------------------- | ---------------------- | :-----------: | ---------------------------------------- |
| `/`                    | —                    | —                      |      ❌       | Redirects → `/admin/dashboard`           |
| `/login`               | `LoginPage`          | Public                 |      ❌       | Login form (username + password)         |
| `/403`                 | `ForbiddenPage`      | Public                 |      ❌       | Shown when role check fails              |
| `/admin`               | `AdminLayout`        | `ADMIN`, `ACCOUNTANT`  |      ✅       | Layout shell (sidebar + topbar + outlet) |
| `/admin/dashboard`     | `AdminDashboard`     | `ADMIN`, `ACCOUNTANT`  |      ✅       | Overview stats + revenue chart           |
| `/admin/flights`       | `FlightManagement`   | `ADMIN`, `ACCOUNTANT`  |      ✅       | Full CRUD for flights                    |
| `/admin/bookings`      | `BookingManagement`  | `ADMIN`, `ACCOUNTANT`  |      ✅       | View bookings + change status            |
| `/admin/users`         | `UserManagement`     | `ADMIN` **only**       |      ✅       | Nested `ProtectedRoute` — ADMIN-exclusive|

### RBAC Mechanism (`ProtectedRoute`)

- **Token check:** reads `localStorage.getItem('token')`. Missing token → redirect `/login`.
- **Role check:** reads `localStorage.getItem('userRole')` (dev default = `'ADMIN'`). If `allowedRoles` is provided and user's role is not in the list → redirect `/403`.
- Two levels of protection:
  1. **Outer guard** on `/admin` — allows `ADMIN` + `ACCOUNTANT`.
  2. **Inner guard** on `/admin/users` — restricts to `ADMIN` only.

### Sidebar Navigation (`AdminLayout`)

Four fixed links rendered via `NavLink`:
1. 📊 Dashboard → `/admin/dashboard`
2. ✈️ Chuyến bay → `/admin/flights`
3. 🎟️ Đặt vé → `/admin/bookings`
4. 👥 Người dùng → `/admin/users`

Top bar shows a static greeting ("Xin chào, Admin 👋") and a **Logout** button (navigates to `/`, but does **not** clear `localStorage` tokens — marked `TODO` in code).

---

## 2. ⚙️ Page-by-Page Feature Breakdown

### 2.1 📊 Dashboard (`AdminDashboard.tsx` — 226 lines)

**View capabilities:**
- Can view **6 stat cards** fetched from the API:
  - Tổng số vé (Total Bookings)
  - Tổng doanh thu (Total Revenue — formatted in VND with tỷ/triệu abbreviations)
  - Tổng chuyến bay (Total Flights)
  - Tổng người dùng (Total Users)
  - Chuyến bay hôm nay (Flights Today)
  - Khách hàng mới (New Customers)
- Can view a **Revenue Line Chart** (Recharts `LineChart`) with dual Y-axes:
  - Left axis: Revenue (VND)
  - Right axis: Ticket count
  - ⚠️ **Data is hardcoded mock** (`REVENUE_DATA` — 7 days, Mon–Sun). Labeled "Dữ liệu mẫu" in the UI.
- Can view a **Recent Bookings mini-table** (4 hardcoded rows — `#BK-001` through `#BK-004`) showing ID, route, passenger, and status badge.
- Custom tooltip on chart hover showing formatted revenue and ticket count.

**Interactive capabilities:**
- "Thử lại" (Retry) button appears when API call to `getDashboardStats` fails.

**Loading / Error states:**
- Skeleton cards (animated pulse) during loading.
- Yellow warning banner with retry button on API error.

---

### 2.2 ✈️ Flight Management (`FlightManagement.tsx` — 693 lines)

**View capabilities:**
- Can view a **data table** of all flights with columns:
  - Số hiệu (Flight Number), Hãng (Airline — derived from flight code prefix), Xuất phát (Origin IATA), Điểm đến (Destination IATA), Giờ bay (Departure), Hạ cánh (Arrival), Ghế trống (Available Seats), Giá vé (Price — VND), Trạng thái (Status badge), Hành động (Actions).
- Status badges with color coding:
  - `SCHEDULED` → blue, `DELAYED` → yellow, `CANCELLED` → red, `COMPLETED` → green.
- Table footer showing "Hiển thị X / Y chuyến bay".

**Interactive / Mutating capabilities:**
- ✅ Can **search/filter** flights by flight number, origin, or destination (client-side text input).
- ✅ Can **add a new flight** via "+ Thêm chuyến bay" button → opens `FlightModal`.
- ✅ Can **edit an existing flight** via "✏️ Sửa" row button → opens `FlightModal` pre-filled.
- ✅ Can **delete a flight** via "🗑️ Xoá" row button → opens `DeleteModal` with confirmation.
- Flight form includes **client-side validation** (`validatePayload`):
  - Flight number format: `XX-NNNN` (regex check).
  - Origin / Destination: exactly 3 uppercase IATA letters.
  - Departure required; Arrival must be after Departure.
  - Seats ≥ 0, integer only. Price > 0.
- Status dropdown in form with 4 options: SCHEDULED, DELAYED, CANCELLED, COMPLETED.

**Fallback behavior:**
- If `getFlights` API fails → falls back to `MOCK_FLIGHTS` (5 hardcoded flights) and sets `isMock = true`.
- In mock mode, Add/Edit/Delete operations update state locally (no API calls) with simulated latency.
- Yellow banner warns user when in mock-data mode.

**Toast notifications:**
- Success/error toasts (auto-dismiss after 3.5s) for add, edit, and delete operations.

---

### 2.3 🎟️ Booking Management (`BookingManagement.tsx` — 346 lines)

**View capabilities:**
- Can view a **data table** of all bookings with columns:
  - Mã đơn (PNR), Hành khách (Customer Name), Chuyến bay (Flight Number), Hành trình (Route), Ngày đặt (Created Date), Tổng tiền (Total Amount — VND), Trạng thái hiện tại (read-only status badge), Đổi trạng thái (editable status dropdown).
- Status badges: `CONFIRMED` → green, `PENDING` → yellow, `CANCELLED` → red.
- Table footer showing "Hiển thị X / Y đơn đặt vé".

**Interactive / Mutating capabilities:**
- ✅ Can **filter by status** using pill-shaped tab buttons: Tất cả | Xác nhận | Chờ xử lý | Đã huỷ — with count badges per status.
- ✅ Can **search** by PNR, customer name, flight number, or route (client-side text input).
- ✅ Can **change booking status** inline via per-row `<select>` dropdown (PENDING ↔ CONFIRMED ↔ CANCELLED).
  - Optimistic update with rollback on API error.
  - Spinner shown on the dropdown while API call is in-flight.

**Fallback behavior:**
- API failure → falls back to `MOCK_BOOKINGS` (5 rows), mock mode toggles status locally.
- Yellow banner for mock-data mode.

**Toast notifications:**
- Success/error toasts (auto-dismiss 3.5s) for status change operations.

---

### 2.4 👥 User Management (`UserManagement.tsx` — 315 lines)

> ⚠️ **ADMIN-only page** — requires an additional `ProtectedRoute` with `allowedRoles={['ADMIN']}`.

**View capabilities:**
- Can view a **data table** of all users with columns:
  - ID (monospace), Họ tên (Name), Email, Role (badge), Ngày tạo (Created At), Trạng thái (ACTIVE / LOCKED badge), Hành động (actions).
- Role badges: `ADMIN` → purple, `ACCOUNTANT` → blue, `AGENT` → indigo, `CUSTOMER` → gray.
- Status badges: `ACTIVE` → green with ● dot, `LOCKED` → red with 🔒 icon.
- Summary counters in page header: "✅ N hoạt động" and "🔒 N bị khoá".
- Table footer with record count + "🔄 Làm mới" (Refresh) button.

**Interactive / Mutating capabilities:**
- ✅ Can **search** users by name, email, or role (client-side text input).
- ✅ Can **change a user's role** via `RoleDropdown` (custom popover, not native `<select>`):
  - Options: ADMIN, ACCOUNTANT, AGENT, CUSTOMER.
  - ⚠️ **Local-only** — no API call for role change. Comment in code: `"no updateUserRole API yet"`. Updates state in-memory only.
- ✅ Can **lock / unlock user accounts** via toggle button:
  - Calls `updateUserStatus(userId, 'LOCKED' | 'ACTIVE')` API.
  - After success, refreshes the full user list from the server.
  - Spinner on the button during the API call; button is disabled while processing.
- ✅ Can **refresh** user list manually via "🔄 Làm mới" footer link.

**Error handling:**
- API error banner with "Thử lại" (Retry) button.
- Toast notifications (success / error / info) with auto-dismiss after 3s.

---

### 2.5 📄 Legacy Pages (unused in current routing)

Two additional page files exist in `src/pages/admin/` but are **NOT mounted** in `App.tsx` routes:

| File                 | Status      | Description                                                                 |
| -------------------- | ----------- | --------------------------------------------------------------------------- |
| `FlightsPage.tsx`    | **Orphaned** | Read-only flight table with search. Has a non-functional "Add" button (no `onClick`). Uses the legacy `Flight` / `getFlights` types. |
| `BookingsPage.tsx`   | **Orphaned** | Read-only booking table with status filter tabs. No inline status editing. Uses the legacy `Booking` / `getBookings` types. |

These appear to be the **original v1 pages** before `FlightManagement.tsx` / `BookingManagement.tsx` replaced them with full CRUD capabilities.

---

## 3. 🔌 API Connections

### Service Layer (`src/features/admin/services/adminApi.ts`)

All calls go through a shared `apiClient` (Axios instance from `src/services/apiClient.ts`).

#### Active Endpoints Used by Current Pages

| Method   | Endpoint                            | Used By                | Action                              | Request Payload                           | Response Type        |
| -------- | ----------------------------------- | ---------------------- | ----------------------------------- | ----------------------------------------- | -------------------- |
| `GET`    | `/admin/dashboard/stats`            | `AdminDashboard`       | Fetch summary statistics            | —                                         | `IDashboardStats`    |
| `GET`    | `/admin/flights?page=N&size=N`      | `FlightManagement`     | List flights (paginated)            | Query: `page`, `size`                     | `IPage<IFlight>`     |
| `POST`   | `/admin/flights`                    | `FlightManagement`     | Create a new flight                 | `FlightPayload` (body)                    | `Flight`             |
| `PUT`    | `/admin/flights/:id`                | `FlightManagement`     | Update an existing flight           | `FlightPayload` (body)                    | `Flight`             |
| `DELETE` | `/admin/flights/:id`                | `FlightManagement`     | Delete a flight                     | —                                         | `void`               |
| `GET`    | `/admin/bookings?page=N&size=N`     | `BookingManagement`    | List bookings (paginated)           | Query: `page`, `size`                     | `IPage<IBooking>`    |
| `PATCH`  | `/admin/bookings/:id/status`        | `BookingManagement`    | Update booking status               | `{ status: 'PENDING'\|'CONFIRMED'\|'CANCELLED' }` | `Booking`   |
| `GET`    | `/admin/users?page=N&size=N`        | `UserManagement`       | List users (paginated)              | Query: `page`, `size`                     | `IPage<IUser>`       |
| `PATCH`  | `/admin/users/:userId/status`       | `UserManagement`       | Lock / Unlock user account          | `{ status: 'ACTIVE'\|'LOCKED' }`          | `IUser`              |

#### Defined But Not Yet Called

| Function                | Endpoint                     | Notes                                             |
| ----------------------- | ---------------------------- | ------------------------------------------------- |
| `getLegacyDashboardStats` | `GET /admin/dashboard/stats` | Deprecated — returns smaller `DashboardStats` type |

#### Missing From API Layer (No Endpoint Defined)

| Action               | Notes                                                           |
| -------------------- | --------------------------------------------------------------- |
| `updateUserRole`     | Role change is local-only in `UserManagement.tsx` — no API call |
| Revenue chart data   | Dashboard chart uses hardcoded `REVENUE_DATA` — no API fetch    |
| Recent bookings feed | Dashboard mini-table uses 4 hardcoded rows — no API fetch       |

### Data Models Summary

| Interface          | Key Fields                                                                               |
| ------------------ | ---------------------------------------------------------------------------------------- |
| `IDashboardStats`  | `totalFlights`, `totalRevenue`, `totalUsers`, `totalBookings`, `flightsToday`, `newCustomers` |
| `IFlight`          | `id`, `flightNumber`, `airline`, `origin`, `destination`, `departureTime`, `arrivalTime`, `status`, `price`, `availableSeats` |
| `IBooking`         | `id`, `pnr`, `customerName`, `flightId`, `flightNumber`, `route`, `status`, `totalAmount`, `createdAt` |
| `IUser`            | `id`, `name`, `email`, `role`, `status`, `createdAt`                                     |
| `FlightPayload`    | Same as `IFlight` minus `id` and `airline`                                               |

---

## 4. 🔍 Gap Analysis

Based on standard enterprise Admin portals, the following UI elements are notably absent:

### Critical Gaps

| #  | Gap                                       | Affected Page(s)           | Impact                                                                                                      |
| -- | ----------------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 1  | **No server-side pagination controls**    | Flights, Bookings, Users   | All pages fetch `page=0, size=100` in a single request. No "Next / Previous" or page-number navigation in the UI. Will not scale past ~100 records. |
| 2  | **No `updateUserRole` API integration**   | User Management            | Role changes via the dropdown are **local-only** (in-memory). Refreshing the page loses changes. The backend endpoint likely exists but isn't wired. |
| 3  | **Dashboard charts use hardcoded data**   | Dashboard                  | The revenue line chart and "recent bookings" table are static mock data. No dynamic time-range or date-picker filtering. |

### Notable Missing UI Elements

| #  | Missing Element                            | Standard Expectation                                                                        |
| -- | ------------------------------------------ | ------------------------------------------------------------------------------------------- |
| 4  | No **date-range / date-picker filter**     | Revenue dashboard and booking tables typically support filtering by custom date ranges.       |
| 5  | No **export functionality** (CSV/Excel)    | Enterprise portals usually allow exporting table data for reporting.                          |
| 6  | No **column sorting**                      | Flight, booking, and user tables are not sortable by any column header.                      |
| 7  | No **"Create User"** action               | Admin can only view/lock/role-change existing users — cannot register new users from the portal. |
| 8  | No **booking detail / view modal**         | No way to inspect full booking details; all data is in the table row.                        |
| 9  | Logout does **not clear auth tokens**      | `handleLogout` in `AdminLayout` navigates to `/` but does not call `localStorage.removeItem`. |
| 10 | Two **orphaned page files** in codebase    | `FlightsPage.tsx` and `BookingsPage.tsx` are unused dead code — should be deleted.           |

---

*End of inventory.*
