/**
 * Core MCP Types for DcisionAI Platform
 * Defines the structure for Model-Context-Protocol objects
 */

// Status types
export type MCPStatus = 'pending' | 'running' | 'completed' | 'failed';

// Base variable types
export type VariableType = 'string' | 'number' | 'boolean' | 'integer' | 'float' | 'array' | 'object' | 'datetime' | 'binary';

// Model section types
export interface Variable {
  name: string;
  type: VariableType;
  description: string;
  domain?: number[];
  min?: number;
  max?: number;
  default?: any;
  dimensions?: string[];
  metadata?: {
    itemType?: string;
    properties?: Record<string, string>;
  };
}

export type ConstraintOperator = 
  | 'eq' | 'lt' | 'gt' | 'lte' | 'gte' 
  | 'in' | 'between'
  | 'after' | 'before' | 'follows'
  | 'min_gap' | 'max_gap'
  | 'concurrent' | 'non_concurrent';

export interface Constraint {
  type: string;
  description: string;
  field: string;
  operator: ConstraintOperator;
  value: any;
  priority: ConstraintPriority;
  penalty?: number;
  parameters?: Record<string, any>;
}

export interface Objective {
  type: 'minimize' | 'maximize';
  field: string;
  description: string;
  weight: number;
}

export type ConstraintPriority = 'must' | 'should' | 'nice_to_have';

// Context section types
export interface Environment {
  region?: string;
  timezone?: string;
  resources?: Record<string, unknown>;
  constraints?: Record<string, unknown>;
  parameters?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface Dataset {
  internalSources: string[];
  externalEnrichment?: string[];
  dataQuality?: 'poor' | 'fair' | 'good' | 'excellent';
  requiredFields?: string[];
  validationRules?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export type ProblemType = 
  | 'vehicle_routing'
  | 'pickup_delivery'
  | 'job_shop'
  | 'project_scheduling'
  | 'resource_scheduling'
  | 'fleet_scheduling'
  | 'multi_depot_routing'
  | 'bin_packing'
  | 'traveling_salesman'
  | 'assignment'
  | 'flow_shop'
  | 'nurse_scheduling'
  | 'inventory_optimization'
  | 'production_planning'
  | 'custom';

export type IndustryVertical = 
  | 'logistics'
  | 'manufacturing'
  | 'project_management'
  | 'retail'
  | 'healthcare'
  | 'construction'
  | 'delivery'
  | 'field_service'
  | 'custom';

// Protocol section types
export type StepAction = 
  | 'interpret_intent'
  | 'map_data'
  | 'collect_data'
  | 'enrich_data'
  | 'validate_constraints'
  | 'validate_network'
  | 'build_model'
  | 'solve_model'
  | 'explain_solution'
  | 'human_review'
  | 'productionalize_workflow'
  | 'custom';

export interface Protocol {
  steps: ProtocolStep[];
  allowPartialSolutions: boolean;
  explainabilityEnabled: boolean;
  humanInTheLoop: {
    required: boolean;
    approvalSteps: string[];
  };
}

export interface ProtocolStep {
  action: StepAction;
  description: string;
  required: boolean;
  agent?: string;
  parameters?: Record<string, any>;
}

// Main MCP type
export interface MCP {
  sessionId: string;
  version: string;
  status: MCPStatus;
  created: string;
  lastModified: string;
  model: {
    variables: Variable[];
    constraints: Constraint[];
    objective: Objective | Objective[];
  };
  context: {
    environment: Environment;
    dataset: Dataset;
    problemType: ProblemType;
    industry?: IndustryVertical;
  };
  protocol: Protocol;
} 