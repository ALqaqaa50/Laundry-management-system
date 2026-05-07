'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { SlidersHorizontal, X, ChevronDown, AlertCircle } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SearchBar from '@/components/SearchBar';
import PartCard from '@/components/PartCard';
import { parts, ALL_BRANDS } from '@/data/parts';
import { Category, DeviceType, CATEGORY_LABELS, DEVICE_LABELS } from '@/types';
import { searchParts, SearchFilters } from '@/lib/search';
import Link from 'next/link';

const categories = Object.keys(CATEGORY_LABELS) as Category[];
const deviceTypes = Object.keys(DEVICE_LABELS) as DeviceType[];

function PartsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [category, setCategory] = useState<Category | ''>(
    (searchParams.get('category') as Category) ?? ''
  );
  const [deviceType, setDeviceType] = useState<DeviceType | ''>(
    (searchParams.get('device') as DeviceType) ?? ''
  );
  const [brand, setBrand] = useState(searchParams.get('brand') ?? '');
  const [symptom, setSymptom] = useState(searchParams.get('symptom') ?? '');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filters: SearchFilters = useMemo(
    () => ({ query, category, deviceType, brand, symptom }),
    [query, category, deviceType, brand, symptom]
  );

  const results = useMemo(() => searchParts(parts, filters), [filters]);

  const activeFiltersCount = [category, deviceType, brand, symptom].filter(Boolean).length;

  const clearAll = () => {
    setQuery('');
    setCategory('');
    setDeviceType('');
    setBrand('');
    setSymptom('');
  };

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">كتالوج القطع</h1>
          <p className="text-slate-500 text-sm mt-1">
            {parts.length} قطعة موثقة · ابحث أو صفّح حسب التصنيف
          </p>
        </div>

        {/* Symptom banner */}
        {symptom && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-amber-800">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>
                نتائج البحث عن العطل: <strong>{symptom}</strong>
              </span>
            </div>
            <button
              onClick={() => setSymptom('')}
              className="text-amber-600 hover:text-amber-800 p-1 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── Sidebar filters (desktop) ─────────────────── */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="bg-white rounded-xl border border-slate-200 p-4 sticky top-20 space-y-5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 text-sm">الفلاتر</span>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-xs text-accent-600 hover:text-accent-700 font-medium"
                  >
                    مسح الكل ({activeFiltersCount})
                  </button>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">التصنيف</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category | '')}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-600"
                >
                  <option value="">جميع التصنيفات</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Device type */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">نوع الجهاز</label>
                <select
                  value={deviceType}
                  onChange={(e) => setDeviceType(e.target.value as DeviceType | '')}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-600"
                >
                  <option value="">جميع الأجهزة</option>
                  {deviceTypes.map((d) => (
                    <option key={d} value={d}>
                      {DEVICE_LABELS[d]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Brand */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">البراند</label>
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-600"
                >
                  <option value="">جميع البراندات</option>
                  {ALL_BRANDS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </aside>

          {/* ── Main content ──────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* Search + mobile filter toggle */}
            <div className="flex gap-2 mb-4">
              <div className="flex-1">
                <SearchBar value={query} onChange={setQuery} />
              </div>
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="lg:hidden flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 shadow-sm"
              >
                <SlidersHorizontal className="w-4 h-4" />
                فلتر
                {activeFiltersCount > 0 && (
                  <span className="bg-accent-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>

            {/* Mobile filters */}
            {filtersOpen && (
              <div className="lg:hidden bg-white border border-slate-200 rounded-xl p-4 mb-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">الفلاتر</span>
                  <div className="flex gap-3">
                    {activeFiltersCount > 0 && (
                      <button onClick={clearAll} className="text-xs text-accent-600 font-medium">
                        مسح الكل
                      </button>
                    )}
                    <button onClick={() => setFiltersOpen(false)}>
                      <X className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                </div>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category | '')}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                >
                  <option value="">جميع التصنيفات</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                  ))}
                </select>
                <select
                  value={deviceType}
                  onChange={(e) => setDeviceType(e.target.value as DeviceType | '')}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                >
                  <option value="">جميع الأجهزة</option>
                  {deviceTypes.map((d) => (
                    <option key={d} value={d}>{DEVICE_LABELS[d]}</option>
                  ))}
                </select>
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                >
                  <option value="">جميع البراندات</option>
                  {ALL_BRANDS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Active filter chips */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {category && (
                  <span className="inline-flex items-center gap-1 bg-brand-50 border border-brand-200 text-brand-700 text-xs px-3 py-1 rounded-full">
                    {CATEGORY_LABELS[category]}
                    <button onClick={() => setCategory('')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {deviceType && (
                  <span className="inline-flex items-center gap-1 bg-brand-50 border border-brand-200 text-brand-700 text-xs px-3 py-1 rounded-full">
                    {DEVICE_LABELS[deviceType]}
                    <button onClick={() => setDeviceType('')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {brand && (
                  <span className="inline-flex items-center gap-1 bg-brand-50 border border-brand-200 text-brand-700 text-xs px-3 py-1 rounded-full">
                    {brand}
                    <button onClick={() => setBrand('')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {symptom && (
                  <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 text-xs px-3 py-1 rounded-full max-w-xs truncate">
                    عطل: {symptom}
                    <button onClick={() => setSymptom('')}><X className="w-3 h-3" /></button>
                  </span>
                )}
              </div>
            )}

            {/* Results count */}
            <p className="text-sm text-slate-500 mb-4">
              {results.length === 0
                ? 'لم يتم العثور على نتائج'
                : `${results.length} نتيجة`}
            </p>

            {/* Grid */}
            {results.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {results.map((part) => (
                  <PartCard key={part.id} part={part} highlight={query} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">لم نجد ما تبحث عنه</h3>
                <p className="text-slate-500 text-sm mb-6">
                  جرّب كلمات بحث مختلفة أو أوضح طلبك عبر نموذج طلب القطعة المجهولة
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={clearAll}
                    className="border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm hover:bg-slate-50"
                  >
                    مسح الفلاتر
                  </button>
                  <Link
                    href="/unknown"
                    className="bg-accent-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-accent-600"
                  >
                    لا أعرف اسم القطعة
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function PartsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">جاري التحميل...</div>}>
      <PartsContent />
    </Suspense>
  );
}
