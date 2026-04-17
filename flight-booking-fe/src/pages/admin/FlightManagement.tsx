import { useState, useEffect, useCallback, useRef, type FormEvent } from 'react';
import {
    getFlights, createFlight, updateFlight, deleteFlight, searchFlights,
    getAirports, getAirlines,
    type IFlight, type CreateFlightPayload, type UpdateFlightPayload
} from '../../features/admin/services/adminApi';

// ─── Local extended type ──────────────────────────────────────────────────────
type Flight = IFlight & { id: string };

const STATUS_OPTIONS: string[] = ['SCHEDULED', 'DELAYED', 'CANCELLED'];

const STATUS_STYLES: Record<string, string> = {
    SCHEDULED: 'bg-blue-100 text-blue-700',
    DELAYED: 'bg-yellow-100 text-yellow-700',
    CANCELLED: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
    SCHEDULED: 'Đã lên lịch',
    DELAYED: 'Trễ chuyến',
    CANCELLED: 'Đã huỷ',
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

const inputCls = (hasError?: string, disabled?: boolean) =>
    `w-full px-3 py-2 text-sm border rounded-lg transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${hasError ? 'border-red-400 bg-red-50' : 'border-gray-300'} ${disabled ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`;

const selectCls = (disabled?: boolean) =>
    `w-full px-3 py-2 text-sm border border-gray-300 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white ${disabled ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`;

// ─── Reusable components ────────────────────────────────────────────────
function SkeletonRow() {
    // Skeleton widths designed to mimic real column content
    const cols: { w: string; align?: string; extra?: 'time' | 'badge' | 'actions' }[] = [
        { w: 'w-16' },                                    // Số hiệu (VN123)
        { w: 'w-24' },                                    // Hãng hàng không
        { w: 'w-36' },                                    // Lộ trình (HAN → SGN)
        { w: 'w-28', extra: 'time' },                     // Giờ bay (2 dòng datetime)
        { w: 'w-10', align: 'center' },                   // Ghế trống
        { w: 'w-20', align: 'right' },                    // Giá vé từ
        { w: 'w-20', align: 'center', extra: 'badge' },   // Trạng thái (badge)
        { w: 'w-14', align: 'right', extra: 'actions' },  // Thao tác (buttons)
    ];
    return (
        <tr className="animate-pulse">
            {cols.map((col, i) => (
                <td key={i} className={`px-5 py-4 ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''}`}>
                    {col.extra === 'time' ? (
                        <div className="space-y-2">
                            <div className={`h-3.5 bg-gray-200 rounded-md ${col.w}`} />
                            <div className="h-3 bg-gray-200 rounded-md w-20" />
                        </div>
                    ) : col.extra === 'badge' ? (
                        <div className="flex justify-center">
                            <div className="h-6 bg-gray-200 rounded-md w-20" />
                        </div>
                    ) : col.extra === 'actions' ? (
                        <div className="flex justify-end gap-2">
                            <div className="h-8 w-8 bg-gray-200 rounded-lg" />
                            <div className="h-8 w-8 bg-gray-200 rounded-lg" />
                        </div>
                    ) : (
                        <div className={`h-4 bg-gray-200 rounded-md ${col.w}`} />
                    )}
                </td>
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

// ─── Flight Modal ──────────────────────────────────────────────────────────
interface FlightFormState {
    flightNumber: string;
    airlineCode: string;
    aircraftCode: string;
    originCode: string;
    destinationCode: string;
    departureTime: string;
    arrivalTime: string;
    status: string;
}

const EMPTY_FORM: FlightFormState = {
    flightNumber: '', airlineCode: '', aircraftCode: '',
    originCode: '', destinationCode: '',
    departureTime: '', arrivalTime: '', status: 'SCHEDULED',
};

interface AirportOption { code: string; name: string; }
interface AirlineOption { code: string; name: string; }

function FlightModal({ open, editTarget, onClose, onSaved }: any) {
    const [form, setForm] = useState<FlightFormState>(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [apiErr, setApiErr] = useState<string | null>(null);

    // Dropdown data
    const [airports, setAirports] = useState<AirportOption[]>([]);
    const [airlines, setAirlines] = useState<AirlineOption[]>([]);
    const [dropdownLoading, setDropdownLoading] = useState(false);

    // Fetch dropdown data when modal opens
    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        const fetchDropdowns = async () => {
            setDropdownLoading(true);
            try {
                const [airportRes, airlineRes] = await Promise.all([getAirports(), getAirlines()]);

                const extractArray = (obj: any): any[] => {
                    if (!obj) return [];
                    if (Array.isArray(obj)) return obj;
                    if (obj.result?.data && Array.isArray(obj.result.data)) return obj.result.data;
                    if (obj.result?.content && Array.isArray(obj.result.content)) return obj.result.content;
                    if (Array.isArray(obj.result)) return obj.result;
                    if (obj.data?.data && Array.isArray(obj.data.data)) return obj.data.data;
                    if (obj.data?.content && Array.isArray(obj.data.content)) return obj.data.content;
                    if (Array.isArray(obj.data)) return obj.data;
                    if (Array.isArray(obj.content)) return obj.content;
                    return [];
                };

                if (!cancelled) {
                    const rawAirports = extractArray(airportRes);
                    setAirports(rawAirports.map((a: any) => ({ code: a.code || a.iataCode || '', name: a.name || a.cityName || '' })).filter((a: AirportOption) => a.code));

                    const rawAirlines = extractArray(airlineRes);
                    setAirlines(rawAirlines.map((a: any) => ({ code: a.code || a.iataCode || '', name: a.name || '' })).filter((a: AirlineOption) => a.code));
                }
            } catch (err) {
                console.error('Error fetching dropdown data:', err);
            } finally {
                if (!cancelled) setDropdownLoading(false);
            }
        };
        fetchDropdowns();
        return () => { cancelled = true; };
    }, [open]);

    // Populate form when editing
    useEffect(() => {
        if (!open) return;
        setApiErr(null);
        if (editTarget) {
            const originCode = typeof editTarget.origin === 'object' ? (editTarget.origin.code || '') : (editTarget.origin || '');
            const destCode = typeof editTarget.destination === 'object' ? (editTarget.destination.code || '') : (editTarget.destination || '');
            const airlineCode = typeof editTarget.airline === 'object' ? (editTarget.airline.code || '') : (editTarget.airlineCode || editTarget.airlineName || '');
            setForm({
                flightNumber: editTarget.flightNumber || '',
                airlineCode: airlineCode,
                aircraftCode: editTarget.aircraftCode || editTarget.aircraft?.code || '',
                originCode: originCode,
                destinationCode: destCode,
                departureTime: toDatetimeLocal(editTarget.departureTime),
                arrivalTime: toDatetimeLocal(editTarget.arrivalTime),
                status: editTarget.status || 'SCHEDULED',
            });
        } else {
            setForm(EMPTY_FORM);
        }
    }, [open, editTarget]);

    const patch = (key: keyof FlightFormState, value: string) => setForm(prev => ({ ...prev, [key]: value }));

    const isEdit = !!editTarget;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setApiErr(null);
        try {
            if (isEdit) {
                const updatePayload: UpdateFlightPayload = {
                    departureTime: form.departureTime.length === 16 ? `${form.departureTime}:00` : form.departureTime,
                    arrivalTime: form.arrivalTime.length === 16 ? `${form.arrivalTime}:00` : form.arrivalTime,
                    status: form.status,
                };
                await updateFlight(editTarget.id, updatePayload);
            } else {
                const createPayload: CreateFlightPayload = {
                    flightNumber: form.flightNumber.toUpperCase(),
                    airlineCode: form.airlineCode.toUpperCase(),
                    aircraftCode: form.aircraftCode.toUpperCase(),
                    originCode: form.originCode.toUpperCase(),
                    destinationCode: form.destinationCode.toUpperCase(),
                    departureTime: form.departureTime.length === 16 ? `${form.departureTime}:00` : form.departureTime,
                    arrivalTime: form.arrivalTime.length === 16 ? `${form.arrivalTime}:00` : form.arrivalTime,
                };
                await createFlight(createPayload);
            }
            onSaved();
            onClose();
        } catch (err: any) {
            const msg = err.response?.data?.message || err.response?.data?.error || 'Lỗi hệ thống (Kiểm tra dữ liệu nhập)';
            setApiErr(typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally {
            setSubmitting(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b flex justify-between items-center">
                    <div>
                        <h2 className="font-bold text-gray-800 text-lg">{isEdit ? '✏️ Sửa chuyến bay' : '➕ Thêm chuyến bay mới'}</h2>
                        <p className="text-xs text-gray-400 mt-0.5">{isEdit ? 'Chỉ được sửa thời gian và trạng thái' : 'Điền đầy đủ thông tin để tạo chuyến bay'}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl transition">✕</button>
                </div>

                {/* Form */}
                <form id="flight-form" onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5">
                    {apiErr && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">⚠️ {apiErr}</div>}

                    {dropdownLoading && (
                        <div className="flex items-center gap-2 text-xs text-indigo-500">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                            Đang tải dữ liệu dropdown...
                        </div>
                    )}

                    {/* Row 1: Flight Number + Airline */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Số hiệu chuyến bay">
                            <input
                                required type="text" placeholder="VD: VN123"
                                value={form.flightNumber}
                                onChange={e => patch('flightNumber', e.target.value)}
                                className={inputCls(undefined, isEdit)}
                                disabled={isEdit}
                            />
                        </Field>
                        <Field label="Hãng hàng không">
                            <select
                                required
                                value={form.airlineCode}
                                onChange={e => patch('airlineCode', e.target.value)}
                                className={selectCls(isEdit)}
                                disabled={isEdit}
                            >
                                <option value="">— Chọn hãng bay —</option>
                                {airlines.map(a => <option key={a.code} value={a.code}>{a.name} ({a.code})</option>)}
                            </select>
                        </Field>
                    </div>

                    {/* Row 2: Aircraft + Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Mã máy bay">
                            <input
                                required type="text" placeholder="VD: A321"
                                value={form.aircraftCode}
                                onChange={e => patch('aircraftCode', e.target.value)}
                                className={inputCls(undefined, isEdit)}
                                disabled={isEdit}
                            />
                        </Field>
                        {isEdit ? (
                            <Field label="Trạng thái">
                                <select
                                    value={form.status}
                                    onChange={e => patch('status', e.target.value)}
                                    className={selectCls(false)}
                                >
                                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>)}
                                </select>
                            </Field>
                        ) : (
                            <Field label="Trạng thái">
                                <input
                                    type="text" value="SCHEDULED (Mặc định)"
                                    className={inputCls(undefined, true)}
                                    disabled
                                />
                            </Field>
                        )}
                    </div>

                    {/* Row 3: Origin + Destination */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Sân bay đi">
                            <select
                                required
                                value={form.originCode}
                                onChange={e => patch('originCode', e.target.value)}
                                className={selectCls(isEdit)}
                                disabled={isEdit}
                            >
                                <option value="">— Chọn sân bay đi —</option>
                                {airports.map(a => <option key={a.code} value={a.code}>{a.code} - {a.name}</option>)}
                            </select>
                        </Field>
                        <Field label="Sân bay đến">
                            <select
                                required
                                value={form.destinationCode}
                                onChange={e => patch('destinationCode', e.target.value)}
                                className={selectCls(isEdit)}
                                disabled={isEdit}
                            >
                                <option value="">— Chọn sân bay đến —</option>
                                {airports.map(a => <option key={a.code} value={a.code}>{a.code} - {a.name}</option>)}
                            </select>
                        </Field>
                    </div>

                    {/* Row 4: Departure + Arrival Time */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Giờ khởi hành">
                            <input
                                required type="datetime-local"
                                value={form.departureTime}
                                onChange={e => patch('departureTime', e.target.value)}
                                className={inputCls()}
                            />
                        </Field>
                        <Field label="Giờ hạ cánh">
                            <input
                                required type="datetime-local"
                                value={form.arrivalTime}
                                onChange={e => patch('arrivalTime', e.target.value)}
                                className={inputCls()}
                            />
                        </Field>
                    </div>

                    {/* Info note for edit mode */}
                    {isEdit && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 flex items-start gap-2">
                            <span className="text-base">💡</span>
                            <span>Chỉ có thể thay đổi <strong>thời gian khởi hành</strong>, <strong>thời gian hạ cánh</strong> và <strong>trạng thái</strong>. Các trường còn lại đã bị khóa.</span>
                        </div>
                    )}
                </form>

                {/* Footer */}
                <div className="p-6 border-t flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 transition">Hủy</button>
                    <button type="submit" form="flight-form" disabled={submitting} className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold disabled:bg-indigo-300 hover:bg-indigo-700 transition shadow-md">
                        {submitting ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                Đang lưu...
                            </span>
                        ) : 'Lưu thông tin'}
                    </button>
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

    // UI states for new filters
    const [filterAirports, setFilterAirports] = useState<AirportOption[]>([]);
    const [filterAirlines, setFilterAirlines] = useState<AirlineOption[]>([]);
    const [filterParams, setFilterParams] = useState({ flightNumber: '', airlineCode: '', originCode: '', destinationCode: '' });
    const [appliedFilters, setAppliedFilters] = useState({ flightNumber: '', airlineCode: '', originCode: '', destinationCode: '' });

    const [modalOpen, setModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Flight | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Flight | null>(null);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    // ─── SERVER-SIDE PAGINATION STATE ──────────────────────────────────────────
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);
    const itemsPerPage = 10;

    // Fetch master data for filters
    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const [airportRes, airlineRes] = await Promise.all([getAirports(), getAirlines()]);
                const extract = (obj: any): any[] => {
                    if (!obj) return [];
                    if (Array.isArray(obj)) return obj;
                    if (obj.result?.data && Array.isArray(obj.result.data)) return obj.result.data;
                    if (obj.result?.content && Array.isArray(obj.result.content)) return obj.result.content;
                    if (Array.isArray(obj.result)) return obj.result;
                    if (obj.data?.data && Array.isArray(obj.data.data)) return obj.data.data;
                    if (obj.data?.content && Array.isArray(obj.data.content)) return obj.data.content;
                    if (Array.isArray(obj.data)) return obj.data;
                    if (Array.isArray(obj.content)) return obj.content;
                    return [];
                };
                
                const rawAirports = extract(airportRes);
                setFilterAirports(rawAirports.map((a: any) => ({ code: a.code || a.iataCode || '', name: a.name || a.cityName || '' })).filter((a: AirportOption) => a.code));
                
                const rawAirlines = extract(airlineRes);
                setFilterAirlines(rawAirlines.map((a: any) => ({ code: a.code || a.iataCode || '', name: a.name || '' })).filter((a: AirlineOption) => a.code));
            } catch (err) {
                console.error('Lỗi tải dữ liệu dropdown:', err);
            }
        };
        fetchMasterData();
    }, []);

    useEffect(() => {
        if (!toast) return;
        const id = setTimeout(() => setToast(null), 3500);
        return () => clearTimeout(id);
    }, [toast]);

    const fetchFlights = useCallback(async () => {
        setLoading(true);
        try {
            const cleanParams: any = {};
            if (appliedFilters.flightNumber.trim()) cleanParams.flightNumber = appliedFilters.flightNumber.trim();
            if (appliedFilters.airlineCode) cleanParams.airlineCode = appliedFilters.airlineCode;
            if (appliedFilters.originCode) cleanParams.originCode = appliedFilters.originCode;
            if (appliedFilters.destinationCode) cleanParams.destinationCode = appliedFilters.destinationCode;
            
            const hasFilters = Object.keys(cleanParams).length > 0;
            
            cleanParams.page = currentPage - 1;
            cleanParams.size = itemsPerPage;

            const res: any = hasFilters 
                ? await searchFlights(cleanParams) 
                : await getFlights({ page: currentPage - 1, size: itemsPerPage });

            // ── Bóc tách PageResponse: res.result chứa { data, currentPage, totalPages, totalElements } ──
            const pageResponse = res?.result || res?.data || res;

            // Ưu tiên trường `data` theo contract PageResponse
            const rawArray: any[] = Array.isArray(pageResponse?.data)
                ? pageResponse.data
                : Array.isArray(pageResponse) ? pageResponse : [];

            // ── Trích xuất metadata phân trang từ PageResponse ──
            setTotalPages(pageResponse?.totalPages || Math.ceil((pageResponse?.totalElements || rawArray.length) / itemsPerPage) || 1);
            setTotalElements(pageResponse?.totalElements ?? rawArray.length);

            const mappedFlights = rawArray.map((f: any, index: number) => {
                const originStr = typeof f.origin === 'object' && f.origin !== null
                    ? (f.origin.code || f.origin.cityCode || f.origin.name || 'N/A')
                    : (f.origin || 'N/A');

                const destStr = typeof f.destination === 'object' && f.destination !== null
                    ? (f.destination.code || f.destination.cityCode || f.destination.name || 'N/A')
                    : (f.destination || 'N/A');

                const airlineStr = typeof f.airline === 'object' && f.airline !== null
                    ? (f.airline.name || f.airline.code)
                    : (f.airlineName || f.airlineCode || 'N/A');

                const classArray = f.classes || f.flightClasses || [];

                return {
                    id: f.id || `${f.flightNumber || 'fallback'}-${index}`,
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
    }, [currentPage, itemsPerPage, appliedFilters]);

    useEffect(() => { fetchFlights(); }, [fetchFlights]);

    // ✅ Phân trang do Server xử lý — flights[] đã là dữ liệu của trang hiện tại

    const handleSearch = () => {
        setAppliedFilters(filterParams);
        setCurrentPage(1);
    };

    const handleReset = () => {
        const resetParams = { flightNumber: '', airlineCode: '', originCode: '', destinationCode: '' };
        setFilterParams(resetParams);
        setAppliedFilters(resetParams);
        setCurrentPage(1);
    };

    const handleSaved = () => {
        fetchFlights();
        setToast({ msg: 'Lưu chuyến bay thành công!', type: 'success' });
    };

    const handleDelete = async (id: string) => {
        await deleteFlight(id);
        fetchFlights();
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

            {/* Advanced Filters */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col lg:flex-row lg:items-end gap-4 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Số hiệu chuyến bay</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none">✈️</span>
                            <input 
                                type="text" 
                                placeholder="VD: VN123" 
                                value={filterParams.flightNumber}
                                onChange={e => setFilterParams(prev => ({ ...prev, flightNumber: e.target.value }))}
                                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                className="w-full pl-10 pr-3 py-2.5 h-11 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" 
                            />
                        </div>
                    </div>
                
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Hãng bay</label>
                        <select 
                            value={filterParams.airlineCode} 
                            onChange={e => setFilterParams(prev => ({ ...prev, airlineCode: e.target.value }))}
                            className="w-full px-3 py-2.5 h-11 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition bg-white"
                        >
                            <option value="">Tất cả hãng bay</option>
                            {filterAirlines.map(a => <option key={a.code} value={a.code}>{a.name} ({a.code})</option>)}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Điểm đi</label>
                        <select 
                            value={filterParams.originCode} 
                            onChange={e => setFilterParams(prev => ({ ...prev, originCode: e.target.value }))}
                            className="w-full px-3 py-2.5 h-11 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition bg-white"
                        >
                            <option value="">Tất cả điểm đi</option>
                            {filterAirports.map(a => <option key={a.code} value={a.code}>{a.code} - {a.name}</option>)}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Điểm đến</label>
                        <select 
                            value={filterParams.destinationCode} 
                            onChange={e => setFilterParams(prev => ({ ...prev, destinationCode: e.target.value }))}
                            className="w-full px-3 py-2.5 h-11 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition bg-white"
                        >
                            <option value="">Tất cả điểm đến</option>
                            {filterAirports.map(a => <option key={a.code} value={a.code}>{a.code} - {a.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex gap-3 w-full lg:w-auto shrink-0 mt-2 lg:mt-0">
                    <button onClick={handleSearch} className="flex-1 lg:flex-none px-6 py-2.5 h-11 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-indigo-700 transition whitespace-nowrap flex items-center justify-center gap-2">
                        🔍 Tìm kiếm
                    </button>
                    <button onClick={handleReset} className="flex-1 lg:flex-none px-6 py-2.5 h-11 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-200 transition whitespace-nowrap flex items-center justify-center">
                        Làm mới
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto min-h-[420px]">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-100 font-bold">
                            <tr>
                                <th className="px-4 py-4 min-w-[100px]">Số hiệu</th>
                                <th className="px-4 py-4 min-w-[150px]">Hãng bay</th>
                                <th className="px-4 py-4 min-w-[170px]">Lộ trình</th>
                                <th className="px-4 py-4 min-w-[160px]">Giờ bay</th>
                                <th className="px-4 py-4 text-center min-w-[90px]">Ghế trống</th>
                                <th className="px-4 py-4 text-right min-w-[120px]">Giá vé từ</th>
                                <th className="px-4 py-4 text-center min-w-[120px]">Trạng thái</th>
                                <th className="px-4 py-4 text-right w-24">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />) :
                                flights.length === 0 ? (
                                    <tr><td colSpan={8} className="p-12 text-center text-gray-400">Không tìm thấy chuyến bay nào.</td></tr>
                                ) : flights.map(f => (
                                    <tr key={f.id} className="hover:bg-indigo-50/40 transition-colors group animate-in fade-in duration-300">
                                        <td className="px-4 py-4">
                                            <div className="font-mono font-bold text-indigo-700">{f.flightNumber}</div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-sm font-medium text-gray-800">{f.airlineName}</span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2 font-bold text-gray-800">
                                                <span className="bg-gray-100 text-gray-600 px-2 py-1.5 rounded-lg text-xs border border-gray-200">{f.origin}</span>
                                                <span className="text-indigo-300 text-[10px]">▶</span>
                                                <span className="bg-gray-100 text-gray-600 px-2 py-1.5 rounded-lg text-xs border border-gray-200">{f.destination}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-xs text-gray-600">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-1.5 font-semibold text-gray-800">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                    {fmtDateTime(f.departureTime)}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-gray-400">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                                                    {fmtDateTime(f.arrivalTime)}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center font-bold text-gray-700">
                                            {getTotalSeats(f.classes)}
                                        </td>
                                        <td className="px-4 py-4 text-right text-indigo-600 font-bold">
                                            {fmtVND(getMinPrice(f.classes))}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className={`inline-flex items-center justify-center min-w-[100px] px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border ${STATUS_STYLES[f.status] || 'bg-gray-100 text-gray-600 border-gray-200'} ${f.status === 'SCHEDULED' ? 'border-blue-200' : ''} ${f.status === 'DELAYED' ? 'border-yellow-200' : ''} ${f.status === 'CANCELLED' ? 'border-red-200' : ''}`}>
                                                {STATUS_LABELS[f.status] || f.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => { setEditTarget(f); setModalOpen(true); }} className="p-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white rounded-lg transition" title="Sửa">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                </button>
                                                <button onClick={() => setDeleteTarget(f)} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-600 hover:text-white rounded-lg transition" title="Hủy chuyến">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>

                {/* ─── PHÂN TRANG (PAGINATION) ────────────────────────────────────── */}
                {!loading && totalElements > 0 && (
                    <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                            Hiển thị <span className="font-bold text-gray-700">{(currentPage - 1) * itemsPerPage + 1}</span> đến <span className="font-bold text-gray-700">{Math.min(currentPage * itemsPerPage, totalElements)}</span> trong số <span className="font-bold text-gray-700">{totalElements}</span> chuyến bay
                        </span>

                        <div className="flex flex-wrap items-center justify-end gap-4 w-full">
                            <button onClick={fetchFlights} className="text-indigo-600 hover:text-indigo-800 transition text-xs font-bold flex items-center gap-1 hidden sm:flex">
                                🔄 Làm mới
                            </button>

                            {/* Bộ nút phân trang */}
                            <div className="flex flex-wrap gap-1">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
                                >
                                    Trước
                                </button>

                                {/* Logic render nút có dấu ... */}
                                {(() => {
                                    const pages = [];
                                    const maxVisible = 5; // Số trang tối đa hiển thị xung quanh trang hiện tại

                                    if (totalPages <= maxVisible + 2) {
                                        // Nếu ít trang thì hiện hết
                                        for (let i = 1; i <= totalPages; i++) {
                                            pages.push(
                                                <button
                                                    key={i}
                                                    onClick={() => setCurrentPage(i)}
                                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition shadow-sm min-w-[32px] ${currentPage === i ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                                                >
                                                    {i}
                                                </button>
                                            );
                                        }
                                    } else {
                                        // Nếu nhiều trang thì dùng dấu ...
                                        pages.push(
                                            <button key={1} onClick={() => setCurrentPage(1)} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition shadow-sm min-w-[32px] ${currentPage === 1 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>1</button>
                                        );

                                        if (currentPage > 3) {
                                            pages.push(<span key="dots-1" className="px-2 py-1.5 text-gray-400 font-bold">...</span>);
                                        }

                                        let startPage = Math.max(2, currentPage - 1);
                                        let endPage = Math.min(totalPages - 1, currentPage + 1);

                                        if (currentPage === 1) endPage = 3;
                                        if (currentPage === totalPages) startPage = totalPages - 2;

                                        for (let i = startPage; i <= endPage; i++) {
                                            pages.push(
                                                <button
                                                    key={i}
                                                    onClick={() => setCurrentPage(i)}
                                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition shadow-sm min-w-[32px] ${currentPage === i ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                                                >
                                                    {i}
                                                </button>
                                            );
                                        }

                                        if (currentPage < totalPages - 2) {
                                            pages.push(<span key="dots-2" className="px-2 py-1.5 text-gray-400 font-bold">...</span>);
                                        }

                                        pages.push(
                                            <button key={totalPages} onClick={() => setCurrentPage(totalPages)} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition shadow-sm min-w-[32px] ${currentPage === totalPages ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>{totalPages}</button>
                                        );
                                    }
                                    return pages;
                                })()}

                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
                                >
                                    Sau
                                </button>
                            </div>

                            {/* Ô nhập số trang nhảy tới */}
                            <div className="flex items-center gap-2 border-l border-gray-200 pl-4 ml-2">
                                <span className="text-xs text-gray-500 font-medium">Đến trang:</span>
                                <input 
                                    type="number" 
                                    min="1" 
                                    max={totalPages} 
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const val = parseInt(e.currentTarget.value);
                                            if (val >= 1 && val <= totalPages) setCurrentPage(val);
                                            e.currentTarget.value = ''; // Xóa ô sau khi Enter
                                        }
                                    }}
                                    placeholder="#"
                                    className="w-12 px-2 py-1 text-xs font-bold text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 hide-arrows"
                                />
                            </div>

                        </div>
                    </div>
                )}
            </div>

            <FlightModal open={modalOpen} editTarget={editTarget} onClose={() => setModalOpen(false)} onSaved={handleSaved} />
            <DeleteModal target={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />
        </div>
    );
}