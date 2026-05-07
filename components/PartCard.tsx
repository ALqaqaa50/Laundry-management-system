import Link from 'next/link';
import { Part, CATEGORY_LABELS, DEVICE_LABELS, AVAILABILITY_LABELS } from '@/types';
import { ArrowLeft, CheckCircle, Clock, HelpCircle } from 'lucide-react';

const CATEGORY_ICONS: Record<string, string> = {
  valves: '🔧',
  heating: '🔥',
  electrical: '⚡',
  mechanical: '⚙️',
  pumps: '💧',
  sensors: '📡',
  'door-safety': '🚪',
  filters: '🔍',
  'belts-pulleys': '🔩',
  'steam-system': '♨️',
  'boiler-parts': '🏭',
  'dry-cleaning': '🧴',
};

const AVAILABILITY_CONFIG = {
  'in-stock': { label: AVAILABILITY_LABELS['in-stock'], icon: CheckCircle, color: 'text-green-600 bg-green-50' },
  'on-request': { label: AVAILABILITY_LABELS['on-request'], icon: Clock, color: 'text-amber-600 bg-amber-50' },
  unknown: { label: AVAILABILITY_LABELS['unknown'], icon: HelpCircle, color: 'text-slate-500 bg-slate-100' },
};

interface PartCardProps {
  part: Part;
  highlight?: string;
}

export default function PartCard({ part, highlight }: PartCardProps) {
  const avail = AVAILABILITY_CONFIG[part.availability];
  const AvailIcon = avail.icon;

  const highlightText = (text: string) => {
    if (!highlight) return text;
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 text-slate-900 rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <Link
      href={`/parts/${part.id}`}
      className="group bg-white rounded-xl border border-slate-200 hover:border-brand-600 hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden"
    >
      {/* Category bar */}
      <div className="bg-slate-50 border-b border-slate-100 px-4 py-2 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
          <span>{CATEGORY_ICONS[part.category] ?? '🔧'}</span>
          {CATEGORY_LABELS[part.category]}
        </span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${avail.color}`}>
          <AvailIcon className="w-3 h-3" />
          {avail.label}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col gap-2">
        <div>
          <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-brand-700 transition-colors">
            {highlightText(part.nameAR)}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{highlightText(part.nameEN)}</p>
          {part.commonLocalName && (
            <p className="text-xs text-slate-400 mt-0.5 italic">{part.commonLocalName}</p>
          )}
        </div>

        <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">
          {part.descriptionAR}
        </p>

        {/* Devices */}
        <div className="flex flex-wrap gap-1 mt-auto pt-2">
          {part.deviceType.slice(0, 3).map((d) => (
            <span key={d} className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">
              {DEVICE_LABELS[d]}
            </span>
          ))}
        </div>

        {/* Top symptoms */}
        {part.symptoms.length > 0 && (
          <div className="text-xs text-slate-500 border-t border-slate-100 pt-2 mt-1">
            <span className="font-medium text-slate-600">أبرز الأعطال: </span>
            {part.symptoms[0]}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs text-slate-400">
          {part.compatibleBrands.slice(0, 2).join(' · ')}
          {part.compatibleBrands.length > 2 && ` +${part.compatibleBrands.length - 2}`}
        </span>
        <span className="text-brand-600 text-xs font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
          التفاصيل
          <ArrowLeft className="w-3 h-3" />
        </span>
      </div>
    </Link>
  );
}
