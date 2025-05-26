
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Main middleware function
export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const response = NextResponse.next();

  // CSP for development/preview environments - more permissive
  // Includes 'unsafe-eval' for Next.js Fast Refresh and ws: wss: for HMR.
  const cspHeader = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com https://*.googleapis.com https://*.firebaseio.com https://*.firebase.com https://securetoken.googleapis.com`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `img-src 'self' data: https: raw.githubusercontent.com placehold.co globcred.org firebasestorage.googleapis.com`,
    `font-src 'self' https://fonts.gstatic.com data:`,
    `connect-src 'self' https://*.googleapis.com https://firestore.googleapis.com https://firebasestorage.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://identitytoolkit.googleapis.com ws: wss:`,
    `frame-src 'self' https://*.firebaseapp.com https://*.google.com`,
    `worker-src 'self' blob:`,
    `form-action 'self'`,
    `base-uri 'self'`,
    `object-src 'none'`,
  ].join('; ');

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Content-Security-Policy', cspHeader.replace(/\s{2,}/g, ' ').trim());

  return response;
}

// Middleware configuration
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - /images/ (publicly served images from /public/images)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images/).*)',
  ],
};
