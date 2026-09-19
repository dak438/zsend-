import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;
  const token = await getToken({ req, secret });

  // Debug Logging for Netlify Edge Logs
  console.log('[MIDDLEWARE DEBUG] Path:', req.nextUrl.pathname);
  console.log('[MIDDLEWARE DEBUG] Cookies Present:', req.cookies.getAll().map((c) => c.name));
  console.log('[MIDDLEWARE DEBUG] Token Resolved:', !!token, '| Secret Present:', !!secret);

  const { pathname } = req.nextUrl;

  // Protect designated routes
  if (!token && (pathname === '/' || pathname.startsWith('/onboarding') || pathname.startsWith('/progress'))) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/onboarding/:path*', '/progress/:path*'],
};
