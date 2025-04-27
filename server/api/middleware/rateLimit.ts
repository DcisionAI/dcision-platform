import { NextApiRequest, NextApiResponse } from 'next';
import { LRUCache } from 'lru-cache';

interface RateLimitConfig {
  uniqueTokenPerInterval?: number;
  interval?: number;
  points: number;
  duration: number;
}

const rateLimit = (options: RateLimitConfig) => {
  const tokenCache = new LRUCache({
    max: options.uniqueTokenPerInterval || 500,
    ttl: options.interval || 60000,
  });

  return async function rateLimitMiddleware(
    req: NextApiRequest,
    res: NextApiResponse
  ): Promise<boolean> {
    const token = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'anonymous';
    const tokenCount = (tokenCache.get(token) as number[]) || [0];
    
    if (tokenCount[0] === 0) {
      tokenCache.set(token, tokenCount);
    }
    
    tokenCount[0] += 1;

    const currentUsage = tokenCount[0];
    const maxRequests = options.points;
    const timeWindow = options.duration;

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - currentUsage));

    if (currentUsage > maxRequests) {
      res.status(429).json({ error: 'Rate limit exceeded' });
      return false;
    }

    return true;
  };
}

export const createRateLimiter = rateLimit; 