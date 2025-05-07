// middleware.js
import { NextResponse } from 'next/server';

const PUBLIC_FILE = /\.(.*)$/;
const supportedLocales = ['en', 'es', 'fr', 'de', 'pt', 'ja', 'zh', 'hi', 'ar', 'ru'];
const defaultLocale = 'en';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Skip API routes, static files, public folder, etc.
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Already has a supported locale prefix
  const pathnameLocale = pathname.split('/')[1];
  if (supportedLocales.includes(pathnameLocale)) {
    return NextResponse.next();
  }

  // Try to detect from browser language
  const acceptLang = request.headers.get('accept-language') || '';
  const preferredLang = acceptLang.split(',')[0]?.slice(0, 2);
  const detectedLocale = supportedLocales.includes(preferredLang) ? preferredLang : defaultLocale;

  const url = request.nextUrl.clone();
  url.pathname = `/${detectedLocale}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|api|static).*)'],
};
