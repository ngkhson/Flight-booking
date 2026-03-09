import { useState, useEffect, type ChangeEvent } from 'react';
import { getFlights, type IFlight, type IFlightClass } from '../../features/admin/services/adminApi';

type Flight = IFlight & { id: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getTotalSeats = (classes: IFlightClass[]): number =>
    classes.reduce((sum, c) => sum + c.availableSeats, 0);

const getMinPrice = (classes: IFlightClass[]): number => {
    if (!classes.length) return 0;
    return Math.min(...classes.map((c) => c.basePrice));
};

const STATUS_STYLES: Record<Flight['status'], string> = {
    SCHEDULED: 'bg-blue-100 text-blue-700',
    DELAYED: 'bg-yellow-100 text-yellow-700',
    CANCELLED: 'bg-red-100 text-red-700',
    COMPLETED: 'bg-green-100 text-green-700',
};

const STATUS_LABELS: Record<Flight['status'], string> = {
    SCHEDULED: 'Đã lên lịch',
    DELAYED: 'Trễ chuyến',
    CANCELLED: 'Đã huỷ',
    COMPLETED: 'Hoàn thành',
};

const fmtDateTime = (iso: string) =>
    new Date(iso).toLocaleString('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short',
    });

const fmtVND = (n: number) =>
    n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

// ─── Mock data (fallback khi API chưa sẵn sàng) ───────────────────────────────

const MOCK_FLIGHTS: Flight[] = [
    { id: '1', flightNumber: 'VN-201', airlineName: 'Vietnam Airlines', origin: 'HAN', destination: 'SGN', departureTime: '2026-02-25T06:00:00', arrivalTime: '2026-02-25T08:10:00', status: 'SCHEDULED', classes: [{ id: 'c1', className: 'Economy', basePrice: 1_250_000, availableSeats: 120 }] },
    { id: '2', flightNumber: 'VN-305', airlineName: 'Vietnam Airlines', origin: 'SGN', destination: 'DAD', departureTime: '2026-02-25T10:30:00', arrivalTime: '2026-02-25T11:45:00', status: 'DELAYED', classes: [{ id: 'c2', className: 'Economy', basePrice: 890_000, availableSeats: 45 }] },
    { id: '3', flightNumber: 'QH-102', airlineName: 'Bamboo Airways', origin: 'HAN', destination: 'PQC', departureTime: '2026-02-25T14:00:00', arrivalTime: '2026-02-25T16:05:00', status: 'SCHEDULED', classes: [{ id: 'c3', className: 'Economy', basePrice: 1_580_000, availableSeats: 78 }] },
    { id: '4', flightNumber: 'VJ-411', airlineName: 'VietJet Air', origin: 'SGN', destination: 'HAN', departureTime: '2026-02-24T18:00:00', arrivalTime: '2026-02-24T20:15:00', status: 'COMPLETED', classes: [{ id: 'c4', className: 'Economy', basePrice: 1_100_000, availableSeats: 0 }] },
    { id: '5', flightNumber: 'VN-789', airlineName: 'Vietnam Airlines', origin: 'HAN', destination: 'DAD', departureTime: '2026-02-25T20:00:00', arrivalTime: '2026-02-25T21:30:00', status: 'CANCELLED', classes: [{ id: 'c5', className: 'Economy', basePrice: 750_000, availableSeats: 0 }] },
];

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            {Array.from({ length: 7 }).map((_, i) => (
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

        getFlights()
            .then((list) => {
                if (!cancelled) {
                    const withIds: Flight[] = list.map((f, i) => ({
                        ...f,
                        id: (f as Flight).id ?? String(i + 1),
                    }));
                    setFlights(withIds);
                    setLoading(false);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    // Fallback: dùng mock data khi backend chưa sẵn sàng
                    setFlights(MOCK_FLIGHTS);
                    setApiError(true);
                    setLoading(false);
                }
            });

        return () => { cancelled = true; };
    }, []);

    const filtered = flights.filter((f) => {
        const q = search.toLowerCase();
        return (
            f.flightNumber.toLowerCase().includes(q) ||
            f.origin.toLowerCase().includes(q) ||
            f.destination.toLowerCase().includes(q)
        );
    });

    const handleSearch = (e: ChangeEvent<HTMLInputElement>) =>
        setSearch(e.target.value);

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">✈️ Quản lý chuyến bay</h1>
                    <p className="mt-0.5 text-sm text-gray-500">Danh sách toàn bộ chuyến bay trong hệ thống</p>
                </div>
                <button className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                    + Thêm chuyến bay
                </button>
            </div>

            {/* API warning banner */}
            {apiError && (
                <div className="px-4 py-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm flex items-center gap-2">
                    <span>⚠️</span>
                    <span>Không thể kết nối API — đang hiển thị dữ liệu mẫu.</span>
                </div>
            )}

            {/* Search bar */}
            <div className="relative max-w-sm">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm">🔍</span>
                <input
                    type="text"
                    placeholder="Tìm theo số hiệu, sân bay..."
                    value={search}
                    onChange={handleSearch}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
            </div>

            {/* Table */}
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
                                            Không tìm thấy chuyến bay phù hợp.
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
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[f.status]}`}>
                                                {STATUS_LABELS[f.status]}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                        }
                    </tbody>
                </table>

                {/* Footer count */}
                {!loading && (
                    <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
                        Hiển thị {filtered.length} / {flights.length} chuyến bay
                    </div>
                )}
            </div>
        </div>
    );
}
