import { z } from 'zod';
import { ModelSchema, SolutionSchema } from '../../solvers/types';

// API Request/Response types
export const CreateJobRequestSchema = z.object({
  model: ModelSchema,
  metadata: z.object({
    userId: z.string(),
    organizationId: z.string().optional(),
    tags: z.array(z.string()).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    callbackUrl: z.string().url().optional(),
  }).optional()
});

export const JobStatusSchema = z.enum([
  'PENDING',
  'QUEUED',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'CANCELLED'
]);

export const JobSchema = z.object({
  id: z.string(),
  status: JobStatusSchema,
  model: ModelSchema,
  solution: SolutionSchema.optional(),
  metadata: z.object({
    userId: z.string(),
    organizationId: z.string().optional(),
    tags: z.array(z.string()).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    callbackUrl: z.string().url().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
    startedAt: z.string().optional(),
    completedAt: z.string().optional(),
    error: z.string().optional()
  }),
  stats: z.object({
    queueTime: z.number().optional(),
    solveTime: z.number().optional(),
    totalTime: z.number().optional()
  }).optional()
});

// Query parameters
export const ListJobsQuerySchema = z.object({
  status: JobStatusSchema.optional(),
  userId: z.string().optional(),
  organizationId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  from: z.string().optional(), // ISO date string
  to: z.string().optional(),   // ISO date string
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional()
});

// Export types
export type CreateJobRequest = z.infer<typeof CreateJobRequestSchema>;
export type JobStatus = z.infer<typeof JobStatusSchema>;
export type Job = z.infer<typeof JobSchema>;
export type ListJobsQuery = z.infer<typeof ListJobsQuerySchema>; 