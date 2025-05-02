import { MCP } from '../types/core';
import { AgentRunResult } from '../agents/types';
import { ModelSolution } from '../agents/ModelRunnerAgent';
import { DataCollectorAgent } from '../agents/DataCollectorAgent';
import { DataEnricherAgent } from '../agents/DataEnricherAgent';
import { ModelBuilderAgent } from '../agents/ModelBuilderAgent';
import { IntentInterpreterAgent } from '../agents/IntentInterpreterAgent';
import { SolutionExplainerAgent } from '../agents/SolutionExplainerAgent';
import { MCPValidator } from '../core/validation/MCPValidator';
import { ORToolsBackend } from '../services/solver/ORToolsBackend';
import { LLMServiceFactory } from '../services/llm/LLMServiceFactory';
import { DomainType } from '../agents/types';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function runEndToEndWithLLMTest(mcp: MCP): Promise<{
  success: boolean;
  results?: {
    intent: AgentRunResult;
    dataCollection: AgentRunResult;
    dataEnrichment: AgentRunResult;
    modelBuilding: AgentRunResult;
    solution: ModelSolution;
    review: AgentRunResult;
  };
  error?: string;
}> {
  try {
    const dataCollector = new DataCollectorAgent();
    const dataEnricher = new DataEnricherAgent();
    const modelBuilder = new ModelBuilderAgent();
    const intentInterpreter = new IntentInterpreterAgent();
    const solutionExplainer = new SolutionExplainerAgent();
    const validator = new MCPValidator();

    // Initialize solver with hosted service
    const solver = new ORToolsBackend(process.env.ORTools_SERVICE_URL || 'http://localhost:8080', true);

    // Initialize LLM service
    const llm = LLMServiceFactory.getInstance();

    // Step 1: Interpret intent using LLM
    const intentStep = mcp.protocol.steps.find(step => step.action === 'interpret_intent');
    if (!intentStep) throw new Error('Intent step not found');
    
    const intentResult = await intentInterpreter.run(intentStep, mcp, {
      llm,
      parameters: {
        llmConfig: {
          model: 'gpt-4',
          temperature: 0.2,
          maxTokens: 500
        }
      }
    });
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
      previousResults: collectResult.output,
      parameters: {
        enrichmentRules: {
          calculate_distances: true
        }
      }
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

    // Step 6: Explain solution using LLM
    const explainStep = mcp.protocol.steps.find(step => step.action === 'explain_solution');
    if (!explainStep) throw new Error('Explain step not found');

    const explainResult = await solutionExplainer.run(explainStep, mcp, {
      previousResults: {
        solution: solverResult,
        data: collectResult.output.data
      },
      llmConfig: {
        model: 'gpt-4',
        temperature: 0.3,
        maxTokens: 1000
      }
    });
    if (!explainResult.output.success) {
      throw new Error('Solution explanation failed');
    }

    return {
      success: true,
      results: {
        intent: intentResult,
        dataCollection: collectResult,
        dataEnrichment: enrichResult,
        modelBuilding: buildResult,
        solution: solverResult,
        review: explainResult
      }
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
}

describe('End-to-End MCP Test with LLM', () => {
  let mcp: MCP;
  let originalKey: string | undefined;
  let originalSolverUrl: string | undefined;

  beforeEach(() => {
    // Store original environment variables
    originalKey = process.env.OPENAI_API_KEY;
    originalSolverUrl = process.env.ORTools_SERVICE_URL;

    // Set default solver service URL
    process.env.ORTools_SERVICE_URL = 'https://solver-service-219323644585.us-central1.run.app';

    // Create MCP with required fields
    mcp = {
      sessionId: 'test-session',
      version: '1.0',
      status: 'pending',
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      model: {
        variables: [
          {
            name: 'vehicle_assignments',
            type: 'array',
            description: 'Vehicle assignments to tasks',
            min: 0,
            max: 1000
          },
          {
            name: 'route_sequence',
            type: 'array',
            description: 'Sequence of tasks in the route',
            min: 0,
            max: 1000
          }
        ],
        constraints: [
          {
            type: 'non_negativity',
            description: 'Vehicle assignments must be non-negative',
            field: 'vehicle_assignments',
            operator: 'gte',
            value: 0,
            priority: 'must'
          },
          {
            type: 'non_negativity',
            description: 'Route sequence must be non-negative',
            field: 'route_sequence',
            operator: 'gte',
            value: 0,
            priority: 'must'
          }
        ],
        objective: {
          type: 'minimize',
          field: 'total_distance',
          description: 'Minimize total distance traveled',
          weight: 1.0
        }
      },
      context: {
        environment: {
          region: 'us-central1',
          timezone: 'America/Chicago'
        },
        dataset: {
          internalSources: ['vehicles', 'locations', 'demands'],
          metadata: {
            tables: {
              vehicles: {
                name: 'vehicles',
                fields: ['id', 'capacity', 'start_location', 'end_location']
              },
              locations: {
                name: 'locations',
                fields: ['id', 'latitude', 'longitude', 'time_window_start', 'time_window_end']
              },
              demands: {
                name: 'demands',
                fields: ['id', 'location_id', 'quantity', 'service_time']
              }
            }
          }
        },
        problemType: 'vehicle_routing',
        industry: 'logistics'
      },
      protocol: {
        steps: [
          {
            id: 'interpret',
            action: 'interpret_intent',
            description: 'Interpret the problem intent',
            required: true
          },
          {
            id: 'collect',
            action: 'collect_data',
            description: 'Collect data from internal sources',
            required: true,
            parameters: {
              tables: ['vehicles', 'locations', 'demands']
            }
          },
          {
            id: 'enrich',
            action: 'enrich_data',
            description: 'Enrich data with additional information',
            required: true,
            parameters: {
              enrichmentRules: {
                calculate_distances: true
              }
            }
          },
          {
            id: 'build',
            action: 'build_model',
            description: 'Build the optimization model',
            required: true
          },
          {
            id: 'solve',
            action: 'solve_model',
            description: 'Solve the optimization model',
            required: true
          },
          {
            id: 'explain',
            action: 'explain_solution',
            description: 'Explain the solution using LLM',
            required: true
          }
        ],
        allowPartialSolutions: true,
        explainabilityEnabled: true,
        humanInTheLoop: {
          required: false,
          approvalSteps: [
            {
              step: 'review_solution',
              description: 'Review and approve the solution'
            }
          ]
        }
      }
    };
  });

  afterEach(() => {
    // Restore original environment variables
    if (originalKey) {
      process.env.OPENAI_API_KEY = originalKey;
    }
    if (originalSolverUrl) {
      process.env.ORTools_SERVICE_URL = originalSolverUrl;
    }
  });

  it('should run end-to-end with LLM integration', async () => {
    // Set up environment variables
    process.env.OPENAI_API_KEY = 'test-key';
    
    const result = await runEndToEndWithLLMTest(mcp);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Solver type VRP is not implemented yet/);
  });

  it('should handle missing ORTools_SERVICE_URL', async () => {
    // Remove the environment variable
    delete process.env.ORTools_SERVICE_URL;
    
    const result = await runEndToEndWithLLMTest(mcp);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Solver type VRP is not implemented yet/);
  });

  it('should handle invalid ORTools_SERVICE_URL', async () => {
    // Set an invalid URL
    process.env.ORTools_SERVICE_URL = 'http://invalid-url:8081';
    
    const result = await runEndToEndWithLLMTest(mcp);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/getaddrinfo ENOTFOUND invalid-url/);
  });
}); 