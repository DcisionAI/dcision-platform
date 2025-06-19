// MCP Solver Client for connecting to different optimization servers
// Supports HiGHS, OR-Tools, Gurobi, and other MCP-compatible solvers

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn, ChildProcess } from 'child_process';

export interface SolverEndpoint {
  type: 'stdio';
  command?: string;
  args?: string[];
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
  private client: Client | null = null;
  private config: SolverConfig;
  private isConnected = false;

  constructor(config: SolverConfig) {
    this.config = config;
  }

  /**
   * Connect to the MCP solver server
   */
  async connect(): Promise<void> {
    try {
      if (this.isConnected) {
        return;
      }

      // Create stdio transport with server parameters
      const transport = new StdioClientTransport({
        command: this.config.endpoint.command || 'npx',
        args: this.config.endpoint.args || ['highs-mcp'],
        env: process.env as Record<string, string>
      });

      // Create MCP client
      this.client = new Client({
        name: 'dcisionai-solver-client',
        version: '1.0.0'
      });

      // Connect to the server
      await this.client.connect(transport);
      this.isConnected = true;
      
      console.log(`✅ Connected to ${this.config.name} solver via stdio`);

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
      if (this.client) {
        await this.client.close();
        this.client = null;
      }

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
    if (!this.isConnected || !this.client) {
      throw new Error(`Not connected to ${this.config.name} solver`);
    }

    try {
      // Determine the tool name based on the solver
      const toolName = this.getToolName();

      // Call the solver tool
      const result = await this.client.callTool({
        name: toolName,
        arguments: {
          problem,
          options: options || {}
        }
      });

      // Parse the result
      if (result.content && Array.isArray(result.content) && result.content.length > 0) {
        const resultText = result.content[0].text;
        const parsedResult = JSON.parse(resultText);
        
        // Add solver metadata
        return {
          ...parsedResult,
          metadata: {
            ...parsedResult.metadata,
            solver_used: this.config.name,
            solver_version: await this.getSolverVersion()
          }
        };
      } else {
        throw new Error('No result content received from solver');
      }

    } catch (error) {
      console.error(`❌ Error solving with ${this.config.name}:`, error);
      throw error;
    }
  }

  /**
   * Get the tool name for the solver
   */
  private getToolName(): string {
    const toolNames: Record<string, string> = {
      'highs': 'optimize-mip-lp-tool',
      'ortools': 'optimize-mip-lp-tool',
      'gurobi': 'optimize-mip-lp-tool',
      'cplex': 'optimize-mip-lp-tool'
    };

    return toolNames[this.config.name.toLowerCase()] || 'optimize-mip-lp-tool';
  }

  /**
   * Get solver version information
   */
  private async getSolverVersion(): Promise<string> {
    try {
      if (!this.client) return 'unknown';

      const result = await this.client.listTools();
      const tool = result.tools.find(t => t.name === this.getToolName());
      return tool?.description?.split(' ')[0] || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Check if the solver is connected
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

// Predefined solver configurations
export const SOLVER_CONFIGS: Record<string, SolverConfig> = {
  highs: {
    name: 'HiGHS',
    endpoint: {
      type: 'stdio',
      command: 'npx',
      args: ['highs-mcp']
    },
    timeout: 300000, // 5 minutes
    retries: 3
  },
  ortools: {
    name: 'OR-Tools',
    endpoint: {
      type: 'stdio',
      command: 'npx',
      args: ['@google/or-tools-mcp']
    },
    timeout: 300000,
    retries: 3
  },
  gurobi: {
    name: 'Gurobi',
    endpoint: {
      type: 'stdio',
      command: 'gurobi_cl',
      args: ['mcp']
    },
    timeout: 600000, // 10 minutes
    retries: 2
  },
  cplex: {
    name: 'CPLEX',
    endpoint: {
      type: 'stdio',
      command: 'cplex',
      args: ['mcp']
    },
    timeout: 600000,
    retries: 2
  }
};

// Factory function to create solver clients
export function createSolverClient(solverName: string): MCPSolverClient {
  const config = SOLVER_CONFIGS[solverName];
  if (!config) {
    throw new Error(`Unknown solver: ${solverName}. Available solvers: ${Object.keys(SOLVER_CONFIGS).join(', ')}`);
  }
  return new MCPSolverClient(config);
}

// Utility function to list available solvers
export function listAvailableSolvers(): string[] {
  return Object.keys(SOLVER_CONFIGS);
} 