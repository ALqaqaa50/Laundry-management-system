import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'طلب غير صالح' }, { status: 400 });
  }

  const { password } = body;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error('[admin/login] ADMIN_PASSWORD env var not set');
    return NextResponse.json({ success: false, error: 'خطأ في إعداد الخادم' }, { status: 500 });
  }

  if (!password || password !== adminPassword) {
    return NextResponse.json({ success: false, error: 'كلمة المرور غير صحيحة' }, { status: 401 });
  }

  const token = btoa(`laundry_hub_admin:${password}`);
  const res = NextResponse.json({ success: true });
  res.cookies.set('admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });

  return res;
}
