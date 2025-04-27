import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { logger } from '../../utils/Logger';

interface RateLimitConfig {
  points: number;
  duration: number;
}

export function createRateLimiter(config: RateLimitConfig) {
  const limiter = new RateLimiterMemory({
    points: config.points,
    duration: config.duration,
  });

  return async function rateLimitMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const key = req.ip || req.socket.remoteAddress || 'unknown';
      await limiter.consume(key);
      next();
    } catch (error) {
      logger.warn({ ip: req.ip }, 'Rate limit exceeded');
      res.status(429).json({
        error: 'Too many requests, please try again later.',
      });
    }
  };
} 