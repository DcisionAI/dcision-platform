// Basic types
export interface Variable {
  name: string;
  type: 'number' | 'string' | 'boolean' | 'array' | 'object';
  description: string;
  default: any;
  required: boolean;
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
  name: string;
  description: string;
  variables: Variable[];
  protocol: Protocol;
  metadata?: Record<string, any>;
} 