
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Main middleware function
export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const response = NextResponse.next();

  // CSP configuration with environment-specific settings
  const isDev = process.env.NODE_ENV === 'development';
  
  // For production, use a strict CSP
  // For development, use a more permissive policy
  const cspHeader = isDev 
    ? [
        `default-src 'self'`,
        `script-src 'self' 'unsafe-inline' 'unsafe-eval' https: http:`,
        `style-src 'self' 'unsafe-inline' https: http:`,
        `img-src 'self' data: blob: https: http:`,
        `font-src 'self' data: https: http:`,
        `connect-src 'self' ws: wss: https: http:`,
        `frame-src 'self' https:`,
        `worker-src 'self' blob:`,
        `form-action 'self'`,
        `base-uri 'self'`,
        `object-src 'none'`
      ].join('; ')
    : [
        `default-src 'self'`,
        `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com https://*.googleapis.com https://*.firebaseio.com https://*.firebase.com https://securetoken.googleapis.com`,
        `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
        `img-src 'self' data: blob: https: http: https://raw.githubusercontent.com https://placehold.co https://globcred.org https://firebasestorage.googleapis.com`,
        `font-src 'self' https://fonts.gstatic.com data:`,
        `connect-src 'self' ws: wss: https://*.googleapis.com https://firestore.googleapis.com https://firebasestorage.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://identitytoolkit.googleapis.com https://live-mt-server.wati.io`,
        `frame-src 'self' https://*.firebaseapp.com https://*.google.com`,
        `worker-src 'self' blob:`,
        `form-action 'self'`,
        `base-uri 'self'`,
        `object-src 'none'`,
        `upgrade-insecure-requests`
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
