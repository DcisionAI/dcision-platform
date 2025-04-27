import { MCP, Variable, Constraint, Objective, VariableType } from '../MCPTypes';
import { FleetConstraintFactory } from '../constraints/FleetConstraints';

interface Operation {
  id: string;
  jobId: string;
  machineId: string;
  processingTime: number;
  setupTime?: number;
  requiredSkills?: string[];
  precedingOperations?: string[];
  alternativeMachines?: string[];
}

interface Machine {
  id: string;
  capabilities: string[];
  availableTimeSlots: Array<{
    start: string;
    end: string;
  }>;
  maintenanceSchedule?: Array<{
    start: string;
    end: string;
    type: string;
  }>;
  setupMatrix?: Record<string, Record<string, number>>;
}

interface JSSPConfig {
  operations: Operation[];
  machines: Machine[];
  jobs: Array<{
    id: string;
    priority: number;
    dueDate?: string;
    releaseDate?: string;
    operations: string[];
  }>;
  constraints?: {
    maxMakespan?: number;
    maxLateness?: number;
    resourceCapacity?: Record<string, number>;
    noPreemption?: boolean;
    minimumBufferTime?: number;
  };
}

export class JobShopTemplate {
  private config: JSSPConfig;

  constructor(config: JSSPConfig) {
    this.config = config;
  }

  private createVariables(): Variable[] {
    return [
      {
        name: 'operation_schedule',
        type: 'array',
        description: 'Schedule of operations on machines',
        metadata: {
          itemType: 'object',
          properties: {
            operationId: 'string',
            machineId: 'string',
            startTime: 'string',
            endTime: 'string',
            setupStartTime: 'string'
          }
        }
      },
      {
        name: 'jobs',
        type: 'array',
        description: 'List of jobs to be scheduled',
        metadata: {
          itemType: 'object',
          properties: {
            'id': 'string',
            'name': 'string',
            'operations': 'array',
            'dueDate': 'datetime',
            'priority': 'number'
          }
        }
      },
      {
        name: 'machines',
        type: 'array',
        description: 'List of available machines',
        metadata: {
          itemType: 'object',
          properties: {
            'id': 'string',
            'name': 'string',
            'availability': 'array'
          }
        }
      }
    ];
  }

  private createConstraints(): Constraint[] {
    return [
      {
        type: 'sequence',
        description: 'Operations for each job must be performed in sequence',
        field: 'operation_sequence',
        operator: 'follows',
        value: null,
        priority: 'must'
      },
      {
        type: 'capacity',
        description: 'Each machine can process only one operation at a time',
        field: 'machine_capacity',
        operator: 'lte',
        value: 1,
        priority: 'must'
      },
      {
        type: 'time_window',
        description: 'Operations can only be scheduled during machine availability windows',
        field: 'machine_availability',
        operator: 'between',
        value: this.config.machines.map(m => m.availableTimeSlots),
        priority: 'must'
      }
    ];
  }

  private createObjectives(): Objective[] {
    return [
      {
        type: 'minimize',
        field: 'makespan',
        description: 'Minimize total completion time of all jobs',
        weight: 1.0
      },
      {
        type: 'minimize',
        field: 'tardiness',
        description: 'Minimize total tardiness (lateness beyond due dates)',
        weight: 0.8
      },
      {
        type: 'minimize',
        field: 'setup_time',
        description: 'Minimize total setup time between operations',
        weight: 0.5
      }
    ];
  }

  public createMCP(): MCP {
    return {
      sessionId: `jssp-${Date.now()}`,
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
          internalSources: ['jobs', 'machines', 'operations'],
          dataQuality: 'good',
          requiredFields: ['id', 'processingTime', 'machineId', 'jobId']
        },
        problemType: 'job_shop',
        industry: 'manufacturing'
      },
      protocol: {
        steps: [
          {
            action: 'collect_data',
            description: 'Collect job and machine data',
            required: true
          },
          {
            action: 'validate_constraints',
            description: 'Validate job sequences and machine availability',
            required: true
          },
          {
            action: 'build_model',
            description: 'Build job shop scheduling model',
            required: true
          },
          {
            action: 'solve_model',
            description: 'Solve job shop scheduling model',
            required: true
          },
          {
            action: 'explain_solution',
            description: 'Generate schedule visualization and metrics',
            required: true
          },
          {
            action: 'human_review',
            description: 'Review and approve schedule',
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