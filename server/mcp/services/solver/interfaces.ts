export interface SolverConfig {
  backend: 'ortools' | 'custom';
  timeout?: number;
  threads?: number;
  parameters?: Record<string, any>;
}

export interface SolverResult {
  status: 'optimal' | 'feasible' | 'infeasible' | 'error';
  objective?: number;
  solution?: Record<string, any>;
  statistics: {
    solveTime: number;
    nodes?: number;
    iterations?: number;
  };
  message?: string;
}

export interface SolverBackend {
  initialize(config: SolverConfig): Promise<void>;
  solve(model: any): Promise<SolverResult>;
  validateModel(model: any): Promise<boolean>;
  getCapabilities(): string[];
  cleanup(): Promise<void>;
}

export interface SolverService {
  getBackend(type: string): SolverBackend;
  registerBackend(type: string, backend: SolverBackend): void;
  removeBackend(type: string): void;
} 