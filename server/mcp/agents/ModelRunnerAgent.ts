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
    thoughtProcess.push(`- Variables: ${Object.keys(modelComponents.variables).length}`);
    thoughtProcess.push(`- Constraints: ${modelComponents.constraints.length}`);
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
    thoughtProcess.push('Solving optimization model...');
    try {
      // Bind data to the model template and send both to the solver backend
      const payload = {
        model: mcp.model,
        data: mcp.context.dataset
      };
      console.log('[ModelRunnerAgent] Solver payload:', JSON.stringify(payload, null, 2));
      // Use the actual solver service
      const solution = await this.solver.solve(payload);
      thoughtProcess.push(`Model solved successfully in ${solution.statistics.solveTime}ms`);
      thoughtProcess.push(`Objective value: ${solution.objective.value}`);
      thoughtProcess.push(`Solution status: ${solution.statistics.status}`);
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
    // This would be replaced with actual model building logic
    // Mock implementation for now
    return {
      variables: {
        // Example variables based on problem type
        ...(mcp.context.problemType === 'vehicle_routing' && {
          routes: 'Array of route assignments',
          times: 'Array of visit times'
        })
      },
      constraints: [
        // Example constraints
        'Capacity constraints',
        'Time window constraints'
      ],
      objective: 'Minimize total distance'
    };
  }
}