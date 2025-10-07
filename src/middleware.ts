import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Allow only the landing page and static assets
  const { pathname } = request.nextUrl;
  
  // Allow these paths
  if (
    pathname === '/' ||                    // Landing page
    pathname.startsWith('/_next') ||       // Next.js internals
    pathname.startsWith('/api') ||         // API routes (if needed)
    pathname.startsWith('/Images') ||      // Images folder
    pathname.includes('.')                 // Static files (favicon, etc.)
  ) {
    return NextResponse.next();
  }
  
  // Redirect everything else to landing page
  return NextResponse.redirect(new URL('/', request.url));
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

