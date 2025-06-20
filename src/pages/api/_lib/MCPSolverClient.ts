// MCP Solver Client for connecting to different optimization servers
// Supports HiGHS, OR-Tools, Gurobi, and other MCP-compatible solvers

import { spawn, ChildProcess } from 'child_process';
import axios from 'axios';

export interface SolverEndpoint {
  type: 'http' | 'websocket';
  url: string;
  apiKey?: string;
}

export interface SolverConfig {
  name: string;
  endpoint: SolverEndpoint;
  timeout?: number;
  retries?: number;
}

export interface OptimizationProblem {
  sense: 'minimize' | 'maximize';
  objective: {
    linear?: number[];
    quadratic?: {
      dense?: number[][];
      sparse?: {
        rows: number[];
        cols: number[];
        values: number[];
        shape: [number, number];
      };
    };
  };
  variables: Array<{
    name: string;
    type: 'cont' | 'int' | 'bin';
    lb?: number;
    ub?: number;
    description?: string;
  }>;
  constraints: {
    dense?: number[][];
    sparse?: {
      rows: number[];
      cols: number[];
      values: number[];
      shape: [number, number];
    };
    sense: Array<'<=' | '>=' | '='>;
    rhs: number[];
    descriptions?: string[];
  };
  metadata?: Record<string, any>;
}

export interface OptimizationOptions {
  time_limit?: number;
  presolve?: 'off' | 'choose' | 'on';
  solver?: 'simplex' | 'choose' | 'ipm' | 'pdlp';
  parallel?: 'off' | 'choose' | 'on';
  threads?: number;
  output_flag?: boolean;
  log_to_console?: boolean;
  mip_rel_gap?: number;
  primal_feasibility_tolerance?: number;
  dual_feasibility_tolerance?: number;
}

export interface OptimizationResult {
  status: 'optimal' | 'infeasible' | 'unbounded' | 'time_limit' | 'iteration_limit';
  objective_value: number;
  solution: Array<{
    variable_name: string;
    value: number;
    description: string;
  }>;
  dual_solution: number[];
  variable_duals: number[];
  metadata: {
    solve_time_ms: number;
    iterations: number;
    nodes_explored?: number;
    gap?: number;
    solver_used: string;
    solver_version?: string;
    problem_size: {
      variables: number;
      constraints: number;
    };
  };
}

export class MCPSolverClient {
  private config: SolverConfig;
  private isConnected = false;
  private httpClient: any;

  constructor(config: SolverConfig) {
    this.config = config;
    this.httpClient = axios.create({
      baseURL: config.endpoint.url,
      timeout: config.timeout || 300000,
      headers: config.endpoint.apiKey ? {
        'Authorization': `Bearer ${config.endpoint.apiKey}`,
        'Content-Type': 'application/json'
      } : {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Connect to the MCP solver server
   */
  async connect(): Promise<void> {
    try {
      if (this.isConnected) {
        return;
      }

      // Test connection by making a simple request
      await this.httpClient.get('/health');
      this.isConnected = true;
      
      console.log(`✅ Connected to ${this.config.name} solver at ${this.config.endpoint.url}`);

    } catch (error) {
      console.error(`❌ Failed to connect to ${this.config.name} solver:`, error);
      throw error;
    }
  }

  /**
   * Disconnect from the MCP solver server
   */
  async disconnect(): Promise<void> {
    try {
      this.isConnected = false;
      console.log(`✅ Disconnected from ${this.config.name} solver`);

    } catch (error) {
      console.error(`❌ Error disconnecting from ${this.config.name} solver:`, error);
    }
  }

  /**
   * Solve an optimization problem
   */
  async solve(
    problem: OptimizationProblem,
    options?: OptimizationOptions
  ): Promise<OptimizationResult> {
    if (!this.isConnected) {
      throw new Error(`Not connected to ${this.config.name} solver`);
    }

    try {
      // Send optimization problem to solver
      const response = await this.httpClient.post('/solve', {
        problem,
        options: options || {},
        solver: this.config.name.toLowerCase()
      });

      const result = response.data;
      
      // Add solver metadata
      return {
        ...result,
        metadata: {
          ...result.metadata,
          solver_used: this.config.name,
          solver_version: await this.getSolverVersion()
        }
      };

    } catch (error) {
      console.error(`❌ Error solving with ${this.config.name}:`, error);
      throw error;
    }
  }

  /**
   * Get the tool name for this solver
   */
  private getToolName(): string {
    switch (this.config.name.toLowerCase()) {
      case 'highs':
        return 'solve_optimization';
      case 'or-tools':
        return 'solve_optimization';
      case 'gurobi':
        return 'solve_optimization';
      case 'cplex':
        return 'solve_optimization';
      default:
        return 'solve_optimization';
    }
  }

  /**
   * Get solver version information
   */
  private async getSolverVersion(): Promise<string> {
    try {
      const response = await this.httpClient.get('/version');
      return response.data.version || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Check if connected to solver
   */
  isConnectedToSolver(): boolean {
    return this.isConnected;
  }

  /**
   * Get solver configuration
   */
  getSolverConfig(): SolverConfig {
    return this.config;
  }
}

// Factory function to create solver clients
export function createSolverClient(solverName: string): MCPSolverClient {
  const configs: Record<string, SolverConfig> = {
    'highs': {
      name: 'HiGHS',
      endpoint: {
        type: 'http',
        url: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',
        apiKey: process.env.SOLVER_API_KEY
      },
      timeout: 300000, // 5 minutes
      retries: 3
    },
    // TODO: IMPLEMENT OR-TOOLS SOLVER
    // - Add OR-Tools dependency to package.json
    // - Create src/pages/api/_lib/solvers/or-tools.ts
    // - Implement solveProblem() method for OR-Tools
    // - Update src/pages/api/solver/solve.ts to handle 'or-tools' case
    'or-tools': {
      name: 'OR-Tools',
      endpoint: {
        type: 'http',
        url: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',
        apiKey: process.env.SOLVER_API_KEY
      },
      timeout: 300000,
      retries: 3
    },
    // TODO: IMPLEMENT GUROBI SOLVER
    // - Add Gurobi Python client dependency
    // - Create src/pages/api/_lib/solvers/gurobi.ts
    // - Implement solveProblem() method for Gurobi
    // - Update src/pages/api/solver/solve.ts to handle 'gurobi' case
    // - Note: Gurobi requires commercial license
    'gurobi': {
      name: 'Gurobi',
      endpoint: {
        type: 'http',
        url: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',
        apiKey: process.env.SOLVER_API_KEY
      },
      timeout: 300000,
      retries: 3
    },
    // TODO: IMPLEMENT CPLEX SOLVER
    // - Add CPLEX Python client dependency
    // - Create src/pages/api/_lib/solvers/cplex.ts
    // - Implement solveProblem() method for CPLEX
    // - Update src/pages/api/solver/solve.ts to handle 'cplex' case
    // - Note: CPLEX requires commercial license
    'cplex': {
      name: 'CPLEX',
      endpoint: {
        type: 'http',
        url: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',
        apiKey: process.env.SOLVER_API_KEY
      },
      timeout: 300000,
      retries: 3
    }
  };

  const config = configs[solverName];
  if (!config) {
    throw new Error(`Unknown solver: ${solverName}`);
  }

  return new MCPSolverClient(config);
}

export function listAvailableSolvers(): string[] {
  return ['highs', 'or-tools', 'gurobi', 'cplex'];
} 