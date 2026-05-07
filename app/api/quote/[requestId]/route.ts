// ⚠️ WARNING: No authentication on this endpoint.
// Restrict access via middleware or network policy before any public deployment.

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'quote-requests.json');

export type QuoteStatus =
  | 'new'
  | 'reviewing'
  | 'quoted'
  | 'waiting_customer'
  | 'ordered'
  | 'completed'
  | 'rejected';

const VALID_STATUSES: QuoteStatus[] = [
  'new', 'reviewing', 'quoted', 'waiting_customer', 'ordered', 'completed', 'rejected',
];

export async function PATCH(
  req: NextRequest,
  { params }: { params: { requestId: string } }
) {
  const { requestId } = params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'طلب غير صالح' }, { status: 400 });
  }

  const newStatus = body.status;

  if (!newStatus || !VALID_STATUSES.includes(newStatus as QuoteStatus)) {
    return NextResponse.json(
      {
        success: false,
        error: `حالة غير صالحة. القيم المقبولة: ${VALID_STATUSES.join(', ')}`,
      },
      { status: 422 }
    );
  }

  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    const records: Record<string, unknown>[] = JSON.parse(raw);

    const idx = records.findIndex((r) => r.requestId === requestId);

    if (idx === -1) {
      return NextResponse.json({ success: false, error: 'الطلب غير موجود' }, { status: 404 });
    }

    records[idx] = {
      ...records[idx],
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    await fs.writeFile(DATA_FILE, JSON.stringify(records, null, 2), 'utf-8');

    return NextResponse.json({ success: true, record: records[idx] });
  } catch (err) {
    console.error('[PATCH /api/quote/:id]', err);
    return NextResponse.json(
      { success: false, error: 'خطأ في الخادم أثناء التحديث' },
      { status: 500 }
    );
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    const records: Record<string, unknown>[] = JSON.parse(raw);
    const record = records.find((r) => r.requestId === params.requestId);

    if (!record) {
      return NextResponse.json({ success: false, error: 'الطلب غير موجود' }, { status: 404 });
    }

    return NextResponse.json({ success: true, record });
  } catch {
    return NextResponse.json({ success: false, error: 'خطأ في الخادم' }, { status: 500 });
  }
}
