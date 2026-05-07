'use client';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight, CheckCircle, Clock, HelpCircle, AlertTriangle,
  Wrench, Phone, ChevronLeft, Info
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PartCard from '@/components/PartCard';
import { parts } from '@/data/parts';
import { CATEGORY_LABELS, DEVICE_LABELS, AVAILABILITY_LABELS } from '@/types';
import { getRelatedParts } from '@/lib/search';

const CATEGORY_ICONS: Record<string, string> = {
  valves: '🔧', heating: '🔥', electrical: '⚡', mechanical: '⚙️',
  pumps: '💧', sensors: '📡', 'door-safety': '🚪', filters: '🔍',
  'belts-pulleys': '🔩', 'steam-system': '♨️', 'boiler-parts': '🏭', 'dry-cleaning': '🧴',
};

export default function PartDetailPage({ params }: { params: { id: string } }) {
  const part = parts.find((p) => p.id === params.id);
  if (!part) notFound();

  const related = getRelatedParts(parts, part, 4);

  const oemBadge = {
    OEM: { label: 'قطعة أصلية', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    Alternative: { label: 'قطعة بديلة', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    Both: { label: 'أصلية وبديلة', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  }[part.oemType];

  const confidenceBadge = {
    High:   { label: 'موثوقية عالية',    color: 'text-green-600' },
    Medium: { label: 'موثوقية متوسطة',   color: 'text-amber-600' },
    Low:    { label: 'موثوقية منخفضة',   color: 'text-red-500' },
  }[part.confidenceLevel];

  const availBadge = {
    'in-stock':   { icon: CheckCircle, label: AVAILABILITY_LABELS['in-stock'],   color: 'text-green-600 bg-green-50 border-green-200' },
    'on-request': { icon: Clock,       label: AVAILABILITY_LABELS['on-request'], color: 'text-amber-600 bg-amber-50 border-amber-200' },
    unknown:      { icon: HelpCircle,  label: AVAILABILITY_LABELS['unknown'],    color: 'text-slate-500 bg-slate-50 border-slate-200' },
  }[part.availability];
  const AvailIcon = availBadge.icon;

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-slate-500 mb-6 flex-wrap">
          <Link href="/" className="hover:text-brand-700">الرئيسية</Link>
          <ChevronLeft className="w-3.5 h-3.5" />
          <Link href="/parts" className="hover:text-brand-700">الكتالوج</Link>
          <ChevronLeft className="w-3.5 h-3.5" />
          <Link href={`/parts?category=${part.category}`} className="hover:text-brand-700">
            {CATEGORY_LABELS[part.category]}
          </Link>
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="text-slate-700 font-medium">{part.nameAR}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Main info ─────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="text-4xl">{CATEGORY_ICONS[part.category] ?? '🔧'}</div>
                <div>
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                    {CATEGORY_LABELS[part.category]}
                  </span>
                  <h1 className="text-2xl font-extrabold text-slate-900 mt-2">{part.nameAR}</h1>
                  <p className="text-base text-slate-500 font-medium">{part.nameEN}</p>
                  {part.commonLocalName && (
                    <p className="text-sm text-slate-400 mt-1 italic">
                      يُعرف أيضاً: {part.commonLocalName}
                    </p>
                  )}
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <span className={`text-xs font-medium px-3 py-1 rounded-full border flex items-center gap-1 ${availBadge.color}`}>
                  <AvailIcon className="w-3.5 h-3.5" />
                  {availBadge.label}
                </span>
                <span className={`text-xs font-medium px-3 py-1 rounded-full border ${oemBadge.color}`}>
                  {oemBadge.label}
                </span>
                {part.partNumber && (
                  <span className="text-xs font-medium px-3 py-1 rounded-full border bg-slate-50 text-slate-600 border-slate-200">
                    رقم القطعة: {part.partNumber}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Info className="w-4 h-4 text-brand-600" />
                الوصف
              </h2>
              <p className="text-slate-700 leading-relaxed mb-4">{part.descriptionAR}</p>
              <p className="text-slate-500 text-sm leading-relaxed border-t border-slate-100 pt-4">
                {part.descriptionEN}
              </p>
            </div>

            {/* Symptoms */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                الأعطال المرتبطة بهذه القطعة
              </h2>
              <ul className="space-y-2">
                {part.symptoms.map((s, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">
                      {i + 1}
                    </div>
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            {/* Compatible devices & brands */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-brand-600" />
                التوافق
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">أنواع الأجهزة</p>
                  <div className="flex flex-wrap gap-2">
                    {part.deviceType.map((d) => (
                      <Link
                        key={d}
                        href={`/parts?device=${d}`}
                        className="text-sm bg-brand-50 text-brand-700 border border-brand-200 px-3 py-1 rounded-full hover:bg-brand-100 transition-colors"
                      >
                        {DEVICE_LABELS[d]}
                      </Link>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">البراندات المتوافقة</p>
                  <div className="flex flex-wrap gap-2">
                    {part.compatibleBrands.map((b) => (
                      <Link
                        key={b}
                        href={`/parts?brand=${encodeURIComponent(b)}`}
                        className="text-sm bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded-full hover:bg-slate-200 transition-colors"
                      >
                        {b}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Confidence note */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex items-start gap-3">
              <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-slate-500 leading-relaxed">
                <span className={`font-semibold ${confidenceBadge.color}`}>{confidenceBadge.label}</span>
                {' — '}
                البيانات الواردة في هذا الكتالوج هي للمساعدة في التحديد الأولي. يُنصح دائماً بالتحقق من رقم القطعة والموديل قبل الطلب.
                {part.supplierNotes && (
                  <span className="block mt-2 font-medium text-amber-700">
                    ملاحظة المورد: {part.supplierNotes}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── Sidebar CTA ───────────────────────────────── */}
          <div className="space-y-4">
            {/* Quote CTA */}
            <div className="bg-brand-950 text-white rounded-2xl p-6 space-y-4 sticky top-20">
              <h3 className="font-bold text-lg">طلب عرض سعر</h3>
              <p className="text-brand-200 text-sm leading-relaxed">
                أرسل لنا طلباً منظماً مع تفاصيل الجهاز والقطعة لنتمكن من تقديم عرض دقيق.
              </p>
              <Link
                href={`/quote?partId=${part.id}&part=${encodeURIComponent(part.nameAR)}`}
                className="flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-600 text-white font-bold px-4 py-3 rounded-xl transition-colors w-full"
              >
                <Phone className="w-4 h-4" />
                اطلب عرض سعر الآن
              </Link>
              <div className="text-center text-brand-300 text-xs">أو تواصل معنا مباشرة عبر واتساب</div>
            </div>

            {/* Part number note */}
            {part.partNumber && (
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-xs text-slate-500 mb-1">رقم القطعة</p>
                <p className="font-mono font-bold text-slate-900 text-lg tracking-wider">{part.partNumber}</p>
              </div>
            )}

            {/* Back to catalog */}
            <Link
              href="/parts"
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-brand-700 transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              العودة للكتالوج
            </Link>
          </div>
        </div>

        {/* ── Related Parts ──────────────────────────────── */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-accent-500 rounded-full inline-block" />
              قطع مشابهة
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {related.map((p) => (
                <PartCard key={p.id} part={p} />
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
