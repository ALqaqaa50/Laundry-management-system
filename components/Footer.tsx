import Link from 'next/link';
import { Wrench, Phone, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-brand-950 text-brand-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-accent-500 rounded-lg p-1.5">
                <Wrench className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white">مركز قطع غيار المغاسل الصناعية</span>
            </div>
            <p className="text-sm leading-relaxed">
              منصة متخصصة للبحث عن قطع غيار المغاسل الصناعية وطلب عروض الأسعار في عُمان والخليج.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-3">روابط سريعة</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/parts" className="hover:text-white transition-colors">كتالوج القطع</Link></li>
              <li><Link href="/unknown" className="hover:text-white transition-colors">لا أعرف اسم القطعة</Link></li>
              <li><Link href="/quote" className="hover:text-white transition-colors">طلب عرض سعر</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-3">تواصل معنا</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-accent-500 flex-shrink-0" />
                <span>واتساب / هاتف</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-accent-500 flex-shrink-0" />
                <span>البريد الإلكتروني</span>
              </li>
            </ul>
            <p className="text-xs mt-3">نخدم: مسقط، صلالة، صحار، الخليج</p>
          </div>
        </div>

        <div className="border-t border-brand-800 mt-8 pt-6 text-center text-xs text-brand-400">
          © {new Date().getFullYear()} مركز قطع غيار المغاسل الصناعية · جميع الحقوق محفوظة
        </div>
      </div>
    </footer>
  );
}
