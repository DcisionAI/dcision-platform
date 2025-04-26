import { MCP, Variable, Constraint, Objective, VariableType, Location } from '../MCPTypes';
import { FleetConstraintFactory } from '../constraints/FleetConstraints';

interface ORToolsVRPConfig {
  numVehicles: number;
  depot: Location;
  locations: Location[];
  distanceMatrix: number[][];
  constraints?: {
    maxRouteDistance?: number;
    timeWindows?: boolean;
    capacityLimits?: number[];
    pickupsDeliveries?: Array<{
      pickup: number;
      delivery: number;
    }>;
    vehicleLoadTime?: number;
    vehicleUnloadTime?: number;
    demandQuantities?: number[];
  };
  objectives?: {
    distanceWeight?: number;
    timeWeight?: number;
    loadWeight?: number;
  };
}

export class ORToolsVRPTemplate {
  private config: ORToolsVRPConfig;
  public readonly complexity = 'basic';

  constructor(config: ORToolsVRPConfig) {
    this.config = config;
  }

  private createVariables(): Variable[] {
    return [
      {
        name: 'route_assignments',
        type: 'array' as VariableType,
        description: 'Vehicle route assignments',
        metadata: {
          itemType: 'object',
          properties: {
            vehicleId: 'integer',
            locationSequence: 'array',
            totalDistance: 'number',
            totalTime: 'number',
            totalLoad: 'number'
          }
        }
      },
      {
        name: 'vehicle_loads',
        type: 'array' as VariableType,
        description: 'Current load of each vehicle',
        metadata: {
          itemType: 'object',
          properties: {
            vehicleId: 'integer',
            currentLoad: 'number',
            remainingCapacity: 'number'
          }
        }
      },
      {
        name: 'arrival_times',
        type: 'array' as VariableType,
        description: 'Arrival times at each location',
        metadata: {
          itemType: 'object',
          properties: {
            locationId: 'integer',
            vehicleId: 'integer',
            arrivalTime: 'number',
            waitTime: 'number',
            serviceTime: 'number'
          }
        }
      }
    ];
  }

  private createConstraints(): Constraint[] {
    const constraints: Constraint[] = [
      // Basic routing constraints
      FleetConstraintFactory.distance(this.config.constraints?.maxRouteDistance || 1000)
        .withPriority('must')
        .build()
    ];

    // Add capacity constraints if specified
    if (this.config.constraints?.capacityLimits) {
      this.config.constraints.capacityLimits.forEach((capacity, index) => {
        constraints.push(
          FleetConstraintFactory.capacity(capacity)
            .withPriority('must')
            .build()
        );
      });
    }

    // Add time window constraints if enabled
    if (this.config.constraints?.timeWindows) {
      this.config.locations
        .filter(location => location.timeWindows && location.timeWindows.length > 0)
        .forEach(location => {
          const window = location.timeWindows![0];
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
    const {
      distanceWeight = 0.6,
      timeWeight = 0.3,
      loadWeight = 0.1
    } = this.config.objectives || {};

    return [
      {
        type: 'minimize',
        field: 'total_distance',
        description: 'Minimize total travel distance',
        weight: distanceWeight
      },
      {
        type: 'minimize',
        field: 'total_time',
        description: 'Minimize total travel time including service times',
        weight: timeWeight
      },
      {
        type: 'minimize',
        field: 'load_imbalance',
        description: 'Balance load across vehicles',
        weight: loadWeight
      }
    ];
  }

  public createMCP(): MCP {
    return {
      sessionId: `ortools-vrp-${Date.now()}`,
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
              first_solution_strategy: 'PATH_CHEAPEST_ARC',
              local_search_metaheuristic: 'GUIDED_LOCAL_SEARCH',
              time_limit_ms: 30000,
              solution_limit: 100,
              log_search: true
            },
            distance_matrix: this.config.distanceMatrix,
            num_vehicles: this.config.numVehicles,
            depot_index: 0,
            pickup_deliveries: this.config.constraints?.pickupsDeliveries || [],
            demand_quantities: this.config.constraints?.demandQuantities || [],
            vehicle_load_time: this.config.constraints?.vehicleLoadTime || 0,
            vehicle_unload_time: this.config.constraints?.vehicleUnloadTime || 0,
            complexity: this.complexity
          }
        },
        dataset: {
          internalSources: ['locations', 'vehicles'],
          dataQuality: 'good',
          requiredFields: [
            'id',
            'latitude',
            'longitude',
            'demand',
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
            description: 'Collect location and vehicle data',
            required: true
          },
          {
            action: 'build_model',
            description: 'Build OR-Tools VRP model',
            required: true,
            parameters: {
              solver_type: 'or_tools_vrp',
              distance_matrix_type: 'euclidean'
            }
          },
          {
            action: 'solve_model',
            description: 'Generate optimal routes using OR-Tools',
            required: true,
            parameters: {
              solver: 'or_tools',
              timeout: 30000,
              solution_limit: 100
            }
          },
          {
            action: 'explain_solution',
            description: 'Generate solution insights and statistics',
            required: true,
            parameters: {
              include_metrics: [
                'total_distance',
                'total_time',
                'vehicle_utilization',
                'service_level'
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