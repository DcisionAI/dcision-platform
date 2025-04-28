import { Step, StepResult } from '@/mcp/MCPTypes';
import { OrchestrationContext } from './OrchestrationContext';

interface RetryPolicy {
  maxAttempts: number;
  delayMs: number;
}

export class StepExecutor {
  private readonly defaultRetryPolicy: RetryPolicy = {
    maxAttempts: 3,
    delayMs: 1000
  };

  constructor(private readonly agents: Record<string, (step: Step, context: OrchestrationContext) => Promise<StepResult>>) {}

  public async runStep(
    step: Step,
    context: OrchestrationContext,
    retryPolicy: RetryPolicy = this.defaultRetryPolicy
  ): Promise<StepResult> {
    let attempts = 0;
    let lastError: Error | null = null;

    while (attempts < retryPolicy.maxAttempts) {
      try {
        const agent = this.agents[step.action];
        if (!agent) {
          throw new Error(`No agent found for action type: ${step.action}`);
        }

        const result = await agent(step, context);
        context.setStepResult(step.id, result);
        return result;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        lastError = error instanceof Error ? error : new Error(errorMessage);
        attempts++;
        
        if (attempts < retryPolicy.maxAttempts) {
          await this.delay(retryPolicy.delayMs);
          context.addWarning(`Retry attempt ${attempts} for step ${step.id}: ${errorMessage}`);
        }
      }
    }

    const errorMessage = `Step ${step.id} failed after ${attempts} attempts. Last error: ${lastError?.message}`;
    context.addError(errorMessage);
    throw new Error(errorMessage);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 