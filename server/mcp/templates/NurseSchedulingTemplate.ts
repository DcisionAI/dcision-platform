import { MCP, Variable, Constraint, Objective, VariableType } from '../types';
import { FleetConstraintFactory } from '../constraints/FleetConstraints';

interface Nurse {
  id: string;
  skills: string[];
  preferences: Array<{
    shiftType: string;
    weight: number;
  }>;
  maxShiftsPerWeek: number;
  minRestHours: number;
  contractHours: number;
  vacationDays?: string[];
}

interface Shift {
  id: string;
  type: string;
  startTime: string;
  endTime: string;
  requiredSkills: string[];
  minNurses: number;
  preferredNurses: number;
  department: string;
}

interface Department {
  id: string;
  minStaffing: Record<string, number>;
  preferredStaffing: Record<string, number>;
  skillRequirements: Record<string, string[]>;
}

interface NSPConfig {
  nurses: Nurse[];
  shifts: Shift[];
  days: number;
  preferences?: Record<string, Record<string, number>>;
  constraints?: {
    minShiftsPerNurse?: number;
    maxShiftsPerNurse?: number;
    minRestHours?: number;
    skillRequirements?: Record<string, string[]>;
  };
  objectives?: {
    minimizeUnderstaffing?: boolean;
    maximizePreferences?: boolean;
    minimizeOvertime?: boolean;
    balanceWorkload?: boolean;
    maximizeSkillMatch?: boolean;
  };
  planningHorizon?: {
    start: string;
    end: string;
  };
}

export class NurseSchedulingTemplate {
  private config: NSPConfig;

  constructor(config: NSPConfig) {
    this.config = config;
  }

  private createVariables(): Variable[] {
    const variables: Variable[] = [];

    // Nurse assignments
    variables.push({
      name: 'nurse_assignments',
      type: 'binary',
      description: 'Assignment of nurses to shifts',
      dimensions: ['nurse_id', 'shift_id', 'day'],
      domain: [0, 1],
      metadata: {
        itemType: 'integer'
      }
    });

    // Shifts per nurse
    variables.push({
      name: 'shifts_per_nurse',
      type: 'integer',
      description: 'Number of shifts assigned to each nurse',
      dimensions: ['nurse_id'],
      min: 0,
      max: this.config.constraints?.maxShiftsPerNurse || 5
    });

    // Rest hours tracking
    variables.push({
      name: 'rest_hours_between_shifts',
      type: 'integer',
      description: 'Hours of rest between consecutive shifts',
      dimensions: ['nurse_id', 'day'],
      min: 0,
      max: 24
    });

    // Skill coverage tracking
    variables.push({
      name: 'skill_requirements_met',
      type: 'binary',
      description: 'Whether skill requirements are met for each shift',
      dimensions: ['shift_id', 'day'],
      domain: [0, 1],
      metadata: {
        itemType: 'integer'
      }
    });

    return variables;
  }

  private createConstraints(): Constraint[] {
    const constraints: Constraint[] = [];

    // Basic assignment constraints
    constraints.push({
      type: 'min_shifts',
      description: 'Each nurse must work at least the minimum required shifts',
      field: 'shifts_per_nurse',
      operator: 'gte',
      value: this.config.constraints?.minShiftsPerNurse || 0,
      priority: 'must'
    });

    constraints.push({
      type: 'max_shifts',
      description: 'Each nurse must not exceed maximum allowed shifts',
      field: 'shifts_per_nurse',
      operator: 'lte',
      value: this.config.constraints?.maxShiftsPerNurse || 5,
      priority: 'must'
    });

    // Rest hours between shifts
    constraints.push({
      type: 'min_rest',
      description: 'Ensure minimum rest hours between shifts',
      field: 'rest_hours_between_shifts',
      operator: 'gte',
      value: this.config.constraints?.minRestHours || 12,
      priority: 'must'
    });

    // Skill requirements
    if (this.config.constraints?.skillRequirements) {
      constraints.push({
        type: 'skill_coverage',
        description: 'Ensure required skills are covered for each shift',
        field: 'skill_requirements_met',
        operator: 'eq',
        value: 1,
        priority: 'must'
      });
    }

    return constraints;
  }

  private createObjectives(): Objective[] {
    const objectives: Objective[] = [];
    const {
      minimizeUnderstaffing = true,
      maximizePreferences = false,
      minimizeOvertime = false,
      balanceWorkload = false,
      maximizeSkillMatch = false
    } = this.config.objectives || {};

    if (minimizeUnderstaffing) {
      objectives.push({
        type: 'minimize',
        field: 'understaffing',
        description: 'Minimize understaffing across departments',
        weight: 0.3
      });
    }

    if (maximizePreferences) {
      objectives.push({
        type: 'maximize',
        field: 'preference_satisfaction',
        description: 'Maximize nurse shift preferences',
        weight: 0.25
      });
    }

    if (minimizeOvertime) {
      objectives.push({
        type: 'minimize',
        field: 'overtime',
        description: 'Minimize overtime hours',
        weight: 0.2
      });
    }

    if (balanceWorkload) {
      objectives.push({
        type: 'minimize',
        field: 'workload_variance',
        description: 'Balance workload across nurses',
        weight: 0.15
      });
    }

    if (maximizeSkillMatch) {
      objectives.push({
        type: 'maximize',
        field: 'skill_utilization',
        description: 'Maximize skill utilization',
        weight: 0.1
      });
    }

    return objectives;
  }

  public createMCP(): MCP {
    return {
      sessionId: `nurse-scheduling-${Date.now()}`,
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
              time_limit_ms: 60000,
              solution_limit: 100,
              log_search: true
            },
            nurses: this.config.nurses,
            shifts: this.config.shifts,
            days: this.config.planningHorizon,
            preferences: this.config.preferences || {}
          }
        },
        dataset: {
          internalSources: ['nurses', 'shifts', 'departments'],
          dataQuality: 'good',
          requiredFields: [
            'id',
            'skills',
            'preferences',
            'maxShiftsPerWeek',
            'minRestHours'
          ]
        },
        problemType: 'resource_scheduling',
        industry: 'healthcare'
      },
      protocol: {
        steps: [
          {
            action: 'collect_data',
            description: 'Gather nurse availability, preferences, and shift requirements',
            required: true
          },
          {
            action: 'validate_constraints',
            description: 'Verify nurse qualifications and shift coverage requirements',
            required: true,
            parameters: {
              validate_skills: true,
              verify_coverage: true
            }
          },
          {
            action: 'build_model',
            description: 'Construct the nurse scheduling optimization model',
            required: true,
            parameters: {
              solver_type: 'or_tools_cp',
              consider_preferences: true
            }
          },
          {
            action: 'solve_model',
            description: 'Generate optimal nurse schedule',
            required: true,
            parameters: {
              solver: 'or_tools',
              timeout: 60000,
              solution_limit: 100
            }
          },
          {
            action: 'explain_solution',
            description: 'Generate schedule insights',
            required: true,
            parameters: {
              include_metrics: [
                'understaffing',
                'preference_satisfaction',
                'overtime_hours',
                'workload_balance',
                'skill_utilization'
              ]
            }
          },
          {
            action: 'human_review',
            description: 'Review and approve nurse schedules',
            required: true
          }
        ],
        allowPartialSolutions: true,
        explainabilityEnabled: true,
        humanInTheLoop: {
          required: true,
          approvalSteps: ['final_schedule', 'shift_assignments']
        }
      }
    };
  }
} 