import { OrchestrationContext } from '../../../src/mcp/orchestrator/OrchestrationContext';
import { MCP, Variable, Step, StepResult } from '../../../src/mcp/MCPTypes';

describe('OrchestrationContext', () => {
  let mockMCP: MCP;
  let context: OrchestrationContext;

  beforeEach(() => {
    mockMCP = {
      id: 'test-mcp',
      name: 'Test MCP',
      description: 'Test MCP for unit tests',
      variables: [
        {
          name: 'testVar',
          type: 'number',
          description: 'Test variable',
          default: 42,
          required: true
        }
      ],
      protocol: {
        steps: [
          {
            id: 'step1',
            action: 'collect_data',
            description: 'Test step 1',
            required: true
          },
          {
            id: 'step2',
            action: 'validate_constraints',
            description: 'Test step 2',
            required: true
          }
        ]
      }
    };
    context = new OrchestrationContext(mockMCP);
  });

  describe('initialization', () => {
    it('should initialize variables with default values', () => {
      expect(context.getVariable('testVar')).toBe(42);
    });

    it('should start at step index 0', () => {
      expect(context.getCurrentStep()).toBe(mockMCP.protocol.steps[0]);
    });
  });

  describe('state management', () => {
    it('should advance step correctly', () => {
      context.advanceStep();
      expect(context.getCurrentStep()).toBe(mockMCP.protocol.steps[1]);
    });

    it('should detect completion correctly', () => {
      expect(context.isComplete()).toBe(false);
      context.advanceStep();
      context.advanceStep();
      expect(context.isComplete()).toBe(true);
    });
  });

  describe('variable management', () => {
    it('should set and get variables', () => {
      context.setVariable('testVar', 100);
      expect(context.getVariable('testVar')).toBe(100);
    });
  });

  describe('results management', () => {
    it('should set and get step results', () => {
      const result: StepResult = {
        success: true,
        data: { value: 'test' }
      };
      context.setStepResult('step1', result);
      expect(context.getStepResult('step1')).toEqual(result);
    });
  });

  describe('error and warning management', () => {
    it('should track errors correctly', () => {
      expect(context.hasErrors()).toBe(false);
      context.addError('Test error');
      expect(context.hasErrors()).toBe(true);
      expect(context.getState().errors).toContain('Test error');
    });

    it('should track warnings', () => {
      context.addWarning('Test warning');
      expect(context.getState().warnings).toContain('Test warning');
    });
  });

  describe('state immutability', () => {
    it('should return a copy of state', () => {
      const state = context.getState();
      state.errors.push('New error');
      expect(context.getState().errors).not.toContain('New error');
    });
  });
}); 