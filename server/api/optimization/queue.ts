import { Job } from './types';
import { logger } from '../../utils/Logger';

export class JobQueue {
  private queue: Job[];
  private processing: Set<string>;

  constructor() {
    this.queue = [];
    this.processing = new Set();
  }

  async enqueue(job: Job): Promise<void> {
    // Add job to queue based on priority
    const priority = this.getPriorityValue(job.metadata.priority);
    const index = this.queue.findIndex(
      queuedJob => this.getPriorityValue(queuedJob.metadata.priority) < priority
    );

    if (index === -1) {
      this.queue.push(job);
    } else {
      this.queue.splice(index, 0, job);
    }

    job.status = 'QUEUED';
    logger.info({ jobId: job.id }, 'Job added to queue');
  }

  async dequeue(): Promise<Job | undefined> {
    // Get next job that isn't being processed
    const job = this.queue.find(job => !this.processing.has(job.id));
    if (!job) {
      return undefined;
    }

    // Mark job as being processed
    this.processing.add(job.id);
    this.queue = this.queue.filter(queuedJob => queuedJob.id !== job.id);

    logger.info({ jobId: job.id }, 'Job dequeued for processing');
    return job;
  }

  async complete(jobId: string): Promise<void> {
    this.processing.delete(jobId);
    logger.info({ jobId }, 'Job processing completed');
  }

  async fail(jobId: string): Promise<void> {
    this.processing.delete(jobId);
    logger.error({ jobId }, 'Job processing failed');
  }

  private getPriorityValue(priority: string | undefined): number {
    switch (priority) {
      case 'HIGH':
        return 3;
      case 'MEDIUM':
        return 2;
      case 'LOW':
        return 1;
      default:
        return 2; // Default to MEDIUM priority
    }
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  getProcessingCount(): number {
    return this.processing.size;
  }
} 