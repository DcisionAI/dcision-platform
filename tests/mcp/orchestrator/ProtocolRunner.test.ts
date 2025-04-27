import { ProtocolRunner } from '../../../src/mcp/orchestrator/ProtocolRunner';
import { StepExecutor } from '../../../src/mcp/orchestrator/StepExecutor';
import { MCP, Step, StepResult } from '../../../src/mcp/MCPTypes';

describe('ProtocolRunner', () => {
  let mockMCP: MCP;
  let mockStepExecutor: StepExecutor;
  let runner: ProtocolRunner;

  beforeEach(() => {
    // Create mock MCP with two steps
    mockMCP = {
      id: 'test-mcp',
      name: 'Test MCP',
      description: 'Test MCP for ProtocolRunner',
      variables: [],
      protocol: {
        steps: [
          {
            id: 'step1',
            action: 'collect_data',
            description: 'Step 1',
            required: true
          },
          {
            id: 'step2',
            action: 'validate_constraints',
            description: 'Step 2',
            required: true
          }
        ]
      }
    };

    // Create mock step executor
    const mockAgents = {
      'collect_data': jest.fn().mockResolvedValue({
        success: true,
        data: { step: 1 }
      }),
      'validate_constraints': jest.fn().mockResolvedValue({
        success: true,
        data: { step: 2 }
      })
    };

    mockStepExecutor = new StepExecutor(mockAgents);
    runner = new ProtocolRunner(mockStepExecutor);
  });

  it('should execute all steps successfully', async () => {
    const result = await runner.runProtocol(mockMCP);

    expect(result.success).toBe(true);
    expect(result.state.currentStepIndex).toBe(2);
    expect(Object.keys(result.state.stepResults)).toHaveLength(2);
    expect(result.state.errors).toHaveLength(0);
  });

  it('should handle step failure', async () => {
    const failingAgents = {
      'collect_data': jest.fn().mockRejectedValue(new Error('Step 1 failed')),
      'validate_constraints': jest.fn().mockResolvedValue({
        success: true
      })
    };

    const failingExecutor = new StepExecutor(failingAgents);
    const runnerWithFailingStep = new ProtocolRunner(failingExecutor);

    const result = await runnerWithFailingStep.runProtocol(mockMCP);

    expect(result.success).toBe(false);
    expect(result.state.errors).toHaveLength(1);
    expect(result.state.currentStepIndex).toBe(0);
  });

  it('should stop execution after step failure', async () => {
    const failingAgents = {
      'collect_data': jest.fn().mockRejectedValue(new Error('Step 1 failed')),
      'validate_constraints': jest.fn().mockResolvedValue({
        success: true
      })
    };

    const failingExecutor = new StepExecutor(failingAgents);
    const runnerWithFailingStep = new ProtocolRunner(failingExecutor);

    await runnerWithFailingStep.runProtocol(mockMCP);

    // Second step should never be called
    expect(failingAgents['validate_constraints']).not.toHaveBeenCalled();
  });

  it('should preserve MCP in result', async () => {
    const result = await runner.runProtocol(mockMCP);
    expect(result.mcp).toBe(mockMCP);
  });
}); 