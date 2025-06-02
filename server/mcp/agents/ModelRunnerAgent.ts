import { MCPAgent, AgentType, AgentRunContext, AgentRunResult, StepAction } from './types';
import { ProtocolStep, MCP, ProblemType } from '../types/core';
import { ORToolsBackend } from '../services/solver/ORToolsBackend';

export interface ModelSolution {
  variables: Record<string, any>;
  objective: {
    value: number;
    breakdown?: Record<string, number>;
  };
  statistics: {
    solveTime: number;
    iterations: number;
    status: string;
  };
  logs: string[];
}

export class ModelRunnerAgent implements MCPAgent {
  name = 'Model Runner Agent';
  type: AgentType = 'model_builder';
  supportedActions: StepAction[] = ['build_model', 'solve_model'];
  private solver: ORToolsBackend;

  constructor() {
    // Initialize the solver with the hosted service backend
    this.solver = new ORToolsBackend(process.env.ORTools_SERVICE_URL || 'https://solver-service-<hash>-uc.a.run.app');
  }

  async run(step: ProtocolStep, mcp: MCP, context?: AgentRunContext): Promise<AgentRunResult> {
    const thoughtProcess: string[] = [];
    
    if (step.action === 'build_model') {
      return this.buildModel(mcp, thoughtProcess, context);
    } else if (step.action === 'solve_model') {
      return this.solveModel(mcp, thoughtProcess, context);
    }

    throw new Error(`Unsupported action: ${step.action}`);
  }

  private async buildModel(mcp: MCP, thoughtProcess: string[], context?: AgentRunContext): Promise<AgentRunResult> {
    thoughtProcess.push('Building optimization model...');

    // Select appropriate solver based on problem type
    const solver = this.getSolverForProblemType(mcp.context.problemType);
    thoughtProcess.push(`Selected ${solver} solver for ${mcp.context.problemType}`);

    // Build model components
    const modelComponents = await this.buildModelComponents(mcp);
    thoughtProcess.push('Built model components:');
    // Summary differs by problem type
    if (mcp.context.problemType === 'vehicle_routing' && modelComponents.fleet) {
      const { vehicles, customers } = modelComponents.fleet;
      const distCount = Array.isArray(modelComponents.data?.distances)
        ? modelComponents.data.distances.length
        : 0;
      thoughtProcess.push(`- Vehicles: ${vehicles?.length ?? 0}`);
      thoughtProcess.push(`- Customers: ${customers?.length ?? 0}`);
      thoughtProcess.push(`- Distances entries: ${distCount}`);
    } else {
      const varCount = modelComponents.variables
        ? Object.keys(modelComponents.variables).length
        : 0;
      const consCount = Array.isArray(modelComponents.constraints)
        ? modelComponents.constraints.length
        : 0;
      thoughtProcess.push(`- Variables: ${varCount}`);
      thoughtProcess.push(`- Constraints: ${consCount}`);
    }
    thoughtProcess.push(`- Objective function defined`);

    // Use LLM for enhanced functionality if available
    if (context?.llm) {
      // Generate constraints from business rules
      if (mcp.context.businessRules) {
        try {
          const { constraints, reasoning } = await context.llm.generateConstraints(
            JSON.stringify(mcp.context.businessRules)
          );
          thoughtProcess.push(`LLM generated constraints: ${constraints.join(', ')}`);
          thoughtProcess.push(`Constraint reasoning: ${reasoning}`);
          modelComponents.constraints.push(...constraints);
        } catch (error) {
          thoughtProcess.push('Failed to generate constraints using LLM');
        }
      }

      // Validate model structure
      try {
        const { issues, suggestions } = await context.llm.validateModel(
          modelComponents,
          mcp.context.problemType
        );
        if (issues.length > 0) {
          thoughtProcess.push('Model validation issues:');
          issues.forEach((issue: string) => thoughtProcess.push(`- ${issue}`));
        }
        if (suggestions.length > 0) {
          thoughtProcess.push('Model improvement suggestions:');
          suggestions.forEach((suggestion: string) => thoughtProcess.push(`- ${suggestion}`));
        }
      } catch (error) {
        thoughtProcess.push('Failed to validate model using LLM');
      }
    }

    return {
      output: {
        success: true,
        solver,
        modelComponents,
        readyToSolve: true
      },
      thoughtProcess: thoughtProcess.join('\n')
    };
  }

  private async solveModel(mcp: MCP, thoughtProcess: string[], context?: AgentRunContext): Promise<AgentRunResult> {
    thoughtProcess.push('Building model components for solver...');
    // Build dynamic model components based on MCP and potential LLM enhancements
    const modelComponents = await this.buildModelComponents(mcp);
    // Summarize built components
    if (mcp.context.problemType === 'vehicle_routing' && modelComponents.fleet) {
      const { vehicles, customers } = modelComponents.fleet;
      const distCount = Array.isArray(modelComponents.data?.distances)
        ? modelComponents.data.distances.length
        : 0;
      thoughtProcess.push(`Built model components: Vehicles(${vehicles?.length}), Customers(${customers?.length}), Distances entries(${distCount}), Objective defined`);
    } else {
      const varCount = modelComponents.variables
        ? Object.keys(modelComponents.variables).length
        : 0;
      const consCount = Array.isArray(modelComponents.constraints)
        ? modelComponents.constraints.length
        : 0;
      thoughtProcess.push(`Built model components: Variables(${varCount}), Constraints(${consCount}), Objective defined`);
    }
    thoughtProcess.push('Formatting solver request payload based on problem type...');
    // Leverage solver backend to format the request for its API
    const payload = this.solver.formatRequestData(modelComponents, mcp);
    thoughtProcess.push('Sending request to solver backend');
    console.log('[ModelRunnerAgent] Formatted solver payload:', JSON.stringify(payload, null, 2));
    try {
      const solution = await this.solver.solve(payload);
      // Log stats if provided
      if (solution.statistics) {
        thoughtProcess.push(`Model solved successfully in ${solution.statistics.solveTime ?? 'N/A'}ms`);
        thoughtProcess.push(`Objective value: ${solution.objective?.value ?? solution.statistics.objective ?? 'N/A'}`);
        thoughtProcess.push(`Solution status: ${solution.statistics.status ?? 'N/A'}`);
      } else {
        thoughtProcess.push('Model solved, but no statistics returned by solver');
      }
      // Use LLM to explain the solution if available
      if (context?.llm) {
        try {
          const { explanation, insights } = await context.llm.explainSolution(
            solution,
            mcp.context.problemType
          );
          thoughtProcess.push('Solution explanation:');
          thoughtProcess.push(explanation);
          thoughtProcess.push('Key insights:');
          if (insights && insights.length > 0) {
            thoughtProcess.push('Solution Insights:');
            insights.forEach((insight: string) => {
              thoughtProcess.push(`- ${insight}`);
            });
          }
        } catch (error) {
          thoughtProcess.push('Failed to generate solution explanation using LLM');
        }
      }
      return {
        output: {
          success: true,
          solution,
          logs: solution.logs
        },
        thoughtProcess: thoughtProcess.join('\n')
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error occurred';
      thoughtProcess.push(`Error solving model: ${errorMessage}`);
      return {
        output: {
          success: false,
          error: 'Failed to solve model',
          details: errorMessage
        },
        thoughtProcess: thoughtProcess.join('\n')
      };
    }
  }

  private getSolverForProblemType(problemType: ProblemType): string {
    // Map problem types to appropriate solvers
    const solverMap: Record<ProblemType, string> = {
      'vehicle_routing': 'OR-Tools VRP',
      'job_shop': 'OR-Tools CP-SAT',
      'bin_packing': 'OR-Tools MIP',
      'resource_scheduling': 'OR-Tools CP-SAT',
      'fleet_scheduling': 'OR-Tools VRP',
      'multi_depot_routing': 'OR-Tools VRP',
      'pickup_delivery': 'OR-Tools VRP',
      'project_scheduling': 'OR-Tools CP-SAT',
      'flow_shop': 'OR-Tools CP-SAT',
      'nurse_scheduling': 'OR-Tools CP-SAT',
      'inventory_optimization': 'OR-Tools MIP',
      'production_planning': 'OR-Tools MIP',
      'traveling_salesman': 'OR-Tools VRP',
      'assignment': 'OR-Tools MIP',
      'custom': 'OR-Tools CP-SAT'
    };

    return solverMap[problemType] || 'OR-Tools CP-SAT';
  }

  private async buildModelComponents(mcp: MCP): Promise<any> {
    // Build model components based on problem type
    if (mcp.context.problemType === 'vehicle_routing') {
      // Read domain model from mcp.model
      const vrpModel: any = (mcp as any).model;
      const vehicles = Array.isArray(vrpModel.vehicles) ? vrpModel.vehicles : [];
      const locations = Array.isArray(vrpModel.locations) ? vrpModel.locations : [];
      const tasks = Array.isArray(vrpModel.tasks) ? vrpModel.tasks : [];
      const distanceMatrix: number[][] = Array.isArray(vrpModel.distance_matrix)
        ? vrpModel.distance_matrix
        : [];
      // Build depots from vehicle start locations
      const depotIds = vehicles.map((v: any) => v.start_location);
      const uniqueDepotIds = Array.from(new Set(depotIds));
      const depots = uniqueDepotIds.map((id: any) => {
        const loc = locations.find((l: any) => l.id === id) || {};
        const veh = vehicles.find((v: any) => v.start_location === id);
        const end = veh?.max_route_time_hours ? veh.max_route_time_hours * 3600 : 86400;
        return {
          ...loc,
          timeWindows: [ { start: 0, end } ]
        };
      });
      // Build customers from tasks, embedding location info
      const customers = tasks.map((t: any) => {
        const loc = locations.find((l: any) => l.id === t.location) || {};
        return {
          id: t.id,
          latitude: loc.latitude ?? loc.lat,
          longitude: loc.longitude ?? loc.lon,
          name: String(t.id),
          timeWindows: Array.isArray(t.time_window)
            ? t.time_window.map((tw: any) => ({ start: tw[0], end: tw[1] }))
            : []
        };
      });
      // Format distances array
      const distances = distanceMatrix.map((row: number[], i: number) => ({
        from_id: locations[i]?.id,
        distances: row.map((d: number, j: number) => ({ to_id: locations[j]?.id, distance: d }))
      }));
      return {
        fleet: { vehicles, depots, customers },
        data: { distances }
      };
    }
    // Fallback for other problem types: use generic model
    return {
      variables: mcp.model?.variables || [],
      constraints: mcp.model?.constraints || [],
      objective: mcp.model?.objective || { type: 'minimize', field: '', description: '', weight: 1 }
    };
  }
}