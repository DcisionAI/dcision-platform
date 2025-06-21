export interface MCPConfig {
  variables: Array<{
    name: string;
    type: 'continuous' | 'int' | 'binary';
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
  problem_type: 'resource_allocation' | 'scheduling' | 'cost_optimization' | 'risk_management' | 'supply_chain';
} 