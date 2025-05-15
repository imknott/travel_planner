import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Allow system routes to pass through
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/static')
  ) {
    return NextResponse.next();
  }

  // No rewriting needed — allow everything else
  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/((?!api|_next|static|favicon.ico).*)'],
};
