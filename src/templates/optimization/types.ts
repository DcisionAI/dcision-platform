export interface OptimizationTemplate {
  template_id: string;
  name: string;
  description: string;
  problem_type: 'LP' | 'MIP' | 'QP' | 'NLP';
  sense: 'minimize' | 'maximize';
  variables: Variable[];
  constraints: Constraints;
  objective: Objective;
  parameters?: Record<string, any>;
  solver_config?: SolverConfig;
  metadata: TemplateMetadata;
}

export interface Variable {
  name: string;
  type: 'cont' | 'int' | 'bin';
  category: string;
  description: string;
  bounds: {
    lower: number;
    upper: number;
  };
}

export interface Constraints {
  dense: number[][];
  sense: string[];
  rhs: number[];
  categories: string[];
  descriptions?: string[];
}

export interface Objective {
  type: 'minimize' | 'maximize';
  target: string;
  description: string;
  linear?: number[];
  quadratic?: {
    dense: number[][];
  };
}

export interface SolverConfig {
  time_limit: number;
  gap_tolerance: number;
  construction_heuristics: boolean;
}

export interface TemplateMetadata {
  domain: string;
  complexity: 'basic' | 'intermediate' | 'advanced';
  tags: string[];
}

export interface TemplateRecommendation {
  template: OptimizationTemplate;
  score: number;
  reasoning: string;
}

export interface TemplateSearchCriteria {
  domain?: string;
  complexity?: 'basic' | 'intermediate' | 'advanced';
  problemType?: string;
  tags?: string[];
  intent?: string;
} 