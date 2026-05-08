import { NextRequest, NextResponse } from 'next/server';
import type { QuoteStatus } from '@/app/api/quote/route';
import {
  getQuoteRequestById,
  updateQuoteRequestStatus,
} from '@/lib/storage/quotes';

const VALID_STATUSES: QuoteStatus[] = [
  'new', 'reviewing', 'quoted', 'waiting_customer', 'ordered', 'completed', 'rejected',
];

export async function PATCH(
  req: NextRequest,
  { params }: { params: { requestId: string } },
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
      { success: false, error: `حالة غير صالحة. القيم المقبولة: ${VALID_STATUSES.join(', ')}` },
      { status: 422 },
    );
  }

  try {
    const updated = await updateQuoteRequestStatus(requestId, newStatus as QuoteStatus);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'الطلب غير موجود' }, { status: 404 });
    }
    return NextResponse.json({ success: true, record: updated });
  } catch (err) {
    console.error('[PATCH /api/quote/:id]', err);
    return NextResponse.json(
      { success: false, error: 'خطأ في الخادم أثناء التحديث' },
      { status: 500 },
    );
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { requestId: string } },
) {
  try {
    const record = await getQuoteRequestById(params.requestId);
    if (!record) {
      return NextResponse.json({ success: false, error: 'الطلب غير موجود' }, { status: 404 });
    }
    return NextResponse.json({ success: true, record });
  } catch (err) {
    console.error('[GET /api/quote/:id]', err);
    return NextResponse.json({ success: false, error: 'خطأ في الخادم' }, { status: 500 });
  }
}
