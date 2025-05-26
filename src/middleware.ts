
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Main middleware function
export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const response = NextResponse.next();

  // CSP for Production - 'unsafe-eval' and 'ws:'/'wss:' removed
  // 'unsafe-inline' is kept for script-src as Next.js might still need it for some internal operations or if noncing isn't perfect.
  // It's also kept for style-src as UI libraries often rely on it.
  const cspHeader = [
    `default-src 'self'`,
    // IMPORTANT: 'unsafe-eval' removed for production. Test thoroughly.
    `script-src 'self' 'nonce-${nonce}' 'unsafe-inline' https://apis.google.com https://www.gstatic.com https://*.googleapis.com https://*.firebaseio.com https://*.firebase.com https://securetoken.googleapis.com`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `img-src 'self' data: https://raw.githubusercontent.com https://placehold.co https://globcred.org https://firebasestorage.googleapis.com`,
    `font-src 'self' https://fonts.gstatic.com data:`,
    // Removed ws: wss: from connect-src for production
    `connect-src 'self' https://*.googleapis.com https://firestore.googleapis.com https://firebasestorage.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://identitytoolkit.googleapis.com`,
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
