// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'

// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//       <div>
//         <a href="https://vite.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.tsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   )
// }

// export default App

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CustomerLayout } from './layout/CustomerLayout';
import { HomePage } from './pages/customer/HomePage';
import { SearchPage } from './pages/customer/SearchPage';
import { BookingPage } from './pages/customer/BookingPage'; // <-- 1. Import trang mới

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Tuyến đường dành cho Khách hàng (FE 1 quản lý) */}
        <Route path="/" element={<CustomerLayout />}>
          <Route index element={<HomePage />} />
          {/* Sau này thêm: <Route path="search" element={<SearchPage />} /> */}
          <Route path="search" element={<SearchPage />} />
          <Route path="booking" element={<BookingPage />} />
        </Route>

        {/* Tuyến đường dành cho Admin (FE 2 sẽ vào đây làm việc sau) */}
        <Route path="/admin" element={<div>Trang Admin (Đang xây dựng)</div>} />

        {/* Bắt lỗi trang không tồn tại */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
