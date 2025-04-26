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
        name: 'machine_utilization',
        type: 'array',
        description: 'Utilization metrics for each machine',
        metadata: {
          itemType: 'object',
          properties: {
            machineId: 'string',
            totalProcessingTime: 'number',
            totalSetupTime: 'number',
            idleTime: 'number',
            utilizationRate: 'number'
          }
        }
      },
      {
        name: 'job_completion',
        type: 'array',
        description: 'Completion metrics for each job',
        metadata: {
          itemType: 'object',
          properties: {
            jobId: 'string',
            completionTime: 'string',
            lateness: 'number',
            flowTime: 'number'
          }
        }
      }
    ];
  }

  private createConstraints(): Constraint[] {
    const constraints: Constraint[] = [];

    // Add time window constraints for machine availability
    this.config.machines.forEach(machine => {
      machine.availableTimeSlots.forEach(slot => {
        constraints.push(
          FleetConstraintFactory.timeWindow(slot.start, slot.end)
            .withPriority('must')
            .build()
        );
      });
    });

    // Add precedence constraints for operations
    this.config.operations
      .filter(op => op.precedingOperations && op.precedingOperations.length > 0)
      .forEach(op => {
        op.precedingOperations!.forEach(precedingOp => {
          constraints.push({
            type: 'precedence',
            description: `Operation ${op.id} must follow ${precedingOp}`,
            field: 'operation_sequence',
            operator: 'after',
            value: {
              operation: op.id,
              predecessor: precedingOp
            },
            priority: 'must'
          });
        });
      });

    // Add resource capacity constraints
    if (this.config.constraints?.resourceCapacity) {
      Object.entries(this.config.constraints.resourceCapacity).forEach(([resource, capacity]) => {
        constraints.push(
          FleetConstraintFactory.capacity(capacity)
            .withPriority('must')
            .build()
        );
      });
    }

    // Add minimum buffer time constraints if specified
    if (this.config.constraints?.minimumBufferTime) {
      constraints.push({
        type: 'buffer_time',
        description: 'Minimum buffer time between operations',
        field: 'operation_schedule',
        operator: 'min_gap',
        value: this.config.constraints.minimumBufferTime,
        priority: 'should'
      });
    }

    return constraints;
  }

  private createObjectives(): Objective[] {
    return [
      {
        type: 'minimize',
        field: 'makespan',
        description: 'Minimize total completion time',
        weight: 0.4
      },
      {
        type: 'minimize',
        field: 'total_tardiness',
        description: 'Minimize total job tardiness',
        weight: 0.3
      },
      {
        type: 'minimize',
        field: 'setup_time',
        description: 'Minimize total setup time',
        weight: 0.2
      },
      {
        type: 'maximize',
        field: 'machine_utilization',
        description: 'Maximize machine utilization',
        weight: 0.1
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
              type: 'or_tools',
              first_solution_strategy: 'SEQUENCE_LEXICAL',
              local_search_metaheuristic: 'TABU_SEARCH',
              time_limit_ms: 60000,
              solution_limit: 100,
              log_search: true
            },
            setup_matrix: this.config.machines.reduce<Record<string, Record<string, Record<string, number>>>>((acc, machine) => {
              if (machine.setupMatrix) {
                acc[machine.id] = machine.setupMatrix;
              }
              return acc;
            }, {}),
            maintenance_schedule: this.config.machines.reduce((acc, machine) => {
              if (machine.maintenanceSchedule) {
                acc[machine.id] = machine.maintenanceSchedule;
              }
              return acc;
            }, {} as Record<string, any[]>)
          }
        },
        dataset: {
          internalSources: ['operations', 'machines', 'jobs'],
          dataQuality: 'good',
          requiredFields: [
            'id',
            'processingTime',
            'machineId',
            'precedingOperations'
          ]
        },
        problemType: 'job_shop',
        industry: 'manufacturing'
      },
      protocol: {
        steps: [
          {
            action: 'collect_data',
            description: 'Collect operation and machine data',
            required: true
          },
          {
            action: 'build_model',
            description: 'Build job shop scheduling model',
            required: true,
            parameters: {
              solver_type: 'or_tools_cp',
              consider_setup_times: true,
              consider_maintenance: true
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
                'tardiness',
                'machine_utilization',
                'setup_efficiency'
              ]
            }
          }
        ],
        allowPartialSolutions: true,
        explainabilityEnabled: true,
        humanInTheLoop: {
          required: true,
          approvalSteps: ['final_schedule']
        }
      }
    };
  }
} 