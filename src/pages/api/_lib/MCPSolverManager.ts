// MCP Solver Manager for switching between different optimization solvers
// Provides a unified interface for HiGHS, OR-Tools, Gurobi, and other solvers

import { MCPSolverClient, OptimizationProblem, OptimizationOptions, OptimizationResult, createSolverClient, listAvailableSolvers } from './MCPSolverClient';

// Re-export types for convenience
export type { OptimizationProblem, OptimizationOptions, OptimizationResult };

export interface SolverManagerConfig {
  defaultSolver?: string;
  fallbackSolver?: string;
  autoConnect?: boolean;
  connectionTimeout?: number;
  retryAttempts?: number;
}

export interface SolverStatus {
  name: string;
  connected: boolean;
  available: boolean;
  lastUsed?: Date;
  errorCount: number;
  averageSolveTime?: number;
}

export class MCPSolverManager {
  private clients: Map<string, MCPSolverClient> = new Map();
  private config: SolverManagerConfig;
  private currentSolver: string;
  private solverStats: Map<string, SolverStatus> = new Map();

  constructor(config: SolverManagerConfig = {}) {
    this.config = {
      defaultSolver: 'highs',
      fallbackSolver: 'highs',
      autoConnect: true,
      connectionTimeout: 30000, // 30 seconds
      retryAttempts: 3,
      ...config
    };

    this.currentSolver = this.config.defaultSolver!;
    this.initializeSolvers();
  }

  /**
   * Initialize all available solvers
   */
  private initializeSolvers(): void {
    const availableSolvers = listAvailableSolvers();
    availableSolvers.forEach(solverName => {
      const client = createSolverClient(solverName);
      this.clients.set(solverName, client);
      
      this.solverStats.set(solverName, {
        name: solverName,
        connected: false,
        available: false,
        errorCount: 0,
        averageSolveTime: undefined
      });
    });
  }

  /**
   * Connect to a specific solver
   */
  async connectToSolver(solverName: string): Promise<boolean> {
    const client = this.clients.get(solverName);
    if (!client) {
      throw new Error(`Unknown solver: ${solverName}`);
    }

    try {
      await client.connect();
      this.updateSolverStatus(solverName, { connected: true, available: true });
      console.log(`✅ Connected to ${solverName} solver`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to connect to ${solverName} solver:`, error);
      this.updateSolverStatus(solverName, { 
        connected: false, 
        available: false, 
        errorCount: this.getSolverStatus(solverName).errorCount + 1 
      });
      return false;
    }
  }

  /**
   * Connect to the current solver
   */
  async connect(): Promise<boolean> {
    return this.connectToSolver(this.currentSolver);
  }

  /**
   * Disconnect from all solvers
   */
  async disconnect(): Promise<void> {
    const disconnectPromises = Array.from(this.clients.values()).map(client => client.disconnect());
    await Promise.all(disconnectPromises);
    
    // Update all solver statuses
    Array.from(this.solverStats.entries()).forEach(([solverName, status]) => {
      this.updateSolverStatus(solverName, { connected: false });
    });
  }

  /**
   * Switch to a different solver
   */
  async switchSolver(solverName: string): Promise<boolean> {
    if (!this.clients.has(solverName)) {
      throw new Error(`Unknown solver: ${solverName}`);
    }

    // Disconnect from current solver
    const currentClient = this.clients.get(this.currentSolver);
    if (currentClient) {
      await currentClient.disconnect();
    }

    // Connect to new solver
    const success = await this.connectToSolver(solverName);
    if (success) {
      this.currentSolver = solverName;
      console.log(`🔄 Switched to ${solverName} solver`);
    }
    
    return success;
  }

  /**
   * Solve an optimization problem with the current solver
   */
  async solve(
    problem: OptimizationProblem,
    options?: OptimizationOptions
  ): Promise<OptimizationResult> {
    const startTime = Date.now();
    
    try {
      // Ensure we're connected to the current solver
      const currentClient = this.clients.get(this.currentSolver);
      if (!currentClient || !currentClient.isConnectedToSolver()) {
        await this.connect();
      }

      // Try to solve with current solver
      const result = await this.solveWithSolver(this.currentSolver, problem, options);
      
      // Update solver statistics
      const solveTime = Date.now() - startTime;
      this.updateSolverStats(this.currentSolver, solveTime);
      
      return result;

    } catch (error) {
      console.error(`❌ Error with ${this.currentSolver} solver:`, error);
      
      // Try fallback solver if available
      if (this.config.fallbackSolver && this.config.fallbackSolver !== this.currentSolver) {
        console.log(`🔄 Trying fallback solver: ${this.config.fallbackSolver}`);
        
        try {
          const fallbackResult = await this.solveWithSolver(this.config.fallbackSolver, problem, options);
          console.log(`✅ Fallback solver ${this.config.fallbackSolver} succeeded`);
          return fallbackResult;
        } catch (fallbackError) {
          console.error(`❌ Fallback solver also failed:`, fallbackError);
        }
      }
      
      throw error;
    }
  }

  /**
   * Solve with a specific solver
   */
  async solveWithSolver(
    solverName: string,
    problem: OptimizationProblem,
    options?: OptimizationOptions
  ): Promise<OptimizationResult> {
    const client = this.clients.get(solverName);
    if (!client) {
      throw new Error(`Unknown solver: ${solverName}`);
    }

    // Ensure connected
    if (!client.isConnectedToSolver()) {
      await this.connectToSolver(solverName);
    }

    return await client.solve(problem, options);
  }

  /**
   * Get the current solver name
   */
  getCurrentSolver(): string {
    return this.currentSolver;
  }

  /**
   * Get available solvers
   */
  getAvailableSolvers(): string[] {
    return Array.from(this.clients.keys());
  }

  /**
   * Get solver status
   */
  getSolverStatus(solverName: string): SolverStatus {
    return this.solverStats.get(solverName) || {
      name: solverName,
      connected: false,
      available: false,
      errorCount: 0
    };
  }

  /**
   * Get all solver statuses
   */
  getAllSolverStatuses(): Map<string, SolverStatus> {
    return new Map(this.solverStats);
  }

  /**
   * Get the best available solver based on performance and availability
   */
  getBestSolver(): string {
    let bestSolver = this.currentSolver;
    let bestScore = -1;

    Array.from(this.solverStats.entries()).forEach(([solverName, status]) => {
      if (status.available && status.connected) {
        // Score based on error count and average solve time
        const errorScore = Math.max(0, 10 - status.errorCount);
        const timeScore = status.averageSolveTime ? Math.max(0, 10 - (status.averageSolveTime / 1000)) : 5;
        const totalScore = errorScore + timeScore;

        if (totalScore > bestScore) {
          bestScore = totalScore;
          bestSolver = solverName;
        }
      }
    });

    return bestSolver;
  }

  /**
   * Auto-switch to the best available solver
   */
  async autoSwitchToBestSolver(): Promise<boolean> {
    const bestSolver = this.getBestSolver();
    if (bestSolver !== this.currentSolver) {
      return await this.switchSolver(bestSolver);
    }
    return true;
  }

  /**
   * Update solver status
   */
  private updateSolverStatus(solverName: string, updates: Partial<SolverStatus>): void {
    const currentStatus = this.solverStats.get(solverName);
    if (currentStatus) {
      this.solverStats.set(solverName, { ...currentStatus, ...updates });
    }
  }

  /**
   * Update solver statistics
   */
  private updateSolverStats(solverName: string, solveTime: number): void {
    const status = this.solverStats.get(solverName);
    if (status) {
      const currentAvg = status.averageSolveTime || 0;
      const newAvg = (currentAvg + solveTime) / 2;
      
      this.updateSolverStatus(solverName, {
        lastUsed: new Date(),
        averageSolveTime: newAvg
      });
    }
  }

  /**
   * Health check for all solvers
   */
  async healthCheck(): Promise<Map<string, boolean>> {
    const healthResults = new Map<string, boolean>();
    
    for (const [solverName, client] of Array.from(this.clients.entries())) {
      try {
        // Try a simple test problem
        const testProblem: OptimizationProblem = {
          sense: 'minimize',
          objective: { linear: [1, 1] },
          variables: [
            { name: 'x', type: 'cont', lb: 0 },
            { name: 'y', type: 'cont', lb: 0 }
          ],
          constraints: {
            dense: [[1, 1]],
            sense: ['>='],
            rhs: [1]
          }
        };

        await this.solveWithSolver(solverName, testProblem);
        healthResults.set(solverName, true);
        this.updateSolverStatus(solverName, { available: true, errorCount: 0 });
        
      } catch (error) {
        healthResults.set(solverName, false);
        this.updateSolverStatus(solverName, { 
          available: false, 
          errorCount: this.getSolverStatus(solverName).errorCount + 1 
        });
      }
    }

    return healthResults;
  }

  /**
   * Get solver performance summary
   */
  getPerformanceSummary(): Record<string, any> {
    const summary: Record<string, any> = {};
    
    Array.from(this.solverStats.entries()).forEach(([solverName, status]) => {
      summary[solverName] = {
        connected: status.connected,
        available: status.available,
        errorCount: status.errorCount,
        averageSolveTime: status.averageSolveTime,
        lastUsed: status.lastUsed
      };
    });

    return summary;
  }
} 