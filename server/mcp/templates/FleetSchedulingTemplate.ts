import { MCP, Variable, Constraint, Objective, VariableType } from '../types';
import { FleetConstraintFactory } from '../constraints/FleetConstraints';

export interface ShiftPattern {
  id: string;
  name: string;
  startTime: string;  // ISO time format HH:mm
  endTime: string;    // ISO time format HH:mm
  breakTimes: {
    start: string;    // ISO time format HH:mm
    end: string;      // ISO time format HH:mm
  }[];
  daysOfWeek: number[];  // 1-7, where 1 is Monday
}

interface Driver {
  id: string;
  name: string;
  skills: string[];
  preferredShifts: string[];
  maxHoursPerWeek: number;
  maxHoursPerDay: number;
  costPerHour: number;
  homeLocation: {
    latitude: number;
    longitude: number;
    address: string;
    metadata?: Record<string, any>;
  };
  metadata?: Record<string, any>;
}

interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  breakTimes: Array<{
    start: string;
    duration: number;
  }>;
  daysOfWeek: number[];
  metadata?: Record<string, any>;
}

interface FleetSchedulingConfig {
  planningHorizon: number; // in days
  minRestBetweenShifts: number; // in hours
  maxConsecutiveWorkDays: number;
  maxHoursPerDay: number;
  allowedSkills: string[];
  shiftPatterns: Shift[];
  drivers: Driver[];
  constraints?: {
    maxOvertimeHours?: number;
    preferredDriverCount?: number;
    skillRequirements?: string[];
    geographicPreferences?: {
      latitude: number;
      longitude: number;
      maxDistance: number;
    };
  };
}

export class FleetSchedulingTemplate {
  private config: FleetSchedulingConfig;
  public readonly complexity = 'intermediate';

  constructor(config: FleetSchedulingConfig) {
    this.config = config;
  }

  private createVariables(): Variable[] {
    return [
      {
        name: 'driver_assignments',
        type: 'array' as VariableType,
        description: 'Driver to shift assignments',
        metadata: {
          itemType: 'object',
          properties: {
            driverId: 'string',
            shiftId: 'string',
            date: 'string'
          }
        }
      },
      {
        name: 'shift_coverage',
        type: 'array' as VariableType,
        description: 'Coverage for each shift',
        metadata: {
          itemType: 'object',
          properties: {
            shiftId: 'string',
            coverage: 'number'
          }
        }
      },
      {
        name: 'overtime_hours',
        type: 'float' as VariableType,
        description: 'Total overtime hours',
        default: 0
      }
    ];
  }

  private createConstraints(): Constraint[] {
    const constraints: Constraint[] = [
      // Break time constraints
      FleetConstraintFactory.breakTime(30, 240)
        .withPriority('must')
        .build(),

      // Working hours constraints
      FleetConstraintFactory.serviceDuration(this.config.maxHoursPerDay * 60)
        .withPriority('must')
        .build()
    ];

    // Add skill requirements if specified
    if (this.config.constraints?.skillRequirements) {
      constraints.push(
        FleetConstraintFactory.skillRequirement(this.config.constraints.skillRequirements)
          .withPriority('must')
          .build()
      );
    }

    // Add geographic constraints if specified
    if (this.config.constraints?.geographicPreferences) {
      const { maxDistance } = this.config.constraints.geographicPreferences;
      constraints.push(
        FleetConstraintFactory.distance(maxDistance)
          .withPriority('should')
          .withPenalty(100)
          .build()
      );
    }

    return constraints;
  }

  private createObjectives(): Objective[] {
    return [
      {
        type: 'minimize',
        field: 'total_labor_cost',
        description: 'Minimize total labor cost',
        weight: 0.4
      },
      {
        type: 'maximize',
        field: 'shift_coverage',
        description: 'Maximize shift coverage',
        weight: 0.3
      },
      {
        type: 'maximize',
        field: 'preference_satisfaction',
        description: 'Maximize driver shift preferences',
        weight: 0.2
      },
      {
        type: 'minimize',
        field: 'overtime_hours',
        description: 'Minimize overtime hours',
        weight: 0.1
      }
    ];
  }

  public createMCP(): MCP {
    return {
      sessionId: `fleet-schedule-${Date.now()}`,
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
            planning_horizon: `${this.config.planningHorizon}d`,
            min_rest_between_shifts: `${this.config.minRestBetweenShifts}h`,
            max_consecutive_work_days: this.config.maxConsecutiveWorkDays,
            allowed_skills: this.config.allowedSkills,
            complexity: this.complexity
          }
        },
        dataset: {
          internalSources: ['drivers', 'shifts'],
          dataQuality: 'good',
          requiredFields: ['id', 'name', 'skills', 'availability']
        },
        problemType: 'fleet_scheduling',
        industry: 'logistics'
      },
      protocol: {
        steps: [
          {
            action: 'interpret_intent',
            description: 'Understand scheduling requirements',
            required: true
          },
          {
            action: 'map_data',
            description: 'Map driver and shift data fields',
            required: true
          },
          {
            action: 'collect_data',
            description: 'Collect driver and shift data',
            required: true
          },
          {
            action: 'enrich_data',
            description: 'Add traffic and weather data',
            required: false
          },
          {
            action: 'build_model',
            description: 'Build scheduling model',
            required: true
          },
          {
            action: 'solve_model',
            description: 'Generate optimal schedule',
            required: true
          },
          {
            action: 'explain_solution',
            description: 'Generate schedule explanations',
            required: true
          },
          {
            action: 'human_review',
            description: 'Manager approval',
            required: true
          },
          {
            action: 'productionalize_workflow',
            description: 'Deploy approved schedule',
            required: true
          }
        ],
        allowPartialSolutions: false,
        explainabilityEnabled: true,
        humanInTheLoop: {
          required: true,
          approvalSteps: ['final_schedule']
        }
      }
    };
  }
} 