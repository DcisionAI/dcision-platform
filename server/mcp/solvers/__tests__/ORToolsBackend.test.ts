import { ORToolsBackend } from '../../services/solver/ORToolsBackend';
import { MCP, MCPStatus, ProblemType } from '../../types/core';

describe('ORToolsBackend', () => {
  let solver: ORToolsBackend;

  beforeEach(() => {
    solver = new ORToolsBackend('http://localhost:8080', true); // Use mock mode for tests
  });

  it('should solve a simple vehicle routing problem', async () => {
    const mockMCP: MCP = {
      sessionId: 'test-session',
      version: '1.0.0',
      context: {
        problemType: 'vehicle_routing' as ProblemType,
        environment: {},
        dataset: { 
          requiredFields: [],
          internalSources: [],
          metadata: {
            userInput: 'Test vehicle routing problem'
          }
        }
      },
      model: {
        variables: [],
        constraints: [],
        objective: { 
          type: 'minimize',
          field: 'total_distance',
          description: 'Minimize total distance',
          weight: 1
        }
      },
      protocol: { 
        steps: [],
        allowPartialSolutions: false,
        explainabilityEnabled: true,
        humanInTheLoop: { required: false, approvalSteps: [] }
      },
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      status: 'pending' as MCPStatus
    };

    const result = await solver.solve(mockMCP);
    expect(result.success).toBe(true);
    expect(result.solution).toBeDefined();
  });
}); 