import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { logger } from '../../utils/Logger';

interface ValidationConfig {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}

export const validateRequest = (config: ValidationConfig) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (config.body) {
        req.body = await config.body.parseAsync(req.body);
      }
      if (config.query) {
        req.query = await config.query.parseAsync(req.query);
      }
      if (config.params) {
        req.params = await config.params.parseAsync(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn({ error: error.errors }, 'Validation failed');
        res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }))
        });
      } else {
        logger.error({ error }, 'Validation middleware error');
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };
}; 