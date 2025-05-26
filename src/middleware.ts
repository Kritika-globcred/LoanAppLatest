
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Main middleware function
export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const response = NextResponse.next();

  // Production-focused CSP.
  // Key changes:
  // - Removed 'unsafe-eval' from script-src for better security.
  // - Kept 'unsafe-inline' for script-src as removing it can be complex; test thoroughly if you attempt to remove it.
  // - Refined connect-src for production.
  const cspHeader = [
    `default-src 'self'`,
    // For scripts: allow self, nonced scripts, and inline scripts (consider removing 'unsafe-inline' if possible after thorough testing).
    // Also allow essential Google/Firebase script sources.
    `script-src 'self' 'nonce-${nonce}' 'unsafe-inline' https://apis.google.com https://www.gstatic.com https://*.googleapis.com https://*.firebaseio.com https://*.firebase.com https://securetoken.googleapis.com`,
    // For styles: allow self, inline styles (common for UI libs), and Google Fonts.
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    // For images: allow self, data URIs, https sources, and specific domains used.
    `img-src 'self' data: https: raw.githubusercontent.com placehold.co globcred.org firebasestorage.googleapis.com`,
    // For fonts: allow self, Google Fonts, and data URIs.
    `font-src 'self' https://fonts.gstatic.com data:`,
    // For connections: allow self and specific Firebase/Google API endpoints.
    `connect-src 'self' https://*.googleapis.com https://firestore.googleapis.com https://firebasestorage.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://identitytoolkit.googleapis.com`,
    // For frames: allow self and Firebase auth/widget frames.
    `frame-src 'self' https://*.firebaseapp.com https://*.google.com`,
    // For web workers.
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
