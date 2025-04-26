import { MCP, Variable, Constraint, Objective, VariableType, VehicleType, Location } from '../MCPTypes';
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
            balancing_rules: this.config.constraints?.balancingRules,
            zone_restrictions: this.config.constraints?.zoneRestrictions,
            complexity: this.complexity
          }
        },
        dataset: {
          internalSources: ['vehicles', 'depots', 'customers'],
          dataQuality: 'good',
          requiredFields: [
            'id',
            'latitude',
            'longitude',
            'capacity',
            'timeWindows',
            'serviceTime'
          ]
        },
        problemType: 'vehicle_routing',
        industry: 'logistics'
      },
      protocol: {
        steps: [
          {
            action: 'collect_data',
            description: 'Collect vehicle, depot, and customer data',
            required: true
          },
          {
            action: 'build_model',
            description: 'Build multi-depot routing model',
            required: true
          },
          {
            action: 'solve_model',
            description: 'Generate optimal routes',
            required: true,
            parameters: {
              solver: 'or_tools',
              timeout: 600,
              reoptimization_interval: '30m'
            }
          },
          {
            action: 'explain_solution',
            description: 'Generate solution insights',
            required: true
          },
          {
            action: 'human_review',
            description: 'Review and approve routes',
            required: true
          }
        ],
        allowPartialSolutions: false,
        explainabilityEnabled: true,
        humanInTheLoop: {
          required: true,
          approvalSteps: ['final_routes']
        }
      }
    };
  }
} 