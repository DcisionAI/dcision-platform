import { MCP, ProblemType } from '../MCPTypes';
import { ModelSolution } from '../agents/ModelRunnerAgent';
import { SolverBackend } from './ORToolsSolver';
import axios from 'axios';

export class ORToolsBackend implements SolverBackend {
  private serviceUrl: string;

  constructor(serviceUrl: string) {
    this.serviceUrl = serviceUrl;
  }

  async buildModel(mcp: MCP): Promise<any> {
    try {
      const response = await axios.post(`${this.serviceUrl}/build`, {
        mcp,
        modelType: this.getModelType(mcp.context.problemType)
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to build model: ${error.message}`);
    }
  }

  async solve(model: any, mcp: MCP): Promise<ModelSolution> {
    try {
      const response = await axios.post(`${this.serviceUrl}/solve`, {
        model,
        mcp,
        modelType: this.getModelType(mcp.context.problemType)
      });

      const solution = response.data;
      return {
        variables: solution.variables,
        objective: {
          value: solution.objectiveValue,
          breakdown: solution.objectiveBreakdown
        },
        statistics: {
          solveTime: solution.solveTime,
          iterations: solution.iterations,
          status: solution.status
        },
        logs: solution.logs
      };
    } catch (error: any) {
      throw new Error(`Failed to solve model: ${error.message}`);
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