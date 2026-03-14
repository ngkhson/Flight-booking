import {
    useState,
    useEffect,
    type FormEvent,
} from 'react';
import { Filter, X } from 'lucide-react';

// ─── Tự định nghĩa Type ───────────────────────────────────────────────────────
export interface IFlightClass {
    id?: string;
    className?: string;
    basePrice?: number;
    availableSeats?: number;
}

export interface IFlight {
    id: string;
    flightNumber: string;
    airlineName: string;
    origin: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
    status: string;
    classes: IFlightClass[];
}

type Flight = IFlight;

// ─── Constants & Helpers ──────────────────────────────────────────────────────
const STATUS_OPTIONS: string[] = ['SCHEDULED', 'DELAYED', 'CANCELLED', 'COMPLETED'];
const STATUS_STYLES: Record<string, string> = {
    SCHEDULED: 'bg-blue-100 text-blue-700', DELAYED: 'bg-yellow-100 text-yellow-700',
    CANCELLED: 'bg-red-100 text-red-700', COMPLETED: 'bg-green-100 text-green-700',
};
const STATUS_LABELS: Record<string, string> = {
    SCHEDULED: 'Đã lên lịch', DELAYED: 'Trễ chuyến',
    CANCELLED: 'Đã huỷ', COMPLETED: 'Hoàn thành',
};

const fmtDateTime = (iso: string) => iso ? new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—';
const fmtVND = (n: number) => n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
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

const getTotalSeats = (classes: IFlightClass[]): number => (classes || []).reduce((sum, c) => sum + (c.availableSeats || 0), 0);
const getMinPrice = (classes: IFlightClass[]): number => {
    if (!classes || !classes.length) return 0;
    return Math.min(...classes.map((c) => c.basePrice || 0));
};

// ─── HÀM TẠO MOCK DATA ĐỘNG ───────────────────────
const generateMockData = (): Flight[] => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(now); nextWeek.setDate(nextWeek.getDate() + 5);
    const nextMonth = new Date(now); nextMonth.setDate(nextMonth.getDate() + 20);

    return [
        { id: '1', flightNumber: 'VN-213', airlineName: 'Vietnam Airlines', origin: 'HAN', destination: 'SGN', departureTime: `${today}T08:00:00`, arrivalTime: `${today}T10:15:00`, status: 'SCHEDULED', classes: [{ className: 'Economy', basePrice: 2500000, availableSeats: 45 }] },
        { id: '2', flightNumber: 'VJ-122', airlineName: 'VietJet Air', origin: 'SGN', destination: 'HAN', departureTime: `${today}T14:30:00`, arrivalTime: `${today}T16:30:00`, status: 'DELAYED', classes: [{ className: 'Economy', basePrice: 1200000, availableSeats: 12 }] },
        { id: '3', flightNumber: 'QH-201', airlineName: 'Bamboo Airways', origin: 'HAN', destination: 'DAD', departureTime: `${tomorrow.toISOString().split('T')[0]}T09:00:00`, arrivalTime: `${tomorrow.toISOString().split('T')[0]}T10:20:00`, status: 'SCHEDULED', classes: [{ className: 'Economy', basePrice: 1500000, availableSeats: 50 }] },
        { id: '4', flightNumber: 'VN-305', airlineName: 'Vietnam Airlines', origin: 'DAD', destination: 'SGN', departureTime: `${nextWeek.toISOString().split('T')[0]}T18:00:00`, arrivalTime: `${nextWeek.toISOString().split('T')[0]}T19:30:00`, status: 'CANCELLED', classes: [{ className: 'Economy', basePrice: 1800000, availableSeats: 0 }] },
        { id: '5', flightNumber: 'VJ-888', airlineName: 'VietJet Air', origin: 'HAN', destination: 'PQC', departureTime: `${nextMonth.toISOString().split('T')[0]}T07:00:00`, arrivalTime: `${nextMonth.toISOString().split('T')[0]}T09:10:00`, status: 'SCHEDULED', classes: [{ className: 'Economy', basePrice: 990000, availableSeats: 120 }] },
    ];
};

// ─── Form Interface & Validation (Đã thêm Price & Seats) ──────────────────────
export interface FlightPayload {
    flightNumber: string; airlineCode: string; aircraftCode: string; origin: string; destination: string; departureTime: string; arrivalTime: string; status: string;
    price: string | number; // Thêm Giá
    availableSeats: string | number; // Thêm Ghế
}

const EMPTY_PAYLOAD: FlightPayload = {
    flightNumber: '', airlineCode: '', aircraftCode: '', origin: '', destination: '', departureTime: '', arrivalTime: '', status: 'SCHEDULED',
    price: '', availableSeats: ''
};

function validatePayload(p: FlightPayload) {
    const err: any = {};
    if (!p.flightNumber.trim()) err.flightNumber = 'Trống!';
    if (!p.origin.trim()) err.origin = 'Trống!';
    if (!p.destination.trim()) err.destination = 'Trống!';
    if (!p.departureTime) err.departureTime = 'Trống!';
    if (!p.arrivalTime) err.arrivalTime = 'Trống!';
    if (!p.price || Number(p.price) <= 0) err.price = 'Nhập giá!';
    if (!p.availableSeats || Number(p.availableSeats) <= 0) err.availableSeats = 'Nhập ghế!';
    return err;
}

// ─── Components ───────────────────────────────────────────────────────────────
function SkeletonRow() {
    return <tr className="animate-pulse">{Array.from({ length: 9 }).map((_, i) => <td key={i} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded w-3/4" /></td>)}</tr>;
}

const inputCls = (err?: string) => `w-full px-3 py-2 text-sm border rounded-lg transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${err ? 'border-red-400 bg-red-50' : 'border-gray-300'}`;

// ─── MODAL THÊM/SỬA ───────────────────────────────────────────────────────────
function FlightModal({ open, editTarget, onClose, onSaved }: any) {
    const [form, setForm] = useState<FlightPayload>(EMPTY_PAYLOAD);
    const [errors, setErrors] = useState<any>({});

    useEffect(() => {
        if (!open) return;
        setErrors({});
        if (editTarget) {
            setForm({
                flightNumber: editTarget.flightNumber, airlineCode: editTarget.airlineName || '', aircraftCode: '',
                origin: editTarget.origin, destination: editTarget.destination,
                departureTime: toDatetimeLocal(editTarget.departureTime), arrivalTime: toDatetimeLocal(editTarget.arrivalTime),
                status: editTarget.status,
                price: getMinPrice(editTarget.classes) || '',
                availableSeats: getTotalSeats(editTarget.classes) || ''
            });
        } else setForm(EMPTY_PAYLOAD);
    }, [open, editTarget]);

    const patch = (k: keyof FlightPayload, v: any) => setForm(p => ({ ...p, [k]: v }));

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const errs = validatePayload(form);
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;

        // 🚀 MOCK: Tạo object lưu trực tiếp vào State (Đã triệt tiêu vụ reload trang)
        const savedFlight: Flight = {
            id: editTarget ? editTarget.id : String(Date.now()),
            flightNumber: form.flightNumber.toUpperCase(),
            airlineName: form.airlineCode || 'Mock Airlines',
            origin: form.origin.toUpperCase(),
            destination: form.destination.toUpperCase(),
            departureTime: form.departureTime.includes('T') ? `${form.departureTime}:00` : form.departureTime,
            arrivalTime: form.arrivalTime.includes('T') ? `${form.arrivalTime}:00` : form.arrivalTime,
            status: form.status,
            // 🚀 Bọc giá vé và số ghế vào mảng classes để bảng render được
            classes: [{ className: 'Economy', basePrice: Number(form.price), availableSeats: Number(form.availableSeats) }]
        };

        onSaved(savedFlight, !!editTarget);
        onClose();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 border-b flex justify-between items-center">
                    <h2 className="font-bold text-gray-800">{editTarget ? 'Sửa chuyến bay' : 'Thêm chuyến bay mới'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
                <form id="flight-form" onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className="text-xs font-bold text-gray-600">Số hiệu</label><input type="text" value={form.flightNumber} onChange={e => patch('flightNumber', e.target.value)} className={inputCls(errors.flightNumber)} disabled={!!editTarget} /></div>
                    <div><label className="text-xs font-bold text-gray-600">Trạng thái</label><select value={form.status} onChange={e => patch('status', e.target.value)} className={inputCls()}>{STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select></div>
                    {!editTarget && (
                        <>
                            <div><label className="text-xs font-bold text-gray-600">Mã Hãng</label><input type="text" value={form.airlineCode} onChange={e => patch('airlineCode', e.target.value)} className={inputCls()} /></div>
                            <div><label className="text-xs font-bold text-gray-600">Mã máy bay</label><input type="text" value={form.aircraftCode} onChange={e => patch('aircraftCode', e.target.value)} className={inputCls()} /></div>
                        </>
                    )}
                    <div><label className="text-xs font-bold text-gray-600">Sân bay đi (IATA)</label><input type="text" maxLength={3} value={form.origin} onChange={e => patch('origin', e.target.value)} className={inputCls(errors.origin)} /></div>
                    <div><label className="text-xs font-bold text-gray-600">Sân bay đến (IATA)</label><input type="text" maxLength={3} value={form.destination} onChange={e => patch('destination', e.target.value)} className={inputCls(errors.destination)} /></div>
                    <div><label className="text-xs font-bold text-gray-600">Giờ khởi hành</label><input type="datetime-local" value={form.departureTime} onChange={e => patch('departureTime', e.target.value)} className={inputCls(errors.departureTime)} /></div>
                    <div><label className="text-xs font-bold text-gray-600">Giờ hạ cánh</label><input type="datetime-local" value={form.arrivalTime} onChange={e => patch('arrivalTime', e.target.value)} className={inputCls(errors.arrivalTime)} /></div>

                    {/* 🚀 HAI TRƯỜNG MỚI ĐƯỢC THÊM VÀO */}
                    <div>
                        <label className="text-xs font-bold text-gray-600 flex items-center gap-1">Giá vé (VND) {errors.price && <span className="text-red-500">*</span>}</label>
                        <input type="number" min="0" value={form.price} onChange={e => patch('price', e.target.value)} className={inputCls(errors.price)} placeholder="Vd: 1500000" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-600 flex items-center gap-1">Số ghế trống {errors.availableSeats && <span className="text-red-500">*</span>}</label>
                        <input type="number" min="0" value={form.availableSeats} onChange={e => patch('availableSeats', e.target.value)} className={inputCls(errors.availableSeats)} placeholder="Vd: 150" />
                    </div>

                </form>
                <div className="p-6 border-t flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-bold text-gray-600">Hủy</button>
                    <button type="submit" form="flight-form" className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-indigo-700">Lưu thông tin</button>
                </div>
            </div>
        </div>
    );
}

// ─── MODAL XÓA ────────────────────────────────────────────────────────────────
function DeleteModal({ target, onClose, onConfirm }: any) {
    if (!target) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
                <h2 className="font-bold text-gray-800 text-lg">Xác nhận xoá</h2>
                <p className="text-sm text-gray-600 mb-4">Bạn có chắc muốn xoá chuyến bay <span className="font-mono font-bold text-red-600">{target.flightNumber}</span>?</p>
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-bold">Hủy</button>
                    <button onClick={() => { onConfirm(target.id); onClose(); }} className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold shadow-md">Xoá ngay</button>
                </div>
            </div>
        </div>
    );
}

// ─── TRANG CHÍNH ──────────────────────────────────────────────────────────────
export default function FlightManagement() {
    const [flights, setFlights] = useState<Flight[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Flight | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Flight | null>(null);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    const [dateFilter, setDateFilter] = useState('all');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [customRange, setCustomRange] = useState({ start: '', end: '' });
    const [appliedRange, setAppliedRange] = useState({ start: '', end: '' });

    useEffect(() => {
        if (!toast) return;
        const id = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(id);
    }, [toast]);

    useEffect(() => {
        setLoading(true);
        setTimeout(() => {
            setFlights(generateMockData());
            setLoading(false);
        }, 500);
    }, []);

    const handleSaved = (savedFlight: Flight, isEdit: boolean) => {
        if (isEdit) {
            setFlights(prev => prev.map(f => f.id === savedFlight.id ? savedFlight : f));
            setToast({ msg: 'Đã cập nhật thông tin chuyến bay!', type: 'success' });
        } else {
            setFlights(prev => [savedFlight, ...prev]);
            setToast({ msg: 'Tạo chuyến bay thành công!', type: 'success' });
        }
    };

    const handleDelete = (id: string) => {
        setFlights(prev => prev.filter(f => f.id !== id));
        setToast({ msg: 'Đã xoá chuyến bay khỏi danh sách.', type: 'success' });
    };

    // Logic Lọc
    const filtered = flights.filter((f) => {
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
        if (!customRange.start || !customRange.end) { alert("Vui lòng chọn đầy đủ ngày!"); return; }
        if (new Date(customRange.start) > new Date(customRange.end)) { alert("Ngày không hợp lệ!"); return; }
        setAppliedRange(customRange); setDateFilter('custom'); setShowDatePicker(false);
    };

    const handleClearCustomDate = (e: React.MouseEvent) => {
        e.stopPropagation(); setDateFilter('all'); setAppliedRange({ start: '', end: '' }); setCustomRange({ start: '', end: '' }); setShowDatePicker(false);
    };

    return (
        <div className="space-y-5">
            {toast && (
                <div className={`fixed top-5 right-5 z-[100] px-4 py-3 rounded-xl shadow-lg border font-bold animate-in slide-in-from-right-2 ${toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                    {toast.msg}
                </div>
            )}

            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">✈️ Quản lý chuyến bay</h1>
                    <p className="mt-0.5 text-sm font-semibold text-yellow-600 bg-yellow-50 inline-block px-2 py-0.5 rounded border border-yellow-200">🛠 Đang chạy chế độ Test (Mock Data)</p>
                </div>
                <button onClick={() => { setEditTarget(null); setModalOpen(true); }} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-indigo-700 hover:-translate-y-0.5 transition-all">+ Thêm chuyến bay</button>
            </div>

            {/* Thanh Tìm Kiếm & Lọc */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center relative z-20">
                <div className="relative max-w-sm w-full md:w-auto">
                    <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm">🔍</span>
                    <input type="text" placeholder="Tìm số hiệu, sân bay..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="flex items-center bg-gray-50 p-1 rounded-xl border border-gray-200 overflow-x-auto hide-scrollbar flex-shrink max-w-[60vw] md:max-w-none">
                        {['all', 'today', 'this_week', 'this_month'].map(key => (
                            <button key={key} onClick={() => { setDateFilter(key); setShowDatePicker(false); }} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${dateFilter === key ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                                {key === 'all' ? 'Tất cả' : key === 'today' ? 'Hôm nay' : key === 'this_week' ? 'Tuần này' : 'Tháng này'}
                            </button>
                        ))}
                    </div>
                    <div className="relative shrink-0">
                        <div className={`flex items-center rounded-xl border transition-all bg-white ${dateFilter === 'custom' || showDatePicker ? 'border-indigo-400 text-indigo-700 shadow-sm' : 'text-gray-700 border-gray-200 hover:bg-gray-50'}`}>
                            <button onClick={() => setShowDatePicker(!showDatePicker)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold outline-none whitespace-nowrap">
                                <Filter size={14} className={dateFilter === 'custom' ? 'text-indigo-600' : 'text-gray-400'} />
                                <span>{dateFilter === 'custom' && appliedRange.start ? `${fmtDateChart(appliedRange.start)} - ${fmtDateChart(appliedRange.end)}` : 'Tùy chỉnh'}</span>
                            </button>
                            {dateFilter === 'custom' && <div className="pr-2 flex items-center"><div className="w-[1px] h-4 bg-gray-200 mr-1.5"></div><button onClick={handleClearCustomDate} className="text-indigo-400 hover:text-indigo-700 transition p-1"><X size={14} /></button></div>}
                        </div>
                        {showDatePicker && (
                            <div className="absolute right-0 top-[calc(100%+8px)] w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50 animate-in fade-in slide-in-from-top-1">
                                <div className="flex justify-between items-center mb-3"><h4 className="font-bold text-gray-800 text-sm">Lọc theo ngày</h4><button onClick={() => setShowDatePicker(false)} className="text-gray-400 hover:text-red-500"><X size={16} /></button></div>
                                <div className="space-y-3">
                                    <div><label className="text-[11px] font-bold text-gray-500 uppercase">Từ ngày</label><input type="date" value={customRange.start} onChange={e => setCustomRange({ ...customRange, start: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                                    <div><label className="text-[11px] font-bold text-gray-500 uppercase">Đến ngày</label><input type="date" value={customRange.end} onChange={e => setCustomRange({ ...customRange, end: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                                    <button onClick={handleApplyCustomDate} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-sm transition mt-2 shadow-md">Áp dụng lọc</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-auto relative z-0">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-bold border-b border-gray-100">
                        <tr>
                            <th className="px-5 py-4">Số hiệu</th>
                            <th className="px-5 py-4">Hãng</th>
                            <th className="px-5 py-4">Xuất phát</th>
                            <th className="px-5 py-4">Điểm đến</th>
                            <th className="px-5 py-4">Giờ bay</th>
                            <th className="px-5 py-4">Ghế trống</th>
                            <th className="px-5 py-4">Giá vé</th>
                            <th className="px-5 py-4">Trạng thái</th>
                            <th className="px-5 py-4 text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? <SkeletonRow /> : filtered.length === 0 ? <tr><td colSpan={9} className="p-10 text-center text-gray-400">Không tìm thấy chuyến bay nào.</td></tr> :
                            filtered.map(f => (
                                <tr key={f.id} className="hover:bg-indigo-50/50 transition-colors group">
                                    <td className="px-5 py-4 font-mono font-bold text-indigo-700">{f.flightNumber}</td>
                                    <td className="px-5 py-4 text-gray-600 font-medium">{f.airlineName}</td>
                                    <td className="px-5 py-4 font-bold text-gray-800">{f.origin}</td>
                                    <td className="px-5 py-4 font-bold text-gray-800">{f.destination}</td>
                                    <td className="px-5 py-4 text-xs text-gray-600">{fmtDateTime(f.departureTime)}</td>
                                    <td className="px-5 py-4 font-bold text-gray-700">{getTotalSeats(f.classes)}</td>
                                    <td className="px-5 py-4 text-indigo-600 font-bold">{fmtVND(getMinPrice(f.classes))}</td>
                                    <td className="px-5 py-4"><span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${STATUS_STYLES[f.status] || 'bg-gray-100 text-gray-600'}`}>{STATUS_LABELS[f.status] || f.status}</span></td>
                                    <td className="px-5 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setEditTarget(f); setModalOpen(true); }} className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white rounded-lg transition">✏️</button>
                                            <button onClick={() => setDeleteTarget(f)} className="p-2 text-red-600 bg-red-50 hover:bg-red-600 hover:text-white rounded-lg transition">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
                {!loading && (
                    <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-500 font-medium bg-gray-50/50">
                        Đang hiển thị <span className="font-bold text-gray-800">{filtered.length}</span> chuyến bay
                    </div>
                )}
            </div>

            <FlightModal open={modalOpen} editTarget={editTarget} onClose={() => setModalOpen(false)} onSaved={handleSaved} />
            <DeleteModal target={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />
        </div>
    );
}