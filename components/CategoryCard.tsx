import Link from 'next/link';
import { Category, CATEGORY_LABELS } from '@/types';

const CATEGORY_CONFIG: Record<
  Category,
  { icon: string; color: string; borderColor: string }
> = {
  valves:         { icon: '🔧', color: 'bg-blue-50 hover:bg-blue-100',    borderColor: 'border-blue-200' },
  heating:        { icon: '🔥', color: 'bg-red-50 hover:bg-red-100',      borderColor: 'border-red-200' },
  electrical:     { icon: '⚡', color: 'bg-yellow-50 hover:bg-yellow-100', borderColor: 'border-yellow-200' },
  mechanical:     { icon: '⚙️', color: 'bg-slate-50 hover:bg-slate-100',  borderColor: 'border-slate-200' },
  pumps:          { icon: '💧', color: 'bg-cyan-50 hover:bg-cyan-100',    borderColor: 'border-cyan-200' },
  sensors:        { icon: '📡', color: 'bg-purple-50 hover:bg-purple-100', borderColor: 'border-purple-200' },
  'door-safety':  { icon: '🚪', color: 'bg-green-50 hover:bg-green-100',  borderColor: 'border-green-200' },
  filters:        { icon: '🔍', color: 'bg-indigo-50 hover:bg-indigo-100', borderColor: 'border-indigo-200' },
  'belts-pulleys':{ icon: '🔩', color: 'bg-orange-50 hover:bg-orange-100', borderColor: 'border-orange-200' },
  'steam-system': { icon: '♨️', color: 'bg-rose-50 hover:bg-rose-100',    borderColor: 'border-rose-200' },
  'boiler-parts': { icon: '🏭', color: 'bg-zinc-50 hover:bg-zinc-100',    borderColor: 'border-zinc-200' },
  'dry-cleaning': { icon: '🧴', color: 'bg-teal-50 hover:bg-teal-100',    borderColor: 'border-teal-200' },
};

interface CategoryCardProps {
  category: Category;
  count: number;
}

export default function CategoryCard({ category, count }: CategoryCardProps) {
  const cfg = CATEGORY_CONFIG[category];
  return (
    <Link
      href={`/parts?category=${category}`}
      className={`${cfg.color} border ${cfg.borderColor} rounded-xl p-4 flex flex-col items-center gap-2 text-center transition-colors cursor-pointer group`}
    >
      <span className="text-3xl">{cfg.icon}</span>
      <span className="font-semibold text-slate-800 text-sm">{CATEGORY_LABELS[category]}</span>
      <span className="text-xs text-slate-500">{count} قطعة</span>
    </Link>
  );
}
