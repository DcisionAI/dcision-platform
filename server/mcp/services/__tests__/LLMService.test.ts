import { LLMService, LLMServiceImpl } from '../LLMService';
import { LLMServiceFactory } from '../LLMServiceFactory';

jest.mock('../LLMServiceFactory');

describe('LLMService', () => {
  let llmService: LLMService;
  const mockLLMResponse = {
    content: JSON.stringify({
      problemType: 'vehicle_routing',
      context: {
        vehicles: 3,
        locations: 5,
        demands: 4
      }
    }),
    usage: {
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150
    }
  };

  beforeEach(() => {
    // Mock the LLM service factory
    (LLMServiceFactory.getInstance as jest.Mock).mockReturnValue({
      interpretIntent: jest.fn().mockResolvedValue({
        problemType: 'vehicle_routing',
        context: {
          vehicles: 3,
          locations: 5,
          demands: 4
        }
      }),
      generateConstraints: jest.fn().mockResolvedValue({
        constraints: ['sum(route_assignment) <= vehicle_capacity'],
        reasoning: 'Based on vehicle capacity limits'
      }),
      validateModel: jest.fn().mockResolvedValue({
        issues: [],
        suggestions: ['Consider adding time window constraints']
      }),
      enrichData: jest.fn().mockResolvedValue({
        enrichedData: {
          vehicles: [
            { id: 1, capacity: 100, location: 'depot' },
            { id: 2, capacity: 150, location: 'depot' }
          ]
        },
        reasoning: 'Added location information to vehicles'
      }),
      explainSolution: jest.fn().mockResolvedValue({
        explanation: 'The solution minimizes total distance while respecting capacity constraints',
        insights: ['Route 1 serves high-priority customers', 'Route 2 handles bulk deliveries']
      })
    });

    llmService = LLMServiceFactory.getInstance();
  });

  describe('interpretIntent', () => {
    it('should interpret problem description correctly', async () => {
      const description = 'Optimize vehicle routes for delivery in San Francisco';
      const result = await llmService.interpretIntent(description);
      
      expect(result).toEqual({
        problemType: 'vehicle_routing',
        context: {
          vehicles: 3,
          locations: 5,
          demands: 4
        }
      });
    });
  });

  describe('generateConstraints', () => {
    it('should generate constraints from business rules', async () => {
      const businessRules = 'Vehicles have capacity limits and must return to depot';
      const result = await llmService.generateConstraints(businessRules);
      
      expect(result).toEqual({
        constraints: ['sum(route_assignment) <= vehicle_capacity'],
        reasoning: 'Based on vehicle capacity limits'
      });
    });
  });

  describe('validateModel', () => {
    it('should validate model and provide suggestions', async () => {
      const model = {
        variables: [{ name: 'route_assignment', type: 'integer' }],
        constraints: [{ type: 'capacity', expression: 'sum(route_assignment) <= 100' }]
      };
      const result = await llmService.validateModel(model, 'vehicle_routing');
      
      expect(result).toEqual({
        issues: [],
        suggestions: ['Consider adding time window constraints']
      });
    });
  });

  describe('enrichData', () => {
    it('should enrich data with additional context', async () => {
      const data = {
        vehicles: [
          { id: 1, capacity: 100 },
          { id: 2, capacity: 150 }
        ]
      };
      const context = { problemType: 'vehicle_routing' };
      const result = await llmService.enrichData(data, context);
      
      expect(result).toEqual({
        enrichedData: {
          vehicles: [
            { id: 1, capacity: 100, location: 'depot' },
            { id: 2, capacity: 150, location: 'depot' }
          ]
        },
        reasoning: 'Added location information to vehicles'
      });
    });
  });

  describe('explainSolution', () => {
    it('should explain solution in business terms', async () => {
      const solution = {
        routes: [
          { vehicle: 1, stops: ['depot', 'customer1', 'customer2', 'depot'] },
          { vehicle: 2, stops: ['depot', 'customer3', 'depot'] }
        ],
        totalDistance: 150
      };
      const result = await llmService.explainSolution(solution, 'vehicle_routing');
      
      expect(result).toEqual({
        explanation: 'The solution minimizes total distance while respecting capacity constraints',
        insights: ['Route 1 serves high-priority customers', 'Route 2 handles bulk deliveries']
      });
    });
  });
}); 