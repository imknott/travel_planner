import { NextResponse } from 'next/server';

const supportedLocales = ['en', 'es', 'fr', 'de', 'pt', 'zh', 'ja', 'hi', 'ar', 'ru'];

export function middleware(request) {
  const { pathname } = request.nextUrl;
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

  // Rewrite "/" → "/en"
  if (pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/en';
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/((?!api|_next|static|favicon.ico).*)'],
};
