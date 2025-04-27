import { MCP, Variable, Constraint, Objective, VariableType } from '../types';
import { FleetConstraintFactory } from '../constraints/FleetConstraints';

interface Activity {
  id: string;
  name: string;
  duration: number;
  earliestStart?: string;
  latestFinish?: string;
  predecessors: string[];
  resourceRequirements: Record<string, number>;
  priority?: number;
  skills?: string[];
}

interface Resource {
  id: string;
  type: 'renewable' | 'nonrenewable' | 'doubly_constrained';
  capacity: number;
  costPerUnit?: number;
  availabilityCalendar?: Array<{
    start: string;
    end: string;
    capacity: number;
  }>;
  skills?: string[];
}

interface RCPSPConfig {
  activities: Activity[];
  resources: Resource[];
  projectDeadline?: string;
  constraints?: {
    maxMakespan?: number;
    resourceLeveling?: boolean;
    minimumQuality?: number;
    maxConcurrentActivities?: number;
    skillRequirements?: boolean;
  };
  objectives?: {
    makespanWeight?: number;
    resourceUtilizationWeight?: number;
    costWeight?: number;
    qualityWeight?: number;
  };
}

export class RCPSPTemplate {
  private config: RCPSPConfig;

  constructor(config: RCPSPConfig) {
    this.config = config;
  }

  private createVariables(): Variable[] {
    return [
      {
        name: 'activity_schedule',
        type: 'array',
        description: 'Schedule of project activities',
        metadata: {
          itemType: 'object',
          properties: {
            activityId: 'string',
            startTime: 'string',
            endTime: 'string',
            assignedResources: 'object',
            progress: 'number'
          }
        }
      },
      {
        name: 'resource_allocation',
        type: 'array',
        description: 'Resource allocation over time',
        metadata: {
          itemType: 'object',
          properties: {
            resourceId: 'string',
            timeSlot: 'string',
            allocation: 'number',
            remainingCapacity: 'number'
          }
        }
      },
      {
        name: 'project_metrics',
        type: 'object',
        description: 'Overall project performance metrics',
        metadata: {
          properties: {
            makespan: 'number',
            totalCost: 'number',
            resourceUtilization: 'number',
            qualityScore: 'number'
          }
        }
      }
    ];
  }

  private createConstraints(): Constraint[] {
    const constraints: Constraint[] = [];

    // Add precedence constraints
    this.config.activities
      .filter(activity => activity.predecessors.length > 0)
      .forEach(activity => {
        activity.predecessors.forEach(predecessor => {
          constraints.push({
            type: 'sequence',
            description: `Activity ${activity.id} must follow ${predecessor}`,
            field: 'activity_sequence',
            operator: 'follows',
            value: {
              activity: activity.id,
              predecessor
            },
            priority: 'must'
          });
        });
      });

    // Add resource capacity constraints
    this.config.resources.forEach(resource => {
      constraints.push(
        FleetConstraintFactory.capacity(resource.capacity)
          .withPriority('must')
          .build()
      );

      // Add time-varying capacity constraints if specified
      if (resource.availabilityCalendar) {
        resource.availabilityCalendar.forEach(slot => {
          constraints.push(
            FleetConstraintFactory.timeWindow(slot.start, slot.end)
              .withPriority('must')
              .build()
          );
        });
      }
    });

    // Add project deadline constraint if specified
    if (this.config.projectDeadline) {
      constraints.push({
        type: 'deadline',
        description: 'Project must complete before deadline',
        field: 'project_completion',
        operator: 'lte',
        value: this.config.projectDeadline,
        priority: 'must'
      });
    }

    return constraints;
  }

  private createObjectives(): Objective[] {
    const {
      makespanWeight = 0.4,
      resourceUtilizationWeight = 0.3,
      costWeight = 0.2,
      qualityWeight = 0.1
    } = this.config.objectives || {};

    return [
      {
        type: 'minimize',
        field: 'makespan',
        description: 'Minimize project duration',
        weight: makespanWeight
      },
      {
        type: 'maximize',
        field: 'resource_utilization',
        description: 'Maximize resource utilization',
        weight: resourceUtilizationWeight
      },
      {
        type: 'minimize',
        field: 'total_cost',
        description: 'Minimize total project cost',
        weight: costWeight
      },
      {
        type: 'maximize',
        field: 'quality_score',
        description: 'Maximize project quality',
        weight: qualityWeight
      }
    ];
  }

  public createMCP(): MCP {
    return {
      sessionId: `rcpsp-${Date.now()}`,
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
              first_solution_strategy: 'CRITICAL_PATH',
              local_search_metaheuristic: 'SIMULATED_ANNEALING',
              time_limit_ms: 60000,
              solution_limit: 100,
              log_search: true
            },
            activities: this.config.activities,
            resources: this.config.resources,
            project_deadline: this.config.projectDeadline,
            resource_leveling: this.config.constraints?.resourceLeveling || false,
            quality_threshold: this.config.constraints?.minimumQuality || 0.8
          }
        },
        dataset: {
          internalSources: ['activities', 'resources'],
          dataQuality: 'good',
          requiredFields: [
            'id',
            'duration',
            'predecessors',
            'resourceRequirements'
          ]
        },
        problemType: 'project_scheduling',
        industry: 'project_management'
      },
      protocol: {
        steps: [
          {
            action: 'collect_data',
            description: 'Collect activity and resource data',
            required: true
          },
          {
            action: 'validate_network',
            description: 'Validate project network structure',
            required: true,
            parameters: {
              check_cycles: true,
              validate_resources: true
            }
          },
          {
            action: 'build_model',
            description: 'Build RCPSP model',
            required: true,
            parameters: {
              solver_type: 'or_tools_cp',
              consider_resource_leveling: true,
              use_calendar: true
            }
          },
          {
            action: 'solve_model',
            description: 'Generate optimal schedule',
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
                'makespan',
                'resource_utilization',
                'cost_efficiency',
                'quality_score',
                'critical_path'
              ]
            }
          }
        ],
        allowPartialSolutions: true,
        explainabilityEnabled: true,
        humanInTheLoop: {
          required: true,
          approvalSteps: ['final_schedule', 'resource_allocation']
        }
      }
    };
  }
} 