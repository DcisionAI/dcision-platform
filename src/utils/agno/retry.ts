import { Agent } from 'agno';

interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  backoffFactor: number;
}

const defaultConfig: RetryConfig = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffFactor: 2
};

export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...defaultConfig, ...config };
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      if (attempt === finalConfig.maxAttempts) break;

      const delay = finalConfig.delayMs * Math.pow(finalConfig.backoffFactor, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

export async function retryAgentChat(
  agent: Agent,
  prompt: string,
  options: { sessionId?: string; context?: Record<string, any> } = {},
  config: Partial<RetryConfig> = {}
): Promise<string> {
  return withRetry(
    () => agent.chat(prompt, options),
    config
  );
} 