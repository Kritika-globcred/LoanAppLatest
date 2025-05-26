
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Main middleware function
export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const response = NextResponse.next();

  // A more permissive CSP, suitable for development and as a baseline.
  // IMPORTANT: This should be reviewed and tightened for production.
  const cspHeader = [
    `default-src 'self'`,
    // Allow self, nonced scripts, inline scripts, and eval (Next.js HMR often needs eval in dev).
    // Also allow essential Google/Firebase script sources.
    `script-src 'self' 'nonce-${nonce}' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com https://*.googleapis.com https://*.firebaseio.com https://*.firebase.com https://securetoken.googleapis.com`,
    // Allow self, inline styles (common for UI libs), and Google Fonts.
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    // Allow images from self, data URIs, https sources, and specific domains used.
    `img-src 'self' data: https: raw.githubusercontent.com placehold.co globcred.org firebasestorage.googleapis.com`,
    // Allow fonts from self, Google Fonts, and data URIs.
    `font-src 'self' https://fonts.gstatic.com data:`,
    // Allow connections to self, WebSocket for HMR, and specific Firebase/Google API endpoints.
    `connect-src 'self' ws: wss: https://*.googleapis.com https://firestore.googleapis.com https://firebasestorage.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://identitytoolkit.googleapis.com`,
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
