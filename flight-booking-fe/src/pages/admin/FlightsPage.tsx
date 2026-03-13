import { useState, useEffect } from 'react';
import { getFlights, type IFlight, type IFlightClass } from '../../features/admin/services/adminApi';

// ─── Tự định nghĩa lại Flight để bao gồm id (Sửa lỗi TS) ─────────────────────
type Flight = IFlight & { id: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getTotalSeats = (classes: IFlightClass[]): number =>
    (classes || []).reduce((sum, c) => sum + (c.availableSeats || 0), 0);

const getMinPrice = (classes: IFlightClass[]): number => {
    if (!classes || !classes.length) return 0;
    return Math.min(...classes.map((c) => c.basePrice || 0));
};

const STATUS_STYLES: Record<string, string> = {
    SCHEDULED: 'bg-blue-100 text-blue-700',
    DELAYED: 'bg-yellow-100 text-yellow-700',
    CANCELLED: 'bg-red-100 text-red-700',
    COMPLETED: 'bg-green-100 text-green-700',
};

const STATUS_LABELS: Record<string, string> = {
    SCHEDULED: 'Đã lên lịch',
    DELAYED: 'Trễ chuyến',
    CANCELLED: 'Đã huỷ',
    COMPLETED: 'Hoàn thành',
};

const fmtDateTime = (iso: string) =>
    iso ? new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—';

const fmtVND = (n: number) =>
    (n || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

// ─── Mock data (fallback) ─────────────────────────────────────────────────────

const MOCK_FLIGHTS: Flight[] = [
    { id: '1', flightNumber: 'VN-201', airlineName: 'Vietnam Airlines', origin: 'HAN', destination: 'SGN', departureTime: '2026-02-25T06:00:00', arrivalTime: '2026-02-25T08:10:00', status: 'SCHEDULED', classes: [{ id: 'c1', className: 'Economy', basePrice: 1250000, availableSeats: 120 }] },
];

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            {Array.from({ length: 9 }).map((_, i) => (
                <td key={i} className="px-4 py-3">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                </td>
            ))}
        </tr>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FlightsPage() {
    const [flights, setFlights] = useState<Flight[]>([]);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => {
        let cancelled = false;

        // Dùng any để bóc tách dữ liệu linh hoạt từ BE
        getFlights()
            .then((res: any) => {
                if (!cancelled) {
                    let list: any[] = [];

                    // Cơ chế bóc tách mảng an toàn (Bọc thép)
                    if (Array.isArray(res)) {
                        list = res;
                    } else if (res && typeof res === 'object') {
                        list = res.data?.content || res.result?.content || res.content || res.data || res.result || [];
                    }

                    // Sửa lỗi build TS7006: Thêm (f: any, i: number)
                    const withIds: Flight[] = list.map((f: any, i: number) => ({
                        ...f,
                        id: f.id ?? String(i + 1),
                    }));

                    setFlights(withIds);
                    setLoading(false);
                }
            })
            .catch((err) => {
                console.error("Lỗi fetch FlightsPage:", err);
                if (!cancelled) {
                    setFlights(MOCK_FLIGHTS);
                    setApiError(true);
                    setLoading(false);
                }
            });

        return () => { cancelled = true; };
    }, []);

    const filtered = (flights || []).filter((f) => {
        const q = search.toLowerCase();
        return (
            (f.flightNumber && f.flightNumber.toLowerCase().includes(q)) ||
            (f.origin && f.origin.toLowerCase().includes(q)) ||
            (f.destination && f.destination.toLowerCase().includes(q))
        );
    });

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">✈️ Quản lý chuyến bay</h1>
                    <p className="mt-0.5 text-sm text-gray-500">Danh sách toàn bộ chuyến bay (Trang phụ)</p>
                </div>
            </div>

            {apiError && (
                <div className="px-4 py-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm flex items-center gap-2">
                    <span>⚠️</span>
                    <span>Không thể kết nối API — đang hiển thị dữ liệu mẫu.</span>
                </div>
            )}

            <div className="relative max-w-sm">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm">🔍</span>
                <input
                    type="text"
                    placeholder="Tìm theo số hiệu, sân bay..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 tracking-wide">
                        <tr>
                            <th className="px-4 py-3">Số hiệu</th>
                            <th className="px-4 py-3">Xuất phát</th>
                            <th className="px-4 py-3">Điểm đến</th>
                            <th className="px-4 py-3">Khởi hành</th>
                            <th className="px-4 py-3">Hạ cánh</th>
                            <th className="px-4 py-3">Ghế trống</th>
                            <th className="px-4 py-3">Giá vé</th>
                            <th className="px-4 py-3">Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading
                            ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                            : filtered.length === 0
                                ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-10 text-center text-gray-400 text-sm">
                                            Không tìm thấy chuyến bay nào.
                                        </td>
                                    </tr>
                                )
                                : filtered.map((f) => (
                                    <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 font-mono font-semibold text-gray-800">{f.flightNumber}</td>
                                        <td className="px-4 py-3 font-medium text-gray-700">{f.origin}</td>
                                        <td className="px-4 py-3 font-medium text-gray-700">{f.destination}</td>
                                        <td className="px-4 py-3 text-gray-600">{fmtDateTime(f.departureTime)}</td>
                                        <td className="px-4 py-3 text-gray-600">{fmtDateTime(f.arrivalTime)}</td>
                                        <td className="px-4 py-3 text-gray-600">{getTotalSeats(f.classes)}</td>
                                        <td className="px-4 py-3 text-gray-600">{fmtVND(getMinPrice(f.classes))}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${STATUS_STYLES[f.status] || 'bg-gray-100 text-gray-600'}`}>
                                                {STATUS_LABELS[f.status] || f.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                        }
                    </tbody>
                </table>

                {!loading && (
                    <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
                        Hiển thị {filtered.length} / {flights.length} chuyến bay
                    </div>
                )}
            </div>
        </div>
    );
}