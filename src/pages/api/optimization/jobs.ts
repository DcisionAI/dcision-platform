import { NextApiRequest, NextApiResponse } from 'next';
import { createRateLimiter } from '@server/api/middleware/rateLimit';
import { authenticate } from '@server/api/middleware/auth';
import { OptimizationService } from '@server/api/optimization/service';
import { CreateJobRequestSchema } from '@server/api/optimization/types';

const optimizationService = new OptimizationService();

// Rate limiting configuration
const rateLimiter = createRateLimiter({
  points: 10,  // 10 requests
  duration: 60, // 1 minute
  uniqueTokenPerInterval: 500
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Check method
    if (req.method === 'POST') {
      // Authenticate request
      const isAuthenticated = await authenticate(req, res);
      if (!isAuthenticated) return;
      
      // Rate limit check
      const isAllowed = await rateLimiter(req, res);
      if (!isAllowed) return;

      // Validate request body
      const validationResult = CreateJobRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: 'Invalid request body', details: validationResult.error });
      }

      // Create job
      const job = await optimizationService.createJob({
        model: req.body.model,
        metadata: {
          userId: (req as any).user.id,
          ...(req.body.metadata || {})
        }
      });
      
      return res.status(201).json(job);
    } 
    
    else if (req.method === 'GET') {
      // Authenticate request
      const isAuthenticated = await authenticate(req, res);
      if (!isAuthenticated) return;

      if (req.query.id) {
        // Get single job
        const job = await optimizationService.getJob(req.query.id as string);
        if (!job) {
          return res.status(404).json({ error: 'Job not found' });
        }
        if (job.metadata.userId !== (req as any).user.id) {
          return res.status(403).json({ error: 'Not authorized to access this job' });
        }
        return res.json(job);
      } else {
        // List jobs
        const jobs = await optimizationService.listJobs({
          ...req.query,
          userId: (req as any).user.id
        });
        return res.json(jobs);
      }
    }
    
    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 