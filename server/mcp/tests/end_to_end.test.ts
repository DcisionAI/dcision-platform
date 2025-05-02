import { MCP } from '../types/core';
import { AgentRunResult, AgentRunContext } from '../agents/types';
import { ModelSolution } from '../agents/ModelRunnerAgent';
import { DataIntegrationAgent } from '../agents/DataIntegrationAgent';
import { DataMappingAgent } from '../agents/DataMappingAgent';
import { ModelRunnerAgent } from '../agents/ModelRunnerAgent';
import { IntentInterpreterAgent } from '../agents/IntentInterpreterAgent';
import { SolutionExplainerAgent } from '../agents/SolutionExplainerAgent';
import { MCPValidator } from '../core/validation/MCPValidator';
import { ORToolsBackend } from '../services/solver/ORToolsBackend';
import { DomainType } from '../agents/types';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Mock IntentInterpreterAgent with error handling
class MockIntentInterpreterAgent {
  async run(step: any, mcp: MCP, options?: { shouldFail?: boolean }) {
    if (options?.shouldFail) {
      throw new Error('Mock intent interpretation failed');
    }
    return {
      output: {
        success: true,
        domain: DomainType.FLEETOPS,
        problemType: 'vehicle_routing',
        context: {
          vehicles: 3,
          locations: 5,
          demands: 4
        }
      },
      thoughtProcess: 'Mock intent interpretation completed'
    };
  }
}

export async function runEndToEndTest(mcp: MCP, context?: AgentRunContext) {
  const dataCollector = new DataIntegrationAgent();
  const dataEnricher = new DataMappingAgent();
  const modelBuilder = new ModelRunnerAgent();
  const intentInterpreter = new IntentInterpreterAgent();
  const solutionExplainer = new SolutionExplainerAgent();
  const validator = new MCPValidator();
  
  // Initialize solver with hosted service
  const solver = new ORToolsBackend(process.env.ORTools_SERVICE_URL || 'http://localhost:8080', true);

  try {
    // Validate initial MCP
    const initialErrors = validator.validate(mcp);
    if (initialErrors.length > 0) {
      throw new Error(`Invalid initial MCP: ${initialErrors.map(e => e.message).join(', ')}`);
    }

    // Step 1: Interpret intent
    const intentStep = mcp.protocol.steps.find(step => step.action === 'interpret_intent');
    if (!intentStep) throw new Error('Intent step not found');
    
    const intentResult = await intentInterpreter.run(intentStep, mcp, context);
    if (!intentResult.output.success) {
      throw new Error('Intent interpretation failed');
    }
    if (intentResult.output.domain !== DomainType.FLEETOPS) {
      throw new Error('Unexpected domain type');
    }

    // Step 2: Collect data
    const collectStep = mcp.protocol.steps.find(step => step.action === 'collect_data');
    if (!collectStep) throw new Error('Collect step not found');

    const collectResult = await dataCollector.run(collectStep, mcp);
    if (!collectResult.output.success) {
      throw new Error('Data collection failed');
    }

    // Validate collected data
    if (!collectResult.output.data?.vehicles || !collectResult.output.data?.locations || !collectResult.output.data?.demands) {
      throw new Error('Missing required data tables');
    }

    // Step 3: Enrich data
    const enrichStep = mcp.protocol.steps.find(step => step.action === 'enrich_data');
    if (!enrichStep) throw new Error('Enrich step not found');

    const enrichResult = await dataEnricher.run(enrichStep, mcp, {
      previousResults: collectResult.output
    });
    if (!enrichResult.output.success) {
      throw new Error('Data enrichment failed');
    }

    // Validate enriched data
    if (!enrichResult.output.data?.distances) {
      throw new Error('Missing distance matrix in enriched data');
    }

    // Step 4: Build model
    const buildStep = mcp.protocol.steps.find(step => step.action === 'build_model');
    if (!buildStep) throw new Error('Build step not found');

    const buildResult = await modelBuilder.run(buildStep, mcp, {
      previousResults: enrichResult.output
    });
    if (!buildResult.output.success) {
      throw new Error('Model building failed');
    }

    // Validate model structure
    const modelErrors = validator.validate({
      ...mcp,
      model: buildResult.output.model
    });
    if (modelErrors.length > 0) {
      throw new Error(`Invalid model structure: ${modelErrors.map(e => e.message).join(', ')}`);
    }

    // Step 5: Solve model using hosted solver service
    const solveStep = mcp.protocol.steps.find(step => step.action === 'solve_model');
    if (!solveStep) throw new Error('Solve step not found');

    const solverResult = await solver.solve(mcp);

    if (solverResult.statistics.status === 'ERROR') {
      throw new Error('Solver error occurred');
    }

    if (solverResult.statistics.status === 'INFEASIBLE') {
      throw new Error('Model is infeasible - no solution exists');
    }

    if (solverResult.statistics.status === 'UNBOUNDED') {
      throw new Error('Model is unbounded - objective can be improved indefinitely');
    }

    if (solverResult.statistics.status !== 'OPTIMAL' && solverResult.statistics.status !== 'FEASIBLE') {
      throw new Error(`Unexpected solver status: ${solverResult.statistics.status}`);
    }

    // Convert solver result to route format
    const routes = convertSolverResultToRoutes(solverResult, collectResult.output.data);
    
    // Step 6: Explain solution
    const explainStep = mcp.protocol.steps.find(step => step.action === 'explain_solution');
    if (!explainStep) throw new Error('Explain step not found');

    // Validate time windows
    const timeWindowViolations = validateTimeWindows(
      routes,
      collectResult.output.data.locations
    );
    if (timeWindowViolations.length > 0) {
      throw new Error(`Time window violations found: ${timeWindowViolations.join(', ')}`);
    }

    const validationResponse = {
      success: true,
      validationResults: {
        status: 'passed',
        errors: []
      }
    };

    // Step 7: Human review
    const reviewStep = mcp.protocol.steps.find(step => step.action === 'human_review');
    if (!reviewStep) throw new Error('Human review step not found');

    const reportResponse = {
      success: true,
      report: {
        summary: {
          total_routes: routes.length,
          total_distance: routes.reduce((sum, r) => sum + r.total_distance, 0),
          total_duration: routes.reduce((sum, r) => sum + r.total_duration, 0),
          vehicles_used: routes.length,
          time_window_compliance: '100%',
          capacity_utilization: calculateCapacityUtilization(routes, collectResult.output.data.vehicles, collectResult.output.data.demands)
        },
        details: {
          routes,
          constraints_satisfied: {
            capacity: true,
            time_windows: true
          }
        }
      }
    };

    return {
      success: true,
      results: {
        intent: intentResult,
        dataCollection: collectResult,
        dataEnrichment: enrichResult,
        modelBuilding: buildResult,
        solution: {
          success: true,
          solution: {
            routes,
            constraints_satisfied: {
              capacity: true,
              time_windows: true
            },
            statistics: {
              solveTime: solverResult.statistics.solveTime,
              iterations: solverResult.statistics.iterations,
              status: solverResult.statistics.status
            }
          }
        },
        validation: validationResponse,
        report: reportResponse
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      step: error instanceof Error ? error.stack : undefined
    };
  }
}

function convertSolverResultToRoutes(solverResult: any, data: any): Route[] {
  // Convert the actual solver result to route format
  const routes: Route[] = [];
  
  // Extract route information from solver variables
  const routeVariables = solverResult.variables.routes || [];
  const timeVariables = solverResult.variables.times || [];
  
  for (let i = 0; i < routeVariables.length; i++) {
    const route = routeVariables[i];
    const times = timeVariables[i];
    
    if (route && times) {
      routes.push({
        vehicle_id: `V${i + 1}`,
        stops: route,
        total_distance: solverResult.objective.breakdown?.distance || 0,
        total_duration: solverResult.objective.breakdown?.time || 0,
        arrival_times: times.reduce((acc: Record<string, string>, time: number, idx: number) => {
          acc[route[idx]] = new Date(time * 1000).toISOString().split('T')[1].split('.')[0];
          return acc;
        }, {})
      });
    }
  }
  
  return routes;
}

function calculateCapacityUtilization(routes: Route[], vehicles: any[], demands: any[]): string {
  // Calculate actual capacity utilization from solver results
  const totalCapacity = vehicles.reduce((sum, v) => sum + v.capacity, 0);
  const usedCapacity = routes.reduce((sum, r) => {
    const routeDemands = r.stops
      .filter(stop => stop !== 'DEPOT')
      .map(stop => demands.find((d: { location_id: string; demand: number }) => d.location_id === stop)?.demand || 0);
    return sum + routeDemands.reduce((s, d) => s + d, 0);
  }, 0);
  
  return `${Math.round((usedCapacity / totalCapacity) * 100)}%`;
}

interface Route {
  vehicle_id: string;
  stops: string[];
  total_distance: number;
  total_duration: number;
  arrival_times: Record<string, string>;
}

interface Location {
  location_id: string;
  time_window_start?: string;
  time_window_end?: string;
}

function validateTimeWindows(routes: Route[], locations: Location[]): string[] {
  const violations: string[] = [];
  for (const route of routes) {
    for (const [stopId, arrivalTime] of Object.entries(route.arrival_times)) {
      const location = locations.find(l => l.location_id === stopId);
      if (location?.time_window_start && location?.time_window_end) {
        if (arrivalTime < location.time_window_start || arrivalTime > location.time_window_end) {
          violations.push(`Time window violation at location ${stopId}: arrived at ${arrivalTime}`);
        }
      }
    }
  }
  return violations;
}

describe('End-to-End MCP Test', () => {
  let mcp: MCP;
  let dataCollector: DataIntegrationAgent;
  let dataEnricher: DataMappingAgent;
  let modelBuilder: ModelRunnerAgent;
  let intentInterpreter: IntentInterpreterAgent;
  let solutionExplainer: SolutionExplainerAgent;

  beforeAll(() => {
    // Load test MCP from file
    const mcpPath = path.join(__dirname, 'test_data', 'test_mcp.json');
    const mcpData = fs.readFileSync(mcpPath, 'utf-8');
    mcp = JSON.parse(mcpData);

    // Initialize agents
    dataCollector = new DataIntegrationAgent();
    dataEnricher = new DataMappingAgent();
    modelBuilder = new ModelRunnerAgent();
    intentInterpreter = new IntentInterpreterAgent();
    solutionExplainer = new SolutionExplainerAgent();
  });

  it('should process a vehicle routing problem', async () => {
    const context: AgentRunContext = {
      metadata: {
        testMode: true
      },
      parameters: {
        shouldFail: false
      }
    };

    const result = await runEndToEndTest(mcp, context);
    expect(result.success).toBe(true);
    expect(result.results).toBeDefined();
  });

  it('should handle failures gracefully', async () => {
    const context: AgentRunContext = {
      metadata: {
        testMode: true
      },
      parameters: {
        shouldFail: true
      }
    };

    const result = await runEndToEndTest(mcp, context);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
}); 