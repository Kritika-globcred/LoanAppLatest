import { NextApiRequest, NextApiResponse } from 'next';
import rateLimit from 'rate-limiter-flexible';
import { initializeFirebaseAdmin, getAdminAuth } from '../lib/firebase-admin';

// Initialize Firebase Admin if not already initialized
try {
  initializeFirebaseAdmin();
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
}

// Rate limiting
const rateLimiter = new rateLimit.RateLimiterMemory({
  points: 100, // 100 requests
  duration: 900, // per 15 minutes per IP
});

interface RateLimiterResponse {
  success: boolean;
  error?: string;
  headers?: Record<string, string>;
}

export const rateLimiterMiddleware = async (req: NextApiRequest, res: NextApiResponse): Promise<RateLimiterResponse> => {
  try {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
               req.socket.remoteAddress || 
               '';
    
    await rateLimiter.consume(ip);
    
    return {
      success: true,
      headers: {
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': '100', // Simplified for now, can be enhanced with proper rate limit tracking
        'X-RateLimit-Reset': (Math.floor(Date.now() / 1000) + 900).toString()
      }
    };
  } catch (error) {
    return {
      success: false,
      error: 'Too Many Requests',
      headers: {
        'Retry-After': '900',
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': (Math.floor(Date.now() / 1000) + 900).toString()
      }
    };
  }
};

// Token verification rate limiter
const tokenRateLimiter = new rateLimit.RateLimiterMemory({
  points: 10, // 10 token verifications
  duration: 60, // per minute per IP
});

interface TokenVerificationResult {
  uid?: string;
  email?: string | null;
  error?: string;
  isRevoked?: boolean;
  issuedAt?: number;
  expiresAt?: number;
}

/**
 * Enhanced Firebase ID Token verification with additional security checks
 * @param idToken The Firebase ID token to verify
 * @param ipAddress Optional IP address for rate limiting (recommended for server-side usage)
 * @returns Token verification result with user information or error details
 */
export const verifyFirebaseToken = async (
  idToken: string,
  ipAddress?: string
): Promise<TokenVerificationResult> => {
  // Input validation
  if (!idToken || typeof idToken !== 'string') {
    console.warn('Invalid token format');
    return { error: 'Invalid token format' };
  }

  // Apply rate limiting if IP address is provided
  if (ipAddress) {
    try {
      await tokenRateLimiter.consume(ipAddress);
    } catch (rateLimitError) {
      console.warn('Rate limit exceeded for token verification', { ipAddress });
      return { error: 'Too many token verification attempts. Please try again later.' };
    }
  }

  try {
    const auth = getAdminAuth();
    
    // Verify the ID token
    const decodedToken = await auth.verifyIdToken(idToken, true); // Check if token is revoked
    
    // Additional security checks
    const currentTime = Math.floor(Date.now() / 1000);
    const tokenAge = currentTime - (decodedToken.iat || 0);
    
    // Check if token was issued in the future (clock skew tolerance: 5 minutes)
    if (decodedToken.iat && decodedToken.iat > (currentTime + 300)) {
      console.warn('Token issued in the future', { 
        uid: decodedToken.uid, 
        issuedAt: new Date((decodedToken.iat || 0) * 1000).toISOString() 
      });
      return { error: 'Invalid token: token issued in the future' };
    }
    
    // Check if token is too old (1 week)
    if (tokenAge > 60 * 60 * 24 * 7) {
      console.warn('Stale token detected', { 
        uid: decodedToken.uid, 
        ageInDays: (tokenAge / (60 * 60 * 24)).toFixed(2) 
      });
      return { error: 'Token is too old. Please sign in again.' };
    }
    
    // Check if token is about to expire soon (5 minutes)
    const expiresIn = (decodedToken.exp || 0) - currentTime;
    if (expiresIn < 300) { // 5 minutes
      console.info('Token expiring soon', { 
        uid: decodedToken.uid, 
        expiresIn: `${expiresIn}s`,
        expiresAt: new Date((decodedToken.exp || 0) * 1000).toISOString()
      });
      // Continue with the current token but indicate it's about to expire
    }

    return {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      issuedAt: decodedToken.iat,
      expiresAt: decodedToken.exp,
      isRevoked: false
    };
    
  } catch (error: any) {
    // Handle specific Firebase Auth errors
    let errorMessage = 'Token verification failed';
    
    if (error.code === 'auth/id-token-revoked') {
      errorMessage = 'Session revoked. Please sign in again.';
      console.warn('Revoked token attempt', { error: error.message });
    } else if (error.code === 'auth/id-token-expired') {
      errorMessage = 'Session expired. Please sign in again.';
      console.warn('Expired token attempt', { error: error.message });
    } else if (error.code === 'auth/argument-error') {
      errorMessage = 'Invalid token format';
      console.warn('Malformed token', { error: error.message });
    } else {
      console.error('Token verification error:', error);
    }
    
    return { 
      error: errorMessage,
      isRevoked: error.code === 'auth/id-token-revoked',
      ...(error.expiredAt && { expiresAt: error.expiredAt })
    };
  }
};

// Check if user is authenticated
export const isAuthenticated = async (req: NextApiRequest): Promise<{ authenticated: boolean; user?: any; error?: string }> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { authenticated: false, error: 'No token provided' };
    }

    const idToken = authHeader.split('Bearer ')[1];
    const user = await verifyFirebaseToken(idToken);
    
    if (!user) {
      return { authenticated: false, error: 'Invalid token' };
    }

    return { authenticated: true, user };
  } catch (error) {
    console.error('Authentication error:', error);
    return { authenticated: false, error: 'Authentication failed' };
  }
};

// Role-based access control
export const checkUserRole = async (uid: string, requiredRole: string): Promise<boolean> => {
  try {
    const auth = getAdminAuth();
    const user = await auth.getUser(uid);
    const customClaims = user.customClaims || {};
    return customClaims.role === requiredRole;
  } catch (error) {
    console.error('Error checking user role:', error);
    return false;
  }
};
