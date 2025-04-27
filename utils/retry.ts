import { z } from 'zod';
import pino from 'pino';

const logger = pino({
  name: 'retry-utility',
  level: process.env.LOG_LEVEL || 'info'
});

// Configuration schema for retry options
const RetryOptionsSchema = z.object({
  maxAttempts: z.number().int().positive().default(3),
  initialDelay: z.number().int().positive().default(1000),
  maxDelay: z.number().int().positive().default(10000),
  backoffFactor: z.number().positive().default(2),
  retryableErrors: z.array(z.instanceof(Error)).optional(),
  onRetry: z.function()
    .args(z.object({ 
      error: z.any(),
      attempt: z.number(),
      nextDelay: z.number()
    }))
    .optional()
});

type RetryOptions = z.infer<typeof RetryOptionsSchema>;

/**
 * Calculates exponential backoff delay
 */
function calculateDelay(attempt: number, options: RetryOptions): number {
  const delay = options.initialDelay * Math.pow(options.backoffFactor, attempt - 1);
  return Math.min(delay, options.maxDelay);
}

/**
 * Checks if an error is retryable based on configured error types
 */
function isRetryableError(error: any, retryableErrors?: Error[]): boolean {
  if (!retryableErrors?.length) {
    return true;
  }
  return retryableErrors.some(retryableError => error instanceof retryableError.constructor);
}

/**
 * Implements retry logic with exponential backoff
 * @param operation - Async function to retry
 * @param options - Retry configuration options
 * @returns Promise that resolves with operation result or rejects after max attempts
 */
export async function retry<T>(
  operation: () => Promise<T>,
  options?: Partial<RetryOptions>
): Promise<T> {
  // Validate and merge options with defaults
  const validatedOptions = RetryOptionsSchema.parse({
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
    ...options
  });

  let lastError: Error = new Error('Operation failed');

  for (let attempt = 1; attempt <= validatedOptions.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error: unknown) {
      if (!(error instanceof Error)) {
        throw new Error('Non-error object thrown');
      }
      lastError = error;

      // Check if error is retryable
      if (!isRetryableError(error, validatedOptions.retryableErrors)) {
        logger.error({ error, attempt }, 'Non-retryable error encountered');
        throw error;
      }

      // Check if we should retry
      if (attempt === validatedOptions.maxAttempts) {
        logger.error(
          { error, attempt: validatedOptions.maxAttempts },
          'Max retry attempts reached'
        );
        throw new Error(
          `Operation failed after ${validatedOptions.maxAttempts} attempts: ${error.message}`,
          { cause: error }
        );
      }

      // Calculate next delay
      const nextDelay = calculateDelay(attempt, validatedOptions);

      // Log retry attempt
      logger.warn(
        { error, attempt, nextDelay },
        `Retry attempt ${attempt} failed, retrying in ${nextDelay}ms`
      );

      // Call onRetry callback if provided
      if (validatedOptions.onRetry) {
        validatedOptions.onRetry({ error, attempt, nextDelay });
      }

      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, nextDelay));
    }
  }

  // This should never happen due to the throw in the loop
  throw lastError;
} 