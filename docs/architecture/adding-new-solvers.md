# Adding New Solvers to DcisionAI

## Overview

This guide explains how to add new optimization solvers to the DcisionAI platform. The platform currently supports HiGHS and has placeholder configurations for OR-Tools, Gurobi, and CPLEX.

## Current Solver Status

| Solver | Status | License | Implementation |
|--------|--------|---------|----------------|
| **HiGHS** | ✅ Implemented | Open Source | Mock solutions |
| **OR-Tools** | 🔄 Placeholder | Open Source | Not implemented |
| **Gurobi** | 🔄 Placeholder | Commercial | Not implemented |
| **CPLEX** | 🔄 Placeholder | Commercial | Not implemented |

## Architecture

The solver system is integrated directly into the Next.js application:

```
┌─────────────────────────────────────────────────────────┐
│                Next.js Application                      │
│                                                         │
│  ┌─────────────────┐  ┌─────────────────────────────────┐ │
│  │   Frontend UI   │  │        API Routes               │ │
│  │                 │  │                                 │ │
│  │ - Construction  │  │ - /api/solver/solve            │ │
│  │ - Retail        │  │ - /api/construction/chat       │ │
│  │ - Finance       │  │ - /api/retail/chat             │ │
│  └─────────────────┘  └─────────────────────────────────┘ │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Solver Layer                           │ │
│  │                                                     │ │
│  │ - MCPSolverClient.ts (solver selection)            │ │
│  │ - solvers/highs.ts (HiGHS implementation)          │ │
│  │ - solvers/or-tools.ts (OR-Tools - TODO)            │ │
│  │ - solvers/gurobi.ts (Gurobi - TODO)                │ │
│  │ - solvers/cplex.ts (CPLEX - TODO)                  │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Steps to Add a New Solver

### 1. Add Dependencies

**For Node.js-based solvers:**
```bash
npm install <solver-package-name>
```

**For Python-based solvers:**
```bash
pip install <solver-package-name>
```

### 2. Create Solver Implementation

Create a new file: `src/pages/api/_lib/solvers/<solver-name>.ts`

```typescript
import { SolverProblem, SolverSolution } from './types';

export interface <SolverName>SolverConfig {
  // Add solver-specific configuration
  timeout?: number;
  maxIterations?: number;
  // ... other config options
}

export class <SolverName>Solver {
  private config: <SolverName>SolverConfig;

  constructor(config: <SolverName>SolverConfig = {}) {
    this.config = {
      timeout: 300000, // 5 minutes
      maxIterations: 1000,
      ...config
    };
  }

  async solveProblem(problem: SolverProblem): Promise<SolverSolution> {
    try {
      // 1. Parse the problem into solver-specific format
      const solverProblem = this.parseProblem(problem);
      
      // 2. Call the solver
      const result = await this.callSolver(solverProblem);
      
      // 3. Parse the result back to standard format
      const solution = this.parseSolution(result);
      
      return solution;
    } catch (error) {
      throw new Error(`<SolverName> solver error: ${error.message}`);
    }
  }

  private parseProblem(problem: SolverProblem): any {
    // Convert DcisionAI problem format to solver-specific format
    // This is where you map:
    // - Variables
    // - Constraints
    // - Objective function
    // - Problem type (LP, MIP, QP, etc.)
  }

  private async callSolver(solverProblem: any): Promise<any> {
    // Make the actual call to the solver
    // This could be:
    // - Direct API call
    // - Command-line execution
    // - Library function call
  }

  private parseSolution(result: any): SolverSolution {
    // Convert solver result back to DcisionAI standard format
    return {
      status: 'optimal', // or 'infeasible', 'unbounded', etc.
      objectiveValue: result.objectiveValue,
      variables: result.variables,
      solveTime: result.solveTime,
      iterations: result.iterations,
      // ... other solution data
    };
  }
}
```

### 3. Update Solver Client

Add the new solver to `src/pages/api/_lib/MCPSolverClient.ts`:

```typescript
export function createSolverClient(solverName: string): MCPSolverClient {
  const configs: Record<string, SolverConfig> = {
    // ... existing solvers ...
    
    '<solver-name>': {
      name: '<Solver Display Name>',
      endpoint: {
        type: 'http',
        url: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',
        apiKey: process.env.SOLVER_API_KEY
      },
      timeout: 300000,
      retries: 3
    }
  };
  // ... rest of function
}
```

### 4. Update API Endpoint

Update `src/pages/api/solver/solve.ts` to handle the new solver:

```typescript
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // ... existing code ...

  try {
    const { problem, solver = 'highs' } = req.body;

    let solution: SolverSolution;

    switch (solver.toLowerCase()) {
      case 'highs':
        const highsSolver = new HiGHSSolver();
        solution = await highsSolver.solveProblem(problem);
        break;
        
      case '<solver-name>':
        const newSolver = new <SolverName>Solver();
        solution = await newSolver.solveProblem(problem);
        break;
        
      default:
        res.status(400).json({ error: `Unknown solver: ${solver}` });
        return;
    }

    res.status(200).json(solution);
  } catch (error) {
    // ... error handling
  }
}
```

### 5. Add Type Definitions

Update `src/pages/api/_lib/solvers/types.ts` if needed:

```typescript
export interface SolverProblem {
  // ... existing types ...
  
  // Add any new problem types specific to your solver
  <solverSpecificField>?: any;
}

export interface SolverSolution {
  // ... existing types ...
  
  // Add any new solution fields specific to your solver
  <solverSpecificField>?: any;
}
```

### 6. Update Frontend

Add the new solver to the frontend selection UI:

```typescript
// In the relevant component
const availableSolvers = [
  { id: 'highs', name: 'HiGHS', description: 'Open source linear and mixed-integer programming solver' },
  { id: '<solver-name>', name: '<Solver Display Name>', description: '<Solver description>' },
  // ... other solvers
];
```

### 7. Add Tests

Create tests for your new solver:

```typescript
// src/tests/solvers/<solver-name>.test.ts
import { <SolverName>Solver } from '../../pages/api/_lib/solvers/<solver-name>';

describe('<SolverName>Solver', () => {
  let solver: <SolverName>Solver;

  beforeEach(() => {
    solver = new <SolverName>Solver();
  });

  it('should solve a simple linear programming problem', async () => {
    const problem = {
      // ... test problem
    };

    const solution = await solver.solveProblem(problem);
    
    expect(solution.status).toBe('optimal');
    expect(solution.objectiveValue).toBeDefined();
    // ... other assertions
  });
});
```

## Implementation Examples

### OR-Tools Implementation

```typescript
// src/pages/api/_lib/solvers/or-tools.ts
import { LinearOptimizationService } from '@google/or-tools';

export class ORToolsSolver {
  async solveProblem(problem: SolverProblem): Promise<SolverSolution> {
    const solver = LinearOptimizationService.createSolver('GLOP');
    
    // Parse problem and create variables
    const variables = this.createVariables(solver, problem);
    
    // Add constraints
    this.addConstraints(solver, problem, variables);
    
    // Set objective
    this.setObjective(solver, problem, variables);
    
    // Solve
    const resultStatus = solver.solve();
    
    return this.parseSolution(solver, resultStatus);
  }
}
```

### Gurobi Implementation

```typescript
// src/pages/api/_lib/solvers/gurobi.ts
import { GRB } from 'gurobi';

export class GurobiSolver {
  async solveProblem(problem: SolverProblem): Promise<SolverSolution> {
    const env = new GRB.Env();
    const model = new GRB.Model(env);
    
    // Parse problem and create variables
    const variables = this.createVariables(model, problem);
    
    // Add constraints
    this.addConstraints(model, problem, variables);
    
    // Set objective
    this.setObjective(model, problem, variables);
    
    // Solve
    model.optimize();
    
    return this.parseSolution(model);
  }
}
```

## Testing Your Solver

1. **Unit Tests**: Test individual solver functions
2. **Integration Tests**: Test the full solve pipeline
3. **Performance Tests**: Compare with existing solvers
4. **Edge Cases**: Test with invalid problems, timeouts, etc.

## Deployment Considerations

1. **Dependencies**: Ensure all solver dependencies are in the Docker image
2. **Licenses**: Handle commercial solver licenses (Gurobi, CPLEX)
3. **Environment Variables**: Configure solver-specific settings
4. **Resource Limits**: Set appropriate memory and CPU limits

## Troubleshooting

### Common Issues

1. **Solver not found**: Check dependencies and installation
2. **License errors**: Verify commercial solver licenses
3. **Timeout issues**: Adjust solver configuration
4. **Memory errors**: Increase container memory limits

### Debugging

```typescript
// Add debug logging to your solver
export class <SolverName>Solver {
  async solveProblem(problem: SolverProblem): Promise<SolverSolution> {
    console.log('Solving problem with <SolverName>:', JSON.stringify(problem, null, 2));
    
    try {
      const solution = await this.callSolver(problem);
      console.log('<SolverName> solution:', JSON.stringify(solution, null, 2));
      return solution;
    } catch (error) {
      console.error('<SolverName> solver error:', error);
      throw error;
    }
  }
}
```

## Next Steps

1. **Priority 1**: Implement OR-Tools (open source, good performance)
2. **Priority 2**: Add Gurobi support (commercial, excellent performance)
3. **Priority 3**: Add CPLEX support (commercial, enterprise-grade)
4. **Future**: Consider other solvers like CBC, SCIP, etc.

## Resources

- [OR-Tools Documentation](https://developers.google.com/optimization)
- [Gurobi Documentation](https://www.gurobi.com/documentation/)
- [CPLEX Documentation](https://www.ibm.com/docs/en/icos/22.1.0)
- [HiGHS Documentation](https://highs.dev/) 