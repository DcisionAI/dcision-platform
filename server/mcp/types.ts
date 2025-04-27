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
  timeout?: number;
  retryPolicy?: {
    maxAttempts: number;
    backoffMs: number;
  };
}

export interface Protocol {
  steps: Step[];
  version?: string;
  metadata?: Record<string, any>;
  variables?: Record<string, any>;
}

export interface StepResult {
  success: boolean;
  error?: string;
  outputs?: Record<string, any>;
  metadata?: Record<string, any>;
} 