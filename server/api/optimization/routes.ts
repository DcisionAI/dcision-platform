import express, { Request, Response } from 'express';
import { validateRequest } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { createRateLimiter } from '../middleware/rateLimit';
import {
  CreateJobRequestSchema,
  ListJobsQuerySchema,
  JobSchema,
  JobStatusSchema
} from './types';
import { OptimizationService } from './service';
import { logger } from '../../utils/Logger';

const router = express.Router();
const optimizationService = new OptimizationService();

// Rate limiting configuration
const createJobLimiter = createRateLimiter({
  points: 10,  // 10 requests
  duration: 60 // 1 minute
});

/**
 * Create a new optimization job
 * POST /api/optimization/jobs
 */
router.post(
  '/jobs',
  authenticate,
  createJobLimiter,
  validateRequest({ body: CreateJobRequestSchema }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const job = await optimizationService.createJob({
        model: req.body.model,
        metadata: {
          userId: req.user.id,
          ...(req.body.metadata || {})
        }
      });
      res.status(201).json(job);
      return;
    } catch (error) {
      logger.error({ error }, 'Failed to create optimization job');
      res.status(500).json({
        error: 'Failed to create optimization job',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
      return;
    }
  }
);

/**
 * List optimization jobs
 * GET /api/optimization/jobs
 */
router.get(
  '/jobs',
  authenticate,
  validateRequest({ query: ListJobsQuerySchema }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const jobs = await optimizationService.listJobs({
        ...req.query,
        userId: req.user.id
      });
      res.json(jobs);
      return;
    } catch (error) {
      logger.error({ error }, 'Failed to list optimization jobs');
      res.status(500).json({
        error: 'Failed to list optimization jobs',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
      return;
    }
  }
);

/**
 * Get optimization job by ID
 * GET /api/optimization/jobs/:id
 */
router.get(
  '/jobs/:id',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const job = await optimizationService.getJob(req.params.id);
      if (!job) {
        res.status(404).json({ error: 'Job not found' });
        return;
      }
      if (job.metadata.userId !== req.user.id) {
        res.status(403).json({ error: 'Not authorized to access this job' });
        return;
      }
      res.json(job);
      return;
    } catch (error) {
      logger.error({ error }, 'Failed to get optimization job');
      res.status(500).json({
        error: 'Failed to get optimization job',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
      return;
    }
  }
);

/**
 * Cancel optimization job
 * POST /api/optimization/jobs/:id/cancel
 */
router.post(
  '/jobs/:id/cancel',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const job = await optimizationService.getJob(req.params.id);
      if (!job) {
        res.status(404).json({ error: 'Job not found' });
        return;
      }
      if (job.metadata.userId !== req.user.id) {
        res.status(403).json({ error: 'Not authorized to cancel this job' });
        return;
      }
      await optimizationService.cancelJob(req.params.id);
      res.json({ message: 'Job cancelled successfully' });
      return;
    } catch (error) {
      logger.error({ error }, 'Failed to cancel optimization job');
      res.status(500).json({
        error: 'Failed to cancel optimization job',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
      return;
    }
  }
);

/**
 * Get job solution
 * GET /api/optimization/jobs/:id/solution
 */
router.get(
  '/jobs/:id/solution',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const job = await optimizationService.getJob(req.params.id);
      if (!job) {
        res.status(404).json({ error: 'Job not found' });
        return;
      }
      if (job.metadata.userId !== req.user.id) {
        res.status(403).json({ error: 'Not authorized to access this job' });
        return;
      }
      if (!job.solution) {
        res.status(404).json({ error: 'Solution not available' });
        return;
      }
      res.json(job.solution);
      return;
    } catch (error) {
      logger.error({ error }, 'Failed to get job solution');
      res.status(500).json({
        error: 'Failed to get job solution',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
      return;
    }
  }
);

export default router; 