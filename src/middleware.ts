
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Main middleware function
export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const response = NextResponse.next();

  // A more production-oriented CSP.
  // Start by removing 'unsafe-eval' from script-src and 'ws:'/'wss:' from connect-src.
  // 'unsafe-inline' is kept for script-src and style-src for broader compatibility,
  // but ideally, these would be further restricted with nonces/hashes if all sources are known.
  const cspHeader = [
    `default-src 'self'`,
    // Allow self, nonced scripts, inline scripts (common for UI libs/Next.js internal),
    // and essential Google/Firebase script sources.
    `script-src 'self' 'nonce-${nonce}' 'unsafe-inline' https://apis.google.com https://www.gstatic.com https://*.googleapis.com https://*.firebaseio.com https://*.firebase.com https://securetoken.googleapis.com`,
    // Allow self, inline styles (common for UI libs), and Google Fonts.
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    // Allow images from self, data URIs, https sources, and specific domains used.
    `img-src 'self' data: https: raw.githubusercontent.com placehold.co globcred.org firebasestorage.googleapis.com`,
    // Allow fonts from self, Google Fonts, and data URIs.
    `font-src 'self' https://fonts.gstatic.com data:`,
    // Allow connections to self and specific Firebase/Google API endpoints.
    // Removed ws: wss:
    `connect-src 'self' https://*.googleapis.com https://firestore.googleapis.com https://firebasestorage.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://identitytoolkit.googleapis.com`,
    // Allow frames from self and Firebase auth/widget frames.
    `frame-src 'self' https://*.firebaseapp.com https://*.google.com`,
    // Allow web workers from self and blob.
    `worker-src 'self' blob:`,
    // Restrict where forms can be submitted to.
    `form-action 'self'`,
    // Restrict the base URI.
    `base-uri 'self'`,
    // Disallow <object>, <embed>, <applet>.
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
