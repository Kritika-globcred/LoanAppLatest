
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Main middleware function
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Check if we're running on Firebase Hosting
  const host = request.headers.get('host') || '';
  const isFirebaseHosting = host.includes('web.app') || host.includes('firebaseapp.com');
  
  // If we're on Firebase Hosting, let it handle the CSP headers
  if (isFirebaseHosting) {
    return response;
  }
  
  // Only apply our CSP headers if not on Firebase Hosting
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const isDev = process.env.NODE_ENV === 'development';
  
  // For local development, use a more permissive policy
  if (isDev) {
    response.headers.set('Content-Security-Policy', [
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
    ].join('; ').replace(/\s{2,}/g, ' ').trim());
  }
  
  // Common security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
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
