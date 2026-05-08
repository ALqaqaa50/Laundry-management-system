import { NextRequest, NextResponse } from 'next/server';
import { getPublicTrackingInfo } from '@/lib/storage/quotes';

export async function GET(
  _req: NextRequest,
  { params }: { params: { requestId: string } },
) {
  const { requestId } = params;

  if (!requestId || typeof requestId !== 'string') {
    return NextResponse.json({ success: false, error: 'رقم الطلب مطلوب' }, { status: 400 });
  }

  try {
    const info = await getPublicTrackingInfo(requestId.trim().toUpperCase());

    if (!info) {
      return NextResponse.json(
        { success: false, error: 'لم يتم العثور على الطلب. تحقق من الرقم وحاول مجدداً.' },
        { status: 404 },
      );
    }

    // Return only public fields — no phone, name, images, or notes
    return NextResponse.json({ success: true, ...info });
  } catch (err) {
    console.error('[GET /api/track/:id]', err);
    return NextResponse.json({ success: false, error: 'خطأ في الخادم' }, { status: 500 });
  }
}
