import { OrchestrationContext } from './OrchestrationContext';
import { Step, StepResult, StepAction } from '../mcp/types';

type StepAgent = (step: Step, context: OrchestrationContext) => Promise<StepResult>;

export class StepExecutor {
  private agents: Map<StepAction, StepAgent>;
  private defaultRetryPolicy = {
    maxAttempts: 3,
    backoffMs: 1000
  };

  constructor(agents?: Record<StepAction, StepAgent>) {
    this.agents = new Map();
    if (agents) {
      Object.entries(agents).forEach(([action, agent]) => {
        this.registerAgent(action as StepAction, agent);
      });
    }
  }

  public registerAgent(action: StepAction, agent: StepAgent): void {
    this.agents.set(action, agent);
  }

  public async executeStep(step: Step, context: OrchestrationContext): Promise<StepResult> {
    const agent = this.agents.get(step.action);
    if (!agent) {
      return {
        success: false,
        error: `No agent registered for action: ${step.action}`
      };
    }

    const retryPolicy = step.retryPolicy || this.defaultRetryPolicy;
    let lastError: string | undefined;
    let attempt = 0;

    while (attempt < retryPolicy.maxAttempts) {
      try {
        // Execute the step with timeout if specified
        const result = await this.executeWithTimeout(
          agent(step, context),
          step.timeout
        );

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        attempt++;

        if (attempt < retryPolicy.maxAttempts) {
          // Wait before retrying with exponential backoff
          await this.delay(retryPolicy.backoffMs * Math.pow(2, attempt - 1));
        }
      }
    }

    return {
      success: false,
      error: `Step failed after ${attempt} attempts. Last error: ${lastError}`
    };
  }

  private async executeWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs?: number
  ): Promise<T> {
    if (!timeoutMs) {
      return promise;
    }

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Step execution timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
