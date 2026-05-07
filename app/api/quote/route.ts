import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'quote-requests.json');

export interface QuoteRecord {
  requestId: string;
  source: 'quote-form' | 'unknown-part-form';
  status: 'new' | 'reviewing' | 'replied' | 'closed';
  customerName: string;
  phone: string;
  city: string | null;
  deviceType: string | null;
  deviceBrand: string | null;
  deviceModel: string | null;
  partId: string | null;
  partNameAR: string | null;
  partNameEN: string | null;
  partNumber: string | null;
  faultDescription: string | null;
  symptoms: string[];
  notes: string | null;
  imageNames: string[];
  nameplateImageNames: string[];
  createdAt: string;
}

async function readRecords(): Promise<QuoteRecord[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(raw) as QuoteRecord[];
  } catch {
    return [];
  }
}

async function writeRecords(records: QuoteRecord[]): Promise<void> {
  await fs.writeFile(DATA_FILE, JSON.stringify(records, null, 2), 'utf-8');
}

function generateId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RQ-${timestamp}-${random}`;
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'طلب غير صالح' }, { status: 400 });
  }

  // Validate required fields
  const errors: Record<string, string> = {};
  if (!String(body.customerName ?? '').trim()) errors.customerName = 'الاسم مطلوب';
  if (!String(body.phone ?? '').trim()) errors.phone = 'رقم الهاتف مطلوب';

  const hasFault =
    String(body.faultDescription ?? '').trim().length > 0 ||
    (Array.isArray(body.symptoms) && body.symptoms.length > 0);

  if (!hasFault) {
    errors.faultDescription = 'يرجى وصف العطل أو اختيار عطل من القائمة';
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ success: false, errors }, { status: 422 });
  }

  const record: QuoteRecord = {
    requestId: generateId(),
    source: (body.source as QuoteRecord['source']) ?? 'quote-form',
    status: 'new',
    customerName: String(body.customerName ?? '').trim(),
    phone:        String(body.phone ?? '').trim(),
    city:         String(body.city ?? '').trim() || null,
    deviceType:   String(body.deviceType ?? '').trim() || null,
    deviceBrand:  String(body.deviceBrand ?? '').trim() || null,
    deviceModel:  String(body.deviceModel ?? '').trim() || null,
    partId:       String(body.partId ?? '').trim() || null,
    partNameAR:   String(body.partNameAR ?? '').trim() || null,
    partNameEN:   String(body.partNameEN ?? '').trim() || null,
    partNumber:   String(body.partNumber ?? '').trim() || null,
    faultDescription: String(body.faultDescription ?? '').trim() || null,
    symptoms: Array.isArray(body.symptoms) ? body.symptoms.map(String) : [],
    notes:    String(body.notes ?? '').trim() || null,
    imageNames:          Array.isArray(body.imageNames)          ? body.imageNames.map(String)          : [],
    nameplateImageNames: Array.isArray(body.nameplateImageNames) ? body.nameplateImageNames.map(String) : [],
    createdAt: new Date().toISOString(),
  };

  try {
    const records = await readRecords();
    records.push(record);
    await writeRecords(records);
  } catch (err) {
    console.error('Failed to save quote request:', err);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء حفظ الطلب، حاول مجدداً' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, requestId: record.requestId }, { status: 201 });
}

// Simple read endpoint for internal use (no auth — local dev only)
export async function GET() {
  const records = await readRecords();
  return NextResponse.json({ total: records.length, records });
}
