import { NextApiRequest, NextApiResponse } from 'next';
import { rateLimiterMiddleware, isAuthenticated } from '../../utils/security';

interface ApiHandler {
  (req: NextApiRequest, res: NextApiResponse, user: any): Promise<void> | void;
}

interface WithAuthOptions {
  requireAuth?: boolean;
  requiredRole?: string;
}

const withAuth = (handler: ApiHandler, options: WithAuthOptions = {}) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Apply rate limiting
      const rateLimitResult = await rateLimiterMiddleware(req, res);
      
      // Set rate limit headers
      if (rateLimitResult.headers) {
        Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
      }
      
      if (!rateLimitResult.success) {
        return res.status(429).json({ error: rateLimitResult.error || 'Too Many Requests' });
      }

      // Check authentication if required
      if (options.requireAuth !== false) {
        const { authenticated, user, error } = await isAuthenticated(req);
        
        if (!authenticated || !user) {
          return res.status(401).json({ error: error || 'Unauthorized' });
        }

        // Check role if required
        if (options.requiredRole) {
          // You would need to implement role checking logic here
          // For now, we'll just check if the user has a role claim
          const userRole = user.role; // Assuming the role is in the token
          if (userRole !== options.requiredRole) {
            return res.status(403).json({ error: 'Forbidden' });
          }
        }

        // Set security headers
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        
        // Call the handler with the authenticated user
        return handler(req, res, user);
      }

      // If no auth required, just call the handler
      return handler(req, res, null);
    } catch (error) {
      console.error('API Error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  };
};

export default withAuth;
