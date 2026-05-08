'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, Wrench, Phone } from 'lucide-react';

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-brand-950 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-accent-500 rounded-lg p-1.5">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <div className="leading-tight">
            <div className="font-bold text-sm sm:text-base">مركز قطع غيار</div>
            <div className="text-brand-200 text-xs">المغاسل الصناعية</div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/parts" className="text-brand-200 hover:text-white transition-colors">
            الكتالوج
          </Link>
          <Link href="/fault" className="text-brand-200 hover:text-white transition-colors">
            بحث بالعطل
          </Link>
          <Link href="/unknown" className="text-brand-200 hover:text-white transition-colors">
            لا أعرف اسم القطعة
          </Link>
        </nav>

        {/* CTA + Mobile toggle */}
        <div className="flex items-center gap-3">
          <Link
            href="/quote"
            className="hidden sm:flex items-center gap-1.5 bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Phone className="w-4 h-4" />
            طلب عرض سعر
          </Link>
          <button
            className="md:hidden p-2 rounded-lg hover:bg-brand-800 transition-colors"
            onClick={() => setOpen(!open)}
            aria-label="القائمة"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-brand-800 bg-brand-900 px-4 py-4 flex flex-col gap-3 text-sm font-medium">
          <Link href="/parts" className="text-brand-200 hover:text-white py-2" onClick={() => setOpen(false)}>
            الكتالوج
          </Link>
          <Link href="/fault" className="text-brand-200 hover:text-white py-2" onClick={() => setOpen(false)}>
            بحث بالعطل
          </Link>
          <Link href="/unknown" className="text-brand-200 hover:text-white py-2" onClick={() => setOpen(false)}>
            لا أعرف اسم القطعة
          </Link>
          <Link
            href="/quote"
            className="flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-600 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors mt-1"
            onClick={() => setOpen(false)}
          >
            <Phone className="w-4 h-4" />
            طلب عرض سعر
          </Link>
        </div>
      )}
    </header>
  );
}
