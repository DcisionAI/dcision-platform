// Basic types
export interface Variable {
  name: string;
  type: 'number' | 'string' | 'boolean' | 'array' | 'object' | 'datetime';
  description: string;
  default?: any;
  required?: boolean;
  metadata?: {
    properties?: Record<string, string>;
  };
}

export interface Constraint {
  type: string;
  description: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'between';
  field: string;
  value: any;
  priority: 'must' | 'should';
}

export interface Objective {
  type: 'minimize' | 'maximize';
  field: string;
  description: string;
  weight: number;
}

export type StepAction = 
  | 'collect_data'
  | 'enrich_data'
  | 'validate_constraints'
  | 'validate_network'
  | 'build_model'
  | 'solve_model'
  | 'explain_solution'
  | 'human_review';

export interface Step {
  id: string;
  action: StepAction;
  description: string;
  required: boolean;
  config?: Record<string, any>;
}

export interface Protocol {
  steps: Step[];
}

// Result types
export interface StepResult {
  success: boolean;
  data?: any;
  error?: string;
  warnings?: string[];
}

export interface OrchestrationResult {
  success: boolean;
  state: {
    variables: Record<string, any>;
    stepResults: Record<string, StepResult>;
    currentStepIndex: number;
    errors: string[];
    warnings: string[];
  };
  mcp: MCP;
}

// Main MCP type
export interface MCP {
  id: string;
  sessionId: string;
  version: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  created: string;
  lastModified: string;
  model: {
    variables: Variable[];
    constraints: Constraint[];
    objective: Objective;
  };
  context: {
    environment: {
      region: string;
      timezone: string;
    };
    dataset: {
      internalSources: string[];
      dataQuality?: 'good' | 'fair' | 'poor';
      requiredFields?: string[];
    };
    problemType: string;
    industry: string;
  };
  protocol: Protocol;
  metadata?: {
    solver?: string;
    timeLimit?: number;
    solutionGap?: number;
  };
}

export interface MCPConfig {
  variables: Array<{
    name: string;
    type: 'continuous' | 'integer' | 'binary';
    lower_bound: number;
    upper_bound: number;
    description: string;
  }>;
  constraints: {
    dense: Array<{
      name: string;
      coefficients: number[];
      variables: string[];
      operator: '<=' | '>=' | '=';
      rhs: number;
      description: string;
    }>;
    sparse: any[];
  };
  objective: {
    name: string;
    sense: 'minimize' | 'maximize';
    coefficients: number[];
    variables: string[];
    description: string;
  };
  solver_config: {
    time_limit: number;
    gap_tolerance: number;
    construction_heuristics: boolean;
  };
} 