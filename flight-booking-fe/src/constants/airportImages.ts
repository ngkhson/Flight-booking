// src/constants/airportImages.ts

export const AIRPORT_IMAGES: Record<string, string> = {
  // === VIỆT NAM ===
  'SGN': 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=800&q=80', // TP.HCM - Landmark 81
  'HAN': 'https://ik.imagekit.io/tvlk/dam/i/01k3wtedg6ne0a0ysg2vjps0t4.png?tr=q-70,c-at_max,w-1000,h-600',
  'DAD': 'https://hoangphuan.com/wp-content/uploads/2024/06/tour-du-lich-da-nang-1.jpg', // Đà Nẵng
  'PQC': 'https://bcp.cdnchinhphu.vn/334894974524682240/2025/6/23/phu-quoc-17506756503251936667562.jpg', // Phú Quốc
  'DLI': 'https://www.dulichdongnai.com.vn/UserFiles/Images/2021/DLat/DNT%20da-lat.jpg', // Đà Lạt
  'HPH': 'https://bcp.cdnchinhphu.vn/334894974524682240/2023/12/3/6c2a27c4e9d617884ec7-1458d2ddfe164132b95ec163ccc8e4ea-1701595864429488932869.jpg', // Hải Phòng
  'HUI': 'https://res.klook.com/image/upload/fl_lossy.progressive,q_60/v1756112161/destination/o9z67xq2yzkcxsrdrsjw.jpg', // Huế
  'CXR': 'https://cdn2.tuoitre.vn/471584752817336320/2023/4/18/tp-nha-trang-16818161974101240202452.jpeg', // Nha Trang
  'VDO': 'https://bizweb.dktcdn.net/100/101/075/files/ha-long-bay.jpg?v=1767845461645', // Hạ Long (Gần Vân Đồn)
  'VCL': 'https://image.vietnam.travel/sites/default/files/styles/top_banner/public/2022-05/shutterstock_1303493764_0.jpg?itok=957WuKlT', // Hội An (Gần Chu Lai)
  'THD': 'https://intour.vn/upload/img/0f70a9710eb8c8bd31bb847ec81b5dd0/2022/03/24/gia_ve_cac_diem_tham_quan_tai_thanh_hoa_moi_nhat_1648099703.jpg', // Thanh Hóa
  'VCA': 'https://cdn-media.sforum.vn/storage/app/media/ctv_seo4/danh-lam-thang-canh-can-tho-thumb.jpg', // Cần Thơ
  'VII': 'https://vanhoavaphattrien.vn/uploads/images/2025/05/15/img-1747221363087-1747223952134-1747278695.jpg', // Nghệ An

  // === MỚI BỔ SUNG ===
  'JNB': 'https://www.andbeyond.com/wp-content/uploads/sites/5/Johannesburg-Skyline.jpg', // Johannesburg
  'ATL': 'https://www.cubesmart.com/blog/wp-content/uploads/800X600_Blog05_01-9.jpg',  // Atlanta
  'BOS': 'https://duhocnamphong.vn/upload_images/images/2019/11/25/Boston-usa.jpg', // Boston
  'ALG': 'https://images.pexels.com/photos/10350410/pexels-photo-10350410.jpeg?auto=compress&cs=tinysrgb&w=800', // Algiers
  'OSS': 'https://tourdulichmy.vn/view/admin/Themes/kcfinder/upload/images/san-diego-mixtourist.jpg', // Osh (Fallback cảnh đẹp)
  'ORY': 'https://images.pexels.com/photos/1530283/pexels-photo-1530283.jpeg?auto=compress&cs=tinysrgb&w=800', // Paris Orly
  'ALA': 'https://datviettour.com.vn/uploads/images/chau-a/kazakhstan/danh-thang/danh_thang_3.jpg', // Almaty

  // === QUỐC TẾ KHÁC ===
  'BKK': 'https://images.pexels.com/photos/1007657/pexels-photo-1007657.jpeg?auto=compress&cs=tinysrgb&w=800', // Bangkok
  'DMK': 'https://images.pexels.com/photos/1310788/pexels-photo-1310788.jpeg?auto=compress&cs=tinysrgb&w=800', // Don Mueang
  'SIN': 'https://images.pexels.com/photos/3152126/pexels-photo-3152126.jpeg?auto=compress&cs=tinysrgb&w=800', // Singapore
  'KUL': 'https://cdnphoto.dantri.com.vn/LqsnKn4NbY_3sevpvl0TyehHeMM=/thumb_w/960/2020/01/03/1-1578062770776.jpg', // Kuala Lumpur
  'DPS': 'https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800', // Bali
  'REP': 'https://images.pexels.com/photos/161401/angkor-wat-temple-cambodia-161401.jpeg?auto=compress&cs=tinysrgb&w=800', // Siem Reap
  'MNL': 'https://images.pexels.com/photos/5842106/pexels-photo-5842106.jpeg?auto=compress&cs=tinysrgb&w=800', // Manila
  'ICN': 'https://images.pexels.com/photos/2372977/pexels-photo-2372977.jpeg?auto=compress&cs=tinysrgb&w=800', // Seoul
  'NRT': 'https://images.pexels.com/photos/1822605/pexels-photo-1822605.jpeg?auto=compress&cs=tinysrgb&w=800', // Tokyo
  'KIX': 'https://images.pexels.com/photos/1440476/pexels-photo-1440476.jpeg?auto=compress&cs=tinysrgb&w=800', // Osaka
  'TPE': 'https://images.pexels.com/photos/1119561/pexels-photo-1119561.jpeg?auto=compress&cs=tinysrgb&w=800', // Taipei
  'HKG': 'https://images.pexels.com/photos/1239162/pexels-photo-1239162.jpeg?auto=compress&cs=tinysrgb&w=800', // Hong Kong
  'PEK': 'https://images.pexels.com/photos/208213/pexels-photo-208213.jpeg?auto=compress&cs=tinysrgb&w=800',  // Beijing
  'PVG': 'https://images.pexels.com/photos/169647/pexels-photo-169647.jpeg?auto=compress&cs=tinysrgb&w=800',  // Shanghai
  'CDG': 'https://images.pexels.com/photos/532826/pexels-photo-532826.jpeg?auto=compress&cs=tinysrgb&w=800',   // Paris
  'LHR': 'https://images.pexels.com/photos/460672/pexels-photo-460672.jpeg?auto=compress&cs=tinysrgb&w=800',   // London
  'AMS': 'https://images.pexels.com/photos/208733/pexels-photo-208733.jpeg?auto=compress&cs=tinysrgb&w=800',   // Amsterdam
  'JFK': 'https://images.pexels.com/photos/466685/pexels-photo-466685.jpeg?auto=compress&cs=tinysrgb&w=800',   // New York
  'SYD': 'https://images.pexels.com/photos/1878293/pexels-photo-1878293.jpeg?auto=compress&cs=tinysrgb&w=800', // Sydney
  'MEL': 'https://images.pexels.com/photos/114979/pexels-photo-114979.jpeg?auto=compress&cs=tinysrgb&w=800',   // Melbourne
};

export const DEFAULT_FLIGHT_IMAGE = 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80';

export const getAirportImage = (codeOrName: string): string => {
  if (!codeOrName) return DEFAULT_FLIGHT_IMAGE;

  const cleanInput = codeOrName.trim().toUpperCase();
  
  // 1. Nếu truyền đúng mã (SGN, HAN) -> Lấy trong list
  if (AIRPORT_IMAGES[cleanInput]) {
    return AIRPORT_IMAGES[cleanInput];
  }

  // 2. Thử match theo tên thành phố (nếu API trả về "Hà Nội" thay vì "HAN")
  const cityToCode: Record<string, string> = {
    'HÀ NỘI': 'HAN', 'HA NOI': 'HAN',
    'HỒ CHÍ MINH': 'SGN', 'TP HCM': 'SGN', 'SAI GON': 'SGN',
    'ĐÀ NẴNG': 'DAD', 'DA NANG': 'DAD',
    'PHÚ QUỐC': 'PQC', 'PHU QUOC': 'PQC',
    'ĐÀ LẠT': 'DLI', 'DA LAT': 'DLI',
    'NHA TRANG': 'CXR',
    // Thêm các thành phố khác nếu cần
  };

  const matchedCode = cityToCode[cleanInput];
  if (matchedCode && AIRPORT_IMAGES[matchedCode]) {
    return AIRPORT_IMAGES[matchedCode];
  }

  // 3. Nếu vẫn không có, trả về ảnh ngẫu nhiên từ Picsum (hoạt động tốt)
  // Tính tổng mã ASCII của chữ để làm seed (giúp 1 thành phố luôn ra 1 ảnh giống nhau)
  let seedId = 100;
  for (let i = 0; i < cleanInput.length; i++) {
    seedId += cleanInput.charCodeAt(i);
  }
  
  // Dùng id từ 100-300 của picsum để đảm bảo có ảnh
  const finalId = seedId % 200 + 100; 
  return `https://picsum.photos/id/${finalId}/800/600`;
};