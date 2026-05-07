'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import {
  Camera, ChevronLeft, ChevronRight, Check, X, Phone,
  Cpu, Wrench, Zap, Waves, ThermometerSun, Shield,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { DEVICE_LABELS, DeviceType, ImageMeta } from '@/types';
import { COMMON_SYMPTOMS } from '@/data/parts';

const MAX_IMAGES = 5;
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'webp'];

const deviceTypes = Object.keys(DEVICE_LABELS) as DeviceType[];

const DEVICE_ICONS: Record<DeviceType, React.ReactNode> = {
  'washer-extractor': <Waves className="w-7 h-7" />,
  'tumble-dryer':     <ThermometerSun className="w-7 h-7" />,
  ironer:             <Shield className="w-7 h-7" />,
  boiler:             <Zap className="w-7 h-7" />,
  'steam-generator':  <Cpu className="w-7 h-7" />,
  'dry-cleaning':     <Wrench className="w-7 h-7" />,
};

const STEPS = [
  { id: 1, title: 'نوع الجهاز' },
  { id: 2, title: 'صورة القطعة' },
  { id: 3, title: 'صورة الماكينة' },
  { id: 4, title: 'وصف العطل' },
  { id: 5, title: 'بياناتك' },
];

const CITIES = ['مسقط', 'صلالة', 'صحار', 'نزوى', 'صور', 'عبري', 'البريمي', 'الرستاق', 'أخرى'];

function validateFiles(incoming: File[], existing: File[]): string | null {
  if (existing.length + incoming.length > MAX_IMAGES)
    return `لا يمكن إضافة أكثر من ${MAX_IMAGES} صور`;
  for (const f of incoming) {
    const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
    if (!ALLOWED_MIME.includes(f.type) || !ALLOWED_EXT.includes(ext))
      return `نوع الملف "${f.name}" غير مسموح. الأنواع المقبولة: JPG, JPEG, PNG, WEBP`;
    if (f.size > MAX_SIZE)
      return `حجم الصورة "${f.name}" يتجاوز الحد الأقصى (5MB)`;
  }
  return null;
}

async function uploadFiles(files: File[]): Promise<ImageMeta[]> {
  if (files.length === 0) return [];
  const fd = new FormData();
  files.forEach((f) => fd.append('files', f));
  const res = await fetch('/api/upload', { method: 'POST', body: fd });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error ?? 'فشل رفع الصور');
  return data.files as ImageMeta[];
}

function ImageUpload({
  label,
  hint,
  files,
  onAdd,
  onRemove,
}: {
  label: string;
  hint: string;
  files: File[];
  onAdd: (f: File[]) => void;
  onRemove: (i: number) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');

  return (
    <div>
      <p className="font-semibold text-slate-800 mb-1">{label}</p>
      <p className="text-sm text-slate-500 mb-4">{hint}</p>

      {files.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-4">
          {files.map((f, i) => (
            <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200">
              <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {files.length < MAX_IMAGES && (
        <button
          type="button"
          onClick={() => { setError(''); ref.current?.click(); }}
          className="w-full border-2 border-dashed border-slate-300 hover:border-brand-500 rounded-2xl py-8 flex flex-col items-center gap-3 text-slate-500 hover:text-brand-600 transition-colors"
        >
          <Camera className="w-8 h-8" />
          <span className="font-medium">{files.length > 0 ? 'إضافة صورة أخرى' : 'اضغط لرفع صورة'}</span>
          <span className="text-xs text-slate-400">JPG, PNG, WEBP — حتى 5MB — {MAX_IMAGES} صور كحد أقصى</span>
        </button>
      )}

      <input
        ref={ref}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        multiple
        className="hidden"
        onChange={(e) => {
          const selected = Array.from(e.target.files ?? []);
          if (ref.current) ref.current.value = '';
          if (selected.length === 0) return;
          const err = validateFiles(selected, files);
          if (err) { setError(err); return; }
          setError('');
          onAdd(selected);
        }}
      />

      {error && (
        <p className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}

export default function UnknownPartPage() {
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);

  const [deviceType, setDeviceType] = useState<DeviceType | ''>('');
  const [partImages, setPartImages] = useState<File[]>([]);
  const [nameplateImages, setNameplateImages] = useState<File[]>([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [faultText, setFaultText] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [requestId, setRequestId] = useState('');
  const [uploadedCount, setUploadedCount] = useState(0);
  const [apiError, setApiError] = useState('');

  const toggleSymptom = (s: string) =>
    setSelectedSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );

  const canNext = () => {
    if (step === 4) return faultText.trim().length > 0 || selectedSymptoms.length > 0;
    if (step === 5) return name.trim() && phone.trim();
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setApiError('');

    try {
      const [uploadedPart, uploadedNameplate] = await Promise.all([
        uploadFiles(partImages),
        uploadFiles(nameplateImages),
      ]);

      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'unknown-part-form',
          customerName: name,
          phone,
          city,
          deviceType: deviceType || null,
          deviceBrand: null,
          deviceModel: null,
          partId: null,
          partNameAR: null,
          partNameEN: null,
          partNumber: null,
          faultDescription: faultText,
          symptoms: selectedSymptoms,
          notes: null,
          images: uploadedPart,
          nameplateImages: uploadedNameplate,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setApiError(data.error ?? 'حدث خطأ، حاول مجدداً');
        return;
      }

      setUploadedCount(uploadedPart.length + uploadedNameplate.length);
      setRequestId(data.requestId);
      setDone(true);
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : 'تعذّر الاتصال بالخادم، تحقق من اتصالك وحاول مجدداً',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <>
        <Header />
        <main className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-2xl border border-green-200 p-10 shadow-sm">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">شكراً!</h2>

            <div className="bg-brand-50 border border-brand-200 rounded-xl px-4 py-3 mb-4 inline-block">
              <p className="text-xs text-brand-600 mb-0.5">رقم طلبك</p>
              <p className="font-mono font-bold text-brand-900 text-lg tracking-widest">{requestId}</p>
            </div>

            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              استلمنا طلبك بنجاح. سيراجع فريقنا المعلومات ويتواصل معك على الرقم{' '}
              <strong dir="ltr" className="inline-block">{phone}</strong> لتحديد القطعة المناسبة.
            </p>

            {uploadedCount > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 text-sm text-green-800 text-right">
                ✓ تم رفع {uploadedCount} {uploadedCount === 1 ? 'صورة' : 'صور'} بنجاح وإرفاقها بطلبك.
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Link
                href="/parts"
                className="flex items-center justify-center gap-2 bg-brand-900 hover:bg-brand-800 text-white font-bold px-4 py-3 rounded-xl transition-colors"
              >
                ابحث في الكتالوج
              </Link>
              <Link
                href="/quote"
                className="border border-slate-300 text-slate-700 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors text-sm"
              >
                إرسال طلب آخر
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">لا أعرف اسم القطعة</h1>
          <p className="text-slate-500 text-sm mt-1">
            أجب على الأسئلة التالية وسنساعدك على تحديد القطعة التي تحتاجها
          </p>
        </div>

        {/* Progress steps */}
        <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
          {STEPS.map((s, idx) => (
            <div key={s.id} className="flex items-center gap-1 flex-shrink-0">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  step === s.id
                    ? 'bg-brand-900 text-white'
                    : step > s.id
                    ? 'bg-green-100 text-green-700'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {step > s.id ? <Check className="w-3 h-3" /> : <span>{s.id}</span>}
                <span className="hidden sm:inline">{s.title}</span>
              </div>
              {idx < STEPS.length - 1 && <div className="w-4 h-0.5 bg-slate-200" />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 mb-6">
          {/* Step 1: Device type */}
          {step === 1 && (
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">ما نوع الجهاز المعطوب؟</h2>
              <p className="text-sm text-slate-500 mb-6">اختر نوع جهازك (اختياري)</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {deviceTypes.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDeviceType(deviceType === d ? '' : d)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-sm font-medium ${
                      deviceType === d
                        ? 'border-brand-600 bg-brand-50 text-brand-800'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <span className={deviceType === d ? 'text-brand-600' : 'text-slate-400'}>
                      {DEVICE_ICONS[d]}
                    </span>
                    {DEVICE_LABELS[d]}
                  </button>
                ))}
              </div>
              {!deviceType && (
                <p className="text-xs text-slate-400 mt-4 text-center">
                  يمكنك المتابعة بدون اختيار — سنسألك لاحقاً
                </p>
              )}
            </div>
          )}

          {/* Step 2: Part photo */}
          {step === 2 && (
            <ImageUpload
              label="ارفع صورة القطعة القديمة أو المعطوبة"
              hint="صورة واضحة تساعدنا على تحديد القطعة بدقة. يمكنك رفع أكثر من صورة."
              files={partImages}
              onAdd={(f) => setPartImages((p) => [...p, ...f])}
              onRemove={(i) => setPartImages((p) => p.filter((_, idx) => idx !== i))}
            />
          )}

          {/* Step 3: Machine nameplate */}
          {step === 3 && (
            <ImageUpload
              label="ارفع صورة لوحة بيانات الجهاز (Nameplate)"
              hint="اللوحة المعدنية أو الملصق الذي يحتوي على البراند والموديل والسيريال. عادةً على جانب أو خلف الجهاز."
              files={nameplateImages}
              onAdd={(f) => setNameplateImages((p) => [...p, ...f])}
              onRemove={(i) => setNameplateImages((p) => p.filter((_, idx) => idx !== i))}
            />
          )}

          {/* Step 4: Fault description */}
          {step === 4 && (
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">ما العطل الذي تواجهه؟</h2>
              <p className="text-sm text-slate-500 mb-5">اختر من الأعطال الشائعة أو اكتب العطل بكلماتك</p>

              <div className="flex flex-wrap gap-2 mb-5">
                {COMMON_SYMPTOMS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSymptom(s)}
                    className={`text-sm px-3 py-1.5 rounded-full border transition-all ${
                      selectedSymptoms.includes(s)
                        ? 'bg-brand-900 border-brand-900 text-white'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-brand-400'
                    }`}
                  >
                    {selectedSymptoms.includes(s) && <span className="ml-1">✓</span>}
                    {s}
                  </button>
                ))}
              </div>

              <textarea
                value={faultText}
                onChange={(e) => setFaultText(e.target.value)}
                rows={4}
                placeholder="أو اكتب وصفاً مفصلاً للعطل بكلماتك..."
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 resize-none"
              />
            </div>
          )}

          {/* Step 5: Contact */}
          {step === 5 && (
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">بيانات التواصل</h2>
              <p className="text-sm text-slate-500 mb-5">سنتواصل معك لتحديد القطعة وإرسال عرض السعر</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    الاسم <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="اسمك الكريم"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    رقم الهاتف / واتساب <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+968 XXXXXXXX"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">المدينة</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
                  >
                    <option value="">اختر مدينتك</option>
                    {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Summary */}
              <div className="mt-6 bg-slate-50 rounded-xl p-4 text-sm space-y-2 text-slate-600">
                <p className="font-semibold text-slate-800 mb-2">ملخص طلبك:</p>
                {deviceType && <p>نوع الجهاز: <strong>{DEVICE_LABELS[deviceType]}</strong></p>}
                {partImages.length > 0 && <p>صور القطعة: <strong>{partImages.length} صورة</strong></p>}
                {nameplateImages.length > 0 && <p>صور لوحة الجهاز: <strong>{nameplateImages.length} صورة</strong></p>}
                {selectedSymptoms.length > 0 && (
                  <p>الأعطال المحددة: <strong>{selectedSymptoms.join('، ')}</strong></p>
                )}
                {faultText && <p>وصف إضافي: <strong>{faultText.slice(0, 80)}{faultText.length > 80 ? '...' : ''}</strong></p>}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed px-4 py-2.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
            السابق
          </button>

          {step < 5 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="flex items-center gap-2 bg-brand-900 hover:bg-brand-800 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
            >
              التالي
              <ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canNext() || submitting}
              className="flex items-center gap-2 bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl transition-colors text-sm"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  إرسال...
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4" />
                  إرسال الطلب
                </>
              )}
            </button>
          )}
        </div>

        {apiError && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 text-center">
            {apiError}
          </div>
        )}

        <div className="text-center mt-6">
          <p className="text-sm text-slate-500">
            أو{' '}
            <Link href="/parts" className="text-brand-700 font-medium hover:underline">
              ابحث في الكتالوج مباشرة
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
