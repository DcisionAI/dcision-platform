import { StepExecutor } from '../../../src/mcp/orchestrator/StepExecutor';
import { OrchestrationContext } from '../../../src/mcp/orchestrator/OrchestrationContext';
import { Step, StepResult, MCP } from '../../../src/mcp/MCPTypes';

describe('StepExecutor', () => {
  let mockStep: Step;
  let mockContext: OrchestrationContext;
  let mockAgents: Record<string, (step: Step, context: OrchestrationContext) => Promise<StepResult>>;
  let executor: StepExecutor;

  beforeEach(() => {
    mockStep = {
      id: 'test-step',
      action: 'collect_data',
      description: 'Test step',
      required: true
    };

    const mockMCP: MCP = {
      id: 'test-mcp',
      name: 'Test MCP',
      description: 'Test MCP',
      variables: [],
      protocol: { steps: [mockStep] }
    };

    mockContext = new OrchestrationContext(mockMCP);

    // Create mock agents
    mockAgents = {
      'collect_data': jest.fn().mockResolvedValue({
        success: true,
        data: { test: 'data' }
      }),
      'validate_constraints': jest.fn().mockResolvedValue({
        success: true
      })
    };

    executor = new StepExecutor(mockAgents);
  });

  it('should execute a step successfully', async () => {
    const result = await executor.runStep(mockStep, mockContext);
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ test: 'data' });
    expect(mockAgents['collect_data']).toHaveBeenCalledWith(mockStep, mockContext);
  });

  it('should throw error for unknown action type', async () => {
    const invalidStep: Step = {
      ...mockStep,
      action: 'invalid_action' as any
    };

    await expect(executor.runStep(invalidStep, mockContext))
      .rejects
      .toThrow('No agent found for action type: invalid_action');
  });

  it('should retry on failure', async () => {
    const failingAgent = jest.fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockRejectedValueOnce(new Error('Second failure'))
      .mockResolvedValueOnce({ success: true });

    const executorWithFailingAgent = new StepExecutor({
      'collect_data': failingAgent
    });

    const result = await executorWithFailingAgent.runStep(
      mockStep,
      mockContext,
      { maxAttempts: 3, delayMs: 0 }
    );

    expect(result.success).toBe(true);
    expect(failingAgent).toHaveBeenCalledTimes(3);
    expect(mockContext.getState().warnings).toHaveLength(2);
  });

  it('should fail after max retries', async () => {
    const failingAgent = jest.fn().mockRejectedValue(new Error('Persistent failure'));

    const executorWithFailingAgent = new StepExecutor({
      'collect_data': failingAgent
    });

    await expect(executorWithFailingAgent.runStep(
      mockStep,
      mockContext,
      { maxAttempts: 2, delayMs: 0 }
    )).rejects.toThrow('Step test-step failed after 2 attempts');

    expect(failingAgent).toHaveBeenCalledTimes(2);
    expect(mockContext.hasErrors()).toBe(true);
  });
}); 