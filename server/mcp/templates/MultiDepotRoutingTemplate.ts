import { MCP, Variable, Constraint, Objective, VariableType, VehicleType, Location } from '../types';
import { FleetConstraintFactory } from '../constraints/FleetConstraints';

interface MultiDepotConfig {
  vehicles: VehicleType[];
  depots: Location[];
  customers: Location[];
  constraints?: {
    maxRouteDistance?: number;
    maxServiceTime?: number;
    requiredVehicleFeatures?: string[];
    zoneRestrictions?: Array<{
      zoneId: string;
      allowedDepots: string[];
      allowedVehicles: string[];
    }>;
    balancingRules?: {
      maxCustomersPerRoute?: number;
      maxLoadPercentage?: number;
      depotCapacityLimits?: Record<string, number>;
    };
  };
  objectives?: {
    distanceWeight?: number;
    loadBalancingWeight?: number;
    serviceQualityWeight?: number;
    costWeight?: number;
  };
}

export class MultiDepotRoutingTemplate {
  private config: MultiDepotConfig;
  public readonly complexity = 'intermediate';

  constructor(config: MultiDepotConfig) {
    this.config = config;
  }

  private createVariables(): Variable[] {
    return [
      {
        name: 'route_assignments',
        type: 'array' as VariableType,
        description: 'Assignment of customers to routes',
        metadata: {
          itemType: 'object',
          properties: {
            customerId: 'string',
            vehicleId: 'string',
            depotId: 'string',
            sequenceNumber: 'integer'
          }
        }
      },
      {
        name: 'depot_loads',
        type: 'array' as VariableType,
        description: 'Load distribution across depots',
        metadata: {
          itemType: 'object',
          properties: {
            depotId: 'string',
            totalLoad: 'number',
            vehicleCount: 'integer'
          }
        }
      },
      {
        name: 'zone_assignments',
        type: 'array' as VariableType,
        description: 'Assignment of customers to service zones',
        metadata: {
          itemType: 'object',
          properties: {
            customerId: 'string',
            zoneId: 'string'
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

      // Time window constraints for all locations
      ...this.config.depots.concat(this.config.customers)
        .filter(location => location.timeWindows && location.timeWindows.length > 0)
        .map(location => {
          const window = location.timeWindows![0];
          return FleetConstraintFactory.timeWindow(window.start, window.end)
            .withPriority('must')
            .build();
        })
    ];

    // Add distance constraints if specified
    if (this.config.constraints?.maxRouteDistance) {
      constraints.push(
        FleetConstraintFactory.distance(this.config.constraints.maxRouteDistance)
          .withPriority('must')
          .build()
      );
    }

    // Add service time constraints if specified
    if (this.config.constraints?.maxServiceTime) {
      constraints.push(
        FleetConstraintFactory.serviceDuration(this.config.constraints.maxServiceTime)
          .withPriority('must')
          .build()
      );
    }

    // Add vehicle feature requirements if specified
    if (this.config.constraints?.requiredVehicleFeatures) {
      constraints.push(
        FleetConstraintFactory.vehicleCompatibility(this.config.constraints.requiredVehicleFeatures)
          .withPriority('must')
          .build()
      );
    }

    return constraints;
  }

  private createObjectives(): Objective[] {
    const {
      distanceWeight = 0.4,
      loadBalancingWeight = 0.3,
      serviceQualityWeight = 0.2,
      costWeight = 0.1
    } = this.config.objectives || {};

    return [
      {
        type: 'minimize',
        field: 'total_distance',
        description: 'Minimize total route distance',
        weight: distanceWeight
      },
      {
        type: 'minimize',
        field: 'depot_imbalance',
        description: 'Balance load across depots',
        weight: loadBalancingWeight
      },
      {
        type: 'maximize',
        field: 'service_quality',
        description: 'Maximize service level and on-time delivery',
        weight: serviceQualityWeight
      },
      {
        type: 'minimize',
        field: 'total_cost',
        description: 'Minimize operational costs',
        weight: costWeight
      }
    ];
  }

  public createMCP(): MCP {
    return {
      sessionId: `multi-depot-${Date.now()}`,
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
              type: 'or_tools_cp',
              first_solution_strategy: 'PATH_CHEAPEST_ARC',
              local_search_metaheuristic: 'SIMULATED_ANNEALING',
              time_limit_ms: 60000
            }
          }
        },
        dataset: {
          internalSources: ['vehicles', 'depots', 'customers'],
          dataQuality: 'good',
          requiredFields: ['id', 'location', 'demand', 'timeWindow']
        },
        problemType: 'multi_depot_routing',
        industry: 'logistics'
      },
      protocol: {
        steps: [
          {
            id: 'interpret_intent',
            action: 'interpret_intent',
            description: 'Understand routing requirements',
            required: true
          },
          {
            id: 'collect_data',
            action: 'collect_data',
            description: 'Collect depot and vehicle data',
            required: true
          },
          {
            id: 'validate_constraints',
            action: 'validate_constraints',
            description: 'Validate routing constraints',
            required: true
          },
          {
            id: 'build_model',
            action: 'build_model',
            description: 'Build routing optimization model',
            required: true
          },
          {
            id: 'solve_model',
            action: 'solve_model',
            description: 'Solve routing optimization model',
            required: true
          },
          {
            id: 'explain_solution',
            action: 'explain_solution',
            description: 'Explain routing solution',
            required: true
          }
        ],
        allowPartialSolutions: false,
        explainabilityEnabled: true,
        humanInTheLoop: {
          required: false,
          approvalSteps: []
        }
      }
    };
  }
} 