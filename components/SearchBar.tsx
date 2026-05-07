'use client';

import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  size?: 'md' | 'lg';
}

export default function SearchBar({
  value,
  onChange,
  placeholder = 'ابحث باسم القطعة أو العطل أو رقم الموديل...',
  size = 'md',
}: SearchBarProps) {
  const heightClass = size === 'lg' ? 'h-14 text-base' : 'h-11 text-sm';
  const iconClass = size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';

  return (
    <div className="relative w-full">
      <Search className={`absolute right-4 top-1/2 -translate-y-1/2 ${iconClass} text-slate-400 pointer-events-none`} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full ${heightClass} pr-11 pl-11 rounded-xl border border-slate-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent placeholder-slate-400 transition`}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="مسح البحث"
        >
          <X className={`${iconClass} text-slate-400`} />
        </button>
      )}
    </div>
  );
}
