'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, CheckCircle, Clock, AlertCircle, Package, ArrowRight } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

type QuoteStatus =
  | 'new' | 'reviewing' | 'quoted'
  | 'waiting_customer' | 'ordered' | 'completed' | 'rejected';

const STATUS_INFO: Record<QuoteStatus, { label: string; message: string; icon: React.ReactNode; color: string }> = {
  new: {
    label: 'مستلم',
    message: 'تم استلام طلبك ولم تتم مراجعته بعد.',
    icon: <Clock className="w-6 h-6" />,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
  },
  reviewing: {
    label: 'قيد المراجعة',
    message: 'طلبك قيد المراجعة من قِبَل فريقنا.',
    icon: <Search className="w-6 h-6" />,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
  },
  quoted: {
    label: 'تم تجهيز عرض السعر',
    message: 'تم تجهيز عرض السعر. تحقق من التواصل معك عبر الهاتف أو واتساب.',
    icon: <CheckCircle className="w-6 h-6" />,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
  },
  waiting_customer: {
    label: 'بانتظار ردك',
    message: 'ننتظر ردك أو تفاصيل إضافية منك. تحقق من رسائلك.',
    icon: <AlertCircle className="w-6 h-6" />,
    color: 'text-orange-600 bg-orange-50 border-orange-200',
  },
  ordered: {
    label: 'تم اعتماد الطلب',
    message: 'تم اعتماد الطلب وجارٍ توفير القطعة.',
    icon: <Package className="w-6 h-6" />,
    color: 'text-teal-600 bg-teal-50 border-teal-200',
  },
  completed: {
    label: 'مكتمل',
    message: 'تم إكمال الطلب بنجاح.',
    icon: <CheckCircle className="w-6 h-6" />,
    color: 'text-green-600 bg-green-50 border-green-200',
  },
  rejected: {
    label: 'تعذّر التوفير',
    message: 'تعذّر توفير القطعة أو تم رفض الطلب. تواصل معنا لمزيد من التفاصيل.',
    icon: <AlertCircle className="w-6 h-6" />,
    color: 'text-red-600 bg-red-50 border-red-200',
  },
};

const SOURCE_LABELS: Record<string, string> = {
  'quote-form': 'طلب عرض سعر',
  'unknown-part-form': 'تحديد قطعة مجهولة',
};

interface TrackResult {
  requestId: string;
  status: QuoteStatus;
  source: string;
  createdAt: string;
}

export default function TrackPage() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackResult | null>(null);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = input.trim().toUpperCase();
    if (!id) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(`/api/track/${encodeURIComponent(id)}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error ?? 'حدث خطأ في البحث');
        return;
      }

      setResult(data as TrackResult);
    } catch {
      setError('تعذّر الاتصال بالخادم. تحقق من اتصالك وحاول مجدداً.');
    } finally {
      setLoading(false);
    }
  };

  const statusInfo = result ? STATUS_INFO[result.status] : null;

  const createdDate = result
    ? new Date(result.createdAt).toLocaleDateString('ar-SA', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '';

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">تتبع طلبك</h1>
            <p className="text-slate-500 text-sm">
              أدخل رقم الطلب الذي وصلك بعد الإرسال لمعرفة حالته
            </p>
          </div>

          {/* Search form */}
          <form onSubmit={handleSearch} className="flex gap-2 mb-6">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              placeholder="مثال: RQ-ABC123-XY"
              className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-600 bg-white"
              dir="ltr"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-brand-900 hover:bg-brand-800 disabled:opacity-50 text-white font-semibold px-5 py-3 rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              بحث
            </button>
          </form>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 text-center mb-4">
              {error}
            </div>
          )}

          {/* Result */}
          {result && statusInfo && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
              {/* Request ID */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">رقم الطلب</span>
                <span className="font-mono font-bold text-brand-800 bg-brand-50 px-3 py-1 rounded-lg text-sm">
                  {result.requestId}
                </span>
              </div>

              {/* Status */}
              <div className={`rounded-xl border p-4 flex items-start gap-3 ${statusInfo.color}`}>
                <div className="flex-shrink-0 mt-0.5">{statusInfo.icon}</div>
                <div>
                  <p className="font-bold text-sm mb-1">{statusInfo.label}</p>
                  <p className="text-sm leading-relaxed">{statusInfo.message}</p>
                </div>
              </div>

              {/* Meta */}
              <div className="space-y-2 text-sm text-slate-600 border-t border-slate-100 pt-4">
                <div className="flex justify-between">
                  <span className="text-slate-500">نوع الطلب</span>
                  <span>{SOURCE_LABELS[result.source] ?? result.source}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">تاريخ الإنشاء</span>
                  <span className="text-xs">{createdDate}</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 text-center">
                للاستفسار تواصل معنا مباشرة عبر واتساب أو هاتف
              </p>
            </div>
          )}

          {/* Links */}
          <div className="mt-8 text-center space-y-3">
            <p className="text-sm text-slate-500">لم ترسل طلباً بعد؟</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/quote"
                className="flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
              >
                طلب عرض سعر
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/unknown"
                className="flex items-center justify-center gap-2 border border-slate-300 text-slate-700 hover:bg-slate-50 px-5 py-2.5 rounded-xl text-sm transition-colors"
              >
                لا أعرف اسم القطعة
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
