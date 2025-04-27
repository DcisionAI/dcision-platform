import { MCP, ProblemType } from '../MCPTypes';
import { ModelSolution } from '../agents/ModelRunnerAgent';

export interface SolverBackend {
  buildModel(mcp: MCP): Promise<any>;
  solve(model: any, mcp: MCP): Promise<ModelSolution>;
}

export class ORToolsSolver {
  private backend: SolverBackend;

  constructor(backend: SolverBackend) {
    this.backend = backend;
  }

  async buildModel(mcp: MCP): Promise<any> {
    return this.backend.buildModel(mcp);
  }

  async solve(model: any, mcp: MCP): Promise<ModelSolution> {
    return this.backend.solve(model, mcp);
  }

  private getModelType(problemType: ProblemType): 'CP-SAT' | 'VRP' | 'MIP' {
    const modelMap: Record<ProblemType, 'CP-SAT' | 'VRP' | 'MIP'> = {
      'job_shop': 'CP-SAT',
      'flow_shop': 'CP-SAT',
      'nurse_scheduling': 'CP-SAT',
      'resource_scheduling': 'CP-SAT',
      'project_scheduling': 'CP-SAT',
      'vehicle_routing': 'VRP',
      'fleet_scheduling': 'VRP',
      'multi_depot_routing': 'VRP',
      'pickup_delivery': 'VRP',
      'traveling_salesman': 'VRP',
      'bin_packing': 'MIP',
      'inventory_optimization': 'MIP',
      'production_planning': 'MIP',
      'assignment': 'MIP',
      'custom': 'CP-SAT'
    };
    return modelMap[problemType] || 'CP-SAT';
  }
}

// Mock solver backend for development/testing
export class MockSolverBackend implements SolverBackend {
  async buildModel(mcp: MCP): Promise<any> {
    return {
      type: 'mock_model',
      problemType: mcp.context.problemType,
      variables: mcp.model.variables.length,
      constraints: mcp.model.constraints.length
    };
  }

  async solve(model: any, mcp: MCP): Promise<ModelSolution> {
    return {
      variables: {
        // Mock solution variables
        routes: [
          [1, 2, 3],
          [4, 5, 6]
        ]
      },
      objective: {
        value: 1234.56,
        breakdown: {
          distance: 1000,
          time: 234.56
        }
      },
      statistics: {
        solveTime: 1234,
        iterations: 100,
        status: 'OPTIMAL'
      },
      logs: [
        'Started solving...',
        'Initial solution found...',
        'Improving solution...',
        'Optimal solution found'
      ]
    };
  }
} 