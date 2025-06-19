import { MCP, OrchestrationResult } from '../../pages/api/_lib/mcp/MCPTypes';
import { OrchestrationContext } from './OrchestrationContext';
import { StepExecutor } from './StepExecutor';

export class ProtocolRunner {
  constructor(private readonly stepExecutor: StepExecutor) {}

  public async runProtocol(mcp: MCP): Promise<OrchestrationResult> {
    const context = new OrchestrationContext(mcp);

    try {
      while (!context.isComplete()) {
        const currentStep = context.getCurrentStep();
        
        // Execute the current step
        await this.stepExecutor.runStep(currentStep, context);
        
        // Move to next step if no errors
        if (!context.hasErrors()) {
          context.advanceStep();
        } else {
          break;
        }
      }

      // Return final state
      return {
        success: !context.hasErrors(),
        state: context.getState(),
        mcp: context.getMCP()
      };
    } catch (error) {
      context.addError(`Protocol execution failed: ${(error as Error).message}`);
      return {
        success: false,
        state: context.getState(),
        mcp: context.getMCP()
      };
    }
  }
} 