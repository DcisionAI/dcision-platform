import { MCP, ProblemType } from '../types/core';
import { ModelSolution } from '../agents/ModelRunnerAgent';
import axios from 'axios';

export interface SolverBackend {
  solve(model: any): Promise<ModelSolution>;
}

export class ORToolsSolver {
  private backend: SolverBackend;
  private solverServiceUrl: string;

  constructor(backend: SolverBackend) {
    this.backend = backend;
    // Use environment variable for solver service URL, default to local development
    this.solverServiceUrl = process.env.ORTools_SERVICE_URL || 'http://localhost:8081';
  }

  async solve(model: any, mcp: MCP): Promise<ModelSolution> {
    try {
      // Transform the model into the format expected by the /solve endpoint
      const solveRequest = {
        type: this.getModelType(mcp.context.problemType).toLowerCase(),
        variables: model.variables.map((v: any) => ({
          name: v.name,
          type: v.type.toLowerCase(),
          lower_bound: v.min ?? 0,
          upper_bound: v.max ?? 1000
        })),
        constraints: model.constraints.map((c: any) => ({
          expression: c.field,
          operator: c.operator === 'gte' ? '>=' : c.operator === 'lte' ? '<=' : c.operator === 'eq' ? '=' : c.operator,
          rhs: c.value
        })).filter((c: any) => c.expression && c.operator && c.rhs !== undefined),
        objective: {
          type: model.objective.type.toLowerCase(),
          expression: model.objective.expression || model.objective.field
        }
      };

      // Call the solver service
      const response = await axios.post(`${this.solverServiceUrl}/solve`, solveRequest);
      
      // Transform the response into the expected format
      return {
        variables: response.data.solution,
        objective: {
          value: response.data.objective_value
        },
        statistics: {
          status: response.data.status.toUpperCase(),
          solveTime: response.data.solve_time || 0,
          iterations: response.data.iterations || 0
        },
        logs: response.data.logs || []
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        const errorMessage = error.response.data.detail;
        if (errorMessage.includes('Failed to solve lp')) {
          throw new Error(`Solver type ${this.getModelType(mcp.context.problemType)} is not implemented yet`);
        }
      }
      console.error('Error solving model:', error);
      throw error;
    }
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