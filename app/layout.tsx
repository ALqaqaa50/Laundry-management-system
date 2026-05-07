import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'مركز قطع غيار المغاسل الصناعية',
  description:
    'منصة بحث وطلب عرض سعر لقطع غيار المغاسل الصناعية في عُمان والخليج. ابحث عن القطعة المناسبة أو أرسل طلبك بسهولة.',
  keywords: 'قطع غيار, مغاسل صناعية, غسالة, مجفف, بويلر, كالندر, عمان, خليج',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 font-[Cairo,sans-serif]">
        {children}
      </body>
    </html>
  );
}
