
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Main middleware function
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Apply security headers for all environments unless explicitly in very early dev.
  // For a live rollout, these should always be active.
  // if (process.env.NODE_ENV === 'development') {
  //   // return response; // Consider if you need a less strict CSP for local dev
  // }

  // More balanced Content Security Policy for production
  const cspHeader = [
    `default-src 'self'`,
    // 'unsafe-inline' is often needed for Next.js client-side hydration and some libraries.
    // Avoid 'unsafe-eval' in production if at all possible.
    `script-src 'self' 'unsafe-inline' https://apis.google.com https://www.gstatic.com https://*.googleapis.com https://*.firebaseio.com https://*.firebase.com https://securetoken.googleapis.com`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `img-src 'self' data: https: raw.githubusercontent.com placehold.co globcred.org`, // Allow specific external image hosts
    `font-src 'self' https://fonts.gstatic.com data:`,
    // Ensure all necessary Firebase and Google API domains are listed for connect-src
    `connect-src 'self' https://*.googleapis.com https://firestore.googleapis.com https://firebasestorage.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://identitytoolkit.googleapis.com`,
    `frame-src 'self' https://*.firebaseapp.com https://*.google.com`, // For Firebase Auth and Google Sign-In
    `worker-src 'self' blob:`,
    `form-action 'self'`,
    `base-uri 'self'`,
    `object-src 'none'`,
    `frame-ancestors 'none'`, // Disallow embedding in iframes from other origins
  ].join('; ');

  // Standard Security Headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY'); // Stricter than SAMEORIGIN if you don't need to frame your own content
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()'); // Restrict sensitive APIs
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
     * - /images/ (publicly served images) - Adjust if your public image path is different
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images/).*)',
  ],
};
