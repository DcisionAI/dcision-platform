import { MCPValidator } from './MCPValidator';
import { MCP, MCPStatus, ProblemType, Variable, Constraint, Objective, StepAction, ProtocolStep } from '../../types/core';

describe('MCPValidator', () => {
  let validator: MCPValidator;

  const validProblem: MCP = {
    sessionId: 'test-session-123',
    version: '1.0.0',
    status: 'pending' as MCPStatus,
    created: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    context: {
      problemType: 'vehicle_routing' as ProblemType,
      environment: {
        region: 'us-west',
        timezone: 'America/Los_Angeles'
      },
      dataset: {
        internalSources: ['vehicles', 'locations', 'demands'],
        metadata: {
          userInput: 'Optimize vehicle routes for delivery in San Francisco'
        }
      }
    },
    model: {
      variables: [{
        name: 'x',
        type: 'integer',
        description: 'Vehicle assignment variable',
        min: 0,
        max: 1
      } as Variable],
      constraints: [{
        type: 'capacity_constraint',
        description: 'Vehicle capacity constraint',
        field: 'x',
        operator: 'lte',
        value: 10,
        priority: 'must'
      } as Constraint],
      objective: {
        type: 'minimize',
        field: 'total_distance',
        description: 'Minimize total distance traveled',
        weight: 1
      } as Objective
    },
    protocol: {
      steps: [{
        id: 'step-1',
        action: 'interpret_intent' as StepAction,
        description: 'Interpret the optimization problem intent',
        required: true,
        status: 'pending'
      } as ProtocolStep],
      allowPartialSolutions: false,
      explainabilityEnabled: true,
      humanInTheLoop: { 
        required: false, 
        approvalSteps: ['step-1'] 
      }
    }
  };

  beforeEach(() => {
    validator = new MCPValidator();
  });

  it('should accept a valid problem', () => {
    const errors = validator.validate(validProblem);
    expect(errors).toHaveLength(0);
  });

  it('should validate timestamps', () => {
    const invalidProblem = {
      ...validProblem,
      created: new Date().toISOString(),
      lastModified: new Date(Date.now() - 1000).toISOString()
    };
    const errors = validator.validate(invalidProblem);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain('lastModified cannot be before created');
  });

  it('should validate problem type', () => {
    const invalidProblem = {
      ...validProblem,
      context: {
        ...validProblem.context,
        problemType: 'invalid_type' as ProblemType
      }
    };
    const errors = validator.validate(invalidProblem);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain('must be equal to one of the allowed values');
  });

  it('should validate model structure', () => {
    const invalidProblem = {
      ...validProblem,
      model: {
        ...validProblem.model,
        variables: []
      }
    };
    const errors = validator.validate(invalidProblem);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain('must NOT have fewer than 1 items');
  });

  it('should validate protocol steps', () => {
    const invalidProblem = {
      ...validProblem,
      protocol: {
        ...validProblem.protocol,
        steps: []
      }
    };
    const errors = validator.validate(invalidProblem);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain('must NOT have fewer than 1 items');
  });

  it('should validate LLM context', () => {
    const invalidProblem = {
      ...validProblem,
      context: {
        ...validProblem.context,
        dataset: {
          ...validProblem.context.dataset,
          metadata: {}
        }
      }
    };
    const errors = validator.validate(invalidProblem);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain('must have required property');
  });

  describe('Resource Scheduling Validation', () => {
    const validSchedulingProblem: MCP = {
      ...validProblem,
      context: {
        problemType: 'resource_scheduling' as ProblemType,
        environment: {
          region: 'us-west',
          timezone: 'America/Los_Angeles'
        },
        dataset: {
          internalSources: ['resources', 'tasks', 'dependencies'],
          metadata: {
            userInput: 'Schedule resources for project tasks'
          }
        }
      },
      model: {
        variables: [{
          name: 'start_time',
          type: 'integer',
          description: 'Task start time',
          min: 0,
          max: 100
        } as Variable],
        constraints: [{
          type: 'time_constraint',
          description: 'Resource capacity constraint',
          field: 'start_time',
          operator: 'lte',
          value: 8,
          priority: 'must'
        } as Constraint],
        objective: {
          type: 'minimize',
          field: 'total_duration',
          description: 'Minimize total project duration',
          weight: 1
        } as Objective
      }
    };

    it('should validate a valid scheduling problem', () => {
      const errors = validator.validate(validSchedulingProblem);
      expect(errors).toHaveLength(0);
    });

    it('should detect missing resources', () => {
      const invalidProblem = {
        ...validSchedulingProblem,
        context: {
          ...validSchedulingProblem.context,
          dataset: {
            ...validSchedulingProblem.context.dataset,
            internalSources: ['tasks', 'dependencies']
          }
        }
      };
      const errors = validator.validate(invalidProblem);
      expect(errors.some(e => e.message.includes('must have at least one resource'))).toBeTruthy();
    });
  });

  describe('Inventory Optimization Validation', () => {
    const validInventoryProblem: MCP = {
      ...validProblem,
      context: {
        problemType: 'inventory_optimization' as ProblemType,
        environment: {
          region: 'us-west',
          timezone: 'America/Los_Angeles'
        },
        dataset: {
          internalSources: ['products', 'demand', 'suppliers'],
          metadata: {
            userInput: 'Optimize inventory levels for products'
          }
        }
      },
      model: {
        variables: [{
          name: 'order_quantity',
          type: 'integer',
          description: 'Product order quantity',
          min: 0,
          max: 1000
        } as Variable],
        constraints: [{
          type: 'capacity_constraint',
          description: 'Storage capacity constraint',
          field: 'order_quantity',
          operator: 'lte',
          value: 10000,
          priority: 'must'
        } as Constraint],
        objective: {
          type: 'minimize',
          field: 'total_cost',
          description: 'Minimize total inventory cost',
          weight: 1
        } as Objective
      }
    };

    it('should validate a valid inventory problem', () => {
      const errors = validator.validate(validInventoryProblem);
      expect(errors).toHaveLength(0);
    });

    it('should detect invalid product costs', () => {
      const invalidProblem = {
        ...validInventoryProblem,
        model: {
          ...validInventoryProblem.model,
          variables: [{
            ...validInventoryProblem.model.variables[0],
            min: -1,
            max: 1000
          } as Variable]
        }
      };
      const errors = validator.validate(invalidProblem);
      expect(errors.some(e => e.message.includes('must have non-negative unit cost'))).toBeTruthy();
    });
  });

  describe('Production Planning Validation', () => {
    const validProductionProblem: MCP = {
      ...validProblem,
      context: {
        problemType: 'production_planning' as ProblemType,
        environment: {
          region: 'us-west',
          timezone: 'America/Los_Angeles'
        },
        dataset: {
          internalSources: ['products', 'machines', 'demand'],
          metadata: {
            userInput: 'Plan production schedule for products'
          }
        }
      },
      model: {
        variables: [{
          name: 'production_quantity',
          type: 'integer',
          description: 'Product production quantity',
          min: 0,
          max: 1000
        } as Variable],
        constraints: [{
          type: 'capacity_constraint',
          description: 'Machine capacity constraint',
          field: 'production_quantity',
          operator: 'lte',
          value: 100,
          priority: 'must'
        } as Constraint],
        objective: {
          type: 'minimize',
          field: 'total_cost',
          description: 'Minimize total production cost',
          weight: 1
        } as Objective
      }
    };

    it('should validate a valid production problem', () => {
      const errors = validator.validate(validProductionProblem);
      expect(errors).toHaveLength(0);
    });

    it('should detect invalid processing rate', () => {
      const invalidProblem = {
        ...validProductionProblem,
        model: {
          ...validProductionProblem.model,
          variables: [{
            ...validProductionProblem.model.variables[0],
            min: 0,
            max: 0
          } as Variable]
        }
      };
      const errors = validator.validate(invalidProblem);
      expect(errors.some(e => e.message.includes('must have positive processing rate'))).toBeTruthy();
    });
  });
}); 