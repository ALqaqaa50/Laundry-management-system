import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { QuoteRecord } from '@/app/api/quote/route';

const DATA_FILE = path.join(process.cwd(), 'data', 'quote-requests.json');

async function readRecords(): Promise<QuoteRecord[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(raw) as QuoteRecord[];
  } catch {
    return [];
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { requestId: string } },
) {
  const { requestId } = params;

  if (!requestId || typeof requestId !== 'string') {
    return NextResponse.json({ success: false, error: 'رقم الطلب مطلوب' }, { status: 400 });
  }

  const records = await readRecords();
  const record = records.find((r) => r.requestId === requestId.trim().toUpperCase());

  if (!record) {
    return NextResponse.json(
      { success: false, error: 'لم يتم العثور على الطلب. تحقق من الرقم وحاول مجدداً.' },
      { status: 404 },
    );
  }

  // Return only public fields — no phone, name, images, or notes
  return NextResponse.json({
    success: true,
    requestId: record.requestId,
    status: record.status,
    source: record.source,
    createdAt: record.createdAt,
  });
}
