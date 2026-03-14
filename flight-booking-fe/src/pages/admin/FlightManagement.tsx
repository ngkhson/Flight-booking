import { useState, useEffect, useCallback, type FormEvent } from 'react';
import {
    getFlights, createFlight, updateFlight, deleteFlight,
    type IFlight
} from '../../features/admin/services/adminApi';

// ─── Local extended type ──────────────────────────────────────────────────────
type Flight = IFlight & { id: string };

const STATUS_OPTIONS: string[] = ['SCHEDULED', 'DELAYED', 'CANCELLED', 'COMPLETED'];

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

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDateTime = (iso: string) => iso ? new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—';
const fmtVND = (n: number) => n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

const toDatetimeLocal = (iso: string): string => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const getTotalSeats = (classes: any[]): number => (classes || []).reduce((sum, c) => sum + (c.availableSeats || 0), 0);
const getMinPrice = (classes: any[]): number => {
    if (!classes || !classes.length) return 0;
    return Math.min(...classes.map((c) => c.basePrice || 0));
};

// ─── Validation & Interface ───────────────────────────────────────────────────
export interface FlightPayload {
    flightNumber: string; airlineCode: string; aircraftCode: string; origin: string; destination: string; departureTime: string; arrivalTime: string; availableSeats: number; price: number; status: string;
}

const EMPTY_PAYLOAD: FlightPayload = {
    flightNumber: '', airlineCode: '', aircraftCode: '', origin: '', destination: '', departureTime: '', arrivalTime: '', availableSeats: 0, price: 0, status: 'SCHEDULED',
};

// ─── Reusable components ────────────────────────────────────────────────
function SkeletonRow() {
    return <tr className="animate-pulse">{Array.from({ length: 8 }).map((_, i) => <td key={i} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded w-3/4" /></td>)}</tr>;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600 uppercase">{label}</label>
            {children}
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}

const inputCls = (hasError?: string) => `w-full px-3 py-2 text-sm border rounded-lg transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${hasError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`;

// ─── Modals ────────────────────────────────────────────────────────────────
function FlightModal({ open, editTarget, onClose, onSaved }: any) {
    const [form, setForm] = useState<FlightPayload>(EMPTY_PAYLOAD);
    const [submitting, setSubmitting] = useState(false);
    const [apiErr, setApiErr] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;
        setApiErr(null);
        if (editTarget) {
            setForm({
                flightNumber: editTarget.flightNumber, airlineCode: editTarget.airlineName || '', aircraftCode: '',
                origin: editTarget.origin, destination: editTarget.destination,
                departureTime: toDatetimeLocal(editTarget.departureTime), arrivalTime: toDatetimeLocal(editTarget.arrivalTime),
                availableSeats: getTotalSeats(editTarget.classes), price: getMinPrice(editTarget.classes), status: editTarget.status,
            });
        } else setForm(EMPTY_PAYLOAD);
    }, [open, editTarget]);

    const patch = (key: keyof FlightPayload, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true); setApiErr(null);
        try {
            if (editTarget) {
                await updateFlight(editTarget.id, { departureTime: form.departureTime, arrivalTime: form.arrivalTime, status: form.status });
            } else {
                const finalPayload = {
                    flightNumber: form.flightNumber.toUpperCase(), airlineCode: form.airlineCode.toUpperCase(), aircraftCode: form.aircraftCode.toUpperCase(),
                    originCode: form.origin.toUpperCase(), destinationCode: form.destination.toUpperCase(),
                    departureTime: `${form.departureTime}:00`, arrivalTime: `${form.arrivalTime}:00`
                };
                await createFlight(finalPayload as any);
            }
            onSaved();
            onClose();
        } catch (err: any) {
            setApiErr(err.response?.data?.message || 'Lỗi hệ thống (Kiểm tra dữ liệu nhập)');
        } finally { setSubmitting(false); }
    };

    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 border-b flex justify-between items-center"><h2 className="font-bold text-gray-800">{editTarget ? 'Sửa chuyến bay' : 'Thêm chuyến bay mới'}</h2><button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button></div>
                <form id="flight-form" onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4">
                    {apiErr && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">⚠️ {apiErr}</div>}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Số hiệu"><input required type="text" value={form.flightNumber} onChange={e => patch('flightNumber', e.target.value)} className={inputCls()} disabled={!!editTarget} /></Field>
                        <Field label="Mã Hãng"><input required type="text" value={form.airlineCode} onChange={e => patch('airlineCode', e.target.value)} className={inputCls()} disabled={!!editTarget} /></Field>
                        <Field label="Mã máy bay"><input required type="text" value={form.aircraftCode} onChange={e => patch('aircraftCode', e.target.value)} className={inputCls()} disabled={!!editTarget} /></Field>
                        <Field label="Trạng thái"><select value={form.status} onChange={e => patch('status', e.target.value)} className={inputCls()}>{STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select></Field>
                        <Field label="Sân bay đi (IATA)"><input required type="text" maxLength={3} value={form.origin} onChange={e => patch('origin', e.target.value)} className={inputCls()} disabled={!!editTarget} /></Field>
                        <Field label="Sân bay đến (IATA)"><input required type="text" maxLength={3} value={form.destination} onChange={e => patch('destination', e.target.value)} className={inputCls()} disabled={!!editTarget} /></Field>
                        <Field label="Giờ khởi hành"><input required type="datetime-local" value={form.departureTime} onChange={e => patch('departureTime', e.target.value)} className={inputCls()} /></Field>
                        <Field label="Giờ hạ cánh"><input required type="datetime-local" value={form.arrivalTime} onChange={e => patch('arrivalTime', e.target.value)} className={inputCls()} /></Field>
                    </div>
                </form>
                <div className="p-6 border-t flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-lg text-sm">Hủy</button>
                    <button type="submit" form="flight-form" disabled={submitting} className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold disabled:bg-indigo-300">{submitting ? 'Đang lưu...' : 'Lưu thông tin'}</button>
                </div>
            </div>
        </div>
    );
}

function DeleteModal({ target, onClose, onConfirm }: any) {
    const [working, setWorking] = useState(false);
    if (!target) return null;
    const handleConfirm = async () => { setWorking(true); try { await onConfirm(target.id); onClose(); } finally { setWorking(false); } };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
                <h2 className="font-bold text-gray-800">Xác nhận xoá</h2>
                <p className="text-sm text-gray-600">Xác nhận đổi chuyến bay <span className="font-mono font-bold text-red-500">{target.flightNumber}</span> sang trạng thái Đã Hủy?</p>
                <div className="flex justify-end gap-3"><button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-lg text-sm">Hủy</button><button onClick={handleConfirm} disabled={working} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold">Xác nhận Hủy</button></div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FlightManagement() {
    const [flights, setFlights] = useState<Flight[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Flight | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Flight | null>(null);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        if (!toast) return;
        const id = setTimeout(() => setToast(null), 3500);
        return () => clearTimeout(id);
    }, [toast]);

    const fetchFlights = useCallback(async () => {
        setLoading(true);
        try {
            const res: any = await getFlights({ page: 0, size: 100 });
            console.log("🔥 JSON GỐC TỪ API:", res);

            // 🚀 BỘ HÚT DỮ LIỆU TỰ ĐỘNG (Xuyên qua mọi lớp vỏ bọc JSON)
            const extractArray = (obj: any): any[] => {
                if (!obj) return [];
                if (Array.isArray(obj)) return obj;

                // 1. Quét trực tiếp các key phổ biến
                if (Array.isArray(obj.content)) return obj.content;
                if (Array.isArray(obj.data)) return obj.data;
                if (Array.isArray(obj.result)) return obj.result;
                if (Array.isArray(obj.items)) return obj.items;

                // 2. Quét sâu vào bên trong obj.result (Chuẩn ApiResponse)
                if (obj.result && typeof obj.result === 'object') {
                    if (Array.isArray(obj.result)) return obj.result;
                    if (Array.isArray(obj.result.content)) return obj.result.content;
                    if (Array.isArray(obj.result.data)) return obj.result.data;
                }

                // 3. Quét sâu vào bên trong obj.data (Chuẩn Axios)
                if (obj.data && typeof obj.data === 'object') {
                    if (Array.isArray(obj.data)) return obj.data;
                    if (Array.isArray(obj.data.content)) return obj.data.content;
                    if (Array.isArray(obj.data.result)) return obj.data.result;
                }

                return [];
            };

            const rawArray = extractArray(res);
            console.log("✈️ DỮ LIỆU ĐÃ BÓC TÁCH:", rawArray);

            // 🚀 MAP DỮ LIỆU VÀO GIAO DIỆN
            const mappedFlights = rawArray.map((f: any) => {
                // Xử lý an toàn Object AirportResponseDTO
                const originStr = typeof f.origin === 'object' && f.origin !== null
                    ? (f.origin.code || f.origin.cityCode || f.origin.name || 'N/A')
                    : (f.origin || 'N/A');

                const destStr = typeof f.destination === 'object' && f.destination !== null
                    ? (f.destination.code || f.destination.cityCode || f.destination.name || 'N/A')
                    : (f.destination || 'N/A');

                // Xử lý an toàn Object AirlineResponseDTO
                const airlineStr = typeof f.airline === 'object' && f.airline !== null
                    ? (f.airline.name || f.airline.code)
                    : (f.airlineName || f.airlineCode || 'N/A');

                // Mảng class có thể tên là 'classes' (SearchDTO) hoặc 'flightClasses' (DetailDTO)
                const classArray = f.classes || f.flightClasses || [];

                return {
                    id: f.id,
                    flightNumber: f.flightNumber || 'N/A',
                    airlineName: airlineStr,
                    origin: originStr,
                    destination: destStr,
                    departureTime: f.departureTime,
                    arrivalTime: f.arrivalTime,
                    status: f.status || 'SCHEDULED',
                    classes: classArray,
                };
            });

            setFlights(mappedFlights);
        } catch (error) {
            console.error("Lỗi lấy danh sách chuyến bay:", error);
            setFlights([]);
            setToast({ msg: 'Lỗi tải dữ liệu. Vui lòng kiểm tra Console.', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchFlights(); }, [fetchFlights]);

    // 🚀 SỬA LỖI 3: Bọc thép hàm Filter chống văng undefined
    const filtered = flights.filter(f => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (f.flightNumber || '').toLowerCase().includes(q)
            || (f.origin || '').toLowerCase().includes(q)
            || (f.destination || '').toLowerCase().includes(q);
    });

    const handleSaved = () => {
        fetchFlights(); // Fetch lại db sau khi Thêm/Sửa
        setToast({ msg: 'Lưu chuyến bay thành công!', type: 'success' });
    };

    const handleDelete = async (id: string) => {
        await deleteFlight(id);
        fetchFlights(); // Fetch lại
        setToast({ msg: 'Đã hủy chuyến bay.', type: 'success' });
    };

    return (
        <div className="space-y-5 pb-10">
            {toast && (
                <div className={`fixed top-5 right-5 z-[100] px-4 py-3 rounded-xl shadow-lg border font-medium animate-in slide-in-from-right-2 ${toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                    {toast.msg}
                </div>
            )}

            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">✈️ Quản lý chuyến bay</h1>
                    <p className="mt-0.5 text-sm text-gray-500">Xem và cấu hình các chuyến bay hệ thống</p>
                </div>
                <button onClick={() => { setEditTarget(null); setModalOpen(true); }} className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-indigo-700 transition">
                    + Thêm chuyến bay
                </button>
            </div>

            <div className="relative max-w-md">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none">🔍</span>
                <input type="text" placeholder="Tìm theo mã chuyến bay, sân bay đi/đến..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-100 font-bold">
                        <tr>
                            <th className="px-5 py-4">Số hiệu</th>
                            <th className="px-5 py-4">Hãng</th>
                            <th className="px-5 py-4">Lộ trình</th>
                            <th className="px-5 py-4">Giờ bay</th>
                            <th className="px-5 py-4 text-center">Ghế trống</th>
                            <th className="px-5 py-4 text-right">Giá vé từ</th>
                            <th className="px-5 py-4 text-center">Trạng thái</th>
                            <th className="px-5 py-4 text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? <SkeletonRow /> : filtered.length === 0 ? <tr><td colSpan={8} className="p-12 text-center text-gray-400">Không có dữ liệu chuyến bay.</td></tr> :
                            filtered.map(f => (
                                <tr key={f.id} className="hover:bg-indigo-50/40 transition-colors group">
                                    <td className="px-5 py-4 font-mono font-bold text-indigo-700">{f.flightNumber}</td>
                                    <td className="px-5 py-4 text-gray-700 font-medium">{f.airlineName}</td>
                                    <td className="px-5 py-4 font-bold text-gray-800">{f.origin} <span className="text-gray-400 font-normal mx-1">→</span> {f.destination}</td>
                                    <td className="px-5 py-4 text-xs text-gray-600">
                                        <div className="font-semibold text-gray-800 mb-0.5">{fmtDateTime(f.departureTime)}</div>
                                        <div className="text-gray-500">Đến: {fmtDateTime(f.arrivalTime)}</div>
                                    </td>
                                    <td className="px-5 py-4 text-center font-bold text-gray-700">{getTotalSeats(f.classes)}</td>
                                    <td className="px-5 py-4 text-right text-indigo-600 font-bold">{fmtVND(getMinPrice(f.classes))}</td>
                                    <td className="px-5 py-4 text-center">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${STATUS_STYLES[f.status] || 'bg-gray-100 text-gray-600'}`}>
                                            {STATUS_LABELS[f.status] || f.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setEditTarget(f); setModalOpen(true); }} className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white rounded-lg transition" title="Sửa">✏️</button>
                                            <button onClick={() => setDeleteTarget(f)} className="p-2 text-red-600 bg-red-50 hover:bg-red-600 hover:text-white rounded-lg transition" title="Hủy chuyến">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>

            <FlightModal open={modalOpen} editTarget={editTarget} onClose={() => setModalOpen(false)} onSaved={handleSaved} />
            <DeleteModal target={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />
        </div>
    );
}