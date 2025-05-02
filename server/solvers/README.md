# OR-Tools Solver Integration

This module provides a TypeScript/JavaScript interface to Google OR-Tools, supporting various optimization problem types through a clean, type-safe API.

## Supported Problem Types

- Linear Programming (LP)
- Mixed Integer Programming (MIP)
- Constraint Programming (CP) - Coming soon
- Vehicle Routing Problem (VRP) - Coming soon

## Installation

1. Install Python dependencies:
```bash
cd server/solvers
pip install -r requirements.txt
```

2. The TypeScript/JavaScript dependencies are already included in the main package.json.

## Usage

### Basic Example

```typescript
import { ORToolsBackend } from './ORToolsBackend';
import { Model } from './types';

// Create a solver instance
const solver = new ORToolsBackend({
  timeLimit: 60,  // 60 seconds
  logLevel: 'INFO'
});

// Define your optimization model
const model: Model = {
  name: 'production_planning',
  type: 'LINEAR_PROGRAMMING',
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

// Solve the model
const solution = await solver.solve(model);
console.log(solution);
```

### Mixed Integer Programming Example

```typescript
const facilityLocationModel: Model = {
  name: 'facility_location',
  type: 'MIXED_INTEGER_PROGRAMMING',
  variables: [
    {
      name: 'facility1',
      type: 'BINARY'
    },
    {
      name: 'facility2',
      type: 'BINARY'
    },
    // Assignment variables
    {
      name: 'assign1_1',
      type: 'BINARY'
    },
    {
      name: 'assign1_2',
      type: 'BINARY'
    }
  ],
  constraints: [
    // Each customer must be assigned to one facility
    {
      name: 'customer1_assignment',
      expression: 'assign1_1 + assign1_2',
      type: 'EQ',
      rhs: 1
    },
    // Assignments only to open facilities
    {
      name: 'facility1_capacity',
      expression: 'assign1_1 - facility1',
      type: 'LE',
      rhs: 0
    }
  ],
  objective: {
    name: 'total_cost',
    expression: '1000*facility1 + 1500*facility2 + 10*assign1_1 + 20*assign1_2',
    sense: 'MINIMIZE'
  }
};
```

## Configuration Options

The solver accepts the following configuration options:

```typescript
{
  timeLimit?: number;      // Maximum solving time in seconds
  threads?: number;        // Number of threads to use
  logLevel?: 'OFF' | 'ERROR' | 'WARNING' | 'INFO' | 'DEBUG';
  randomSeed?: number;     // Random seed for reproducibility
}
```

## Solution Format

The solver returns solutions in the following format:

```typescript
{
  status: 'OPTIMAL' | 'FEASIBLE' | 'INFEASIBLE' | 'UNBOUNDED' | 'ERROR' | 'TIMEOUT';
  objectiveValue?: number;
  variables?: Record<string, number>;
  solveTime: number;
  gap?: number;           // For MIP problems
  message?: string;       // Error or additional information
}
```

## Error Handling

The solver includes comprehensive error handling:

- Invalid model definitions
- Solver failures
- Timeouts
- Infeasible problems

Errors are logged using Pino logger and include detailed information about the failure.

## Development

### Running Tests

```bash
npm test
```

### Adding New Problem Types

1. Add the new problem type to `ProblemTypeSchema` in `types.ts`
2. Implement the corresponding solver method in `ortools_wrapper.py`
3. Add validation logic in `ORToolsBackend.ts`
4. Create tests in `__tests__/ORToolsBackend.test.ts` 