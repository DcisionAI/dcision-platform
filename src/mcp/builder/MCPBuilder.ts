import { MCP, Variable, Step, StepAction, Protocol } from '@/mcp/MCPTypes';

export class MCPBuilder {
  private id: string;
  private name: string;
  private description: string;
  private variables: Variable[] = [];
  private steps: Step[] = [];
  private metadata: Record<string, any> = {};

  constructor(id: string) {
    this.id = id;
    this.name = id; // Default name to id
    this.description = ''; // Empty default description
  }

  // Basic setters
  public setName(name: string): MCPBuilder {
    this.name = name;
    return this;
  }

  public setDescription(description: string): MCPBuilder {
    this.description = description;
    return this;
  }

  public addMetadata(key: string, value: any): MCPBuilder {
    this.metadata[key] = value;
    return this;
  }

  // Variable management
  public addVariable(
    name: string,
    type: Variable['type'],
    options: {
      description?: string;
      default?: any;
      required?: boolean;
    } = {}
  ): MCPBuilder {
    const variable: Variable = {
      name,
      type,
      description: options.description || name,
      default: options.default,
      required: options.required ?? true
    };

    this.validateVariable(variable);
    this.variables.push(variable);
    return this;
  }

  // Step management
  public addStep(
    id: string,
    action: StepAction,
    options: {
      description?: string;
      required?: boolean;
      config?: Record<string, any>;
    } = {}
  ): MCPBuilder {
    const step: Step = {
      id,
      action,
      description: options.description || `Execute ${action}`,
      required: options.required ?? true,
      config: options.config
    };

    this.validateStep(step);
    this.steps.push(step);
    return this;
  }

  // Common step patterns
  public addDataCollectionStep(
    id: string,
    dataSource: string,
    options: {
      description?: string;
      required?: boolean;
      additionalConfig?: Record<string, any>;
    } = {}
  ): MCPBuilder {
    return this.addStep(id, 'collect_data', {
      description: options.description || `Collect data from ${dataSource}`,
      required: options.required,
      config: {
        dataSource,
        ...options.additionalConfig
      }
    });
  }

  public addValidationStep(
    id: string,
    validationType: 'constraints' | 'network',
    options: {
      description?: string;
      required?: boolean;
      config?: Record<string, any>;
    } = {}
  ): MCPBuilder {
    const action = `validate_${validationType}` as StepAction;
    return this.addStep(id, action, options);
  }

  public addModelStep(
    id: string,
    action: 'build_model' | 'solve_model',
    options: {
      description?: string;
      required?: boolean;
      config?: Record<string, any>;
    } = {}
  ): MCPBuilder {
    return this.addStep(id, action, options);
  }

  public addHumanReviewStep(
    id: string,
    options: {
      description?: string;
      required?: boolean;
      config?: Record<string, any>;
    } = {}
  ): MCPBuilder {
    return this.addStep(id, 'human_review', options);
  }

  // Additional convenience methods
  public addEnrichmentStep(
    id: string,
    enrichmentType: string,
    options: {
      description?: string;
      required?: boolean;
      config?: Record<string, any>;
    } = {}
  ): MCPBuilder {
    return this.addStep(id, 'enrich_data', {
      description: options.description || `Enrich data with ${enrichmentType}`,
      required: options.required,
      config: {
        enrichmentType,
        ...options.config
      }
    });
  }

  public addExplanationStep(
    id: string,
    options: {
      description?: string;
      required?: boolean;
      format?: 'text' | 'json' | 'html';
      config?: Record<string, any>;
    } = {}
  ): MCPBuilder {
    return this.addStep(id, 'explain_solution', {
      description: options.description || 'Explain solution',
      required: options.required,
      config: {
        format: options.format || 'text',
        ...options.config
      }
    });
  }

  // Template methods for common optimization problems
  public static createVRPTemplate(
    id: string,
    options: {
      numVehicles?: number;
      depotLocation?: { lat: number; lng: number };
      capacityConstraints?: boolean;
      timeWindows?: boolean;
      customConstraints?: Record<string, any>;
    } = {}
  ): MCPBuilder {
    const builder = new MCPBuilder(id)
      .setName('Vehicle Routing Problem')
      .setDescription('Optimize vehicle routes for deliveries')
      .addMetadata('template', 'vrp')
      .addMetadata('version', '1.0');

    // Add variables
    builder
      .addVariable('num_vehicles', 'number', {
        default: options.numVehicles || 10,
        description: 'Number of available vehicles'
      })
      .addVariable('depot_location', 'object', {
        default: options.depotLocation || { lat: 0, lng: 0 },
        description: 'Depot location coordinates'
      })
      .addVariable('max_route_distance', 'number', {
        default: 1000,
        description: 'Maximum route distance per vehicle'
      })
      .addVariable('delivery_locations', 'array', {
        default: [],
        description: 'Array of delivery locations'
      });

    // Add capacity constraints if needed
    if (options.capacityConstraints) {
      builder
        .addVariable('vehicle_capacities', 'array', {
          default: [],
          description: 'Capacity of each vehicle'
        })
        .addVariable('delivery_demands', 'array', {
          default: [],
          description: 'Demand at each delivery location'
        });
    }

    // Add time windows if needed
    if (options.timeWindows) {
      builder
        .addVariable('time_windows', 'array', {
          default: [],
          description: 'Time windows for each delivery'
        })
        .addVariable('service_times', 'array', {
          default: [],
          description: 'Service time at each location'
        });
    }

    // Add steps
    builder
      .addDataCollectionStep('collect_vehicles', 'database', {
        description: 'Fetch vehicle data',
        additionalConfig: { table: 'vehicles' }
      })
      .addDataCollectionStep('collect_deliveries', 'api', {
        description: 'Fetch delivery locations'
      })
      .addEnrichmentStep('calculate_distances', 'matrix_calculation', {
        description: 'Calculate distance matrix',
        config: {
          method: 'haversine'
        }
      })
      .addValidationStep('validate_constraints', 'constraints', {
        config: {
          rules: [
            'valid_coordinates',
            'within_bounds',
            ...(options.capacityConstraints ? ['capacity_limits'] : []),
            ...(options.timeWindows ? ['time_window_feasibility'] : [])
          ]
        }
      })
      .addModelStep('build_vrp_model', 'build_model', {
        config: {
          solver: 'or_tools',
          algorithm: 'savings',
          ...options.customConstraints
        }
      })
      .addModelStep('solve_routes', 'solve_model')
      .addExplanationStep('explain_routes', {
        description: 'Generate route explanations',
        format: 'text'
      })
      .addHumanReviewStep('approve_routes');

    return builder;
  }

  public static createJobShopTemplate(
    id: string,
    options: {
      numMachines?: number;
      numJobs?: number;
      includeSetupTimes?: boolean;
      includeMaintenance?: boolean;
    } = {}
  ): MCPBuilder {
    const builder = new MCPBuilder(id)
      .setName('Job Shop Scheduling')
      .setDescription('Optimize job scheduling across machines')
      .addMetadata('template', 'jobshop')
      .addMetadata('version', '1.0');

    // Add variables
    builder
      .addVariable('num_machines', 'number', {
        default: options.numMachines || 5,
        description: 'Number of machines'
      })
      .addVariable('num_jobs', 'number', {
        default: options.numJobs || 10,
        description: 'Number of jobs to schedule'
      })
      .addVariable('processing_times', 'array', {
        default: [],
        description: 'Processing time for each job on each machine'
      })
      .addVariable('job_priorities', 'array', {
        default: [],
        description: 'Priority level for each job'
      });

    // Add setup times if needed
    if (options.includeSetupTimes) {
      builder.addVariable('setup_times', 'array', {
        default: [],
        description: 'Setup times between jobs'
      });
    }

    // Add maintenance windows if needed
    if (options.includeMaintenance) {
      builder.addVariable('maintenance_windows', 'array', {
        default: [],
        description: 'Scheduled maintenance periods for machines'
      });
    }

    // Add steps
    builder
      .addDataCollectionStep('collect_jobs', 'database', {
        description: 'Fetch job data'
      })
      .addDataCollectionStep('collect_machines', 'database', {
        description: 'Fetch machine data'
      })
      .addValidationStep('validate_constraints', 'constraints', {
        config: {
          rules: [
            'valid_processing_times',
            'machine_availability',
            ...(options.includeSetupTimes ? ['valid_setup_times'] : []),
            ...(options.includeMaintenance ? ['maintenance_feasibility'] : [])
          ]
        }
      })
      .addModelStep('build_jobshop_model', 'build_model', {
        config: {
          solver: 'or_tools',
          algorithm: 'sat'
        }
      })
      .addModelStep('optimize_schedule', 'solve_model')
      .addExplanationStep('explain_schedule', {
        description: 'Generate schedule explanations',
        format: 'text'
      })
      .addHumanReviewStep('approve_schedule');

    return builder;
  }

  public static createRCPSPTemplate(
    id: string,
    options: {
      numResources?: number;
      numTasks?: number;
      includeSkills?: boolean;
      includePreemption?: boolean;
    } = {}
  ): MCPBuilder {
    const builder = new MCPBuilder(id)
      .setName('Resource-Constrained Project Scheduling')
      .setDescription('Optimize project schedule with resource constraints')
      .addMetadata('template', 'rcpsp')
      .addMetadata('version', '1.0');

    // Add variables
    builder
      .addVariable('num_resources', 'number', {
        default: options.numResources || 5,
        description: 'Number of available resources'
      })
      .addVariable('num_tasks', 'number', {
        default: options.numTasks || 20,
        description: 'Number of tasks to schedule'
      })
      .addVariable('task_durations', 'array', {
        default: [],
        description: 'Duration of each task'
      })
      .addVariable('resource_capacities', 'array', {
        default: [],
        description: 'Capacity of each resource'
      })
      .addVariable('resource_requirements', 'array', {
        default: [],
        description: 'Resource requirements for each task'
      })
      .addVariable('precedence_relations', 'array', {
        default: [],
        description: 'Task precedence relationships'
      });

    // Add skill requirements if needed
    if (options.includeSkills) {
      builder
        .addVariable('resource_skills', 'array', {
          default: [],
          description: 'Skills possessed by each resource'
        })
        .addVariable('task_skill_requirements', 'array', {
          default: [],
          description: 'Skills required for each task'
        });
    }

    // Add preemption-related variables if needed
    if (options.includePreemption) {
      builder
        .addVariable('preemption_allowed', 'array', {
          default: [],
          description: 'Whether each task can be preempted'
        })
        .addVariable('min_block_duration', 'number', {
          default: 1,
          description: 'Minimum duration of a task block when preempted'
        });
    }

    // Add steps
    builder
      .addDataCollectionStep('collect_tasks', 'database', {
        description: 'Fetch task data'
      })
      .addDataCollectionStep('collect_resources', 'database', {
        description: 'Fetch resource data'
      })
      .addEnrichmentStep('calculate_earliest_starts', 'critical_path', {
        description: 'Calculate earliest start times'
      })
      .addValidationStep('validate_constraints', 'constraints', {
        config: {
          rules: [
            'precedence_feasibility',
            'resource_availability',
            ...(options.includeSkills ? ['skill_requirements'] : []),
            ...(options.includePreemption ? ['preemption_rules'] : [])
          ]
        }
      })
      .addModelStep('build_rcpsp_model', 'build_model', {
        config: {
          solver: 'or_tools',
          algorithm: 'cp_sat'
        }
      })
      .addModelStep('optimize_schedule', 'solve_model')
      .addExplanationStep('explain_schedule', {
        description: 'Generate schedule explanations',
        format: 'text'
      })
      .addHumanReviewStep('approve_schedule');

    return builder;
  }

  public static createFlowShopTemplate(
    id: string,
    options: {
      numMachines?: number;
      numJobs?: number;
      includeBuffers?: boolean;
      includeMaintenance?: boolean;
    } = {}
  ): MCPBuilder {
    const builder = new MCPBuilder(id)
      .setName('Flow Shop Scheduling')
      .setDescription('Optimize flow shop production schedule')
      .addMetadata('template', 'flowshop')
      .addMetadata('version', '1.0');

    // Add variables
    builder
      .addVariable('num_machines', 'number', {
        default: options.numMachines || 5,
        description: 'Number of machines in sequence'
      })
      .addVariable('num_jobs', 'number', {
        default: options.numJobs || 10,
        description: 'Number of jobs to schedule'
      })
      .addVariable('processing_times', 'array', {
        default: [],
        description: 'Processing time for each job on each machine'
      })
      .addVariable('job_due_dates', 'array', {
        default: [],
        description: 'Due date for each job'
      })
      .addVariable('job_weights', 'array', {
        default: [],
        description: 'Priority weight of each job'
      });

    // Add buffer constraints if needed
    if (options.includeBuffers) {
      builder
        .addVariable('buffer_capacities', 'array', {
          default: [],
          description: 'Capacity of buffers between machines'
        })
        .addVariable('minimum_buffer_times', 'array', {
          default: [],
          description: 'Minimum time jobs must spend in buffers'
        });
    }

    // Add maintenance windows if needed
    if (options.includeMaintenance) {
      builder
        .addVariable('maintenance_schedule', 'array', {
          default: [],
          description: 'Scheduled maintenance periods for machines'
        })
        .addVariable('maintenance_durations', 'array', {
          default: [],
          description: 'Duration of maintenance activities'
        });
    }

    // Add steps
    builder
      .addDataCollectionStep('collect_jobs', 'database', {
        description: 'Fetch job data'
      })
      .addDataCollectionStep('collect_machines', 'database', {
        description: 'Fetch machine data'
      })
      .addValidationStep('validate_constraints', 'constraints', {
        config: {
          rules: [
            'sequence_feasibility',
            'due_date_feasibility',
            ...(options.includeBuffers ? ['buffer_capacity'] : []),
            ...(options.includeMaintenance ? ['maintenance_feasibility'] : [])
          ]
        }
      })
      .addModelStep('build_flowshop_model', 'build_model', {
        config: {
          solver: 'or_tools',
          algorithm: 'cp_sat'
        }
      })
      .addModelStep('optimize_schedule', 'solve_model')
      .addExplanationStep('explain_schedule', {
        description: 'Generate schedule explanations',
        format: 'text'
      })
      .addHumanReviewStep('approve_schedule');

    return builder;
  }

  // Validation methods
  private validateVariable(variable: Variable): void {
    if (!variable.name) {
      throw new Error('Variable name is required');
    }

    if (this.variables.some(v => v.name === variable.name)) {
      throw new Error(`Duplicate variable name: ${variable.name}`);
    }

    if (variable.default !== undefined) {
      this.validateVariableValue(variable);
    }
  }

  private validateVariableValue(variable: Variable): void {
    const value = variable.default;
    switch (variable.type) {
      case 'number':
        if (typeof value !== 'number') {
          throw new Error(`Variable ${variable.name} default value must be a number`);
        }
        break;
      case 'string':
        if (typeof value !== 'string') {
          throw new Error(`Variable ${variable.name} default value must be a string`);
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          throw new Error(`Variable ${variable.name} default value must be a boolean`);
        }
        break;
      case 'array':
        if (!Array.isArray(value)) {
          throw new Error(`Variable ${variable.name} default value must be an array`);
        }
        break;
      case 'object':
        if (typeof value !== 'object' || Array.isArray(value) || value === null) {
          throw new Error(`Variable ${variable.name} default value must be an object`);
        }
        break;
    }
  }

  private validateStep(step: Step): void {
    if (!step.id) {
      throw new Error('Step ID is required');
    }

    if (this.steps.some(s => s.id === step.id)) {
      throw new Error(`Duplicate step ID: ${step.id}`);
    }
  }

  // Build method
  public build(): MCP {
    if (!this.id) {
      throw new Error('MCP ID is required');
    }

    if (this.steps.length === 0) {
      throw new Error('MCP must have at least one step');
    }

    const protocol: Protocol = {
      steps: [...this.steps]
    };

    return {
      id: this.id,
      sessionId: this.id, // Using id as sessionId for now
      version: '1.0.0',
      status: 'pending',
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      model: {
        variables: [...this.variables],
        constraints: [],
        objective: {
          type: 'minimize',
          field: '',
          description: '',
          weight: 1
        }
      },
      context: {
        environment: {
          region: 'us-east-1',
          timezone: 'UTC'
        },
        dataset: {
          internalSources: []
        },
        problemType: '',
        industry: ''
      },
      protocol,
      metadata: Object.keys(this.metadata).length > 0 ? { ...this.metadata } : undefined
    };
  }

  // Static factory methods
  public static create(id: string): MCPBuilder {
    return new MCPBuilder(id);
  }
} 