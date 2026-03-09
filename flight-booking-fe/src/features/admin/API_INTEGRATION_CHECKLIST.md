# 🗺️ Admin Frontend → Backend API Integration Checklist

> **Generated**: 2026-03-09  
> **Source files analysed (READ-ONLY)**:  
> - `src/features/admin/services/adminApi.ts`  
> - `src/services/apiClient.ts`  
> - `.env` / `.env.example` — **not found** (none exist yet)

---

## 1. 🌍 Environment Variables Needed

The current `apiClient.ts` has a **hardcoded** base URL:

```ts
baseURL: 'http://localhost:8080/api'
```

This single Axios instance is shared by all admin API calls. Before going live, create a `.env` file (and commit a `.env.example` template) with variables for **each backend service**:

| Variable Name (suggested)       | Purpose                                   | Example Value                        |
| ------------------------------- | ----------------------------------------- | ------------------------------------ |
| `VITE_FLIGHT_API_BASE_URL`      | Flights microservice base URL             | `http://localhost:8080/api`          |
| `VITE_BOOKING_API_BASE_URL`     | Bookings microservice base URL            | `http://localhost:8081/api`          |
| `VITE_AUTH_API_BASE_URL`        | Auth / User-management service base URL   | `http://localhost:8082/api`          |

> [!IMPORTANT]
> Currently **all** admin calls go through a single `apiClient` pointing to `localhost:8080/api`. If the three BE services run on **different** ports or domains, the FE will need either:
> - **Option A**: Three separate Axios instances (one per service), or
> - **Option B**: An API Gateway that aggregates all services behind one origin.
>
> **Action**: Confirm with the BE team which approach is used and update `apiClient.ts` accordingly.

---

## 2. 🔗 Endpoints & Methods Mapping

Every API call extracted from `adminApi.ts`. The developer **must** verify each route exists in the Backend Swagger/Postman documentation.

### 2.1 Primary Endpoints (New Integration Layer)

| # | Function Name        | HTTP Method | Endpoint Route                       | Query Params               | Request Body                | Expected Response Type      |
|---|----------------------|-------------|--------------------------------------|-----------------------------|-----------------------------|-----------------------------|
| 1 | `getDashboardStats`  | `GET`       | `/admin/dashboard/stats`             | —                           | —                           | `IDashboardStats`           |
| 2 | `getFlights`         | `GET`       | `/admin/flights`                     | `page` (int), `size` (int)  | —                           | `IPage<IFlight>`            |
| 3 | `getBookings`        | `GET`       | `/admin/bookings`                    | `page` (int), `size` (int)  | —                           | `IPage<IBooking>`           |
| 4 | `getUsers`           | `GET`       | `/admin/users`                       | `page` (int), `size` (int)  | —                           | `IPage<IUser>`              |
| 5 | `updateUserStatus`   | `PATCH`     | `/admin/users/{userId}/status`       | —                           | `{ status: "ACTIVE" \| "LOCKED" }` | `IUser`              |

### 2.2 Legacy Endpoints (Still in Use by Existing Pages)

| # | Function Name              | HTTP Method | Endpoint Route                       | Request Body                        | Expected Response Type |
|---|----------------------------|-------------|--------------------------------------|-------------------------------------|------------------------|
| 6 | `getLegacyDashboardStats`  | `GET`       | `/admin/dashboard/stats`             | —                                   | `DashboardStats`       |
| 7 | `createFlight`             | `POST`      | `/admin/flights`                     | `FlightPayload` (see §3.6)         | `Flight` (`IFlight`)   |
| 8 | `updateFlight`             | `PUT`       | `/admin/flights/{id}`                | `FlightPayload` (see §3.6)         | `Flight` (`IFlight`)   |
| 9 | `deleteFlight`             | `DELETE`    | `/admin/flights/{id}`                | —                                   | `void`                 |
| 10| `updateBookingStatus`      | `PATCH`     | `/admin/bookings/{id}/status`        | `{ status: "CONFIRMED" \| "PENDING" \| "CANCELLED" }` | `Booking` (legacy) |

---

## 3. 📦 Data Contracts (Payloads & Responses)

> [!CAUTION]
> The FE uses **camelCase** field names (e.g. `activeFlights`, `customerName`). If the BE returns **snake_case** (e.g. `active_flights`, `customer_name`), all API calls will silently produce `undefined` values. **Verify exact key casing** for every field below.

### 3.1 `IDashboardStats`

```ts
interface IDashboardStats {
    totalFlights:      number;
    totalRevenue:      number;   // VND
    totalUsers:        number;
    totalBookings:     number;
    flightsToday:      number;
    newCustomers:      number;
    todayRevenue:      number;   // VND – revenue earned today
    activeFlights:     number;   // flights currently in-progress
    pendingBookings:   number;   // bookings awaiting confirmation
    totalTicketsSold:  number;   // lifetime tickets sold
}
```

**BE must return ALL 10 keys.** Missing keys will render as `0` or `undefined` on the dashboard.

---

### 3.2 `IFlight`

```ts
interface IFlight {
    id:             string;
    flightNumber:   string;
    airline:        string;
    origin:         string;
    destination:    string;
    departureTime:  string;   // ISO-8601 (e.g. "2026-03-15T08:30:00Z")
    arrivalTime:    string;   // ISO-8601
    status:         'SCHEDULED' | 'DELAYED' | 'CANCELLED' | 'COMPLETED';
    price:          number;   // VND
    availableSeats: number;
}
```

**Check**: Does the BE return `status` as an uppercase enum string (e.g. `"SCHEDULED"`)? The FE strictly matches these four values.

---

### 3.3 `IBooking`

```ts
interface IBooking {
    id:            string;
    pnr:           string;   // Passenger Name Record / booking code
    customerName:  string;
    flightId:      string;
    flightNumber:  string;
    route:         string;
    status:        'PENDING' | 'CONFIRMED' | 'CANCELLED';
    totalAmount:   number;   // VND
    createdAt:     string;   // ISO-8601
}
```

> [!WARNING]
> The legacy `Booking` interface uses `bookingCode` instead of `pnr`, and `passengerName` instead of `customerName`. Pages still using the legacy type will break if the BE returns the new field names. **Verify which pages use which interface.**

---

### 3.4 `IUser`

```ts
interface IUser {
    id:        string;
    name:      string;
    email:     string;
    role:      'ADMIN' | 'ACCOUNTANT' | 'AGENT' | 'CUSTOMER';
    status:    'ACTIVE' | 'LOCKED';
    createdAt: string;   // ISO-8601
}
```

**Check**: Does the BE role enum include all four values? The FE renders badges/tags based on these exact strings.

---

### 3.5 `IPage<T>` — Pagination Wrapper

```ts
interface IPage<T> {
    content:       T[];
    totalElements: number;
    totalPages:    number;
    page:          number;
    size:          number;
}
```

This corresponds to Spring Boot's `Page<T>` response shape. **Verify** the BE returns these exact top-level keys (Spring default uses `content`, `totalElements`, `totalPages`, `number` (not `page`), `size`).

> [!WARNING]
> **Potential Mismatch**: Spring Boot's `PageImpl` serializes the current page number as `number`, but the FE expects `page`. Confirm the BE field name and add a mapping if necessary.

---

### 3.6 `FlightPayload` — Request Body for Create/Update Flight

```ts
interface FlightPayload {
    flightNumber:   string;
    origin:         string;
    destination:    string;
    departureTime:  string;   // ISO-8601
    arrivalTime:    string;   // ISO-8601
    availableSeats: number;
    price:          number;
    status:         'SCHEDULED' | 'DELAYED' | 'CANCELLED' | 'COMPLETED';
}
```

---

## 4. 🛡️ Authentication & Infrastructure Requirements

### 4.1 Auth Header Format

The `apiClient.ts` request interceptor automatically attaches the following header to **every** request:

```
Authorization: Bearer <token>
```

- The token is read from `localStorage` under the key **`accessToken`**.
- If `accessToken` is absent from `localStorage`, **no** `Authorization` header is sent.

**Developer action**: After login, the auth flow must call `localStorage.setItem('accessToken', token)` with the JWT received from the Auth service.

---

### 4.2 Error Handling — 401 Interceptor

The response interceptor currently logs a message on `401 Unauthorized` but does **not** redirect. The redirect line is commented out:

```ts
// window.location.href = '/login';
```

**Action**: Decide whether to enable automatic redirect on 401 before integration.

---

### 4.3 Admin Account Credentials

> [!IMPORTANT]
> **Before testing**, obtain a real Admin account from the BE team:
> - Username / Email
> - Password
> - Confirm the account has `role: "ADMIN"` in the database
>
> The FE `ProtectedRoute` will check the user's role to guard admin pages.

---

### 4.4 CORS Configuration

> [!IMPORTANT]
> Ask the BE team to whitelist the FE development origin in their CORS configuration:
>
> ```
> Allowed Origin: http://localhost:5173
> Allowed Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
> Allowed Headers: Content-Type, Authorization
> ```
>
> Without this, all API calls will fail with a CORS preflight error in the browser.

---

### 4.5 Request Defaults

| Setting          | Value                      |
| ---------------- | -------------------------- |
| `Content-Type`   | `application/json`         |
| Timeout          | `10000 ms` (10 seconds)    |
| Base URL         | `http://localhost:8080/api` |

---

## 5. ✅ Pre-Integration Checklist

Use this checklist when verifying each endpoint against the BE documentation:

- [ ] `.env` file created with correct `VITE_*_API_BASE_URL` variables
- [ ] `apiClient.ts` updated to read `baseURL` from `import.meta.env`
- [ ] **GET** `/admin/dashboard/stats` — returns all 10 `IDashboardStats` keys
- [ ] **GET** `/admin/flights?page=0&size=20` — returns `IPage<IFlight>` with correct `page` key (not `number`)
- [ ] **GET** `/admin/bookings?page=0&size=20` — returns `IPage<IBooking>` with correct key names
- [ ] **GET** `/admin/users?page=0&size=20` — returns `IPage<IUser>`
- [ ] **PATCH** `/admin/users/{userId}/status` — accepts `{ status }` body, returns `IUser`
- [ ] **POST** `/admin/flights` — accepts `FlightPayload`, returns `IFlight`
- [ ] **PUT** `/admin/flights/{id}` — accepts `FlightPayload`, returns `IFlight`
- [ ] **DELETE** `/admin/flights/{id}` — returns 200/204
- [ ] **PATCH** `/admin/bookings/{id}/status` — accepts `{ status }` body, returns `Booking`
- [ ] All enum values (`status`, `role`) match between FE and BE (exact casing)
- [ ] All date fields return ISO-8601 strings
- [ ] All monetary fields (`price`, `totalAmount`, `totalRevenue`, `todayRevenue`) are `number` (not string)
- [ ] CORS enabled for `http://localhost:5173`
- [ ] Admin account created and tested
- [ ] JWT token stored as `accessToken` in `localStorage`
- [ ] 401 redirect strategy decided and implemented
