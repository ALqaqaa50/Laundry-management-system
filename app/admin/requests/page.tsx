'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Search, RefreshCcw, ChevronDown, LogOut,
  Package, Clock, CheckCircle, Loader2, X, ArrowRight,
  Inbox, Filter,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type QuoteStatus =
  | 'new' | 'reviewing' | 'quoted'
  | 'waiting_customer' | 'ordered' | 'completed' | 'rejected';

interface ImageMeta {
  originalName: string;
  storedName: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
}

interface QuoteRecord {
  requestId: string;
  source: 'quote-form' | 'unknown-part-form';
  status: QuoteStatus;
  customerName: string;
  phone: string;
  city: string | null;
  deviceType: string | null;
  deviceBrand: string | null;
  deviceModel: string | null;
  partNameAR: string | null;
  partNameEN: string | null;
  partNumber: string | null;
  faultDescription: string | null;
  symptoms: string[];
  notes: string | null;
  images: ImageMeta[];
  nameplateImages: ImageMeta[];
  createdAt: string;
  updatedAt?: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const STATUS_META: Record<QuoteStatus, { label: string; dot: string; badge: string }> = {
  new:              { label: 'مستلم جديد',       dot: 'bg-blue-500',   badge: 'bg-blue-100 text-blue-700 border-blue-200' },
  reviewing:        { label: 'قيد المراجعة',      dot: 'bg-purple-500', badge: 'bg-purple-100 text-purple-700 border-purple-200' },
  quoted:           { label: 'تم إرسال السعر',    dot: 'bg-amber-500',  badge: 'bg-amber-100 text-amber-700 border-amber-200' },
  waiting_customer: { label: 'بانتظار العميل',    dot: 'bg-orange-500', badge: 'bg-orange-100 text-orange-700 border-orange-200' },
  ordered:          { label: 'تم الطلب',          dot: 'bg-teal-500',   badge: 'bg-teal-100 text-teal-700 border-teal-200' },
  completed:        { label: 'مكتمل',             dot: 'bg-green-500',  badge: 'bg-green-100 text-green-700 border-green-200' },
  rejected:         { label: 'مرفوض',             dot: 'bg-red-400',    badge: 'bg-red-100 text-red-700 border-red-200' },
};

const ALL_STATUSES = Object.keys(STATUS_META) as QuoteStatus[];

const SOURCE_LABELS: Record<string, string> = {
  'quote-form':         'نموذج السعر',
  'unknown-part-form':  'قطعة مجهولة',
};

const DEVICE_LABELS: Record<string, string> = {
  'washer-extractor': 'غسالة استخراج',
  'tumble-dryer':     'مجفف',
  ironer:             'كالندر / مكواة',
  boiler:             'بويلر',
  'steam-generator':  'مولد بخار',
  'dry-cleaning':     'تنظيف جاف',
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (m < 1) return 'الآن';
  if (m < 60) return `منذ ${m} دقيقة`;
  if (h < 24) return `منذ ${h} ساعة`;
  if (d < 30) return `منذ ${d} يوم`;
  return new Date(iso).toLocaleDateString('ar-SA');
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ar-SA', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[ً-ٟ]/g, '').trim();
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: QuoteStatus }) {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${m.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

function StatusSelect({
  requestId,
  current,
  onUpdate,
}: {
  requestId: string;
  current: QuoteStatus;
  onUpdate: (id: string, next: QuoteStatus) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as QuoteStatus;
    if (next === current) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/quote/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? 'خطأ في التحديث');
        return;
      }
      onUpdate(requestId, next);
    } catch {
      setError('تعذّر الاتصال');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="relative">
        <select
          value={current}
          onChange={handleChange}
          disabled={loading}
          className="text-xs border border-slate-200 rounded-lg pr-2 pl-6 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-600 disabled:opacity-50 cursor-pointer appearance-none min-w-[130px]"
        >
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_META[s].label}</option>
          ))}
        </select>
        <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">
          {loading
            ? <Loader2 className="w-3 h-3 text-slate-400 animate-spin" />
            : <ChevronDown className="w-3 h-3 text-slate-400" />}
        </div>
      </div>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}

function StatCard({
  label, value, icon: Icon, color,
}: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminRequestsPage() {
  const [records, setRecords] = useState<QuoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Filters
  const [query, setQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<QuoteStatus | ''>('');
  const [filterSource, setFilterSource] = useState<string>('');
  const [filterCity, setFilterCity] = useState('');
  const [filterDevice, setFilterDevice] = useState('');

  // Load records
  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const res = await fetch('/api/quote');
      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'خطأ');
      // Sort newest first
      setRecords(
        [...data.records].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
      setLastRefresh(new Date());
    } catch (e: unknown) {
      setFetchError(e instanceof Error ? e.message : 'تعذّر تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  // Status updated optimistically
  const handleStatusUpdate = useCallback((id: string, next: QuoteStatus) => {
    setRecords((prev) =>
      prev.map((r) =>
        r.requestId === id ? { ...r, status: next, updatedAt: new Date().toISOString() } : r
      )
    );
  }, []);

  // All cities / devices from data (dynamic)
  const allCities = useMemo(() =>
    Array.from(new Set(records.map((r) => r.city).filter(Boolean) as string[])).sort(),
    [records]
  );
  const allDevices = useMemo(() =>
    Array.from(new Set(records.map((r) => r.deviceType).filter(Boolean) as string[])).sort(),
    [records]
  );

  // Filter + search
  const filtered = useMemo(() => {
    const q = normalize(query);
    return records.filter((r) => {
      if (filterStatus && r.status !== filterStatus) return false;
      if (filterSource && r.source !== filterSource) return false;
      if (filterCity && r.city !== filterCity) return false;
      if (filterDevice && r.deviceType !== filterDevice) return false;
      if (!q) return true;
      const haystack = normalize([
        r.requestId, r.customerName, r.phone,
        r.city ?? '', r.partNameAR ?? '', r.partNameEN ?? '',
        r.partNumber ?? '', r.faultDescription ?? '',
        ...r.symptoms,
      ].join(' '));
      return haystack.includes(q);
    });
  }, [records, query, filterStatus, filterSource, filterCity, filterDevice]);

  // Stats
  const stats = useMemo(() => ({
    total:      records.length,
    new:        records.filter((r) => r.status === 'new').length,
    inProgress: records.filter((r) => ['reviewing', 'quoted', 'waiting_customer', 'ordered'].includes(r.status)).length,
    completed:  records.filter((r) => r.status === 'completed').length,
    rejected:   records.filter((r) => r.status === 'rejected').length,
  }), [records]);

  const activeFilters = [filterStatus, filterSource, filterCity, filterDevice].filter(Boolean).length;
  const clearFilters = () => {
    setQuery(''); setFilterStatus(''); setFilterSource('');
    setFilterCity(''); setFilterDevice('');
  };

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {/* ── Header ────────────────────────────────────────────── */}
      <header className="bg-brand-950 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-brand-300 hover:text-white transition-colors text-sm flex items-center gap-1">
            <ArrowRight className="w-4 h-4" />
            الموقع
          </Link>
          <span className="text-brand-600">›</span>
          <h1 className="font-bold">لوحة إدارة الطلبات</h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={fetchRecords}
            disabled={loading}
            className="flex items-center gap-1.5 text-brand-300 hover:text-white text-xs transition-colors disabled:opacity-50"
            title="تحديث"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">
              آخر تحديث: {lastRefresh.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </button>
          <button
            onClick={async () => {
              await fetch('/api/admin/logout', { method: 'POST' });
              window.location.href = '/admin/login';
            }}
            className="flex items-center gap-1.5 text-brand-300 hover:text-white text-xs transition-colors"
            title="خروج"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">خروج</span>
          </button>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        {/* ── Stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="إجمالي الطلبات" value={stats.total}      icon={Inbox}        color="bg-slate-600" />
          <StatCard label="جديد"           value={stats.new}         icon={Package}      color="bg-blue-600" />
          <StatCard label="قيد التنفيذ"   value={stats.inProgress}  icon={Clock}        color="bg-amber-500" />
          <StatCard label="مكتمل"          value={stats.completed}   icon={CheckCircle}  color="bg-green-600" />
        </div>

        {/* ── Search + Filters ───────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث برقم الطلب، الاسم، الهاتف، اسم القطعة، العطل..."
              className="w-full h-10 pr-9 pl-9 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 bg-slate-50"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute left-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              </button>
            )}
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap gap-2 items-center">
            <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as QuoteStatus | '')}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-600"
            >
              <option value="">كل الحالات</option>
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_META[s].label}</option>
              ))}
            </select>

            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-600"
            >
              <option value="">كل المصادر</option>
              <option value="quote-form">نموذج السعر</option>
              <option value="unknown-part-form">قطعة مجهولة</option>
            </select>

            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-600"
            >
              <option value="">كل المدن</option>
              {allCities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              value={filterDevice}
              onChange={(e) => setFilterDevice(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-600"
            >
              <option value="">كل الأجهزة</option>
              {allDevices.map((d) => (
                <option key={d} value={d}>{DEVICE_LABELS[d] ?? d}</option>
              ))}
            </select>

            {activeFilters > 0 && (
              <button
                onClick={clearFilters}
                className="text-xs text-accent-600 hover:text-accent-700 font-medium flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                مسح الفلاتر ({activeFilters})
              </button>
            )}
          </div>
        </div>

        {/* ── Results count ─────────────────────────────────────── */}
        {!loading && !fetchError && (
          <p className="text-sm text-slate-500">
            {filtered.length === 0
              ? 'لا توجد نتائج مطابقة'
              : `${filtered.length} طلب${filtered.length !== records.length ? ` من ${records.length}` : ''}`}
          </p>
        )}

        {/* ── Loading ───────────────────────────────────────────── */}
        {loading && (
          <div className="bg-white rounded-xl border border-slate-200 p-16 flex flex-col items-center gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
            <span className="text-sm">جاري تحميل الطلبات...</span>
          </div>
        )}

        {/* ── Fetch error ───────────────────────────────────────── */}
        {fetchError && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-700 font-medium mb-3">{fetchError}</p>
            <button
              onClick={fetchRecords}
              className="text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* ── Empty state ───────────────────────────────────────── */}
        {!loading && !fetchError && records.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
            <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-700 mb-1">لا توجد طلبات بعد</h3>
            <p className="text-sm text-slate-500">ستظهر طلبات عروض السعر هنا بعد إرسالها</p>
          </div>
        )}

        {/* ── Table ─────────────────────────────────────────────── */}
        {!loading && !fetchError && filtered.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: '900px' }}>
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-right">
                    <th className="px-4 py-3 font-semibold text-slate-600 text-xs whitespace-nowrap">رقم الطلب</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 text-xs whitespace-nowrap">المصدر</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 text-xs whitespace-nowrap">العميل</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 text-xs whitespace-nowrap">الجهاز</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 text-xs whitespace-nowrap">القطعة</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 text-xs whitespace-nowrap">الأعطال</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 text-xs whitespace-nowrap">الحالة</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 text-xs whitespace-nowrap">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((r) => (
                    <RequestRow key={r.requestId} record={r} onStatusUpdate={handleStatusUpdate} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── No-match (filters applied but no results) ─────────── */}
        {!loading && !fetchError && records.length > 0 && filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
            <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-700 mb-1">لا توجد نتائج</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-brand-700 hover:underline mt-1"
            >
              مسح جميع الفلاتر
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

// ── Row component ──────────────────────────────────────────────────────────────

function RequestRow({
  record,
  onStatusUpdate,
}: {
  record: QuoteRecord;
  onStatusUpdate: (id: string, next: QuoteStatus) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const partName = record.partNameAR || record.partNameEN || '—';
  const deviceLine = [
    record.deviceType ? DEVICE_LABELS[record.deviceType] ?? record.deviceType : null,
    record.deviceBrand,
    record.deviceModel,
  ].filter(Boolean).join(' · ') || '—';

  return (
    <>
      <tr
        className="hover:bg-slate-50 transition-colors cursor-pointer"
        onClick={() => setExpanded((e) => !e)}
      >
        {/* requestId */}
        <td className="px-4 py-3 whitespace-nowrap">
          <span className="font-mono text-xs text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
            {record.requestId}
          </span>
          {(record.images.length > 0 || record.nameplateImages.length > 0) && (
            <span className="mr-1.5 text-xs text-slate-400" title="يوجد صور">
              📎 {record.images.length + record.nameplateImages.length}
            </span>
          )}
        </td>

        {/* source */}
        <td className="px-4 py-3 whitespace-nowrap">
          <span className={`text-xs px-2 py-0.5 rounded-full border ${
            record.source === 'quote-form'
              ? 'bg-slate-100 text-slate-600 border-slate-200'
              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
          }`}>
            {SOURCE_LABELS[record.source] ?? record.source}
          </span>
        </td>

        {/* customer */}
        <td className="px-4 py-3">
          <div className="font-medium text-slate-900 whitespace-nowrap">{record.customerName}</div>
          <div className="text-xs text-slate-500 mt-0.5 flex gap-2 flex-wrap">
            <span dir="ltr">{record.phone}</span>
            {record.city && <span className="text-slate-400">· {record.city}</span>}
          </div>
        </td>

        {/* device */}
        <td className="px-4 py-3">
          <span className="text-slate-700 text-xs">{deviceLine}</span>
        </td>

        {/* part */}
        <td className="px-4 py-3">
          <span className="text-slate-700 text-xs">{partName}</span>
          {record.partNumber && (
            <div className="text-xs text-slate-400 font-mono mt-0.5">{record.partNumber}</div>
          )}
        </td>

        {/* symptoms */}
        <td className="px-4 py-3 max-w-[200px]">
          {record.symptoms.length === 0 && !record.faultDescription && (
            <span className="text-slate-400 text-xs">—</span>
          )}
          {record.symptoms.slice(0, 2).map((s, i) => (
            <div key={i} className="text-xs text-slate-600 truncate">{s}</div>
          ))}
          {record.symptoms.length > 2 && (
            <span className="text-xs text-slate-400">+{record.symptoms.length - 2} أعطال</span>
          )}
          {record.faultDescription && record.symptoms.length === 0 && (
            <div className="text-xs text-slate-600 line-clamp-2">{record.faultDescription}</div>
          )}
        </td>

        {/* status */}
        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <StatusSelect
            requestId={record.requestId}
            current={record.status}
            onUpdate={onStatusUpdate}
          />
        </td>

        {/* date */}
        <td className="px-4 py-3 whitespace-nowrap">
          <div className="text-xs text-slate-600">{relativeTime(record.createdAt)}</div>
          {record.updatedAt && (
            <div className="text-xs text-slate-400 mt-0.5">
              تحديث: {relativeTime(record.updatedAt)}
            </div>
          )}
        </td>
      </tr>

      {/* Expanded detail row */}
      {expanded && (
        <tr className="bg-blue-50/40">
          <td colSpan={8} className="px-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {/* Full fault description */}
              {record.faultDescription && (
                <div className="lg:col-span-2">
                  <p className="font-semibold text-slate-600 mb-1">وصف العطل</p>
                  <p className="text-slate-700 leading-relaxed bg-white rounded-lg border border-slate-200 p-3">
                    {record.faultDescription}
                  </p>
                </div>
              )}

              {/* All symptoms */}
              {record.symptoms.length > 0 && (
                <div>
                  <p className="font-semibold text-slate-600 mb-1">الأعطال المختارة</p>
                  <ul className="space-y-1">
                    {record.symptoms.map((s, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-slate-700">
                        <span className="text-amber-500 mt-0.5">•</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Notes */}
              {record.notes && (
                <div>
                  <p className="font-semibold text-slate-600 mb-1">ملاحظات العميل</p>
                  <p className="text-slate-700 bg-white rounded-lg border border-slate-200 p-3">
                    {record.notes}
                  </p>
                </div>
              )}

              {/* Image thumbnails */}
              {(record.images.length > 0 || record.nameplateImages.length > 0) && (
                <div className="lg:col-span-3">
                  <p className="font-semibold text-slate-600 mb-2">الصور المرفوعة</p>
                  {record.images.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-slate-500 mb-2">
                        صور القطعة ({record.images.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {record.images.map((img, i) => (
                          <a
                            key={i}
                            href={img.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={img.originalName}
                            className="flex-shrink-0"
                          >
                            <img
                              src={img.url}
                              alt={img.originalName}
                              className="w-20 h-20 object-cover rounded-lg border border-slate-200 hover:border-brand-400 transition-colors"
                              loading="lazy"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {record.nameplateImages.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 mb-2">
                        صور لوحة البيانات ({record.nameplateImages.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {record.nameplateImages.map((img, i) => (
                          <a
                            key={i}
                            href={img.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={img.originalName}
                            className="flex-shrink-0"
                          >
                            <img
                              src={img.url}
                              alt={img.originalName}
                              className="w-20 h-20 object-cover rounded-lg border border-slate-200 hover:border-brand-400 transition-colors"
                              loading="lazy"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Metadata */}
              <div className="text-slate-400 space-y-0.5">
                <p>رقم الطلب: <span className="font-mono text-slate-500">{record.requestId}</span></p>
                <p>أُنشئ: {formatDate(record.createdAt)}</p>
                {record.updatedAt && <p>آخر تحديث: {formatDate(record.updatedAt)}</p>}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
