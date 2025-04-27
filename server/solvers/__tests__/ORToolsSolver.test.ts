import { ORToolsSolver } from '../ORToolsSolver';
import { Model, ProblemType } from '../types';
import path from 'path';

describe('ORToolsSolver', () => {
  let solver: ORToolsSolver;

  beforeEach(() => {
    solver = new ORToolsSolver({
      timeLimit: 60,
      logLevel: 'ERROR'
    });
  });

  // Example 1: Production Planning (Linear Programming)
  const productionPlanningModel: Model = {
    name: 'production_planning',
    type: 'LINEAR_PROGRAMMING' as ProblemType,
    variables: [
      {
        name: 'x1',
        type: 'CONTINUOUS',
        lowerBound: 0
      },
      {
        name: 'x2',
        type: 'CONTINUOUS',
        lowerBound: 0
      }
    ],
    constraints: [
      {
        name: 'material_constraint',
        expression: '2*x1 + x2',
        type: 'LE',
        rhs: 100
      },
      {
        name: 'labor_constraint',
        expression: 'x1 + 3*x2',
        type: 'LE',
        rhs: 90
      }
    ],
    objective: {
      name: 'profit',
      expression: '3*x1 + 2*x2',
      sense: 'MAXIMIZE'
    }
  };

  // Example 2: Facility Location (Mixed Integer Programming)
  const facilityLocationModel: Model = {
    name: 'facility_location',
    type: 'MIXED_INTEGER_PROGRAMMING' as ProblemType,
    variables: [
      {
        name: 'facility1',
        type: 'BINARY'
      },
      {
        name: 'facility2',
        type: 'BINARY'
      },
      {
        name: 'assign1_1',
        type: 'BINARY'
      },
      {
        name: 'assign1_2',
        type: 'BINARY'
      },
      {
        name: 'assign2_1',
        type: 'BINARY'
      },
      {
        name: 'assign2_2',
        type: 'BINARY'
      }
    ],
    constraints: [
      // Each customer must be assigned to exactly one facility
      {
        name: 'customer1_assignment',
        expression: 'assign1_1 + assign1_2',
        type: 'EQ',
        rhs: 1
      },
      {
        name: 'customer2_assignment',
        expression: 'assign2_1 + assign2_2',
        type: 'EQ',
        rhs: 1
      },
      // Assignments only to open facilities
      {
        name: 'facility1_capacity',
        expression: 'assign1_1 + assign2_1 - facility1',
        type: 'LE',
        rhs: 0
      },
      {
        name: 'facility2_capacity',
        expression: 'assign1_2 + assign2_2 - facility2',
        type: 'LE',
        rhs: 0
      }
    ],
    objective: {
      name: 'total_cost',
      expression: '1000*facility1 + 1500*facility2 + 10*assign1_1 + 20*assign1_2 + 15*assign2_1 + 25*assign2_2',
      sense: 'MINIMIZE'
    }
  };

  test('solves linear programming model', async () => {
    const solution = await solver.solve(productionPlanningModel);
    expect(solution.status).toBe('OPTIMAL');
    expect(solution.objectiveValue).toBeDefined();
    expect(solution.variables).toBeDefined();
    if (solution.variables) {
      expect(solution.variables['x1']).toBeGreaterThanOrEqual(0);
      expect(solution.variables['x2']).toBeGreaterThanOrEqual(0);
    }
  });

  test('solves mixed integer programming model', async () => {
    const solution = await solver.solve(facilityLocationModel);
    expect(solution.status).toBe('OPTIMAL');
    expect(solution.objectiveValue).toBeDefined();
    expect(solution.variables).toBeDefined();
    if (solution.variables) {
      // Check binary variables are actually binary
      for (const [name, value] of Object.entries(solution.variables)) {
        if (name.startsWith('facility') || name.startsWith('assign')) {
          expect(value).toBeCloseTo(Math.round(value));
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  test('handles infeasible model', async () => {
    const infeasibleModel: Model = {
      ...productionPlanningModel,
      name: 'infeasible_model',
      constraints: [
        {
          name: 'impossible_constraint1',
          expression: 'x1',
          type: 'GE',
          rhs: 10
        },
        {
          name: 'impossible_constraint2',
          expression: 'x1',
          type: 'LE',
          rhs: 5
        }
      ]
    };

    const solution = await solver.solve(infeasibleModel);
    expect(solution.status).toBe('INFEASIBLE');
  });

  test('handles solver configuration', async () => {
    const timeoutSolver = new ORToolsSolver({
      timeLimit: 0.001 // 1ms timeout
    });

    const solution = await timeoutSolver.solve(facilityLocationModel);
    // The model might be solved quickly enough, so we accept either OPTIMAL or TIMEOUT
    expect(['OPTIMAL', 'TIMEOUT']).toContain(solution.status);
  });
}); 