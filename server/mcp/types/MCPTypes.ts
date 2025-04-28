export type MCPStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

export type StepAction = 
  | 'collect_data'
  | 'enrich_data'
  | 'validate_constraints'
  | 'validate_network'
  | 'build_model'
  | 'solve_model'
  | 'explain_solution'
  | 'human_review';

export interface Variable {
  name: string;
  type: string;
  description: string;
  default?: any;
}

export interface Constraint {
  type: string;
  description: string;
  operator: string;
  field: string;
  value?: any;
}

export interface Objective {
  type: 'minimize' | 'maximize';
  field: string;
  description: string;
}

export interface Environment {
  region: string;
  timezone: string;
}

export interface Dataset {
  internalSources: string[];
  externalEnrichment?: string[];
}

export interface Context {
  problemType: string;
  industry: string;
  environment: Environment;
  dataset: Dataset;
  businessRules?: any;
}

export interface ProtocolStep {
  action: StepAction;
  required: boolean;
}

export interface Protocol {
  steps: ProtocolStep[];
  allowPartialSolutions: boolean;
  explainabilityEnabled: boolean;
  humanInTheLoop: {
    required: boolean;
  };
}

export interface MCP {
  sessionId: string;
  model: {
    variables: Variable[];
    constraints: Constraint[];
    objective: Objective;
  };
  context: Context;
  protocol: Protocol;
  version: string;
  created: string;
  lastModified: string;
  status: MCPStatus;
} 