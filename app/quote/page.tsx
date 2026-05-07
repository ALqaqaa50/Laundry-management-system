'use client';

import { useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Upload, X, CheckCircle, Phone, ArrowRight, Camera, FileText } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { DEVICE_LABELS, DeviceType, ImageMeta } from '@/types';

const MAX_IMAGES = 5;
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'webp'];

const deviceTypes = Object.keys(DEVICE_LABELS) as DeviceType[];
const CITIES = ['مسقط', 'صلالة', 'صحار', 'نزوى', 'صور', 'عبري', 'البريمي', 'الرستاق', 'السيب', 'أخرى'];

function validateFiles(incoming: File[], existing: File[]): string | null {
  if (existing.length + incoming.length > MAX_IMAGES)
    return `لا يمكن إضافة أكثر من ${MAX_IMAGES} صور في هذا الحقل`;
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

function ImageUploadSlot({
  label,
  hint,
  files,
  onAdd,
  onRemove,
}: {
  label: string;
  hint: string;
  files: File[];
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (inputRef.current) inputRef.current.value = '';
    if (selected.length === 0) return;
    const err = validateFiles(selected, files);
    if (err) { setError(err); return; }
    setError('');
    onAdd(selected);
  };

  return (
    <div>
      <p className="text-sm font-semibold text-slate-700 mb-1">{label}</p>
      <p className="text-xs text-slate-500 mb-3">{hint}</p>

      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {files.map((file, i) => (
            <div
              key={i}
              className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex-shrink-0"
            >
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
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
          onClick={() => { setError(''); inputRef.current?.click(); }}
          className="flex items-center gap-2 text-sm bg-slate-100 hover:bg-slate-200 border border-slate-200 border-dashed rounded-xl px-4 py-3 text-slate-600 transition-colors w-full justify-center"
        >
          <Camera className="w-4 h-4" />
          {files.length > 0 ? 'إضافة صورة أخرى' : 'ارفع صورة'}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        multiple
        className="hidden"
        onChange={handleChange}
      />

      {error && (
        <p className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <p className="mt-1.5 text-xs text-slate-400">
        JPG, PNG, WEBP — حتى 5MB لكل صورة — {MAX_IMAGES} صور كحد أقصى لكل حقل
      </p>
    </div>
  );
}

function QuoteContent() {
  const searchParams = useSearchParams();
  const prefillPartName = searchParams.get('part') ?? '';
  const prefillPartId = searchParams.get('partId') ?? '';

  const [step, setStep] = useState<'form' | 'success'>('form');
  const [submitting, setSubmitting] = useState(false);
  const [requestId, setRequestId] = useState('');
  const [apiError, setApiError] = useState('');
  const [uploadedCount, setUploadedCount] = useState(0);

  const [form, setForm] = useState({
    customerName: '',
    phone: '',
    city: '',
    deviceType: '' as DeviceType | '',
    deviceBrand: '',
    deviceModel: '',
    partNameAR: prefillPartName,
    partNameEN: '',
    partNumber: '',
    faultDescription: '',
    notes: '',
  });

  const [partImages, setPartImages] = useState<File[]>([]);
  const [nameplateImages, setNameplateImages] = useState<File[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!form.customerName.trim()) e.customerName = 'الاسم مطلوب';
    if (!form.phone.trim()) e.phone = 'رقم الهاتف مطلوب';
    if (!form.city) e.city = 'المدينة مطلوبة';
    if (!form.faultDescription.trim()) e.faultDescription = 'وصف العطل مطلوب';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
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
          source: 'quote-form',
          customerName: form.customerName,
          phone: form.phone,
          city: form.city,
          deviceType: form.deviceType,
          deviceBrand: form.deviceBrand,
          deviceModel: form.deviceModel,
          partId: prefillPartId || null,
          partNameAR: form.partNameAR,
          partNameEN: form.partNameEN,
          partNumber: form.partNumber,
          faultDescription: form.faultDescription,
          symptoms: [],
          notes: form.notes,
          images: uploadedPart,
          nameplateImages: uploadedNameplate,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.errors) setErrors(data.errors);
        else setApiError(data.error ?? 'حدث خطأ، حاول مجدداً');
        return;
      }

      setUploadedCount(uploadedPart.length + uploadedNameplate.length);
      setRequestId(data.requestId);
      setStep('success');
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : 'تعذّر الاتصال بالخادم، تحقق من اتصالك وحاول مجدداً',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const set = (key: keyof typeof form, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  if (step === 'success') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-2xl border border-green-200 p-10 shadow-sm">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">تم استلام طلبك!</h2>

          <div className="bg-brand-50 border border-brand-200 rounded-xl px-4 py-3 mb-4 inline-block">
            <p className="text-xs text-brand-600 mb-0.5">رقم طلبك</p>
            <p className="font-mono font-bold text-brand-900 text-lg tracking-widest">{requestId}</p>
          </div>

          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            شكراً <strong>{form.customerName}</strong>، تم تسجيل طلبك بنجاح.
            سيتم مراجعته والتواصل معك على الرقم{' '}
            <strong dir="ltr" className="inline-block">{form.phone}</strong> في أقرب وقت ممكن.
          </p>

          {uploadedCount > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-sm text-green-800 text-right">
              ✓ تم رفع {uploadedCount} {uploadedCount === 1 ? 'صورة' : 'صور'} بنجاح وإرفاقها بطلبك.
            </div>
          )}

          <Link
            href="/parts"
            className="flex items-center justify-center gap-2 bg-brand-900 hover:bg-brand-800 text-white font-bold px-4 py-3 rounded-xl transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            العودة للكتالوج
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">طلب عرض سعر</h1>
        <p className="text-slate-500 text-sm mt-1">
          أكمل النموذج أدناه وسنتواصل معك في أقرب وقت مع عرض سعر مخصص
        </p>
      </div>

      {prefillPartId && (
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <FileText className="w-5 h-5 text-brand-600 flex-shrink-0" />
          <div className="text-sm">
            <span className="text-slate-600">طلب سعر للقطعة: </span>
            <strong className="text-brand-800">{prefillPartName}</strong>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer info */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-bold text-slate-900 border-b border-slate-100 pb-3">معلومات التواصل</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                الاسم <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.customerName}
                onChange={(e) => set('customerName', e.target.value)}
                placeholder="اسمك الكريم"
                className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 ${errors.customerName ? 'border-red-400' : 'border-slate-200'}`}
              />
              {errors.customerName && <p className="text-xs text-red-500 mt-1">{errors.customerName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                رقم الهاتف / واتساب <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="+968 XXXXXXXX"
                className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 ${errors.phone ? 'border-red-400' : 'border-slate-200'}`}
                dir="ltr"
              />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              المدينة <span className="text-red-500">*</span>
            </label>
            <select
              value={form.city}
              onChange={(e) => set('city', e.target.value)}
              className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 ${errors.city ? 'border-red-400' : 'border-slate-200'}`}
            >
              <option value="">اختر مدينتك</option>
              {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
          </div>
        </div>

        {/* Device info */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-bold text-slate-900 border-b border-slate-100 pb-3">معلومات الجهاز</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">نوع الجهاز</label>
            <select
              value={form.deviceType}
              onChange={(e) => set('deviceType', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
            >
              <option value="">اختر نوع الجهاز</option>
              {deviceTypes.map((d) => (
                <option key={d} value={d}>{DEVICE_LABELS[d]}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">البراند / الماركة</label>
              <input
                type="text"
                value={form.deviceBrand}
                onChange={(e) => set('deviceBrand', e.target.value)}
                placeholder="مثال: Primus، Electrolux"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">رقم الموديل</label>
              <input
                type="text"
                value={form.deviceModel}
                onChange={(e) => set('deviceModel', e.target.value)}
                placeholder="مثال: FX180, W6400H"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
                dir="ltr"
              />
            </div>
          </div>
        </div>

        {/* Part info */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-bold text-slate-900 border-b border-slate-100 pb-3">معلومات القطعة</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">اسم القطعة (عربي)</label>
              <input
                type="text"
                value={form.partNameAR}
                onChange={(e) => set('partNameAR', e.target.value)}
                placeholder="مثال: صمام التصريف"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">اسم القطعة (إنجليزي)</label>
              <input
                type="text"
                value={form.partNameEN}
                onChange={(e) => set('partNameEN', e.target.value)}
                placeholder="مثال: Drain Valve"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">رقم القطعة (إن وجد)</label>
            <input
              type="text"
              value={form.partNumber}
              onChange={(e) => set('partNumber', e.target.value)}
              placeholder="رقم القطعة الموجود عليها"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              وصف العطل <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.faultDescription}
              onChange={(e) => set('faultDescription', e.target.value)}
              rows={3}
              placeholder="مثال: الغسالة لا تصرف الماء بعد انتهاء الغسيل، صوت المضخة موجود لكن الماء لا يخرج..."
              className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 resize-none ${errors.faultDescription ? 'border-red-400' : 'border-slate-200'}`}
            />
            {errors.faultDescription && <p className="text-xs text-red-500 mt-1">{errors.faultDescription}</p>}
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
          <h2 className="font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Upload className="w-4 h-4 text-slate-500" />
            الصور (اختياري ولكن مفيد جداً)
          </h2>

          <ImageUploadSlot
            label="صورة القطعة القديمة أو المعطوبة"
            hint="ارفع صورة واضحة للقطعة من أكثر من زاوية إن أمكن"
            files={partImages}
            onAdd={(f) => setPartImages((prev) => [...prev, ...f])}
            onRemove={(i) => setPartImages((prev) => prev.filter((_, idx) => idx !== i))}
          />

          <ImageUploadSlot
            label="صورة لوحة بيانات الماكينة (Nameplate)"
            hint="اللوحة المعدنية التي تحتوي على البراند والموديل والسيريال"
            files={nameplateImages}
            onAdd={(f) => setNameplateImages((prev) => [...prev, ...f])}
            onRemove={(i) => setNameplateImages((prev) => prev.filter((_, idx) => idx !== i))}
          />
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <label className="block text-sm font-medium text-slate-700 mb-1">ملاحظات إضافية</label>
          <textarea
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            rows={2}
            placeholder="أي معلومات إضافية تريد إضافتها..."
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 resize-none"
          />
        </div>

        {apiError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 text-center">
            {apiError}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-accent-500 hover:bg-accent-600 disabled:opacity-60 text-white font-bold px-6 py-4 rounded-2xl transition-colors text-base flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              جاري الإرسال...
            </>
          ) : (
            <>
              <Phone className="w-5 h-5" />
              إرسال طلب عرض السعر
            </>
          )}
        </button>

        <p className="text-center text-xs text-slate-400">
          بيانات طلبك آمنة ولن تُشارك مع أي طرف ثالث
        </p>
      </form>
    </div>
  );
}

export default function QuotePage() {
  return (
    <>
      <Header />
      <main>
        <Suspense fallback={<div className="p-8 text-center text-slate-500">جاري التحميل...</div>}>
          <QuoteContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
