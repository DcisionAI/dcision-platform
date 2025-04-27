import { MCP, Variable, Constraint, Objective, VariableType, Location } from '../types';
import { FleetConstraintFactory } from '../constraints/FleetConstraints';

interface TSPConfig {
  cities: Location[];
  distanceMatrix: number[][];
  constraints?: {
    maxTourLength?: number;
    requiredVisits?: string[];
    visitPrecedence?: Array<{
      before: string;
      after: string;
    }>;
    timeWindows?: Record<string, {
      start: string;
      end: string;
    }>;
  };
  objectives?: {
    minimizeDistance?: boolean;
    minimizeTime?: boolean;
    maximizePriority?: boolean;
  };
}

export class TravelingSalesmanTemplate {
  private config: TSPConfig;

  constructor(config: TSPConfig) {
    this.config = config;
  }

  private createVariables(): Variable[] {
    return [
      {
        name: 'tour_sequence',
        type: 'array',
        description: 'Sequence of cities in the tour',
        metadata: {
          itemType: 'object',
          properties: {
            cityId: 'string',
            position: 'integer',
            arrivalTime: 'string',
            departureTime: 'string'
          }
        }
      },
      {
        name: 'tour_metrics',
        type: 'object',
        description: 'Metrics for the complete tour',
        metadata: {
          properties: {
            totalDistance: 'number',
            totalTime: 'number',
            averageSpeed: 'number',
            visitedCities: 'integer'
          }
        }
      }
    ];
  }

  private createConstraints(): Constraint[] {
    const constraints: Constraint[] = [];

    // Add tour length constraint if specified
    if (this.config.constraints?.maxTourLength) {
      constraints.push({
        type: 'tour_length',
        description: 'Maximum tour length constraint',
        field: 'total_distance',
        operator: 'lte',
        value: this.config.constraints.maxTourLength,
        priority: 'must'
      });
    }

    // Add required visits constraints
    if (this.config.constraints?.requiredVisits) {
      this.config.constraints.requiredVisits.forEach(cityId => {
        constraints.push({
          type: 'visit',
          description: `Required visit to city ${cityId}`,
          field: 'visited_cities',
          operator: 'in',
          value: cityId,
          priority: 'must'
        });
      });
    }

    // Add precedence constraints
    if (this.config.constraints?.visitPrecedence) {
      this.config.constraints.visitPrecedence.forEach(rule => {
        constraints.push({
          type: 'precedence',
          description: `Visit ${rule.before} before ${rule.after}`,
          field: 'visit_order',
          operator: 'before',
          value: {
            first: rule.before,
            second: rule.after
          },
          priority: 'must'
        });
      });
    }

    // Add time window constraints
    if (this.config.constraints?.timeWindows) {
      Object.entries(this.config.constraints.timeWindows).forEach(([cityId, window]) => {
        constraints.push(
          FleetConstraintFactory.timeWindow(window.start, window.end)
            .withPriority('must')
            .build()
        );
      });
    }

    return constraints;
  }

  private createObjectives(): Objective[] {
    const objectives: Objective[] = [];
    const {
      minimizeDistance = true,
      minimizeTime = false,
      maximizePriority = false
    } = this.config.objectives || {};

    if (minimizeDistance) {
      objectives.push({
        type: 'minimize',
        field: 'total_distance',
        description: 'Minimize total tour distance',
        weight: 0.5
      });
    }

    if (minimizeTime) {
      objectives.push({
        type: 'minimize',
        field: 'total_time',
        description: 'Minimize total travel time',
        weight: 0.3
      });
    }

    if (maximizePriority) {
      objectives.push({
        type: 'maximize',
        field: 'priority_score',
        description: 'Maximize visit priority satisfaction',
        weight: 0.2
      });
    }

    return objectives;
  }

  public createMCP(): MCP {
    return {
      sessionId: `tsp-${Date.now()}`,
      version: '1.0.0',
      status: 'pending',
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      model: {
        variables: this.createVariables(),
        constraints: this.createConstraints(),
        objective: this.createObjectives()
      },
      context: {
        environment: {
          region: 'default',
          timezone: 'UTC',
          parameters: {
            solver_config: {
              type: 'or_tools',
              first_solution_strategy: 'CHRISTOFIDES',
              local_search_metaheuristic: 'SIMULATED_ANNEALING',
              time_limit_ms: 30000,
              solution_limit: 100,
              log_search: true
            },
            distance_matrix: this.config.distanceMatrix,
            cities: this.config.cities,
            required_visits: this.config.constraints?.requiredVisits || [],
            precedence_rules: this.config.constraints?.visitPrecedence || []
          }
        },
        dataset: {
          internalSources: ['cities', 'distances'],
          dataQuality: 'good',
          requiredFields: [
            'id',
            'latitude',
            'longitude',
            'timeWindows'
          ]
        },
        problemType: 'traveling_salesman',
        industry: 'logistics'
      },
      protocol: {
        steps: [
          {
            action: 'collect_data',
            description: 'Collect city and distance data',
            required: true
          },
          {
            action: 'validate_constraints',
            description: 'Validate tour constraints',
            required: true,
            parameters: {
              check_connectivity: true,
              validate_distances: true
            }
          },
          {
            action: 'build_model',
            description: 'Build TSP model',
            required: true,
            parameters: {
              solver_type: 'or_tools_cp',
              use_time_windows: true
            }
          },
          {
            action: 'solve_model',
            description: 'Generate optimal tour',
            required: true,
            parameters: {
              solver: 'or_tools',
              timeout: 30000,
              solution_limit: 100
            }
          },
          {
            action: 'explain_solution',
            description: 'Generate tour insights',
            required: true,
            parameters: {
              include_metrics: [
                'total_distance',
                'total_time',
                'visit_sequence',
                'time_window_satisfaction'
              ]
            }
          }
        ],
        allowPartialSolutions: true,
        explainabilityEnabled: true,
        humanInTheLoop: {
          required: false,
          approvalSteps: []
        }
      }
    };
  }
} 