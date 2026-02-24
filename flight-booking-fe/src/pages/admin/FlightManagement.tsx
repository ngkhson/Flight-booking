import {
    useState,
    useEffect,
    useCallback,
    type ChangeEvent,
    type FormEvent,
} from 'react';
import {
    getFlights,
    createFlight,
    updateFlight,
    deleteFlight,
    type Flight,
    type FlightPayload,
} from '../../features/admin/services/adminApi';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: Flight['status'][] = ['SCHEDULED', 'DELAYED', 'CANCELLED', 'COMPLETED'];

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDateTime = (iso: string) =>
    new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

const fmtVND = (n: number) =>
    n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

/** ISO → YYYY-MM-DDTHH:mm (for datetime-local inputs) */
const toDatetimeLocal = (iso: string): string => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// ─── Validation ───────────────────────────────────────────────────────────────

interface FieldErrors {
    flightNumber?: string;
    origin?: string;
    destination?: string;
    departureTime?: string;
    arrivalTime?: string;
    availableSeats?: string;
    price?: string;
}

function validatePayload(p: FlightPayload): FieldErrors {
    const err: FieldErrors = {};

    if (!p.flightNumber.trim())
        err.flightNumber = 'Số hiệu không được để trống.';
    else if (!/^[A-Z0-9]{2,3}-\d{2,4}$/i.test(p.flightNumber.trim()))
        err.flightNumber = 'Định dạng không hợp lệ — VD: VN-201, QH-102.';

    if (!p.origin.trim())
        err.origin = 'Sân bay xuất phát không được để trống.';
    else if (!/^[A-Z]{3}$/i.test(p.origin.trim()))
        err.origin = 'Mã IATA gồm đúng 3 chữ cái (VD: HAN).';

    if (!p.destination.trim())
        err.destination = 'Sân bay đến không được để trống.';
    else if (!/^[A-Z]{3}$/i.test(p.destination.trim()))
        err.destination = 'Mã IATA gồm đúng 3 chữ cái (VD: SGN).';

    if (!p.departureTime)
        err.departureTime = 'Vui lòng chọn giờ khởi hành.';

    if (!p.arrivalTime)
        err.arrivalTime = 'Vui lòng chọn giờ hạ cánh.';
    else if (p.departureTime && p.arrivalTime <= p.departureTime)
        err.arrivalTime = 'Giờ hạ cánh phải sau giờ khởi hành.';

    if (!Number.isFinite(p.availableSeats) || p.availableSeats < 0)
        err.availableSeats = 'Số ghế phải ≥ 0.';
    else if (!Number.isInteger(p.availableSeats))
        err.availableSeats = 'Số ghế phải là số nguyên.';

    if (!Number.isFinite(p.price) || p.price <= 0)
        err.price = 'Giá vé phải > 0 VND.';

    return err;
}

const EMPTY_PAYLOAD: FlightPayload = {
    flightNumber: '',
    airline: '',
    origin: '',
    destination: '',
    departureTime: '',
    arrivalTime: '',
    availableSeats: 0,
    price: 0,
    status: 'SCHEDULED',
};

// ─── Small reusable components ────────────────────────────────────────────────

function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            {Array.from({ length: 10 }).map((_, i) => (
                <td key={i} className="px-4 py-3">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                </td>
            ))}
        </tr>
    );
}

interface FieldProps {
    label: string;
    error?: string;
    children: React.ReactNode;
}
function Field({ label, error, children }: FieldProps) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                {label}
            </label>
            {children}
            {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
        </div>
    );
}

const inputCls = (hasError?: string) =>
    [
        'w-full px-3 py-2 text-sm border rounded-lg transition',
        'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
        hasError ? 'border-red-400 bg-red-50' : 'border-gray-300',
    ].join(' ');

// ─── Flight Modal (Add / Edit) ────────────────────────────────────────────────

interface FlightModalProps {
    open: boolean;
    editTarget: Flight | null;
    isMock: boolean;
    onClose: () => void;
    onSaved: (flight: Flight) => void;
}

function FlightModal({ open, editTarget, isMock, onClose, onSaved }: FlightModalProps) {
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
                airline: editTarget.airline,
                origin: editTarget.origin,
                destination: editTarget.destination,
                departureTime: toDatetimeLocal(editTarget.departureTime),
                arrivalTime: toDatetimeLocal(editTarget.arrivalTime),
                availableSeats: editTarget.availableSeats,
                price: editTarget.price,
                status: editTarget.status,
            });
        } else {
            setForm(EMPTY_PAYLOAD);
        }
    }, [open, editTarget]);

    const patch = (key: keyof FlightPayload, value: unknown) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const normalized: FlightPayload = {
            ...form,
            flightNumber: form.flightNumber.trim().toUpperCase(),
            origin: form.origin.trim().toUpperCase(),
            destination: form.destination.trim().toUpperCase(),
        };

        const errs = validatePayload(normalized);
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;

        setSubmitting(true);
        setApiErr(null);
        try {
            let saved: Flight;
            if (isMock) {
                await new Promise((r) => setTimeout(r, 400));
                saved = { ...normalized, airline: normalized.airline || '', id: editTarget?.id ?? String(Date.now()) };
            } else if (editTarget) {
                saved = await updateFlight(editTarget.id, normalized);
            } else {
                saved = await createFlight(normalized);
            }
            onSaved(saved);
            onClose();
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Lỗi không xác định.';
            setApiErr(`Không thể lưu: ${msg}`);
        } finally {
            setSubmitting(false);
        }
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            role="dialog"
            aria-modal="true"
            aria-label={editTarget ? 'Sửa chuyến bay' : 'Thêm chuyến bay mới'}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                    <h2 className="text-lg font-bold text-gray-800">
                        {editTarget ? '✏️ Sửa chuyến bay' : '✈️ Thêm chuyến bay mới'}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                        aria-label="Đóng modal"
                    >
                        ✕
                    </button>
                </div>

                {/* Body */}
                <form
                    id="flight-form"
                    onSubmit={handleSubmit}
                    noValidate
                    className="overflow-y-auto flex-1 px-6 py-5 space-y-4"
                >
                    {apiErr && (
                        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex gap-2">
                            <span>⚠️</span><span>{apiErr}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Hãng hàng không">
                            <input
                                id="fm-airline"
                                type="text"
                                placeholder="VD: Vietnam Airlines"
                                value={form.airline}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => patch('airline', e.target.value)}
                                className={inputCls()}
                            />
                        </Field>

                        <Field label="Số hiệu chuyến bay *" error={errors.flightNumber}>
                            <input
                                id="fm-flightNumber"
                                type="text"
                                placeholder="VD: VN-201"
                                value={form.flightNumber}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => patch('flightNumber', e.target.value)}
                                className={inputCls(errors.flightNumber)}
                                required
                            />
                        </Field>

                        <Field label="Trạng thái *">
                            <select
                                id="fm-status"
                                value={form.status}
                                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                                    patch('status', e.target.value as Flight['status'])
                                }
                                className={inputCls()}
                            >
                                {STATUS_OPTIONS.map((s) => (
                                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Sân bay khởi hành (IATA) *" error={errors.origin}>
                            <input
                                id="fm-origin"
                                type="text"
                                placeholder="VD: HAN"
                                maxLength={3}
                                value={form.origin}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => patch('origin', e.target.value)}
                                className={inputCls(errors.origin)}
                                required
                            />
                        </Field>

                        <Field label="Sân bay đến (IATA) *" error={errors.destination}>
                            <input
                                id="fm-destination"
                                type="text"
                                placeholder="VD: SGN"
                                maxLength={3}
                                value={form.destination}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => patch('destination', e.target.value)}
                                className={inputCls(errors.destination)}
                                required
                            />
                        </Field>

                        <Field label="Giờ khởi hành *" error={errors.departureTime}>
                            <input
                                id="fm-departureTime"
                                type="datetime-local"
                                value={form.departureTime}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => patch('departureTime', e.target.value)}
                                className={inputCls(errors.departureTime)}
                                required
                            />
                        </Field>

                        <Field label="Giờ hạ cánh *" error={errors.arrivalTime}>
                            <input
                                id="fm-arrivalTime"
                                type="datetime-local"
                                value={form.arrivalTime}
                                min={form.departureTime || undefined}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => patch('arrivalTime', e.target.value)}
                                className={inputCls(errors.arrivalTime)}
                                required
                            />
                        </Field>

                        <Field label="Số ghế trống *" error={errors.availableSeats}>
                            <input
                                id="fm-availableSeats"
                                type="number"
                                min={0}
                                step={1}
                                placeholder="0"
                                value={form.availableSeats}
                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                    patch('availableSeats', parseInt(e.target.value, 10) || 0)
                                }
                                className={inputCls(errors.availableSeats)}
                                required
                            />
                        </Field>

                        <Field label="Giá vé (VND) *" error={errors.price}>
                            <input
                                id="fm-price"
                                type="number"
                                min={1}
                                step={1000}
                                placeholder="1000000"
                                value={form.price}
                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                    patch('price', parseFloat(e.target.value) || 0)
                                }
                                className={inputCls(errors.price)}
                                required
                            />
                        </Field>
                    </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        form="flight-form"
                        disabled={submitting}
                        className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-lg shadow transition flex items-center gap-2"
                    >
                        {submitting && (
                            <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        )}
                        {editTarget ? 'Lưu thay đổi' : 'Thêm chuyến bay'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Delete Confirmation Modal ────────────────────────────────────────────────

interface DeleteModalProps {
    target: Flight | null;
    onClose: () => void;
    onConfirm: (id: string) => Promise<void>;
}

function DeleteModal({ target, onClose, onConfirm }: DeleteModalProps) {
    const [working, setWorking] = useState(false);

    if (!target) return null;

    const handleConfirm = async () => {
        setWorking(true);
        try {
            await onConfirm(target.id);
            onClose();
        } finally {
            setWorking(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Xác nhận xoá"
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
                <div className="flex items-start gap-3">
                    <span className="text-2xl">🗑️</span>
                    <div>
                        <h2 className="text-base font-bold text-gray-800">Xác nhận xoá chuyến bay</h2>
                        <p className="mt-1 text-sm text-gray-600">
                            Bạn có chắc muốn xoá chuyến{' '}
                            <span className="font-mono font-semibold text-gray-800">{target.flightNumber}</span>
                            {' '}({target.origin} → {target.destination})?
                            Hành động này <strong>không thể hoàn tác</strong>.
                        </p>
                    </div>
                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={working}
                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={working}
                        className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 rounded-lg shadow transition flex items-center gap-2"
                    >
                        {working && (
                            <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        )}
                        Xoá
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
    const [isMock] = useState(false); // no longer set; kept for handleDelete guard
    const [search, setSearch] = useState('');

    const [modalOpen, setModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Flight | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Flight | null>(null);

    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    // Auto-dismiss toast after 3.5 s
    useEffect(() => {
        if (!toast) return;
        const id = setTimeout(() => setToast(null), 3500);
        return () => clearTimeout(id);
    }, [toast]);

    // Load flights on mount
    const [apiError, setApiError] = useState<string | null>(null);
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setApiError(null);
        getFlights({ page: 0, size: 100 })
            .then((res) => {
                if (!cancelled) { setFlights(res.content); setLoading(false); }
            })
            .catch((err: unknown) => {
                if (!cancelled) {
                    const msg = err instanceof Error ? err.message : 'Không thể tải danh sách chuyến bay.';
                    setApiError(msg);
                    setFlights([]);
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

    const openAdd = () => { setEditTarget(null); setModalOpen(true); };
    const openEdit = (f: Flight) => { setEditTarget(f); setModalOpen(true); };

    const handleSaved = useCallback((saved: Flight) => {
        setFlights((prev) => {
            const idx = prev.findIndex((f) => f.id === saved.id);
            if (idx >= 0) {
                const next = [...prev];
                next[idx] = saved;
                return next;
            }
            return [saved, ...prev];
        });
        setToast({ msg: editTarget ? 'Đã cập nhật chuyến bay.' : 'Đã thêm chuyến bay mới.', type: 'success' });
    }, [editTarget]);

    const handleDelete = useCallback(async (id: string) => {
        if (!isMock) await deleteFlight(id);
        else await new Promise((r) => setTimeout(r, 300));
        setFlights((prev) => prev.filter((f) => f.id !== id));
        setToast({ msg: 'Đã xoá chuyến bay.', type: 'success' });
    }, [isMock]);

    return (
        <div className="space-y-5">
            {/* Toast */}
            {toast && (
                <div
                    role="alert"
                    aria-live="polite"
                    className={`fixed top-5 right-5 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === 'success'
                        ? 'bg-green-50 border border-green-200 text-green-700'
                        : 'bg-red-50 border border-red-200 text-red-700'
                        }`}
                >
                    <span>{toast.type === 'success' ? '✅' : '❌'}</span>
                    <span>{toast.msg}</span>
                    <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70" aria-label="Đóng thông báo">✕</button>
                </div>
            )}

            {/* API error banner */}
            {apiError && !loading && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                    <span>⚠️</span>
                    <span>{apiError}</span>
                    <button onClick={() => { setApiError(null); }} className="ml-auto text-xs underline hover:no-underline">Bỏ qua</button>
                </div>
            )}

            {/* Page header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">✈️ Quản lý chuyến bay</h1>
                    <p className="mt-0.5 text-sm text-gray-500">Thêm, sửa, xoá chuyến bay trong hệ thống</p>
                </div>
                <button
                    id="btn-add-flight"
                    onClick={openAdd}
                    className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                    + Thêm chuyến bay
                </button>
            </div>

            {/* Mock-data warning */}
            {isMock && (
                <div className="px-4 py-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm flex items-center gap-2">
                    <span>⚠️</span>
                    <span>Không thể kết nối API — đang dùng dữ liệu mẫu. Thêm/Sửa/Xoá cập nhật cục bộ.</span>
                </div>
            )}

            {/* Search */}
            <div className="relative max-w-sm">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm pointer-events-none">🔍</span>
                <input
                    id="search-flights"
                    type="text"
                    placeholder="Tìm theo số hiệu, sân bay..."
                    value={search}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 tracking-wide">
                        <tr>
                            <th className="px-4 py-3">Số hiệu</th>
                            <th className="px-4 py-3">Hãng</th>
                            <th className="px-4 py-3">Xuất phát</th>
                            <th className="px-4 py-3">Điểm đến</th>
                            <th className="px-4 py-3">Giờ bay</th>
                            <th className="px-4 py-3">Hạ cánh</th>
                            <th className="px-4 py-3">Ghế trống</th>
                            <th className="px-4 py-3">Giá vé</th>
                            <th className="px-4 py-3">Trạng thái</th>
                            <th className="px-4 py-3 text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading
                            ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                            : filtered.length === 0
                                ? (
                                    <tr>
                                        <td colSpan={10} className="px-4 py-12 text-center text-gray-400 text-sm">
                                            Không tìm thấy chuyến bay phù hợp.
                                        </td>
                                    </tr>
                                )
                                : filtered.map((f) => {
                                    const airline = f.flightNumber.split('-')[0] ?? '—';
                                    return (
                                        <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-mono font-semibold text-gray-800">{f.flightNumber}</td>
                                            <td className="px-4 py-3 text-gray-600">{airline}</td>
                                            <td className="px-4 py-3 font-medium text-gray-700">{f.origin}</td>
                                            <td className="px-4 py-3 font-medium text-gray-700">{f.destination}</td>
                                            <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmtDateTime(f.departureTime)}</td>
                                            <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmtDateTime(f.arrivalTime)}</td>
                                            <td className="px-4 py-3 text-gray-600">{f.availableSeats}</td>
                                            <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmtVND(f.price)}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[f.status]}`}>
                                                    {STATUS_LABELS[f.status]}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openEdit(f)}
                                                        className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                                                        aria-label={`Sửa chuyến ${f.flightNumber}`}
                                                    >
                                                        ✏️ Sửa
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteTarget(f)}
                                                        className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                                                        aria-label={`Xoá chuyến ${f.flightNumber}`}
                                                    >
                                                        🗑️ Xoá
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                        }
                    </tbody>
                </table>

                {/* Table footer count */}
                {!loading && (
                    <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400 flex items-center justify-between">
                        <span>Hiển thị {filtered.length} / {flights.length} chuyến bay</span>
                        {isMock && <span className="text-yellow-600 font-medium">● Dữ liệu mẫu</span>}
                    </div>
                )}
            </div>

            {/* Modals */}
            <FlightModal
                open={modalOpen}
                editTarget={editTarget}
                isMock={isMock}
                onClose={() => setModalOpen(false)}
                onSaved={handleSaved}
            />
            <DeleteModal
                target={deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
            />
        </div>
    );
}
