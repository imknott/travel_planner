// middleware.js
import { NextResponse } from 'next/server';

const supportedLocales = ['en', 'es', 'fr', 'de', 'pt', 'ja', 'zh', 'hi', 'ar', 'ru'];
const defaultLocale = 'en';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Skip paths that are already locale-prefixed or static/API routes
  const firstSegment = pathname.split('/')[1];
  if (
    supportedLocales.includes(firstSegment) ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/static')
  ) {
    return NextResponse.next();
  }

  // Only redirect root "/"
  if (pathname === '/') {
    const acceptLang = request.headers.get('accept-language') || '';
    const preferred = acceptLang.slice(0, 2).toLowerCase();
    const locale = supportedLocales.includes(preferred) ? preferred : defaultLocale;

    const url = request.nextUrl.clone();
    url.pathname = `/${locale}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|static|favicon.ico).*)'],
};
