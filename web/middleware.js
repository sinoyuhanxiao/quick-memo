import { NextResponse } from 'next/server';

export function middleware(request) {
  // If APP_PASSWORD is not set, we bypass auth (fail-open for local dev without password)
  if (!process.env.APP_PASSWORD) {
    return NextResponse.next();
  }

  const url = request.nextUrl.pathname;

  // Whitelist public paths
  if (
    url.startsWith('/login') ||
    url.startsWith('/api/auth') ||
    url.startsWith('/_next') ||
    url === '/favicon.ico' ||
    url === '/manifest.js' ||
    url.startsWith('/icon-') ||
    url.endsWith('.svg') ||
    url.endsWith('.png')
  ) {
    return NextResponse.next();
  }

  // Determine expected token
  // A simple base64 encoding of the password acts as our session token
  const expectedToken = Buffer.from(process.env.APP_PASSWORD).toString('base64');

  // Check Cookie (Web browser)
  const cookieAuth = request.cookies.get('auth_token')?.value === expectedToken;
  
  // Check Header (CLI or Desktop app API requests)
  const headerAuth = request.headers.get('x-app-password') === process.env.APP_PASSWORD;

  if (cookieAuth || headerAuth) {
    return NextResponse.next();
  }

  // If it's an API request, return 401 Unauthorized
  if (url.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Otherwise, redirect to login page
  const loginUrl = new URL('/login', request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     */
    '/((?!_next/static|_next/image).*)',
  ],
};
