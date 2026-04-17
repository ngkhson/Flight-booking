import { useState, useEffect, useCallback, useRef } from 'react';
import { Eye, RefreshCw, Mail, Ban, X, User, Phone, AtSign, Plane, Luggage, CreditCard, Loader2 } from 'lucide-react';
import {
    getBookings, cancelBooking, resendBookingEmail, verifyPayment, getBookingDetail,
    type IBooking, type IBookingSearchRequest,
    type IBookingDetailResponse, type IBookingPassenger, type IBookingAncillary, type IBookingTransaction,
} from '../../features/admin/services/adminApi';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
    CONFIRMED: 'bg-green-100 text-green-700 border-green-200',
    PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    CANCELLED: 'bg-red-100 text-red-700 border-red-200',
    PAID: 'bg-blue-100 text-blue-700 border-blue-200',
    AWAITING_PAYMENT: 'bg-orange-100 text-orange-700 border-orange-200',
    REFUNDED: 'bg-gray-100 text-gray-600 border-gray-200',
};

const STATUS_LABELS: Record<string, string> = {
    CONFIRMED: 'Xác nhận',
    PENDING: 'Chờ xử lý',
    CANCELLED: 'Đã huỷ',
    PAID: 'Đã thanh toán',
    AWAITING_PAYMENT: 'Chờ thanh toán',
    REFUNDED: 'Hoàn tiền',
};

const FILTER_STATUS_OPTIONS = [
    { label: 'Tất cả trạng thái', value: '' },
    { label: 'Chờ xử lý', value: 'PENDING' },
    { label: 'Chờ thanh toán', value: 'AWAITING_PAYMENT' },
    { label: 'Đã thanh toán', value: 'PAID' },
    { label: 'Xác nhận', value: 'CONFIRMED' },
    { label: 'Đã huỷ', value: 'CANCELLED' },
    { label: 'Hoàn tiền', value: 'REFUNDED' },
];

// Status cho phép huỷ vé
const CANCELLABLE_STATUSES = ['PENDING', 'AWAITING_PAYMENT', 'CONFIRMED', 'PAID'];
// Status cho phép gửi lại email
const RESEND_EMAIL_STATUSES = ['CONFIRMED', 'PAID'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const fmtVND = (n?: number) =>
    (n || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

const resolveStr = (val: any): string => {
    if (!val) return '—';
    if (typeof val === 'object') return val.code || val.name || val.cityCode || '—';
    return val;
};

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            {Array.from({ length: 9 }).map((_, i) => (
                <td key={i} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded w-3/4" /></td>
            ))}
        </tr>
    );
}

// ─── Status Badge (read-only) ─────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
            {STATUS_LABELS[status] || status}
        </span>
    );
}

// ─── Action Buttons per row ───────────────────────────────────────────────────

interface ActionCellProps {
    booking: IBooking;
    onViewDetail: (id: string) => void;
    onVerifyPayment: (pnrCode: string) => void;
    onResendEmail: (id: string) => void;
    onCancelBooking: (booking: IBooking) => void;
    loadingAction: string | null; // stores the currently-loading action key
}

function ActionCell({ booking, onViewDetail, onVerifyPayment, onResendEmail, onCancelBooking, loadingAction }: ActionCellProps) {
    const isLoading = (key: string) => loadingAction === `${key}-${booking.id}`;

    return (
        <div className="flex items-center justify-center gap-1">
            {/* Xem chi tiết — luôn hiển thị */}
            <button
                onClick={() => onViewDetail(booking.id)}
                title="Xem chi tiết"
                className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
            >
                <Eye size={16} />
            </button>

            {/* Kiểm tra thanh toán — chỉ AWAITING_PAYMENT */}
            {booking.status === 'AWAITING_PAYMENT' && (
                <button
                    onClick={() => onVerifyPayment(booking.pnrCode)}
                    disabled={isLoading('verify')}
                    title="Kiểm tra thanh toán"
                    className="p-1.5 rounded-lg text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-wait"
                >
                    {isLoading('verify') ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                </button>
            )}

            {/* Gửi lại Email — CONFIRMED hoặc PAID */}
            {RESEND_EMAIL_STATUSES.includes(booking.status) && (
                <button
                    onClick={() => onResendEmail(booking.id)}
                    disabled={isLoading('email')}
                    title="Gửi lại Email xác nhận"
                    className="p-1.5 rounded-lg text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-wait"
                >
                    {isLoading('email') ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                </button>
            )}

            {/* Huỷ vé — PENDING, AWAITING_PAYMENT, CONFIRMED, PAID */}
            {CANCELLABLE_STATUSES.includes(booking.status) && (
                <button
                    onClick={() => onCancelBooking(booking)}
                    disabled={isLoading('cancel')}
                    title="Huỷ vé"
                    className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-wait"
                >
                    {isLoading('cancel') ? <Loader2 size={16} className="animate-spin" /> : <Ban size={16} />}
                </button>
            )}
        </div>
    );
}

// ─── Cancel Confirm Modal ─────────────────────────────────────────────────────

interface CancelModalProps {
    booking: IBooking | null;
    isOpen: boolean;
    isProcessing: boolean;
    onConfirm: () => void;
    onClose: () => void;
}

function CancelConfirmModal({ booking, isOpen, isProcessing, onConfirm, onClose }: CancelModalProps) {
    if (!isOpen || !booking) return null;

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={!isProcessing ? onClose : undefined} />

            {/* Content */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                        <Ban size={20} className="text-red-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Xác nhận huỷ vé</h3>
                        <p className="text-sm text-gray-500">Hành động này không thể hoàn tác</p>
                    </div>
                </div>

                <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-5">
                    <p className="text-sm text-gray-700">
                        Bạn có chắc chắn muốn huỷ đơn đặt vé <span className="font-bold text-red-700">{booking.pnrCode}</span> của khách hàng <span className="font-bold text-gray-900">{booking.contactName}</span>?
                    </p>
                </div>

                <div className="flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isProcessing}
                        className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition disabled:opacity-50"
                    >
                        Đóng
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isProcessing}
                        className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition flex items-center gap-2 disabled:opacity-60 disabled:cursor-wait"
                    >
                        {isProcessing && <Loader2 size={14} className="animate-spin" />}
                        {isProcessing ? 'Đang huỷ...' : 'Xác nhận huỷ'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Booking Detail Modal ─────────────────────────────────────────────────────

interface DetailModalProps {
    bookingId: string | null;
    isOpen: boolean;
    onClose: () => void;
    fallbackBooking?: IBooking | null; // Dữ liệu từ danh sách để fallback hiển thị hành trình, khởi hành
}

function DetailSkeleton() {
    return (
        <div className="animate-pulse space-y-6 p-6">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-8 w-32 bg-gray-200 rounded-lg" />
                    <div className="h-6 w-20 bg-gray-200 rounded-full" />
                </div>
                <div className="h-7 w-28 bg-gray-200 rounded-lg" />
            </div>
            <div className="h-px bg-gray-200" />
            {/* Contact skeleton */}
            <div className="space-y-3">
                <div className="h-5 w-40 bg-gray-200 rounded" />
                <div className="grid grid-cols-3 gap-4">
                    <div className="h-12 bg-gray-100 rounded-xl" />
                    <div className="h-12 bg-gray-100 rounded-xl" />
                    <div className="h-12 bg-gray-100 rounded-xl" />
                </div>
            </div>
            {/* Passengers skeleton */}
            <div className="space-y-3">
                <div className="h-5 w-48 bg-gray-200 rounded" />
                <div className="h-24 bg-gray-100 rounded-xl" />
                <div className="h-24 bg-gray-100 rounded-xl" />
            </div>
            {/* Transactions skeleton */}
            <div className="space-y-3">
                <div className="h-5 w-44 bg-gray-200 rounded" />
                <div className="h-32 bg-gray-100 rounded-xl" />
            </div>
        </div>
    );
}

function BookingDetailModal({ bookingId, isOpen, onClose, fallbackBooking }: DetailModalProps) {
    const [detail, setDetail] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || !bookingId) {
            setDetail(null);
            setError(null);
            return;
        }

        const fetchDetail = async () => {
            setLoading(true);
            setError(null);
            try {
                const res: any = await getBookingDetail(bookingId);
                const detailData = res?.result || res?.data || res;
                console.log('Booking Detail API:', detailData);
                setDetail(detailData);
            } catch (err: any) {
                console.error('Lỗi lấy chi tiết booking:', err);
                setError(err?.response?.data?.message || 'Không thể tải chi tiết đơn đặt vé.');
            } finally {
                setLoading(false);
            }
        };

        fetchDetail();
    }, [isOpen, bookingId]);

    if (!isOpen) return null;

    // ── Đọc dữ liệu đúng theo cấu trúc API thực tế ──
    const base = detail?.baseDetails;
    const contact = base?.contact;
    const passengers: any[] = base?.passengers || [];
    const transactions: any[] = detail?.transactions || [];

    // Ancillaries: nằm sâu trong passengers → tickets → ancillaries → flatten ra
    const ancillaries: any[] = passengers.flatMap((p: any) =>
        (p.tickets || []).flatMap((t: any) =>
            (t.ancillaries || []).map((a: any) => ({
                ...a,
                passengerName: p.fullName || [p.firstName, p.lastName].filter(Boolean).join(' ') || '—',
            }))
        )
    );

    // Các trường chính — ưu tiên baseDetails, fallback về detail top-level hoặc fallbackBooking
    const pnrCode = base?.pnrCode || detail?.pnrCode || fallbackBooking?.pnrCode || '—';
    const status = base?.status || detail?.status || fallbackBooking?.status || 'PENDING';
    const totalAmount = base?.totalAmount ?? detail?.totalAmount ?? fallbackBooking?.totalAmount ?? 0;
    const flightNumber = base?.flightNumber || detail?.flightNumber || fallbackBooking?.flightNumber;
    const contactFullName = contact?.fullName
        || [contact?.firstName, contact?.lastName].filter(Boolean).join(' ')
        || detail?.contactName || fallbackBooking?.contactName || '—';
    const contactPhone = contact?.phone || detail?.contactPhone || fallbackBooking?.contactPhone || '—';
    const contactEmail = contact?.email || detail?.contactEmail || fallbackBooking?.contactEmail || '—';
    // Hành trình & thời gian: fallback từ danh sách
    const originDisplay = resolveStr(detail?.origin || fallbackBooking?.origin);
    const destDisplay = resolveStr(detail?.destination || fallbackBooking?.destination);
    const departureTime = detail?.departureTime || fallbackBooking?.departureTime;
    const createdAt = detail?.createdAt || base?.createdAt || fallbackBooking?.createdAt;
    const bookingIdDisplay = detail?.id || bookingId || '—';

    return (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Modal Container */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col animate-in zoom-in-95 overflow-hidden">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                >
                    <X size={20} />
                </button>

                {/* Scrollable content */}
                <div className="overflow-y-auto flex-1">
                    {loading ? (
                        <DetailSkeleton />
                    ) : error ? (
                        <div className="p-10 text-center">
                            <div className="text-4xl mb-3">⚠️</div>
                            <p className="text-red-600 font-semibold">{error}</p>
                            <button onClick={onClose} className="mt-4 px-4 py-2 text-sm font-semibold bg-gray-100 rounded-xl hover:bg-gray-200 transition">
                                Đóng
                            </button>
                        </div>
                    ) : detail ? (
                        <div className="p-6 space-y-6">
                            {/* ── HEADER ── */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <div className="flex items-center gap-2">
                                        <Plane size={20} className="text-indigo-600" />
                                        <span className="text-xl font-bold font-mono text-indigo-700">{pnrCode}</span>
                                    </div>
                                    <StatusBadge status={status} />
                                    {flightNumber && (
                                        <span className="text-sm font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg">
                                            ✈ {flightNumber}
                                        </span>
                                    )}
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-gray-400 font-medium">Tổng tiền</div>
                                    <div className="text-xl font-bold text-indigo-600">{fmtVND(totalAmount)}</div>
                                </div>
                            </div>

                            {/* ── THÔNG TIN LIÊN HỆ ── */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <User size={16} className="text-indigo-500" /> Thông tin liên hệ
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                                        <div className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Họ tên</div>
                                        <div className="text-sm font-semibold text-gray-800">{contactFullName}</div>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                                        <div className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1 flex items-center gap-1"><Phone size={11} /> SĐT</div>
                                        <div className="text-sm font-semibold text-gray-800">{contactPhone}</div>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                                        <div className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1 flex items-center gap-1"><AtSign size={11} /> Email</div>
                                        <div className="text-sm font-semibold text-gray-800 break-all">{contactEmail}</div>
                                    </div>
                                </div>
                            </div>

                            {/* ── HÀNH KHÁCH ── */}
                            {passengers.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <User size={16} className="text-indigo-500" /> Hành khách ({passengers.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {passengers.map((p: any, idx: number) => {
                                            const passengerName = p.fullName || [p.firstName, p.lastName].filter(Boolean).join(' ') || '—';
                                            // Lấy seat từ tickets nếu có
                                            const seatNumber = p.seatNumber || p.tickets?.[0]?.seatNumber;
                                            return (
                                                <div key={p.id || idx} className="flex flex-col sm:flex-row sm:items-center justify-between bg-gradient-to-r from-indigo-50/50 to-white border border-indigo-100/60 rounded-xl px-4 py-3 gap-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                            {idx + 1}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-gray-800">{passengerName}</div>
                                                            <div className="text-xs text-gray-400 flex items-center gap-2 flex-wrap">
                                                                <span className="bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase">{p.type || p.passengerType || 'ADULT'}</span>
                                                                {p.gender && <span>• {p.gender}</span>}
                                                                {p.nationality && <span>• {p.nationality}</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                                        {p.dateOfBirth && <span>🎂 {fmtDate(p.dateOfBirth)?.split(',')[0]}</span>}
                                                        {seatNumber && <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">💺 {seatNumber}</span>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* ── DỊCH VỤ PHỤ TRỢ ── */}
                            {ancillaries.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Luggage size={16} className="text-amber-500" /> Dịch vụ phụ trợ ({ancillaries.length})
                                    </h3>
                                    <div className="bg-amber-50/50 border border-amber-100 rounded-xl overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-amber-100/40 text-xs text-amber-700 uppercase tracking-wider font-bold">
                                                <tr>
                                                    <th className="px-4 py-2.5 text-left">Dịch vụ</th>
                                                    <th className="px-4 py-2.5 text-left">Loại</th>
                                                    <th className="px-4 py-2.5 text-left">Hành khách</th>
                                                    <th className="px-4 py-2.5 text-right">Đơn giá</th>
                                                    <th className="px-4 py-2.5 text-center">SL</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-amber-100/60">
                                                {ancillaries.map((a: any, idx: number) => (
                                                    <tr key={a.id || idx} className="hover:bg-amber-50/80 transition-colors">
                                                        <td className="px-4 py-2.5 font-semibold text-gray-800">{a.name || a.ancillaryName || a.code || a.type || '—'}</td>
                                                        <td className="px-4 py-2.5 text-gray-500">{a.type || a.code || a.ancillaryCode || '—'}</td>
                                                        <td className="px-4 py-2.5 text-gray-500">{a.passengerName || '—'}</td>
                                                        <td className="px-4 py-2.5 text-right font-bold text-amber-700">{fmtVND(a.price ?? a.amount)}</td>
                                                        <td className="px-4 py-2.5 text-center text-gray-600">{a.quantity ?? 1}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* ── LỊCH SỬ GIAO DỊCH ── */}
                            {transactions.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <CreditCard size={16} className="text-emerald-500" /> Lịch sử giao dịch ({transactions.length})
                                    </h3>
                                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider font-bold border-b border-gray-100">
                                                <tr>
                                                    <th className="px-4 py-2.5 text-left">Mã GD</th>
                                                    <th className="px-4 py-2.5 text-left">Phương thức</th>
                                                    <th className="px-4 py-2.5 text-right">Số tiền</th>
                                                    <th className="px-4 py-2.5 text-center">Trạng thái</th>
                                                    <th className="px-4 py-2.5 text-left">Thời gian</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {transactions.map((t: any, idx: number) => {
                                                    const txStatusStyle: Record<string, string> = {
                                                        SUCCESS: 'bg-green-100 text-green-700',
                                                        FAILED: 'bg-red-100 text-red-700',
                                                        PENDING: 'bg-yellow-100 text-yellow-700',
                                                    };
                                                    return (
                                                        <tr key={t.id || t.transactionNo || idx} className="hover:bg-gray-50/60 transition-colors">
                                                            <td className="px-4 py-2.5 font-mono text-xs font-bold text-gray-700">{t.transactionNo || t.transactionCode || '—'}</td>
                                                            <td className="px-4 py-2.5 text-gray-600">{t.paymentMethod || '—'}</td>
                                                            <td className="px-4 py-2.5 text-right font-bold text-indigo-600">{fmtVND(t.amount)}</td>
                                                            <td className="px-4 py-2.5 text-center">
                                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${txStatusStyle[t.status || ''] || 'bg-gray-100 text-gray-500'}`}>
                                                                    {t.status || '—'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-2.5 text-xs text-gray-500">{fmtDate(t.createdAt)}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* ── THÔNG TIN BỔ SUNG ── */}
                            <div className="border-t border-gray-100 pt-4">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                        <div className="text-gray-400 font-bold uppercase tracking-wider mb-0.5">Hành trình</div>
                                        <div className="font-bold text-gray-800">{originDisplay} → {destDisplay}</div>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                        <div className="text-gray-400 font-bold uppercase tracking-wider mb-0.5">Khởi hành</div>
                                        <div className="font-bold text-gray-800">{fmtDate(departureTime)}</div>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                        <div className="text-gray-400 font-bold uppercase tracking-wider mb-0.5">Ngày đặt</div>
                                        <div className="font-bold text-gray-800">{fmtDate(createdAt)}</div>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                        <div className="text-gray-400 font-bold uppercase tracking-wider mb-0.5">Mã booking</div>
                                        <div className="font-bold text-gray-800 font-mono text-[11px] break-all">{bookingIdDisplay}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BookingsPage() {
    // Data state
    const [bookings, setBookings] = useState<IBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState<string | null>(null);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    // Phân trang — API Booking dùng 1-based page
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);
    const pageSize = 10;

    // Filter params — gửi trực tiếp lên server
    const [filterParams, setFilterParams] = useState({
        keyword: '',
        status: '',
        fromDate: '',
        toDate: '',
    });

    // Action state
    const [loadingAction, setLoadingAction] = useState<string | null>(null);

    // Modal state: Detail
    const [detailBookingId, setDetailBookingId] = useState<string | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    // Modal state: Cancel
    const [cancelTarget, setCancelTarget] = useState<IBooking | null>(null);
    const [isCancelOpen, setIsCancelOpen] = useState(false);
    const [isCancelProcessing, setIsCancelProcessing] = useState(false);

    // Debounce search
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Toast auto-hide
    useEffect(() => {
        if (!toast) return;
        const id = setTimeout(() => setToast(null), 4000);
        return () => clearTimeout(id);
    }, [toast]);

    // ─── GỌI API ───────────────────────────────────────────────────────────────
    const loadData = useCallback(async () => {
        setLoading(true);
        setApiError(null);
        try {
            const params: IBookingSearchRequest = {
                page: currentPage,
                size: pageSize,
            };

            const kw = filterParams.keyword?.trim() || "";
            if (kw) {
                if (kw.includes('@')) {
                    params.contactEmail = kw;
                    params.pnrCode = undefined;
                    params.contactPhone = undefined;
                } else if (/^[\d\s\+]+$/.test(kw)) {
                    params.contactPhone = kw;
                    params.pnrCode = undefined;
                    params.contactEmail = undefined;
                } else {
                    params.pnrCode = kw;
                    params.contactEmail = undefined;
                    params.contactPhone = undefined;
                }
            } else {
                params.pnrCode = undefined;
                params.contactEmail = undefined;
                params.contactPhone = undefined;
            }

            if (filterParams.status) {
                params.status = filterParams.status;
            }
            if (filterParams.fromDate) {
                params.fromDate = `${filterParams.fromDate}T00:00:00`;
            }
            if (filterParams.toDate) {
                params.toDate = `${filterParams.toDate}T23:59:59`;
            }

            const res: any = await getBookings(params);
            const responseData = res?.result || res?.data || res;

            const rawList = responseData?.data || responseData?.content || [];
            const mappedBookings: IBooking[] = (Array.isArray(rawList) ? rawList : []).map((b: any) => ({
                id: b.id || '',
                pnrCode: b.pnrCode || '—',
                contactName: b.contactName || '—',
                contactPhone: b.contactPhone,
                contactEmail: b.contactEmail,
                flightNumber: b.flightNumber || (typeof b.flight === 'object' ? b.flight?.flightNumber : '') || '—',
                origin: b.origin || (typeof b.flight === 'object' ? b.flight?.origin : null),
                destination: b.destination || (typeof b.flight === 'object' ? b.flight?.destination : null),
                departureTime: b.departureTime || (typeof b.flight === 'object' ? b.flight?.departureTime : ''),
                status: b.status || 'PENDING',
                totalAmount: b.totalAmount || 0,
                createdAt: b.createdAt || '',
            }));

            setBookings(mappedBookings);
            setTotalPages(responseData?.totalPages || 1);
            setTotalElements(responseData?.totalElements || mappedBookings.length);
        } catch (error: any) {
            console.error("Lỗi lấy dữ liệu đặt vé:", error);
            setApiError(error?.response?.data?.message || "Không thể kết nối đến máy chủ.");
            setBookings([]);
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, filterParams]);

    useEffect(() => { loadData(); }, [loadData]);

    // ─── HANDLERS ──────────────────────────────────────────────────────────────
    const handleSearchChange = (val: string) => {
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            setFilterParams(prev => ({ ...prev, keyword: val }));
            setCurrentPage(1);
        }, 500);
    };

    const handleFilterChange = (field: string, value: string) => {
        setFilterParams(prev => ({ ...prev, [field]: value }));
        setCurrentPage(1);
    };

    // Track selected booking for fallback data in detail modal
    const [selectedBooking, setSelectedBooking] = useState<IBooking | null>(null);

    // Xem chi tiết
    const handleViewDetail = (id: string) => {
        const booking = bookings.find(b => b.id === id) || null;
        setSelectedBooking(booking);
        setDetailBookingId(id);
        setIsDetailOpen(true);
    };

    // Kiểm tra thanh toán
    const handleVerifyPayment = async (pnrCode: string) => {
        const booking = bookings.find(b => b.pnrCode === pnrCode);
        if (!booking) return;
        const actionKey = `verify-${booking.id}`;
        setLoadingAction(actionKey);
        try {
            await verifyPayment(pnrCode);
            setToast({ msg: `✅ Kiểm tra thanh toán PNR ${pnrCode} thành công!`, type: 'success' });
            loadData(); // Reload list
        } catch (err: any) {
            const errMsg = err?.response?.data?.message || 'Lỗi kiểm tra thanh toán.';
            setToast({ msg: `❌ ${errMsg}`, type: 'error' });
        } finally {
            setLoadingAction(null);
        }
    };

    // Gửi lại email
    const handleResendEmail = async (id: string) => {
        const actionKey = `email-${id}`;
        setLoadingAction(actionKey);
        try {
            await resendBookingEmail(id);
            setToast({ msg: '✅ Đã gửi lại email xác nhận thành công!', type: 'success' });
        } catch (err: any) {
            const errMsg = err?.response?.data?.message || 'Lỗi gửi email.';
            setToast({ msg: `❌ ${errMsg}`, type: 'error' });
        } finally {
            setLoadingAction(null);
        }
    };

    // Huỷ vé — mở modal xác nhận
    const handleOpenCancelModal = (booking: IBooking) => {
        setCancelTarget(booking);
        setIsCancelOpen(true);
    };

    const handleConfirmCancel = async () => {
        if (!cancelTarget) return;
        setIsCancelProcessing(true);
        try {
            await cancelBooking(cancelTarget.id);
            setToast({ msg: `✅ Đã huỷ vé ${cancelTarget.pnrCode} thành công!`, type: 'success' });
            setIsCancelOpen(false);
            setCancelTarget(null);
            loadData(); // Reload list
        } catch (err: any) {
            const errMsg = err?.response?.data?.message || 'Lỗi huỷ vé.';
            setToast({ msg: `❌ ${errMsg}`, type: 'error' });
        } finally {
            setIsCancelProcessing(false);
        }
    };

    // ─── RENDER ─────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-5 pb-10">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-5 right-5 z-[100] px-4 py-3 rounded-xl shadow-lg border font-medium animate-in slide-in-from-right-2 max-w-sm ${toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                    {toast.msg}
                </div>
            )}

            {/* Cancel Confirm Modal */}
            <CancelConfirmModal
                booking={cancelTarget}
                isOpen={isCancelOpen}
                isProcessing={isCancelProcessing}
                onConfirm={handleConfirmCancel}
                onClose={() => { setIsCancelOpen(false); setCancelTarget(null); }}
            />

            {/* Booking Detail Modal */}
            <BookingDetailModal
                bookingId={detailBookingId}
                isOpen={isDetailOpen}
                onClose={() => { setIsDetailOpen(false); setDetailBookingId(null); setSelectedBooking(null); }}
                fallbackBooking={selectedBooking}
            />

            {/* Header */}
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">🎟️ Quản lý đặt vé</h1>
                    <p className="mt-0.5 text-sm text-gray-500">Quản lý toàn bộ đơn đặt vé trong hệ thống</p>
                </div>
                <button onClick={loadData} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-100 transition flex items-center gap-2">
                    🔄 Làm mới
                </button>
            </div>

            {/* Bộ lọc */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between">
                {/* Search */}
                <div className="flex-1 max-w-md relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none">🔍</span>
                    <input
                        type="text"
                        placeholder="Tìm theo mã PNR, SĐT hoặc email..."
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm text-gray-700 font-medium"
                    />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    <select
                        value={filterParams.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="py-2.5 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                        {FILTER_STATUS_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>

                    <input
                        type="date"
                        value={filterParams.fromDate}
                        onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                        className="py-2.5 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        title="Từ ngày"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                        type="date"
                        value={filterParams.toDate}
                        onChange={(e) => handleFilterChange('toDate', e.target.value)}
                        className="py-2.5 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        title="Đến ngày"
                    />
                </div>
            </div>

            {/* Error */}
            {apiError && (
                <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                    <span>⚠️</span>
                    <span>{apiError}</span>
                </div>
            )}

            {/* Bảng */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-2 text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 font-semibold text-sm shadow-sm">
                        🎟️ Tổng số: {totalElements} đơn đặt vé
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50/80 text-xs uppercase text-gray-500 tracking-wider font-bold border-b border-gray-100">
                            <tr>
                                <th className="px-5 py-4">Mã PNR</th>
                                <th className="px-5 py-4">Hành khách</th>
                                <th className="px-5 py-4">Chuyến bay</th>
                                <th className="px-5 py-4">Hành trình</th>
                                <th className="px-5 py-4">Ngày đặt</th>
                                <th className="px-5 py-4">Khởi hành</th>
                                <th className="px-5 py-4 text-right">Tổng tiền</th>
                                <th className="px-5 py-4 text-center">Trạng thái</th>
                                <th className="px-5 py-4 text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-gray-700">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                            ) : bookings.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-5 py-16 text-center">
                                        <div className="inline-flex flex-col items-center justify-center text-gray-400">
                                            <span className="text-4xl mb-3">📭</span>
                                            <p className="text-base font-medium">Không tìm thấy đơn đặt vé nào</p>
                                            <p className="text-xs mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                bookings.map((b) => (
                                    <tr key={b.id} className="hover:bg-indigo-50/30 transition-colors group">
                                        <td className="px-5 py-4 font-mono font-bold text-indigo-700">{b.pnrCode}</td>
                                        <td className="px-5 py-4">
                                            <div className="font-semibold text-gray-800">{b.contactName}</div>
                                            {b.contactPhone && <div className="text-xs text-gray-400">{b.contactPhone}</div>}
                                        </td>
                                        <td className="px-5 py-4 font-medium text-gray-700">{b.flightNumber}</td>
                                        <td className="px-5 py-4 font-bold text-gray-800">
                                            {resolveStr(b.origin)} <span className="text-gray-400 font-normal mx-1">→</span> {resolveStr(b.destination)}
                                        </td>
                                        <td className="px-5 py-4 text-gray-500 text-xs font-medium">{fmtDate(b.createdAt)}</td>
                                        <td className="px-5 py-4 text-gray-500 text-xs font-medium">{fmtDate(b.departureTime)}</td>
                                        <td className="px-5 py-4 text-right text-indigo-600 font-bold">{fmtVND(b.totalAmount)}</td>
                                        <td className="px-5 py-4 text-center">
                                            <StatusBadge status={b.status} />
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <ActionCell
                                                booking={b}
                                                onViewDetail={handleViewDetail}
                                                onVerifyPayment={handleVerifyPayment}
                                                onResendEmail={handleResendEmail}
                                                onCancelBooking={handleOpenCancelModal}
                                                loadingAction={loadingAction}
                                            />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ─── PHÂN TRANG (PAGINATION) ────────────────────────────────────── */}
                {!loading && totalPages > 1 && (
                    <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-b-2xl">
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                            Hiển thị trang <span className="font-bold text-gray-700">{currentPage}</span> / {totalPages} (Tổng: <span className="font-bold text-gray-700">{totalElements}</span> đơn)
                        </span>

                        <div className="flex flex-wrap items-center justify-end gap-4 w-full">
                            <button onClick={loadData} className="text-indigo-600 hover:text-indigo-800 transition text-xs font-bold flex items-center gap-1 hidden sm:flex">
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

                                {(() => {
                                    const pages = [];
                                    const maxVisible = 5;

                                    if (totalPages <= maxVisible + 2) {
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
                                        pages.push(
                                            <button key={1} onClick={() => setCurrentPage(1)} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition shadow-sm min-w-[32px] ${currentPage === 1 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>1</button>
                                        );
                                        if (currentPage > 3) pages.push(<span key="dots-1" className="px-2 py-1.5 text-gray-400 font-bold">...</span>);

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

                                        if (currentPage < totalPages - 2) pages.push(<span key="dots-2" className="px-2 py-1.5 text-gray-400 font-bold">...</span>);
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
                                            e.currentTarget.value = '';
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
        </div>
    );
}