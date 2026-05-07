import { Part, Category, DeviceType } from '@/types';

export interface SearchFilters {
  query: string;
  category: Category | '';
  deviceType: DeviceType | '';
  brand: string;
  symptom: string;
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[ً-ٟ]/g, '') // strip Arabic diacritics
    .trim();
}

export function searchParts(parts: Part[], filters: SearchFilters): Part[] {
  const q = normalize(filters.query);
  const sym = normalize(filters.symptom);

  return parts.filter((part) => {
    if (filters.category && part.category !== filters.category) return false;
    if (filters.deviceType && !part.deviceType.includes(filters.deviceType)) return false;
    if (filters.brand && !part.compatibleBrands.includes(filters.brand)) return false;

    if (sym) {
      const matchesSymptom = part.symptoms.some((s) => normalize(s).includes(sym));
      if (!matchesSymptom) return false;
    }

    if (!q) return true;

    const searchable = [
      part.nameAR,
      part.nameEN,
      part.commonLocalName ?? '',
      part.partNumber ?? '',
      part.descriptionAR,
      part.descriptionEN,
      ...part.symptoms,
      ...part.compatibleBrands,
    ]
      .map(normalize)
      .join(' ');

    return searchable.includes(q);
  });
}

export function getRelatedParts(parts: Part[], current: Part, limit = 4): Part[] {
  return parts
    .filter((p) => p.id !== current.id)
    .map((p) => ({
      part: p,
      score:
        (p.category === current.category ? 3 : 0) +
        p.deviceType.filter((d) => current.deviceType.includes(d)).length +
        p.compatibleBrands.filter((b) => current.compatibleBrands.includes(b)).length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.part);
}
