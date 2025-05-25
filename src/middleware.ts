import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Main middleware function
async function applyMiddleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Skip security headers in development
  if (process.env.NODE_ENV === 'development') {
    return response;
  }

  // Production security headers
  try {
    // Generate nonce for CSP
    const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
    
    // CSP Header for production
    const csp = [
      `default-src 'self'`,
      `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
      `style-src 'self' 'unsafe-inline'`,
      `img-src 'self' data: blob:`,
      `font-src 'self'`,
      `frame-ancestors 'none'`,
      `form-action 'self'`,
      `base-uri 'self'`,
      `object-src 'none'`,
    ].join('; ');

    // Security Headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    response.headers.set('Content-Security-Policy', csp);
    
    return response;
    
  } catch (error) {
    console.error('Middleware error:', error);
    return response;
  }
}

// Export the middleware function
export default applyMiddleware;

// Middleware configuration
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|json|map)$).*)',
  ],
};
