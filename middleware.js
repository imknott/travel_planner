import { NextResponse } from 'next/server';

const supportedLocales = ['en', 'es', 'fr', 'de', 'pt', 'ja', 'zh', 'hi', 'ar', 'ru'];
const defaultLocale = 'en';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Skip if already has a locale (e.g., /en, /es)
  const firstSegment = pathname.split('/')[1];
  if (supportedLocales.includes(firstSegment)) {
    return NextResponse.next();
  }

  // Only redirect from root path "/"
  if (pathname === '/') {
    const acceptLang = request.headers.get('accept-language') || '';
    const browserLang = acceptLang.split(',')[0]?.slice(0, 2);
    const locale = supportedLocales.includes(browserLang) ? browserLang : defaultLocale;

    const url = request.nextUrl.clone();
    url.pathname = `/${locale}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|favicon.ico|static).*)'],
};
