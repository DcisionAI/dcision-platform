import { IntentInterpreterAgent } from '../IntentInterpreterAgent';
import { MCP, MCPStatus, ProtocolStep } from '../../types/core';
import { LLMService } from '../../services/LLMService';

jest.mock('../../services/LLMService');

describe('IntentInterpreterAgent', () => {
  let agent: IntentInterpreterAgent;
  let mockLLMService: jest.Mocked<LLMService>;

  const mockMCP: MCP = {
    sessionId: 'test-session-123',
    version: '1.0.0',
    status: 'pending' as MCPStatus,
    created: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    context: {
      problemType: 'vehicle_routing',
      environment: {
        region: 'us-west',
        timezone: 'America/Los_Angeles'
      },
      dataset: {
        internalSources: ['vehicles', 'locations', 'demands'],
        metadata: {
          userInput: 'Optimize vehicle routes for delivery in San Francisco'
        }
      }
    },
    model: {
      variables: [],
      constraints: [],
      objective: {
        type: 'minimize',
        field: 'total_distance',
        description: 'Minimize total distance traveled',
        weight: 1
      }
    },
    protocol: {
      steps: [],
      allowPartialSolutions: false,
      explainabilityEnabled: true,
      humanInTheLoop: { required: false, approvalSteps: [] }
    }
  };

  const mockStep: ProtocolStep = {
    id: 'step-1',
    action: 'interpret_intent',
    description: 'Interpret the optimization problem intent',
    required: true,
    status: 'pending'
  };

  beforeEach(() => {
    mockLLMService = {
      interpretIntent: jest.fn().mockResolvedValue({
        problemType: 'vehicle_routing',
        context: {
          vehicles: 3,
          locations: 5,
          demands: 4
        }
      }),
      generateConstraints: jest.fn(),
      validateModel: jest.fn(),
      enrichData: jest.fn(),
      explainSolution: jest.fn()
    } as jest.Mocked<LLMService>;

    agent = new IntentInterpreterAgent();
  });

  describe('run', () => {
    it('should interpret intent using LLM when available', async () => {
      const result = await agent.run(
        mockStep,
        mockMCP,
        { llm: mockLLMService }
      );

      expect(result.output.success).toBe(true);
      expect(result.output.problemType).toBe('vehicle_routing');
      expect(result.output.context).toEqual({
        vehicles: 3,
        locations: 5,
        demands: 4
      });
      expect(result.thoughtProcess).toContain('LLM identified problem type');
    });

    it('should fall back to basic interpretation when LLM is not available', async () => {
      const result = await agent.run(
        mockStep,
        mockMCP
      );

      expect(result.output.success).toBe(true);
      expect(result.output.problemType).toBe('vehicle_routing');
      expect(result.output.context).toBeDefined();
      expect(result.thoughtProcess).toContain('Interpreting optimization problem intent');
      expect(result.thoughtProcess).toContain('Determined problem type: vehicle_routing');
    });

    it('should handle LLM interpretation errors gracefully', async () => {
      mockLLMService.interpretIntent.mockRejectedValueOnce(new Error('LLM error'));

      const result = await agent.run(
        mockStep,
        mockMCP,
        { llm: mockLLMService }
      );

      expect(result.output.success).toBe(true);
      expect(result.thoughtProcess).toContain('Failed to interpret intent using LLM');
    });

    it('should throw error for unsupported actions', async () => {
      const invalidStep = {
        ...mockStep,
        action: 'invalid_action'
      };
      await expect(agent.run(
        invalidStep,
        mockMCP
      )).rejects.toThrow('Unsupported action');
    });
  });

  describe('determineProblemType', () => {
    it('should identify vehicle routing problems', () => {
      const type = agent['determineProblemType']('Optimize vehicle routes for delivery');
      expect(type).toBe('vehicle_routing');
    });

    it('should identify job shop problems', () => {
      const type = agent['determineProblemType']('Schedule jobs on machines');
      expect(type).toBe('job_shop');
    });

    it('should return custom for unknown problems', () => {
      const type = agent['determineProblemType']('Some random text');
      expect(type).toBe('custom');
    });
  });

  describe('extractBasicContext', () => {
    it('should extract numbers from description', () => {
      const context = agent['extractBasicContext']('3 vehicles, 5 locations, 4 demands');
      expect(context.numbers).toEqual([3, 5, 4]);
    });

    it('should extract keywords from description', () => {
      const context = agent['extractBasicContext']('Optimize vehicle routes for delivery');
      expect(context.keywords).toContain('optimize');
      expect(context.keywords).toContain('vehicle');
      expect(context.keywords).toContain('routes');
    });
  });
}); 