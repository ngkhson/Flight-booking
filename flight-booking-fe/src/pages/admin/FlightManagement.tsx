import {
    useState,
    useEffect,
    useCallback,
    type FormEvent,
} from 'react';
import {
    getFlights,
    createFlight,
    updateFlight,
    deleteFlight,
    type IFlight,
    type IFlightClass,
} from '../../features/admin/services/adminApi';

// ─── Local extended type ──────────────────────────────────────────────────────
type Flight = IFlight & { id: string };

// ─── Constants ────────────────────────────────────────────────────────────────
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
const fmtDateTime = (iso: string) =>
    iso ? new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—';

const fmtVND = (n: number) =>
    n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

const toDatetimeLocal = (iso: string): string => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const getTotalSeats = (classes: IFlightClass[]): number =>
    (classes || []).reduce((sum, c) => sum + (c.availableSeats || 0), 0);

const getMinPrice = (classes: IFlightClass[]): number => {
    if (!classes || !classes.length) return 0;
    return Math.min(...classes.map((c) => c.basePrice || 0));
};

// ─── Validation & Interface ───────────────────────────────────────────────────
export interface FlightPayload {
    flightNumber: string;
    airlineCode: string;   // BE yêu cầu
    aircraftCode: string;  // BE yêu cầu
    origin: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
    availableSeats: number;
    price: number;
    status: string;
}

interface FieldErrors {
    flightNumber?: string;
    airlineCode?: string;
    aircraftCode?: string;
    origin?: string;
    destination?: string;
    departureTime?: string;
    arrivalTime?: string;
}

function validatePayload(p: FlightPayload): FieldErrors {
    const err: FieldErrors = {};
    if (!p.flightNumber.trim()) err.flightNumber = 'Số hiệu không được để trống.';
    if (!p.airlineCode.trim()) err.airlineCode = 'Mã hãng bay không được để trống (VD: SQ, AA).';
    if (!p.aircraftCode.trim()) err.aircraftCode = 'Mã máy bay không được để trống (VD: A321).';
    if (!p.origin.trim()) err.origin = 'Mã IATA đi không được để trống (VD: HAN).';
    if (!p.destination.trim()) err.destination = 'Mã IATA đến không được để trống (VD: SGN).';
    if (!p.departureTime) err.departureTime = 'Chọn giờ đi.';
    if (!p.arrivalTime) err.arrivalTime = 'Chọn giờ đến.';
    return err;
}

const EMPTY_PAYLOAD: FlightPayload = {
    flightNumber: '',
    airlineCode: '',
    aircraftCode: '',
    origin: '',
    destination: '',
    departureTime: '',
    arrivalTime: '',
    availableSeats: 0,
    price: 0,
    status: 'SCHEDULED',
};

// ─── Reusable components ────────────────────────────────────────────────

function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            {Array.from({ length: 10 }).map((_, i) => (
                <td key={i} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded w-3/4" /></td>
            ))}
        </tr>
    );
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

const inputCls = (hasError?: string) =>
    `w-full px-3 py-2 text-sm border rounded-lg transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${hasError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`;

// ─── Flight Modal (Add / Edit) ────────────────────────────────────────────────

interface FlightModalProps {
    open: boolean;
    editTarget: Flight | null;
    onClose: () => void;
    onSaved: (flight: Flight) => void;
}

function FlightModal({ open, editTarget, onClose, onSaved }: FlightModalProps) {
    const [form, setForm] = useState<FlightPayload>(EMPTY_PAYLOAD);
    const [errors, setErrors] = useState<FieldErrors>({});
    const [submitting, setSubmitting] = useState(false);
    const [apiErr, setApiErr] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;
        setErrors({});
        setApiErr(null);
        if (editTarget) {
            setForm({
                flightNumber: editTarget.flightNumber,
                airlineCode: editTarget.airlineName || '',
                aircraftCode: '',
                origin: editTarget.origin,
                destination: editTarget.destination,
                departureTime: toDatetimeLocal(editTarget.departureTime),
                arrivalTime: toDatetimeLocal(editTarget.arrivalTime),
                availableSeats: getTotalSeats(editTarget.classes),
                price: getMinPrice(editTarget.classes),
                status: editTarget.status,
            });
        } else {
            setForm(EMPTY_PAYLOAD);
        }
    }, [open, editTarget]);

    const patch = (key: keyof FlightPayload, value: any) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const errs = validatePayload(form);
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;

        setSubmitting(true);
        setApiErr(null);

        try {
            if (editTarget) {
                const res = await updateFlight(editTarget.id, {
                    departureTime: form.departureTime,
                    arrivalTime: form.arrivalTime,
                    status: form.status,
                });
                onSaved({ ...editTarget, ...res });
            } else {
                // 🚀 ĐÓNG GÓI PAYLOAD CHUẨN FlightManualRequestDTO.java
                const finalPayload = {
                    flightNumber: form.flightNumber.toUpperCase(),
                    airlineCode: form.airlineCode.toUpperCase(),
                    aircraftCode: form.aircraftCode.toUpperCase(),
                    originCode: form.origin.toUpperCase(),
                    destinationCode: form.destination.toUpperCase(),
                    departureTime: `${form.departureTime}:00`,
                    arrivalTime: `${form.arrivalTime}:00`
                };

                const response: any = await createFlight(finalPayload as any);

                // BE chỉ trả về UUID, tạo object tạm để hiện lên UI
                const newFlight: Flight = {
                    id: response.result || String(Date.now()),
                    flightNumber: finalPayload.flightNumber,
                    airlineName: finalPayload.airlineCode,
                    origin: finalPayload.originCode,
                    destination: finalPayload.destinationCode,
                    departureTime: finalPayload.departureTime,
                    arrivalTime: finalPayload.arrivalTime,
                    status: 'SCHEDULED',
                    classes: []
                };
                onSaved(newFlight);
                // Vì BE cần set giá riêng, khuyên dùng reload để lấy data chuẩn
                setTimeout(() => window.location.reload(), 1000);
            }
            onClose();
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Lỗi hệ thống (Kiểm tra Airline/Airport code)';
            setApiErr(msg);
        } finally {
            setSubmitting(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 border-b flex justify-between items-center">
                    <h2 className="font-bold text-gray-800">{editTarget ? 'Sửa chuyến bay' : 'Thêm chuyến bay mới'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <form id="flight-form" onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4">
                    {apiErr && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">⚠️ {apiErr}</div>}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Số hiệu (VD: SQ-182)" error={errors.flightNumber}>
                            <input type="text" value={form.flightNumber} onChange={e => patch('flightNumber', e.target.value)} className={inputCls(errors.flightNumber)} />
                        </Field>
                        <Field label="Mã Hãng (VD: SQ, AA)" error={errors.airlineCode}>
                            <input type="text" value={form.airlineCode} onChange={e => patch('airlineCode', e.target.value)} className={inputCls(errors.airlineCode)} />
                        </Field>
                        <Field label="Mã máy bay (VD: A321)" error={errors.aircraftCode}>
                            <input type="text" value={form.aircraftCode} onChange={e => patch('aircraftCode', e.target.value)} className={inputCls(errors.aircraftCode)} />
                        </Field>
                        <Field label="Trạng thái">
                            <select value={form.status} onChange={e => patch('status', e.target.value)} className={inputCls()}>
                                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                            </select>
                        </Field>
                        <Field label="Sân bay đi (IATA)" error={errors.origin}>
                            <input type="text" maxLength={3} value={form.origin} onChange={e => patch('origin', e.target.value)} className={inputCls(errors.origin)} />
                        </Field>
                        <Field label="Sân bay đến (IATA)" error={errors.destination}>
                            <input type="text" maxLength={3} value={form.destination} onChange={e => patch('destination', e.target.value)} className={inputCls(errors.destination)} />
                        </Field>
                        <Field label="Giờ khởi hành" error={errors.departureTime}>
                            <input type="datetime-local" value={form.departureTime} onChange={e => patch('departureTime', e.target.value)} className={inputCls(errors.departureTime)} />
                        </Field>
                        <Field label="Giờ hạ cánh" error={errors.arrivalTime}>
                            <input type="datetime-local" value={form.arrivalTime} onChange={e => patch('arrivalTime', e.target.value)} className={inputCls(errors.arrivalTime)} />
                        </Field>
                    </div>
                </form>

                <div className="p-6 border-t flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-lg text-sm">Hủy</button>
                    <button type="submit" form="flight-form" disabled={submitting} className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold disabled:bg-indigo-300 flex items-center gap-2">
                        {submitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />}
                        {editTarget ? 'Cập nhật' : 'Tạo chuyến bay'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Delete Confirmation Modal (Giữ nguyên logic cũ của bạn) ─────────────────
function DeleteModal({ target, onClose, onConfirm }: { target: Flight | null, onClose: () => void, onConfirm: (id: string) => Promise<void> }) {
    const [working, setWorking] = useState(false);
    if (!target) return null;
    const handleConfirm = async () => {
        setWorking(true);
        try { await onConfirm(target.id); onClose(); } finally { setWorking(false); }
    };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
                <h2 className="font-bold text-gray-800">Xác nhận xoá</h2>
                <p className="text-sm text-gray-600">Bạn có chắc muốn xoá chuyến <span className="font-mono font-bold">{target.flightNumber}</span>?</p>
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-lg text-sm">Hủy</button>
                    <button onClick={handleConfirm} disabled={working} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold">
                        {working ? 'Đang xoá...' : 'Xoá ngay'}
                    </button>
                </div>
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

    const fetchFlights = useCallback(() => {
        setLoading(true);
        // Payload mặc định để tránh 400
        const today = new Date().toISOString().split('T')[0];
        getFlights({ page: 1, size: 100, departureDate: today, origin: "HAN", destination: "SGN" })
            .then((res: any) => {
                let flightArray: any[] = [];
                if (Array.isArray(res)) flightArray = res;
                else if (res && typeof res === 'object') {
                    flightArray = res.data?.content || res.result?.content || res.content || res.data || res.result || [];
                }
                setFlights(flightArray.map((f, i) => ({ ...f, id: f.id ?? String(i + 1) })));
                setLoading(false);
            })
            .catch(() => { setFlights([]); setLoading(false); });
    }, []);

    useEffect(() => { fetchFlights(); }, [fetchFlights]);

    const filtered = flights.filter(f => {
        const q = search.toLowerCase();
        return f.flightNumber?.toLowerCase().includes(q) || f.origin?.toLowerCase().includes(q) || f.destination?.toLowerCase().includes(q);
    });

    const handleSaved = (saved: Flight) => {
        setFlights(prev => {
            const idx = prev.findIndex(f => f.id === saved.id);
            if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
            return [saved, ...prev];
        });
        setToast({ msg: 'Thao tác thành công!', type: 'success' });
    };

    const handleDelete = async (id: string) => {
        await deleteFlight(id);
        setFlights(prev => prev.filter(f => f.id !== id));
        setToast({ msg: 'Đã xoá chuyến bay.', type: 'success' });
    };

    return (
        <div className="space-y-5">
            {toast && (
                <div className={`fixed top-5 right-5 z-[100] px-4 py-3 rounded-xl shadow-lg border ${toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                    {toast.msg}
                </div>
            )}

            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">✈️ Quản lý chuyến bay</h1>
                <button onClick={() => { setEditTarget(null); setModalOpen(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-indigo-700">+ Thêm chuyến bay</button>
            </div>

            <div className="relative max-w-sm">
                <input type="text" placeholder="Tìm chuyến bay..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-4 pr-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div className="bg-white rounded-xl border shadow-sm overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-3">Số hiệu</th>
                            <th className="px-4 py-3">Hãng</th>
                            <th className="px-4 py-3">Xuất phát</th>
                            <th className="px-4 py-3">Điểm đến</th>
                            <th className="px-4 py-3">Giờ bay</th>
                            <th className="px-4 py-3">Ghế trống</th>
                            <th className="px-4 py-3">Giá vé</th>
                            <th className="px-4 py-3 text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? <SkeletonRow /> : filtered.length === 0 ? <tr><td colSpan={8} className="p-10 text-center text-gray-400">Không có dữ liệu.</td></tr> :
                            filtered.map(f => (
                                <tr key={f.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-mono font-bold text-gray-800">{f.flightNumber}</td>
                                    <td className="px-4 py-3 text-gray-600">{f.airlineName}</td>
                                    <td className="px-4 py-3 font-medium">{f.origin}</td>
                                    <td className="px-4 py-3 font-medium">{f.destination}</td>
                                    <td className="px-4 py-3 text-xs">{fmtDateTime(f.departureTime)}</td>
                                    <td className="px-4 py-3">{getTotalSeats(f.classes)}</td>
                                    <td className="px-4 py-3">{fmtVND(getMinPrice(f.classes))}</td>

                                    {/* THÊM ĐOẠN NÀY VÀO ĐỂ DÙNG STATUS_STYLES */}
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${STATUS_STYLES[f.status] || 'bg-gray-100 text-gray-600'}`}>
                                            {STATUS_LABELS[f.status] || f.status}
                                        </span>
                                    </td>

                                    <td className="px-4 py-3 text-right">
                                        <button onClick={() => { setEditTarget(f); setModalOpen(true); }} className="px-2 py-1 text-indigo-600 hover:bg-indigo-50 rounded mr-2">✏️</button>
                                        <button onClick={() => setDeleteTarget(f)} className="px-2 py-1 text-red-600 hover:bg-red-50 rounded">🗑️</button>
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