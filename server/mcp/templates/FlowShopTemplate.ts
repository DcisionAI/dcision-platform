import { MCP, Variable, Constraint, Objective, ProtocolStep, ProblemType, IndustryVertical } from '../MCPTypes';

const FlowShopTemplate: MCP = {
  sessionId: `flowshop-${Date.now()}`,
  version: '1.0.0',
  status: 'pending',
  created: new Date().toISOString(),
  lastModified: new Date().toISOString(),
  model: {
    variables: [
      {
        name: 'jobs',
        type: 'array',
        description: 'List of jobs to be processed',
        metadata: {
          itemType: 'object',
          properties: {
            id: 'string',
            name: 'string',
            processing_times: 'array',
            due_date: 'number',
            priority: 'number'
          }
        }
      },
      {
        name: 'machines',
        type: 'array',
        description: 'List of machines in sequence',
        metadata: {
          itemType: 'object',
          properties: {
            id: 'string',
            name: 'string',
            setup_time: 'number',
            maintenance_schedule: 'array'
          }
        }
      },
      {
        name: 'max_wip',
        type: 'number',
        description: 'Maximum allowed work in progress between machines',
        default: 999999
      },
      {
        name: 'buffer_capacity',
        type: 'number',
        description: 'Maximum number of jobs that can wait between machines',
        default: 999999
      }
    ],
    constraints: [
      {
        type: 'sequence',
        description: 'Jobs must follow the same sequence through all machines',
        field: 'job_sequence',
        operator: 'follows',
        value: true,
        priority: 'must'
      },
      {
        type: 'capacity',
        description: 'A machine can process only one job at a time',
        field: 'machine_capacity',
        operator: 'non_concurrent',
        value: true,
        priority: 'must'
      },
      {
        type: 'precedence',
        description: 'A job cannot start on a machine before completing on the previous machine',
        field: 'operation_precedence',
        operator: 'follows',
        value: true,
        priority: 'must'
      },
      {
        type: 'wip',
        description: 'Number of jobs in progress must not exceed max_wip',
        field: 'wip_count',
        operator: 'lte',
        value: 'max_wip',
        priority: 'should',
        penalty: 1000
      },
      {
        type: 'buffer',
        description: 'Number of jobs waiting between machines must not exceed buffer_capacity',
        field: 'buffer_count',
        operator: 'lte',
        value: 'buffer_capacity',
        priority: 'should',
        penalty: 1000
      }
    ],
    objective: [
      {
        type: 'minimize',
        field: 'makespan',
        description: 'Minimize the total completion time of all jobs',
        weight: 1.0
      },
      {
        type: 'minimize',
        field: 'tardiness',
        description: 'Minimize the total tardiness of jobs relative to their due dates',
        weight: 0.7
      },
      {
        type: 'minimize',
        field: 'wip',
        description: 'Minimize the average work in progress',
        weight: 0.3
      }
    ]
  },
  context: {
    environment: {
      region: 'default',
      timezone: 'UTC',
      parameters: {
        solver_config: {
          type: 'or_tools',
          first_solution_strategy: 'PRIORITY_BASED',
          local_search_metaheuristic: 'TABU_SEARCH',
          time_limit_ms: 60000
        }
      }
    },
    dataset: {
      internalSources: ['jobs', 'machines'],
      dataQuality: 'good',
      requiredFields: ['id', 'processing_times', 'priority']
    },
    problemType: 'flow_shop',
    industry: 'manufacturing'
  },
  protocol: {
    steps: [
      {
        action: 'collect_data',
        description: 'Collect job processing times and due dates',
        required: true
      },
      {
        action: 'collect_data',
        description: 'Collect machine setup times and maintenance schedules',
        required: true
      },
      {
        action: 'validate_constraints',
        description: 'Validate job and machine data consistency',
        required: true
      },
      {
        action: 'build_model',
        description: 'Build flow shop scheduling optimization model',
        required: true
      },
      {
        action: 'solve_model',
        description: 'Solve the optimization model',
        required: true
      },
      {
        action: 'explain_solution',
        description: 'Generate Gantt chart visualization',
        required: true
      },
      {
        action: 'human_review',
        description: 'Review and approve production schedule',
        required: true
      }
    ],
    allowPartialSolutions: true,
    explainabilityEnabled: true,
    humanInTheLoop: {
      required: true,
      approvalSteps: ['review_schedule']
    }
  }
};

export default FlowShopTemplate; 