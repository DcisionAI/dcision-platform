import { MCP, Variable, Constraint, Objective, VariableType, Location } from '../MCPTypes';
import { FleetConstraintFactory } from '../constraints/FleetConstraints';

interface TimeSlot {
  startTime: string;
  endTime: string;
  speedFactor: number;  // Multiplier for base travel times (e.g., 0.8 for slower traffic)
}

interface TDVRPConfig {
  vehicles: Array<{
    id: string;
    capacity: number;
    startLocation: Location;
    endLocation?: Location;
    availableTimeSlots: TimeSlot[];
    maxDrivingTime?: number;
  }>;
  customers: Array<{
    location: Location;
    demand: number;
    serviceTime: number;
    timeWindows: Array<{
      start: string;
      end: string;
      priority?: number;
    }>;
  }>;
  timeSlots: TimeSlot[];
  baseDistanceMatrix: number[][];
  constraints?: {
    maxRouteDistance?: number;
    maxRouteTime?: number;
    breakRequirements?: Array<{
      afterDrivingTime: number;
      duration: number;
    }>;
    restartPoints?: Location[];
  };
}

export class TimeDependentVRPTemplate {
  private config: TDVRPConfig;

  constructor(config: TDVRPConfig) {
    this.config = config;
  }

  private createVariables(): Variable[] {
    return [
      {
        name: 'route_assignments',
        type: 'array',
        description: 'Time-dependent route assignments',
        metadata: {
          itemType: 'object',
          properties: {
            vehicleId: 'string',
            stops: 'array',
            departureTime: 'string',
            arrivalTimes: 'array',
            totalTime: 'number',
            totalDistance: 'number'
          }
        }
      },
      {
        name: 'break_schedules',
        type: 'array',
        description: 'Break and rest schedules',
        metadata: {
          itemType: 'object',
          properties: {
            vehicleId: 'string',
            breakStart: 'string',
            breakEnd: 'string',
            location: 'object',
            breakType: 'string'
          }
        }
      },
      {
        name: 'time_slot_utilization',
        type: 'array',
        description: 'Utilization of different time slots',
        metadata: {
          itemType: 'object',
          properties: {
            timeSlotId: 'string',
            numVehicles: 'integer',
            totalDistance: 'number',
            averageSpeed: 'number'
          }
        }
      }
    ];
  }

  private createConstraints(): Constraint[] {
    const constraints: Constraint[] = [
      // Time window constraints for customers
      ...this.config.customers.flatMap(customer =>
        customer.timeWindows.map(window =>
          FleetConstraintFactory.timeWindow(window.start, window.end)
            .withPriority(window.priority ? 'should' : 'must')
            .withPenalty(window.priority || 100)
            .build()
        )
      )
    ];

    // Add vehicle-specific constraints
    this.config.vehicles.forEach(vehicle => {
      if (vehicle.maxDrivingTime) {
        constraints.push(
          FleetConstraintFactory.serviceDuration(vehicle.maxDrivingTime * 60)
            .withPriority('must')
            .build()
        );
      }
    });

    // Add break time constraints if specified
    if (this.config.constraints?.breakRequirements) {
      this.config.constraints.breakRequirements.forEach(req => {
        constraints.push(
          FleetConstraintFactory.breakTime(req.duration, req.afterDrivingTime)
            .withPriority('must')
            .build()
        );
      });
    }

    return constraints;
  }

  private createObjectives(): Objective[] {
    return [
      {
        type: 'minimize',
        field: 'total_time',
        description: 'Minimize total travel time considering time-dependent speeds',
        weight: 0.4
      },
      {
        type: 'minimize',
        field: 'peak_hour_usage',
        description: 'Minimize travel during peak hours',
        weight: 0.3
      },
      {
        type: 'maximize',
        field: 'time_window_satisfaction',
        description: 'Maximize preferred time window satisfaction',
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
      sessionId: `tdvrp-${Date.now()}`,
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
              local_search_metaheuristic: 'SIMULATED_ANNEALING',
              time_limit_ms: 60000,
              solution_limit: 100,
              log_search: true
            },
            time_slots: this.config.timeSlots,
            base_distance_matrix: this.config.baseDistanceMatrix,
            break_requirements: this.config.constraints?.breakRequirements || [],
            restart_points: this.config.constraints?.restartPoints || []
          }
        },
        dataset: {
          internalSources: ['vehicles', 'customers', 'traffic_data'],
          dataQuality: 'good',
          requiredFields: [
            'id',
            'location',
            'timeWindows',
            'demand',
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
            description: 'Collect vehicle, customer, and traffic data',
            required: true
          },
          {
            action: 'enrich_data',
            description: 'Enrich with real-time traffic data',
            required: true,
            parameters: {
              data_sources: ['traffic_api', 'weather_api']
            }
          },
          {
            action: 'build_model',
            description: 'Build time-dependent VRP model',
            required: true,
            parameters: {
              solver_type: 'or_tools_tdvrp',
              time_dependency: true
            }
          },
          {
            action: 'solve_model',
            description: 'Generate optimal time-dependent routes',
            required: true,
            parameters: {
              solver: 'or_tools',
              timeout: 60000,
              solution_limit: 100
            }
          },
          {
            action: 'explain_solution',
            description: 'Generate solution insights',
            required: true,
            parameters: {
              include_metrics: [
                'total_time',
                'peak_hour_usage',
                'time_window_satisfaction',
                'vehicle_utilization'
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