'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, ChevronLeft } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { COMMON_SYMPTOMS } from '@/data/parts';

const DEVICE_SYMPTOMS: Record<string, string[]> = {
  'غسالة استخراج': [
    'الماء لا يخرج من الغسالة',
    'الماء لا يدخل الغسالة',
    'الحلة لا تدور',
    'الباب لا يقفل',
    'تسريب ماء من الباب أو الأسفل',
    'اهتزاز شديد أو صوت عالٍ',
    'الجهاز لا يبدأ التشغيل',
    'الجهاز يطفأ وحده',
    'الماء لا يسخن',
    'كود خطأ على الشاشة',
    'رائحة حرق',
  ],
  'مجفف': [
    'الهواء لا يسخن (المجفف)',
    'التجفيف بطيء جداً',
    'الجهاز لا يبدأ التشغيل',
    'اهتزاز شديد أو صوت عالٍ',
    'الجهاز يطفأ وحده',
    'رائحة حرق',
    'كود خطأ على الشاشة',
  ],
  'بويلر': [
    'ضعف بخار أو انعدامه',
    'تسريب ماء من الباب أو الأسفل',
    'الماء لا يسخن',
    'اهتزاز شديد أو صوت عالٍ',
  ],
  'كالندر / مكواة': [
    'الماء لا يسخن',
    'ضعف بخار أو انعدامه',
    'الجهاز لا يبدأ التشغيل',
    'رائحة حرق',
  ],
};

export default function FaultPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [deviceFilter, setDeviceFilter] = useState<string>('الكل');

  const devices = ['الكل', ...Object.keys(DEVICE_SYMPTOMS)];

  const displayedSymptoms =
    deviceFilter === 'الكل'
      ? COMMON_SYMPTOMS
      : (DEVICE_SYMPTOMS[deviceFilter] ?? COMMON_SYMPTOMS);

  const handleSearch = () => {
    if (!selected) return;
    router.push(`/parts?symptom=${encodeURIComponent(selected)}`);
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50">
        {/* Hero */}
        <section className="bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 text-white py-12 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-400/40 rounded-full px-4 py-1.5 text-red-300 text-sm font-medium mb-4">
              <AlertCircle className="w-4 h-4" />
              تشخيص العطل
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">
              ما العطل الذي تواجهه؟
            </h1>
            <p className="text-brand-200 text-base max-w-xl mx-auto">
              اختر العطل وسنعرض لك القطع المرتبطة به مباشرة
            </p>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-4 py-10">
          {/* Device filter */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-slate-600 mb-3">
              صفّح حسب نوع الجهاز:
            </p>
            <div className="flex flex-wrap gap-2">
              {devices.map((d) => (
                <button
                  key={d}
                  onClick={() => { setDeviceFilter(d); setSelected(null); }}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                    deviceFilter === d
                      ? 'bg-brand-900 text-white border-brand-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-brand-400'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Symptom grid */}
          <div className="mb-8">
            <p className="text-sm font-semibold text-slate-600 mb-3">
              اختر العطل:
            </p>
            <div className="flex flex-wrap gap-3">
              {displayedSymptoms.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelected(s === selected ? null : s)}
                  className={`px-4 py-2.5 rounded-xl text-sm border transition-all shadow-sm ${
                    selected === s
                      ? 'bg-accent-500 text-white border-accent-500 shadow-accent-200 shadow-md'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-accent-400 hover:text-accent-700'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div
            className={`transition-all duration-300 ${
              selected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
            }`}
          >
            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div>
                <p className="text-xs text-slate-500 mb-1">العطل المحدد:</p>
                <p className="font-semibold text-slate-900">{selected}</p>
              </div>
              <button
                onClick={handleSearch}
                className="flex items-center gap-2 bg-accent-500 hover:bg-accent-600 text-white font-bold px-6 py-3 rounded-xl transition-colors shadow whitespace-nowrap"
              >
                عرض القطع المرتبطة
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!selected && (
            <p className="text-center text-slate-400 text-sm mt-4">
              اختر عطلاً من الأعلى لعرض القطع المرتبطة به
            </p>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
