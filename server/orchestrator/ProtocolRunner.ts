import { OrchestrationContext } from './OrchestrationContext';
import { StepExecutor } from './StepExecutor';
import { Step } from '../mcp/types';
import { Session, SessionStatus } from '../sessions/types';

export interface ProtocolResult {
  success: boolean;
  sessionId: string;
  completedSteps: string[];
  failedStep?: string;
  error?: string;
  outputs: Record<string, any>;
}

export class ProtocolRunner {
  private context: OrchestrationContext;
  private executor: StepExecutor;

  constructor(session: Session) {
    this.context = new OrchestrationContext(session);
    this.executor = new StepExecutor();
  }

  async executeProtocol(): Promise<ProtocolResult> {
    const session = this.context.getSession();
    const steps = session.protocol.steps;
    const completedSteps: string[] = [];

    try {
      // Initialize session status
      await this.updateSessionStatus(SessionStatus.RUNNING);

      // Execute steps sequentially
      for (const step of steps) {
        try {
          // Pre-step validation
          this.validateStep(step);
          
          // Update current step in context
          this.context.setCurrentStep(step.id);
          
          // Execute step
          const stepResult = await this.executor.executeStep(step, this.context);
          
          // Process step result
          if (!stepResult.success) {
            throw new Error(`Step ${step.id} failed: ${stepResult.error}`);
          }

          // Update context with step outputs
          if (stepResult.outputs) {
            this.context.addStepOutputs(step.id, stepResult.outputs);
          }

          completedSteps.push(step.id);
          
          // Update session status
          await this.updateSessionStatus(SessionStatus.RUNNING, {
            currentStep: step.id,
            progress: (completedSteps.length / steps.length) * 100
          });

        } catch (error) {
          // Handle step failure
          const errorMessage = error instanceof Error ? error.message : String(error);
          await this.updateSessionStatus(SessionStatus.FAILED, {
            error: errorMessage,
            failedStep: step.id
          });

          return {
            success: false,
            sessionId: session.id,
            completedSteps,
            failedStep: step.id,
            error: errorMessage,
            outputs: this.context.getAllOutputs()
          };
        }
      }

      // All steps completed successfully
      await this.updateSessionStatus(SessionStatus.COMPLETED);

      return {
        success: true,
        sessionId: session.id,
        completedSteps,
        outputs: this.context.getAllOutputs()
      };

    } catch (error) {
      // Handle protocol-level errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.updateSessionStatus(SessionStatus.FAILED, {
        error: errorMessage
      });

      return {
        success: false,
        sessionId: session.id,
        completedSteps,
        error: errorMessage,
        outputs: this.context.getAllOutputs()
      };
    }
  }

  private validateStep(step: Step): void {
    if (!step.id) {
      throw new Error('Step ID is required');
    }
    if (!step.action) {
      throw new Error(`Step ${step.id}: Action is required`);
    }
    // Add more validation as needed
  }

  private async updateSessionStatus(
    status: SessionStatus,
    details: Record<string, any> = {}
  ): Promise<void> {
    try {
      const session = this.context.getSession();
      // Update session status in database
      await this.context.updateSession({
        ...session,
        status,
        lastUpdated: new Date().toISOString(),
        ...details
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Failed to update session status:', errorMessage);
      // Don't throw here to prevent status update failures from breaking execution
    }
  }
}
