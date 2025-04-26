import { MCPValidator } from './MCPValidator';
import { MCP, FleetProblem } from './MCPTypes';
import { 
  SchedulingProblem,
  InventoryProblem,
  ProductionProblem
} from './OptimizationTypes';
import { ValidationError } from '../errors/ValidationError';
import { describe, it, expect } from '@jest/globals';

describe('MCPValidator', () => {
  let validator: MCPValidator;
  let validFleetProblem: FleetProblem;

  beforeEach(() => {
    validator = new MCPValidator();
    validFleetProblem = {
      sessionId: 'test-session-123',
      model: {
        variables: [],
        constraints: [],
        objective: { type: 'minimize', field: 'total_distance', description: 'Minimize total distance' },
        fleet: {
          vehicles: [
            {
              id: 'vehicle1',
              capacity: 100,
              costPerKm: 1.0
            }
          ],
          depots: [
            {
              id: 'depot1',
              latitude: 37.7749,
              longitude: -122.4194
            }
          ],
          customers: [
            {
              id: 'customer1',
              latitude: 37.7833,
              longitude: -122.4167,
              demand: 10
            }
          ]
        }
      },
      context: {
        environment: {},
        dataset: { internalSources: [] },
        problemType: 'vehicle_routing'
      },
      protocol: {
        steps: [],
        allowPartialSolutions: false,
        explainabilityEnabled: true,
        humanInTheLoop: { required: false }
      },
      version: '1.0',
      created: '2024-03-20T10:00:00Z',
      lastModified: '2024-03-20T10:00:00Z',
      status: 'pending'
    };
  });

  it('should accept a valid fleet problem', () => {
    const errors = validator.validate(validFleetProblem);
    expect(errors).toHaveLength(0);
  });

  it('should validate timestamps', () => {
    const invalidProblem = { ...validFleetProblem };
    invalidProblem.lastModified = new Date(2020, 0, 1).toISOString();
    invalidProblem.created = new Date(2021, 0, 1).toISOString();
    
    const errors = validator.validate(invalidProblem);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain('lastModified cannot be before created');
  });

  it('should validate vehicle properties', () => {
    const invalidProblem = { ...validFleetProblem };
    (invalidProblem.model.fleet as any).vehicles[0].capacity = -1;
    
    const errors = validator.validate(invalidProblem);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain('must be > 0');
  });

  it('should validate location coordinates', () => {
    const invalidProblem = { ...validFleetProblem };
    (invalidProblem.model.fleet as any).customers[0].latitude = 91;
    
    const errors = validator.validate(invalidProblem);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain('must be <= 90');
  });

  it('should validate time windows', () => {
    const invalidProblem = { ...validFleetProblem };
    const customer = (invalidProblem.model.fleet as any).customers[0];
    customer.timeWindows = [{
      start: '2024-03-20T10:00:00Z',
      end: '2024-03-20T09:00:00Z'  // End before start
    }];
    
    const errors = validator.validate(invalidProblem);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain('Invalid time window');
  });

  it('should require at least one route-related constraint', () => {
    const invalidProblem = { ...validFleetProblem };
    invalidProblem.model.constraints = [
      {
        type: 'other_constraint',
        description: 'Some other constraint'
      }
    ];
    
    const errors = validator.validate(invalidProblem);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain('Invalid constraint type');
  });

  it('should validate human-in-the-loop settings', () => {
    const invalidProblem = { ...validFleetProblem };
    invalidProblem.protocol.humanInTheLoop = {
      required: true
    };
    
    const errors = validator.validate(invalidProblem);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain('approvalSteps');
  });

  it('should validate protocol steps', () => {
    const invalidProblem = { ...validFleetProblem };
    invalidProblem.protocol.steps = [
      {
        action: 'invalid_action' as any,
        required: true
      }
    ];
    
    const errors = validator.validate(invalidProblem);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain('must be equal to one of the allowed values');
  });

  describe('Resource Scheduling Validation', () => {
    const validSchedulingProblem: SchedulingProblem = {
      sessionId: 'test-session-123',
      model: {
        variables: [],
        constraints: [],
        objective: { type: 'minimize', field: 'total_time', description: 'Minimize total completion time' },
        scheduling: {
          resources: [
            {
              id: 'resource1',
              name: 'Engineer 1',
              skills: ['repair', 'maintenance'],
              availability: [{ start: '2024-03-20T09:00:00Z', end: '2024-03-20T17:00:00Z' }],
              cost: 100,
              efficiency: 1.0
            }
          ],
          tasks: [
            {
              id: 'task1',
              name: 'Repair Machine A',
              duration: 120,
              requiredSkills: ['repair'],
              priority: 1,
              earliestStart: '2024-03-20T09:00:00Z',
              latestEnd: '2024-03-20T17:00:00Z'
            }
          ]
        }
      },
      context: {
        environment: {},
        dataset: { internalSources: [] },
        problemType: 'resource_scheduling'
      },
      protocol: {
        steps: [],
        allowPartialSolutions: false,
        explainabilityEnabled: true,
        humanInTheLoop: { required: false }
      },
      version: '1.0',
      created: '2024-03-20T10:00:00Z',
      lastModified: '2024-03-20T10:00:00Z',
      status: 'pending'
    };

    it('should validate a valid scheduling problem', () => {
      const errors = validator.validate(validSchedulingProblem);
      expect(errors).toHaveLength(0);
    });

    it('should detect missing resources', () => {
      const invalidProblem: SchedulingProblem = {
        ...validSchedulingProblem,
        model: {
          ...validSchedulingProblem.model,
          scheduling: {
            ...validSchedulingProblem.model.scheduling,
            resources: []
          }
        }
      };
      const errors = validator.validate(invalidProblem);
      expect(errors.some(e => e.message.includes('must have at least one resource'))).toBeTruthy();
    });
  });

  describe('Inventory Optimization Validation', () => {
    const validInventoryProblem: InventoryProblem = {
      sessionId: 'test-session-123',
      model: {
        variables: [],
        constraints: [],
        objective: { type: 'minimize', field: 'total_cost', description: 'Minimize total inventory cost' },
        inventory: {
          products: [
            {
              id: 'product1',
              name: 'Widget A',
              unitCost: 10,
              holdingCost: 2,
              setupCost: 100,
              leadTime: 5
            }
          ],
          warehouses: [
            {
              id: 'warehouse1',
              name: 'Main Warehouse',
              capacity: 1000,
              fixedCost: 1000,
              handlingCost: 5
            }
          ],
          demandForecasts: [
            {
              productId: 'product1',
              period: '2024-04',
              quantity: 100,
              confidence: 0.9
            }
          ]
        }
      },
      context: {
        environment: {},
        dataset: { internalSources: [] },
        problemType: 'inventory_optimization'
      },
      protocol: {
        steps: [],
        allowPartialSolutions: false,
        explainabilityEnabled: true,
        humanInTheLoop: { required: false }
      },
      version: '1.0',
      created: '2024-03-20T10:00:00Z',
      lastModified: '2024-03-20T10:00:00Z',
      status: 'pending'
    };

    it('should validate a valid inventory problem', () => {
      const errors = validator.validate(validInventoryProblem);
      expect(errors).toHaveLength(0);
    });

    it('should detect invalid product costs', () => {
      const invalidProblem: InventoryProblem = {
        ...validInventoryProblem,
        model: {
          ...validInventoryProblem.model,
          inventory: {
            ...validInventoryProblem.model.inventory,
            products: [
              {
                ...validInventoryProblem.model.inventory.products[0],
                unitCost: -1
              }
            ]
          }
        }
      };
      const errors = validator.validate(invalidProblem);
      expect(errors.some(e => e.message.includes('must have non-negative unit cost'))).toBeTruthy();
    });
  });

  describe('Production Planning Validation', () => {
    const validProductionProblem: ProductionProblem = {
      sessionId: 'test-session-123',
      model: {
        variables: [],
        constraints: [],
        objective: { type: 'minimize', field: 'makespan', description: 'Minimize total production time' },
        production: {
          machines: [
            {
              id: 'machine1',
              name: 'CNC Machine',
              setupTime: 30,
              processingRate: 10,
              capabilities: ['milling', 'drilling'],
              costPerHour: 100
            }
          ],
          materials: [
            {
              id: 'material1',
              name: 'Aluminum',
              cost: 50,
              leadTime: 2
            }
          ],
          orders: [
            {
              id: 'order1',
              productId: 'product1',
              quantity: 100,
              dueDate: '2024-04-01T17:00:00Z',
              priority: 1,
              routingSteps: [
                {
                  machineType: 'CNC Machine',
                  duration: 60,
                  materials: [{ materialId: 'material1', quantity: 1 }]
                }
              ]
            }
          ]
        }
      },
      context: {
        environment: {},
        dataset: { internalSources: [] },
        problemType: 'production_planning'
      },
      protocol: {
        steps: [],
        allowPartialSolutions: false,
        explainabilityEnabled: true,
        humanInTheLoop: { required: false }
      },
      version: '1.0',
      created: '2024-03-20T10:00:00Z',
      lastModified: '2024-03-20T10:00:00Z',
      status: 'pending'
    };

    it('should validate a valid production problem', () => {
      const errors = validator.validate(validProductionProblem);
      expect(errors).toHaveLength(0);
    });

    it('should detect invalid processing rate', () => {
      const invalidProblem: ProductionProblem = {
        ...validProductionProblem,
        model: {
          ...validProductionProblem.model,
          production: {
            ...validProductionProblem.model.production,
            machines: [
              {
                ...validProductionProblem.model.production.machines[0],
                processingRate: 0
              }
            ]
          }
        }
      };
      const errors = validator.validate(invalidProblem);
      expect(errors.some(e => e.message.includes('must have positive processing rate'))).toBeTruthy();
    });
  });
}); 