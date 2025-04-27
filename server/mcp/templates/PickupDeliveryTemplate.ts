import { MCP, Variable, Constraint, Objective, VariableType, Location } from '../types';
import { FleetConstraintFactory } from '../constraints/FleetConstraints';

interface PDPRequest {
  id: string;
  pickup: Location;
  delivery: Location;
  demand: number;
  priority?: number;
  timeWindows?: {
    pickup: { start: string; end: string };
    delivery: { start: string; end: string };
  };
}

interface PDPConfig {
  vehicles: Array<{
    id: string;
    capacity: number;
    startLocation: Location;
    endLocation?: Location;
    skills?: string[];
    costPerKm?: number;
    costPerHour?: number;
  }>;
  requests: PDPRequest[];
  constraints?: {
    maxRouteDistance?: number;
    maxRouteTime?: number;
    maxStops?: number;
    requiredSkills?: string[];
    loadBalancing?: boolean;
    precedence?: Array<{
      before: string;
      after: string;
    }>;
  };
}

export class PickupDeliveryTemplate {
  private config: PDPConfig;
  public readonly complexity = 'intermediate';

  constructor(config: PDPConfig) {
    this.config = config;
  }

  private createVariables(): Variable[] {
    return [
      {
        name: 'vehicle_routes',
        type: 'array',
        description: 'Route assignments for each vehicle',
        metadata: {
          itemType: 'object',
          properties: {
            vehicleId: 'string',
            stops: 'array',
            totalDistance: 'number',
            totalTime: 'number',
            currentLoad: 'number'
          }
        }
      },
      {
        name: 'request_assignments',
        type: 'array',
        description: 'Assignment of requests to vehicles',
        metadata: {
          itemType: 'object',
          properties: {
            requestId: 'string',
            vehicleId: 'string',
            pickupStop: 'integer',
            deliveryStop: 'integer',
            pickupTime: 'string',
            deliveryTime: 'string'
          }
        }
      },
      {
        name: 'vehicle_utilization',
        type: 'array',
        description: 'Utilization metrics for each vehicle',
        metadata: {
          itemType: 'object',
          properties: {
            vehicleId: 'string',
            totalRequests: 'integer',
            totalDistance: 'number',
            totalTime: 'number',
            capacityUtilization: 'number'
          }
        }
      }
    ];
  }

  private createConstraints(): Constraint[] {
    const constraints: Constraint[] = [
      // Vehicle capacity constraints
      ...this.config.vehicles.map(vehicle =>
        FleetConstraintFactory.capacity(vehicle.capacity)
          .withPriority('must')
          .build()
      ),

      // Time window constraints for pickups and deliveries
      ...this.config.requests
        .filter(req => req.timeWindows)
        .flatMap(req => [
          FleetConstraintFactory.timeWindow(
            req.timeWindows!.pickup.start,
            req.timeWindows!.pickup.end
          )
            .withPriority('must')
            .build(),
          FleetConstraintFactory.timeWindow(
            req.timeWindows!.delivery.start,
            req.timeWindows!.delivery.end
          )
            .withPriority('must')
            .build()
        ])
    ];

    // Add route distance constraints if specified
    if (this.config.constraints?.maxRouteDistance) {
      constraints.push(
        FleetConstraintFactory.distance(this.config.constraints.maxRouteDistance)
          .withPriority('must')
          .build()
      );
    }

    // Add skill requirements if specified
    if (this.config.constraints?.requiredSkills) {
      constraints.push(
        FleetConstraintFactory.skillRequirement(this.config.constraints.requiredSkills)
          .withPriority('must')
          .build()
      );
    }

    return constraints;
  }

  private createObjectives(): Objective[] {
    return [
      {
        type: 'minimize',
        field: 'total_distance',
        description: 'Minimize total travel distance',
        weight: 0.4
      },
      {
        type: 'minimize',
        field: 'total_time',
        description: 'Minimize total travel time',
        weight: 0.3
      },
      {
        type: 'maximize',
        field: 'request_priority',
        description: 'Maximize service of high-priority requests',
        weight: 0.2
      },
      {
        type: 'minimize',
        field: 'vehicle_count',
        description: 'Minimize number of vehicles used',
        weight: 0.1
      }
    ];
  }

  public createMCP(): MCP {
    return {
      sessionId: `pdp-${Date.now()}`,
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
              first_solution_strategy: 'PARALLEL_CHEAPEST_INSERTION',
              local_search_metaheuristic: 'GUIDED_LOCAL_SEARCH',
              time_limit_ms: 30000,
              solution_limit: 100,
              log_search: true
            },
            complexity: this.complexity,
            vehicles: this.config.vehicles,
            requests: this.config.requests,
            precedence_rules: this.config.constraints?.precedence || [],
            load_balancing_enabled: this.config.constraints?.loadBalancing || false
          }
        },
        dataset: {
          internalSources: ['vehicles', 'requests'],
          dataQuality: 'good',
          requiredFields: [
            'id',
            'capacity',
            'location',
            'demand',
            'timeWindows'
          ]
        },
        problemType: 'pickup_delivery',
        industry: 'logistics'
      },
      protocol: {
        steps: [
          {
            action: 'collect_data',
            description: 'Collect vehicle and request data',
            required: true
          },
          {
            action: 'validate_constraints',
            description: 'Validate pickup-delivery constraints',
            required: true
          },
          {
            action: 'build_model',
            description: 'Build PDP model with OR-Tools',
            required: true,
            parameters: {
              solver_type: 'or_tools_pdp',
              consider_traffic: true
            }
          },
          {
            action: 'solve_model',
            description: 'Generate optimal pickup-delivery routes',
            required: true,
            parameters: {
              solver: 'or_tools',
              timeout: 30000,
              solution_limit: 100
            }
          },
          {
            action: 'explain_solution',
            description: 'Generate solution insights',
            required: true,
            parameters: {
              include_metrics: [
                'total_distance',
                'total_time',
                'vehicle_utilization',
                'request_fulfillment',
                'priority_satisfaction'
              ]
            }
          },
          {
            action: 'human_review',
            description: 'Review and approve pickup-delivery routes',
            required: true
          }
        ],
        allowPartialSolutions: true,
        explainabilityEnabled: true,
        humanInTheLoop: {
          required: true,
          approvalSteps: ['final_routes', 'vehicle_assignments']
        }
      }
    };
  }
} 