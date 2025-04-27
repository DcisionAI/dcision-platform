import { MCP, Variable, Constraint, Objective, VariableType } from '../MCPTypes';
import { FleetConstraintFactory } from '../constraints/FleetConstraints';

interface Worker {
  id: string;
  skills: string[];
  availability: Array<{
    start: string;
    end: string;
  }>;
  maxTasks?: number;
  preferences?: string[];
  costPerHour: number;
}

interface Task {
  id: string;
  requiredSkills: string[];
  duration: number;
  deadline?: string;
  priority: number;
  dependencies?: string[];
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface AssignmentConfig {
  workers: Worker[];
  tasks: Task[];
  constraints?: {
    maxWorkloadPerWorker?: number;
    skillMatchRequired?: boolean;
    geographicalPreference?: boolean;
    workloadBalance?: boolean;
    maxConcurrentTasks?: number;
  };
  objectives?: {
    minimizeCost?: boolean;
    maximizeSkillMatch?: boolean;
    balanceWorkload?: boolean;
    maximizePriority?: boolean;
  };
}

export class AssignmentTemplate {
  private config: AssignmentConfig;

  constructor(config: AssignmentConfig) {
    this.config = config;
  }

  private createVariables(): Variable[] {
    return [
      {
        name: 'task_assignments',
        type: 'array',
        description: 'Assignment of tasks to workers',
        metadata: {
          itemType: 'object',
          properties: {
            taskId: 'string',
            workerId: 'string',
            startTime: 'string',
            endTime: 'string',
            skillMatch: 'number'
          }
        }
      },
      {
        name: 'worker_schedules',
        type: 'array',
        description: 'Detailed schedule for each worker',
        metadata: {
          itemType: 'object',
          properties: {
            workerId: 'string',
            totalHours: 'number',
            taskCount: 'integer',
            utilization: 'number',
            totalCost: 'number'
          }
        }
      }
    ];
  }

  private createConstraints(): Constraint[] {
    const constraints: Constraint[] = [];

    // Add skill match constraints if required
    if (this.config.constraints?.skillMatchRequired) {
      constraints.push({
        type: 'skill_match',
        description: 'Workers must have required skills',
        field: 'skill_requirements',
        operator: 'eq',
        value: true,
        priority: 'must'
      });
    }

    // Add workload constraints
    if (this.config.constraints?.maxWorkloadPerWorker) {
      this.config.workers.forEach(worker => {
        constraints.push({
          type: 'workload',
          description: `Maximum workload for worker ${worker.id}`,
          field: 'total_hours',
          operator: 'lte',
          value: this.config.constraints!.maxWorkloadPerWorker,
          priority: 'must'
        });
      });
    }

    // Add concurrent tasks constraints
    if (this.config.constraints?.maxConcurrentTasks) {
      constraints.push({
        type: 'concurrent_tasks',
        description: 'Maximum concurrent tasks per worker',
        field: 'active_tasks',
        operator: 'lte',
        value: this.config.constraints.maxConcurrentTasks,
        priority: 'must'
      });
    }

    // Add task dependency constraints
    this.config.tasks
      .filter(task => task.dependencies && task.dependencies.length > 0)
      .forEach(task => {
        task.dependencies!.forEach(depId => {
          constraints.push({
            type: 'dependency',
            description: `Task ${task.id} depends on ${depId}`,
            field: 'task_sequence',
            operator: 'after',
            value: {
              task: task.id,
              dependency: depId
            },
            priority: 'must'
          });
        });
      });

    return constraints;
  }

  private createObjectives(): Objective[] {
    const objectives: Objective[] = [];
    const {
      minimizeCost = true,
      maximizeSkillMatch = false,
      balanceWorkload = false,
      maximizePriority = false
    } = this.config.objectives || {};

    if (minimizeCost) {
      objectives.push({
        type: 'minimize',
        field: 'total_cost',
        description: 'Minimize total assignment cost',
        weight: 0.4
      });
    }

    if (maximizeSkillMatch) {
      objectives.push({
        type: 'maximize',
        field: 'skill_match_score',
        description: 'Maximize skill match between workers and tasks',
        weight: 0.3
      });
    }

    if (balanceWorkload) {
      objectives.push({
        type: 'minimize',
        field: 'workload_variance',
        description: 'Balance workload across workers',
        weight: 0.2
      });
    }

    if (maximizePriority) {
      objectives.push({
        type: 'maximize',
        field: 'priority_satisfaction',
        description: 'Maximize high-priority task assignments',
        weight: 0.1
      });
    }

    return objectives;
  }

  public createMCP(): MCP {
    return {
      sessionId: `assignment-${Date.now()}`,
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
              first_solution_strategy: 'MIN_COST_FLOW',
              local_search_metaheuristic: 'GUIDED_LOCAL_SEARCH',
              time_limit_ms: 30000,
              solution_limit: 100,
              log_search: true
            },
            workers: this.config.workers,
            tasks: this.config.tasks,
            skill_requirements: this.config.constraints?.skillMatchRequired || false,
            geographical_preference: this.config.constraints?.geographicalPreference || false
          }
        },
        dataset: {
          internalSources: ['workers', 'tasks'],
          dataQuality: 'good',
          requiredFields: [
            'id',
            'skills',
            'availability',
            'requiredSkills',
            'duration'
          ]
        },
        problemType: 'assignment',
        industry: 'project_management'
      },
      protocol: {
        steps: [
          {
            action: 'collect_data',
            description: 'Collect worker and task data',
            required: true
          },
          {
            action: 'validate_constraints',
            description: 'Validate assignment constraints',
            required: true,
            parameters: {
              check_skills: true,
              validate_availability: true
            }
          },
          {
            action: 'build_model',
            description: 'Build assignment model',
            required: true,
            parameters: {
              solver_type: 'or_tools_cp',
              consider_preferences: true
            }
          },
          {
            action: 'solve_model',
            description: 'Generate optimal assignments',
            required: true,
            parameters: {
              solver: 'or_tools',
              timeout: 30000,
              solution_limit: 100
            }
          },
          {
            action: 'explain_solution',
            description: 'Generate assignment insights',
            required: true,
            parameters: {
              include_metrics: [
                'total_cost',
                'skill_match_score',
                'workload_balance',
                'priority_satisfaction'
              ]
            }
          },
          {
            action: 'human_review',
            description: 'Review and approve task assignments',
            required: true
          }
        ],
        allowPartialSolutions: true,
        explainabilityEnabled: true,
        humanInTheLoop: {
          required: true,
          approvalSteps: ['final_assignments', 'worker_schedules']
        }
      }
    };
  }
} 