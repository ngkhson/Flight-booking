import { useState, useEffect, type FormEvent } from 'react';
import { Filter, X } from 'lucide-react';
import {
    getFlights, createFlight, updateFlight, deleteFlight,
    type IFlight, type IFlightClass
} from '../../features/admin/services/adminApi';

// ─── Tự định nghĩa lại Flight ────────────────────────────────────────────────
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

const toDatetimeLocal = (iso: string): string => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const fmtDateChart = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    return parts.length === 3 ? `${parts[2]}/${parts[1]}` : dateStr;
};

// ─── Mock data (fallback) ─────────────────────────────────────────────────────
const MOCK_FLIGHTS: Flight[] = [
    { id: '1', flightNumber: 'VN-201', airlineName: 'Vietnam Airlines', origin: 'HAN', destination: 'SGN', departureTime: '2026-03-14T06:00:00', arrivalTime: '2026-03-14T08:10:00', status: 'SCHEDULED', classes: [{ id: 'c1', className: 'Economy', basePrice: 1250000, availableSeats: 120 }] },
];

// ─── Reusable Components ──────────────────────────────────────────────────────
function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            {Array.from({ length: 9 }).map((_, i) => (
                <td key={i} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded w-3/4" /></td>
            ))}
        </tr>
    );
}

const inputCls = (hasError?: string) =>
    `w-full px-3 py-2 text-sm border rounded-lg transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${hasError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`;

// ─── Modals ───────────────────────────────────────────────────────────────────
function FlightModal({ open, editTarget, onClose, onSaved }: { open: boolean; editTarget: Flight | null; onClose: () => void; onSaved: () => void; }) {
    const [form, setForm] = useState<any>({});
    const [submitting, setSubmitting] = useState(false);
    const [apiErr, setApiErr] = useState<string | null>(null);

    useEffect(() => {
        if (editTarget) {
            setForm({
                flightNumber: editTarget.flightNumber,
                airlineCode: editTarget.airlineName || '',
                aircraftCode: '',
                origin: editTarget.origin,
                destination: editTarget.destination,
                departureTime: toDatetimeLocal(editTarget.departureTime),
                arrivalTime: toDatetimeLocal(editTarget.arrivalTime),
                status: editTarget.status,
            });
        } else setForm({ status: 'SCHEDULED' });
    }, [open, editTarget]);

    const patch = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setApiErr(null);
        try {
            if (editTarget) {
                await updateFlight(editTarget.id, { departureTime: form.departureTime, arrivalTime: form.arrivalTime, status: form.status });
            } else {
                await createFlight({
                    flightNumber: form.flightNumber?.toUpperCase() || '',
                    airlineCode: form.airlineCode?.toUpperCase() || '',
                    aircraftCode: form.aircraftCode?.toUpperCase() || '',
                    originCode: form.origin?.toUpperCase() || '',
                    destinationCode: form.destination?.toUpperCase() || '',
                    departureTime: `${form.departureTime}:00`,
                    arrivalTime: `${form.arrivalTime}:00`
                } as any);
            }
            onSaved();
            onClose();
        } catch (err: any) {
            setApiErr(err.response?.data?.message || 'Có lỗi xảy ra.');
        } finally { setSubmitting(false); }
    };

    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col">
                <div className="px-6 py-4 border-b flex justify-between items-center"><h2 className="font-bold">{editTarget ? 'Sửa' : 'Thêm'} chuyến bay</h2><button onClick={onClose}>✕</button></div>
                <form id="flight-page-form" onSubmit={handleSubmit} className="p-6 space-y-4 grid grid-cols-2 gap-4">
                    {apiErr && <div className="col-span-2 text-red-500 text-sm">⚠️ {apiErr}</div>}
                    <div><label className="text-xs font-bold text-gray-600">Số hiệu</label><input required disabled={!!editTarget} value={form.flightNumber || ''} onChange={e => patch('flightNumber', e.target.value)} className={inputCls()} /></div>
                    <div><label className="text-xs font-bold text-gray-600">Trạng thái</label><select value={form.status} onChange={e => patch('status', e.target.value)} className={inputCls()}>{Object.keys(STATUS_LABELS).map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select></div>
                    {!editTarget && (
                        <>
                            <div><label className="text-xs font-bold text-gray-600">Mã hãng</label><input required value={form.airlineCode || ''} onChange={e => patch('airlineCode', e.target.value)} className={inputCls()} /></div>
                            <div><label className="text-xs font-bold text-gray-600">Mã máy bay</label><input required value={form.aircraftCode || ''} onChange={e => patch('aircraftCode', e.target.value)} className={inputCls()} /></div>
                            <div><label className="text-xs font-bold text-gray-600">Sân bay đi</label><input required value={form.origin || ''} onChange={e => patch('origin', e.target.value)} className={inputCls()} /></div>
                            <div><label className="text-xs font-bold text-gray-600">Sân bay đến</label><input required value={form.destination || ''} onChange={e => patch('destination', e.target.value)} className={inputCls()} /></div>
                        </>
                    )}
                    <div><label className="text-xs font-bold text-gray-600">Giờ đi</label><input type="datetime-local" required value={form.departureTime || ''} onChange={e => patch('departureTime', e.target.value)} className={inputCls()} /></div>
                    <div><label className="text-xs font-bold text-gray-600">Giờ đến</label><input type="datetime-local" required value={form.arrivalTime || ''} onChange={e => patch('arrivalTime', e.target.value)} className={inputCls()} /></div>
                </form>
                <div className="p-6 border-t flex justify-end gap-3"><button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-lg">Hủy</button><button type="submit" form="flight-page-form" disabled={submitting} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold">Lưu</button></div>
            </div>
        </div>
    );
}

function DeleteModal({ target, onClose, onConfirm }: { target: Flight | null, onClose: () => void, onConfirm: (id: string) => Promise<void> }) {
    const [working, setWorking] = useState(false);
    if (!target) return null;
    const handleConfirm = async () => { setWorking(true); try { await onConfirm(target.id); onClose(); } finally { setWorking(false); } };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md"><h2 className="font-bold mb-2">Xác nhận xoá</h2><p className="text-sm text-gray-600 mb-4">Xoá chuyến bay {target.flightNumber}?</p><div className="flex justify-end gap-3"><button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-lg">Hủy</button><button onClick={handleConfirm} disabled={working} className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold">Xoá</button></div></div>
        </div>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function FlightsPage() {
    const [flights, setFlights] = useState<Flight[]>([]);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState(false);

    // State tìm kiếm & lọc
    const [search, setSearch] = useState('');
    const [dateFilter, setDateFilter] = useState('all');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [customRange, setCustomRange] = useState({ start: '', end: '' });
    const [appliedRange, setAppliedRange] = useState({ start: '', end: '' });

    const [modalOpen, setModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Flight | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Flight | null>(null);

    const fetchFlights = () => {
        setLoading(true); setApiError(false);
        getFlights()
            .then((res: any) => {
                let list: any[] = [];
                if (Array.isArray(res)) list = res;
                else if (res && typeof res === 'object') list = res.data?.content || res.result?.content || res.content || res.data || res.result || [];
                setFlights(list.map((f: any, i: number) => ({ ...f, id: f.id ?? String(i + 1) })));
                setLoading(false);
            })
            .catch(() => { setFlights(MOCK_FLIGHTS); setApiError(true); setLoading(false); });
    };

    useEffect(() => { fetchFlights(); }, []);

    // Logic Lọc
    const filtered = (flights || []).filter((f) => {
        const q = search.toLowerCase();
        const searchMatch = (f.flightNumber && f.flightNumber.toLowerCase().includes(q)) || (f.origin && f.origin.toLowerCase().includes(q)) || (f.destination && f.destination.toLowerCase().includes(q));
        if (!searchMatch) return false;

        if (!f.departureTime) return true;
        const depDate = new Date(f.departureTime);
        const today = new Date();
        const depDateOnly = new Date(depDate); depDateOnly.setHours(0, 0, 0, 0);
        const todayOnly = new Date(today); todayOnly.setHours(0, 0, 0, 0);

        if (dateFilter === 'today') return depDateOnly.getTime() === todayOnly.getTime();
        else if (dateFilter === 'this_week') { const nextWeek = new Date(todayOnly); nextWeek.setDate(todayOnly.getDate() + 7); return depDateOnly >= todayOnly && depDateOnly <= nextWeek; }
        else if (dateFilter === 'this_month') return depDateOnly.getMonth() === todayOnly.getMonth() && depDateOnly.getFullYear() === todayOnly.getFullYear();
        else if (dateFilter === 'custom' && appliedRange.start && appliedRange.end) {
            const start = new Date(appliedRange.start); start.setHours(0, 0, 0, 0);
            const end = new Date(appliedRange.end); end.setHours(23, 59, 59, 999);
            return depDate >= start && depDate <= end;
        }
        return true;
    });

    const handleApplyCustomDate = () => {
        if (!customRange.start || !customRange.end) return;
        setAppliedRange(customRange); setDateFilter('custom'); setShowDatePicker(false);
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">✈️ Quản lý chuyến bay</h1>
                    <p className="mt-0.5 text-sm text-gray-500">Danh sách toàn bộ chuyến bay (Trang phụ)</p>
                </div>
                <button onClick={() => { setEditTarget(null); setModalOpen(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-indigo-700">+ Thêm chuyến bay</button>
            </div>

            {apiError && <div className="px-4 py-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm">⚠️ Lỗi API — hiển thị dữ liệu mẫu.</div>}

            {/* 🚀 THANH TÌM KIẾM & LỌC (ĐÃ SỬA LỖI POPUP) */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center relative z-20">
                <div className="relative max-w-sm w-full md:w-auto">
                    <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm">🔍</span>
                    <input type="text" placeholder="Tìm theo số hiệu, sân bay..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                </div>

                {/* Khu vực bọc các nút lọc */}
                <div className="flex items-center gap-2 w-full md:w-auto">

                    {/* Chỉ gắn overflow-x-auto vào phần Lọc nhanh */}
                    <div className="flex items-center bg-gray-50 p-1 rounded-lg border border-gray-200 overflow-x-auto hide-scrollbar flex-shrink max-w-[60vw] md:max-w-none">
                        {['all', 'today', 'this_week', 'this_month'].map(key => (
                            <button key={key} onClick={() => { setDateFilter(key); setShowDatePicker(false); }} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${dateFilter === key ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                                {key === 'all' ? 'Tất cả' : key === 'today' ? 'Hôm nay' : key === 'this_week' ? 'Tuần này' : 'Tháng này'}
                            </button>
                        ))}
                    </div>

                    {/* Nút Tùy chỉnh (Nằm ngoài cùng, tuyệt đối KHÔNG có overflow) */}
                    <div className="relative shrink-0">
                        <div className={`flex items-center rounded-lg border transition-all bg-white ${dateFilter === 'custom' || showDatePicker ? 'border-indigo-400 text-indigo-700' : 'text-gray-700 border-gray-200 hover:bg-gray-50'}`}>
                            <button onClick={() => setShowDatePicker(!showDatePicker)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold outline-none whitespace-nowrap">
                                <Filter size={14} className={dateFilter === 'custom' ? 'text-indigo-600' : 'text-gray-400'} />
                                <span>{dateFilter === 'custom' && appliedRange.start ? `${fmtDateChart(appliedRange.start)} - ${fmtDateChart(appliedRange.end)}` : 'Tùy chỉnh'}</span>
                            </button>
                            {dateFilter === 'custom' && <div className="pr-2 flex items-center"><div className="w-[1px] h-3 bg-gray-200 mr-1.5"></div><button onClick={(e) => { e.stopPropagation(); setDateFilter('all'); setShowDatePicker(false); }} className="text-indigo-400"><X size={14} /></button></div>}
                        </div>

                        {/* Popup Chọn Ngày sẽ nổi bật lên tuyệt đối nhờ thẻ cha không bị overflow */}
                        {showDatePicker && (
                            <div className="absolute top-[calc(100%+8px)] right-0 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 p-4 z-50 animate-in fade-in slide-in-from-top-1">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-bold text-gray-800 text-sm">Chọn khoảng thời gian</h4>
                                    <button onClick={() => setShowDatePicker(false)} className="text-gray-400 hover:text-red-500"><X size={16} /></button>
                                </div>
                                <div className="space-y-3">
                                    <div><label className="text-[11px] font-bold text-gray-500 uppercase">Từ ngày</label><input type="date" value={customRange.start} onChange={e => setCustomRange({ ...customRange, start: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:ring-1 focus:border-indigo-500" /></div>
                                    <div><label className="text-[11px] font-bold text-gray-500 uppercase">Đến ngày</label><input type="date" value={customRange.end} onChange={e => setCustomRange({ ...customRange, end: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:ring-1 focus:border-indigo-500" /></div>
                                    <button onClick={handleApplyCustomDate} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg text-sm transition mt-3">Áp dụng lọc</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* BẢNG DỮ LIỆU */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto relative z-0">
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
                            <th className="px-4 py-3 text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />) : filtered.length === 0 ? <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-400 text-sm">Không tìm thấy chuyến bay nào.</td></tr> : filtered.map((f) => (
                            <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 font-mono font-semibold text-gray-800">{f.flightNumber}</td>
                                <td className="px-4 py-3 font-medium text-gray-700">{f.origin}</td>
                                <td className="px-4 py-3 font-medium text-gray-700">{f.destination}</td>
                                <td className="px-4 py-3 text-gray-600">{fmtDateTime(f.departureTime)}</td>
                                <td className="px-4 py-3 text-gray-600">{fmtDateTime(f.arrivalTime)}</td>
                                <td className="px-4 py-3 text-gray-600">{getTotalSeats(f.classes)}</td>
                                <td className="px-4 py-3 text-gray-600">{fmtVND(getMinPrice(f.classes))}</td>
                                <td className="px-4 py-3"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${STATUS_STYLES[f.status] || 'bg-gray-100 text-gray-600'}`}>{STATUS_LABELS[f.status] || f.status}</span></td>
                                <td className="px-4 py-3 text-right">
                                    <button onClick={() => { setEditTarget(f); setModalOpen(true); }} className="px-2 py-1 text-indigo-600 hover:bg-indigo-50 rounded mr-2">✏️</button>
                                    <button onClick={() => setDeleteTarget(f)} className="px-2 py-1 text-red-600 hover:bg-red-50 rounded">🗑️</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <FlightModal open={modalOpen} editTarget={editTarget} onClose={() => setModalOpen(false)} onSaved={fetchFlights} />
            <DeleteModal target={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={async (id) => { await deleteFlight(id); fetchFlights(); }} />
        </div>
    );
}