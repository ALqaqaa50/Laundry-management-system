export interface ImageMeta {
  originalName: string;
  storedName: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
}

export type DeviceType =
  | 'washer-extractor'
  | 'tumble-dryer'
  | 'ironer'
  | 'boiler'
  | 'steam-generator'
  | 'dry-cleaning';

export type Category =
  | 'valves'
  | 'heating'
  | 'electrical'
  | 'mechanical'
  | 'pumps'
  | 'sensors'
  | 'door-safety'
  | 'filters'
  | 'belts-pulleys'
  | 'steam-system'
  | 'boiler-parts'
  | 'dry-cleaning';

export type Availability = 'in-stock' | 'on-request' | 'unknown';
export type OEMType = 'OEM' | 'Alternative' | 'Both';
export type ConfidenceLevel = 'High' | 'Medium' | 'Low';

export interface Part {
  id: string;
  category: Category;
  deviceType: DeviceType[];
  nameEN: string;
  nameAR: string;
  commonLocalName?: string;
  partNumber?: string;
  compatibleBrands: string[];
  compatibleModels?: string[];
  symptoms: string[];
  descriptionEN: string;
  descriptionAR: string;
  imageUrl?: string;
  oemType: OEMType;
  confidenceLevel: ConfidenceLevel;
  availability: Availability;
  supplierNotes?: string;
}

export interface QuoteRequest {
  id: string;
  customerName: string;
  phone: string;
  city: string;
  deviceType: string;
  deviceBrand: string;
  deviceModel: string;
  partNameAR?: string;
  partNameEN?: string;
  partNumber?: string;
  faultDescription: string;
  partImageFiles?: File[];
  nameplateImageFiles?: File[];
  notes?: string;
  submittedAt: string;
  relatedPartId?: string;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  valves: 'صمامات',
  heating: 'تسخين',
  electrical: 'كهربائي',
  mechanical: 'ميكانيكي',
  pumps: 'مضخات',
  sensors: 'حساسات',
  'door-safety': 'باب وأمان',
  filters: 'فلاتر',
  'belts-pulleys': 'سيور وبكرات',
  'steam-system': 'نظام البخار',
  'boiler-parts': 'بويلر',
  'dry-cleaning': 'تنظيف جاف',
};

export const DEVICE_LABELS: Record<DeviceType, string> = {
  'washer-extractor': 'غسالة استخراج',
  'tumble-dryer': 'مجفف',
  ironer: 'كالندر / مكواة',
  boiler: 'بويلر',
  'steam-generator': 'مولد بخار',
  'dry-cleaning': 'تنظيف جاف',
};

export const AVAILABILITY_LABELS: Record<Availability, string> = {
  'in-stock': 'متوفر',
  'on-request': 'بالطلب',
  unknown: 'غير معروف',
};
