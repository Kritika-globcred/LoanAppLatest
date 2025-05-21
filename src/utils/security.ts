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

// Verify Firebase ID Token
export const verifyFirebaseToken = async (idToken: string) => {
  try {
    const auth = getAdminAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    return { uid: decodedToken.uid, email: decodedToken.email };
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
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
