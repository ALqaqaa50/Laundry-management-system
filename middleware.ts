import { NextRequest, NextResponse } from 'next/server';

const LOGIN_PATH = '/admin/login';

function isAuthenticated(req: NextRequest): boolean {
  const token = req.cookies.get('admin_session')?.value;
  if (!token) return false;
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  try {
    const decoded = atob(token);
    return decoded === `laundry_hub_admin:${password}`;
  } catch {
    return false;
  }
}

function unauthorizedJson() {
  return new NextResponse(
    JSON.stringify({ success: false, error: 'غير مصرح' }),
    { status: 401, headers: { 'Content-Type': 'application/json' } }
  );
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method;

  // Admin pages: protect all except /admin/login itself
  if (pathname.startsWith('/admin') && pathname !== LOGIN_PATH) {
    if (!isAuthenticated(req)) {
      return NextResponse.redirect(new URL(LOGIN_PATH, req.url));
    }
  }

  // GET /api/quote — list all records (admin only)
  if (pathname === '/api/quote' && method === 'GET') {
    if (!isAuthenticated(req)) return unauthorizedJson();
  }

  // /api/quote/[id] — GET or PATCH single record (admin only)
  if (/^\/api\/quote\/.+/.test(pathname) && (method === 'GET' || method === 'PATCH')) {
    if (!isAuthenticated(req)) return unauthorizedJson();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/quote', '/api/quote/:path*'],
};
