// src/constants/airportImages.ts

export const AIRPORT_IMAGES: Record<string, string> = {
  // === VIỆT NAM ===
  'SGN': 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=800&q=80', // TP.HCM - Landmark 81
  'HAN': 'https://ik.imagekit.io/tvlk/dam/i/01k3wtedg6ne0a0ysg2vjps0t4.png?tr=q-70,c-at_max,w-1000,h-600',
  'DAD': 'https://images.pexels.com/photos/2034351/pexels-photo-2034351.jpeg?auto=compress&cs=tinysrgb&w=800', // Đà Nẵng
  'PQC': 'https://images.pexels.com/photos/2602537/pexels-photo-2602537.jpeg?auto=compress&cs=tinysrgb&w=800', // Phú Quốc
  'DLI': 'https://images.pexels.com/photos/4060416/pexels-photo-4060416.jpeg?auto=compress&cs=tinysrgb&w=800', // Đà Lạt
  'HPH': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Thanh_pho_Hai_Phong.jpg/800px-Thanh_pho_Hai_Phong.jpg', // Hải Phòng
  'HUI': 'https://images.pexels.com/photos/2673324/pexels-photo-2673324.jpeg?auto=compress&cs=tinysrgb&w=800', // Huế
  'CXR': 'https://images.pexels.com/photos/1683492/pexels-photo-1683492.jpeg?auto=compress&cs=tinysrgb&w=800', // Nha Trang
  'VDO': 'https://images.pexels.com/photos/3354641/pexels-photo-3354641.jpeg?auto=compress&cs=tinysrgb&w=800', // Hạ Long (Gần Vân Đồn)
  'VCL': 'https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg?auto=compress&cs=tinysrgb&w=800', // Hội An (Gần Chu Lai)
  'THD': 'https://images.pexels.com/photos/12304381/pexels-photo-12304381.jpeg?auto=compress&cs=tinysrgb&w=800', // Thanh Hóa
  'VCA': 'https://images.pexels.com/photos/14801124/pexels-photo-14801124.jpeg?auto=compress&cs=tinysrgb&w=800', // Cần Thơ

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

export const getAirportImage = (code: string): string => {
  const cleanCode = code?.trim().toUpperCase();
  
  if (AIRPORT_IMAGES[cleanCode]) {
    return AIRPORT_IMAGES[cleanCode];
  }

  // 👇 THAY ĐỔI Ở ĐÂY: Nếu không có ảnh mã sân bay, lấy ảnh theo keyword 
  // Mỗi code sẽ ra 1 ảnh khác nhau (nhờ vào tham số sig=${code})
  return `https://source.unsplash.com/featured/800x600?city,travel&sig=${cleanCode}`;
};