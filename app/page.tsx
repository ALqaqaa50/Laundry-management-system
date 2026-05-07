'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search, ArrowLeft, HelpCircle, Zap, CheckCircle, Users, Package
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CategoryCard from '@/components/CategoryCard';
import { parts, COMMON_SYMPTOMS } from '@/data/parts';
import { Category, CATEGORY_LABELS } from '@/types';

const categories = Object.keys(CATEGORY_LABELS) as Category[];

function getCategoryCounts(): Record<Category, number> {
  const counts: Partial<Record<Category, number>> = {};
  for (const p of parts) {
    counts[p.category] = (counts[p.category] ?? 0) + 1;
  }
  return counts as Record<Category, number>;
}

const STEPS = [
  {
    num: '١',
    title: 'ابحث أو اختر',
    desc: 'ابحث باسم القطعة أو العطل أو اختر من التصنيفات',
    icon: Search,
  },
  {
    num: '٢',
    title: 'راجع التفاصيل',
    desc: 'شاهد الوصف والأعطال المرتبطة والموديلات المتوافقة',
    icon: CheckCircle,
  },
  {
    num: '٣',
    title: 'أرسل طلبك',
    desc: 'أرسل طلب عرض سعر منظم مع صور الماكينة والقطعة',
    icon: ArrowLeft,
  },
];

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const counts = getCategoryCounts();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/parts?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push('/parts');
    }
  };

  const handleSymptomClick = (symptom: string) => {
    router.push(`/parts?symptom=${encodeURIComponent(symptom)}`);
  };

  return (
    <>
      <Header />

      <main>
        {/* ── Hero ───────────────────────────────────────────── */}
        <section className="bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 text-white py-16 sm:py-24 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-accent-500/20 border border-accent-500/40 rounded-full px-4 py-1.5 text-accent-400 text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              متخصصون في قطع غيار المغاسل الصناعية
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight mb-4">
              ابحث عن القطعة الصحيحة
              <br />
              <span className="text-accent-400">بسرعة وثقة</span>
            </h1>
            <p className="text-brand-200 text-lg mb-10 max-w-xl mx-auto">
              كتالوج متخصص لقطع غيار الغسالات والمجففات والبويلرات والكالندرات. ابحث بالاسم، العطل، أو الموديل.
            </p>

            {/* Search form */}
            <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="مثال: صمام التصريف، drain valve، مفتاح الضغط..."
                  className="w-full h-14 pr-12 pl-4 rounded-xl border-0 text-slate-900 placeholder-slate-400 text-base focus:outline-none focus:ring-2 focus:ring-accent-500 shadow-lg"
                />
              </div>
              <button
                type="submit"
                className="bg-accent-500 hover:bg-accent-600 text-white font-bold px-6 h-14 rounded-xl transition-colors shadow-lg whitespace-nowrap"
              >
                بحث
              </button>
            </form>

            {/* Quick links */}
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {['صمام التصريف', 'بيارينق', 'هيتر', 'مضخة', 'لوحة تحكم'].map((q) => (
                <button
                  key={q}
                  onClick={() => router.push(`/parts?q=${encodeURIComponent(q)}`)}
                  className="text-xs bg-brand-800/60 hover:bg-brand-700 text-brand-200 px-3 py-1.5 rounded-full transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── Stats ──────────────────────────────────────────── */}
        <section className="bg-white border-b border-slate-100 py-6 px-4">
          <div className="max-w-4xl mx-auto grid grid-cols-3 gap-4 text-center">
            {[
              { icon: Package, value: `${parts.length}+`, label: 'قطعة موثقة' },
              { icon: Users, value: '15+', label: 'براند متوافق' },
              { icon: CheckCircle, value: '12', label: 'تصنيف متخصص' },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <Icon className="w-5 h-5 text-accent-500" />
                <div className="font-extrabold text-2xl text-brand-900">{value}</div>
                <div className="text-xs text-slate-500">{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Categories ─────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-accent-500 rounded-full inline-block" />
            تصفح حسب التصنيف
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {categories.map((cat) => (
              <CategoryCard key={cat} category={cat} count={counts[cat] ?? 0} />
            ))}
          </div>
        </section>

        {/* ── Symptom Search ─────────────────────────────────── */}
        <section className="bg-slate-100 py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
              <span className="w-1 h-6 bg-accent-500 rounded-full inline-block" />
              ما العطل الذي تواجهه؟
            </h2>
            <p className="text-slate-500 text-sm mb-6">
              اختر العطل مباشرة وسنعرض لك القطع المرتبطة به
            </p>
            <div className="flex flex-wrap gap-2">
              {COMMON_SYMPTOMS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSymptomClick(s)}
                  className="bg-white border border-slate-200 hover:border-brand-500 hover:text-brand-700 hover:bg-brand-50 text-slate-700 text-sm px-4 py-2 rounded-full transition-all shadow-sm"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ───────────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-4 py-12">
          <h2 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
            <span className="w-1 h-6 bg-accent-500 rounded-full inline-block" />
            كيف يعمل المركز؟
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-900 text-white font-extrabold flex items-center justify-center text-lg">
                      {step.num}
                    </div>
                    <Icon className="w-5 h-5 text-accent-500" />
                  </div>
                  <h3 className="font-bold text-slate-900">{step.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── CTA: Unknown Part ──────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-4 pb-12">
          <div className="bg-gradient-to-l from-brand-900 to-brand-800 rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-white">
            <div className="flex items-start gap-4">
              <div className="bg-accent-500 rounded-xl p-3 flex-shrink-0">
                <HelpCircle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">لا تعرف اسم القطعة؟</h3>
                <p className="text-brand-200 text-sm leading-relaxed">
                  لا مشكلة. ارفع صورة القطعة أو الماكينة وصف العطل وسنساعدك على تحديد ما تحتاجه.
                </p>
              </div>
            </div>
            <Link
              href="/unknown"
              className="flex-shrink-0 bg-accent-500 hover:bg-accent-600 text-white font-bold px-6 py-3 rounded-xl transition-colors whitespace-nowrap flex items-center gap-2"
            >
              ابدأ هنا
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
