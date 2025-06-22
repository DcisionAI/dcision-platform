# HiGHS Integration Guide for DcisionAI

## Overview

This guide explains how the HiGHS optimization solver is integrated into the DcisionAI construction management platform. The solver functionality is now **integrated directly into the Next.js application** as API routes, providing a streamlined and efficient optimization pipeline.

## What is HiGHS?

[HiGHS](https://highs.dev/) is a high-performance open-source solver for linear programming (LP), mixed-integer programming (MIP), and quadratic programming (QP). It's perfect for construction optimization needs because it supports:

- **Linear Programming (LP)**: Resource allocation, scheduling
- **Mixed-Integer Programming (MIP)**: Project selection, workforce planning
- **Quadratic Programming (QP)**: Risk optimization, portfolio management
- **Binary and integer variables**: Yes/no decisions, discrete quantities
- **Multi-objective optimization**: Balancing multiple goals

## Integration Architecture

### Current Architecture

Your DcisionAI platform now has a **single-service architecture**:

```
Customer Data → Data Agent → Intent Agent → Model Builder Agent → Integrated HiGHS Solver → Explain Agent
```

### Solver Integration

The optimization solver is integrated directly into the Next.js application:

```
┌─────────────────────────────────────────────────────────┐
│                Next.js Application                      │
│                                                         │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │   Frontend UI   │  │   API Routes    │              │
│  │                 │  │                 │              │
│  │ • React Pages   │  │ • /api/solver   │ ← HiGHS      │
│  │ • Components    │  │ • /api/agno     │   Integration│
│  │ • Workflows     │  │ • /api/docs     │              │
│  │ • Chat Interface│  │ • /api/metrics  │              │
│  └─────────────────┘  └─────────────────┘              │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │           Optimization Engine                   │   │
│  │                                               │   │
│  │ • ConstructionMCPSolver                       │   │
│  │ • HiGHS Integration                           │   │
│  │ • Problem Templates                           │   │
│  │ • Solution Analysis                           │   │
│  └───────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Implementation

### 1. Solver API Endpoint

The solver functionality is exposed via the `/api/solver/solve` endpoint:

```typescript
// POST /api/solver/solve
{
  "problem": {
    "variables": [...],
    "constraints": {...},
    "objective": {...}
  },
  "options": {
    "time_limit": 300,
    "solver": "highs"
  }
}
```

### 2. ConstructionMCPSolver Integration

The `ConstructionMCPSolver` class provides the main interface:

```typescript
import ConstructionMCPSolver from './src/pages/api/_lib/ConstructionMCPSolver';

const solver = new ConstructionMCPSolver();

// Check if HiGHS is available
if (solver.isSolverAvailable('highs')) {
  console.log('✅ HiGHS solver is available');
} else {
  console.log('⚠️ Using fallback solver');
}
```

### 3. Use in Workflow

The workflow orchestrator automatically uses the integrated solver:

```typescript
import { executeConstructionWorkflow } from './src/dcisionai-agents/constructionWorkflow';

const result = await executeConstructionWorkflow(customerData, userIntent, {
  solverOptions: {
    time_limit: 300, // 5 minutes
    construction_heuristics: true,
    safety_constraint_weight: 1.5,
    quality_constraint_weight: 1.2
  }
});

console.log('Solver used:', result.metadata.solverUsed);
console.log('HiGHS available:', result.metadata.highsAvailable);
```

## Construction Optimization Examples

### 1. Workforce Scheduling

```typescript
const workforceProblem = {
  problem_type: 'scheduling',
  sense: 'minimize',
  objective: {
    linear: [1, 1, 1, 1] // Minimize total worker hours
  },
  variables: [
    { name: 'carpenters', type: 'int', category: 'worker' },
    { name: 'electricians', type: 'int', category: 'worker' },
    { name: 'plumbers', type: 'int', category: 'worker' },
    { name: 'overtime_hours', type: 'cont', category: 'time' }
  ],
  constraints: {
    dense: [
      [1, 0, 0, 0], // Carpenter requirement
      [0, 1, 0, 0], // Electrician requirement
      [0, 0, 1, 0], // Plumber requirement
      [1, 1, 1, 0]  // Total worker constraint
    ],
    sense: ['>=', '>=', '>=', '<='],
    rhs: [5, 3, 2, 15]
  }
};

const result = await solver.solveConstructionOptimization(workforceProblem);
```

### 2. Resource Allocation

```typescript
const resourceProblem = {
  problem_type: 'resource_allocation',
  sense: 'maximize',
  objective: {
    linear: [100, 150, 80, 120] // Maximize project value
  },
  variables: [
    { name: 'project_a', type: 'bin', category: 'project' },
    { name: 'project_b', type: 'bin', category: 'project' },
    { name: 'project_c', type: 'bin', category: 'project' },
    { name: 'project_d', type: 'bin', category: 'project' }
  ],
  constraints: {
    dense: [
      [5, 8, 3, 6],   // Budget constraint
      [2, 3, 1, 2]    // Time constraint
    ],
    sense: ['<=', '<='],
    rhs: [20, 8]
  }
};
```

## Solver Options

### Basic Options

```typescript
const options = {
  time_limit: 300,              // 5 minutes
  presolve: 'on',               // Enable presolve
  solver: 'simplex',            // Use simplex algorithm
  parallel: 'on',               // Enable parallel processing
  threads: 4,                   // Use 4 threads
  output_flag: true,            // Enable solver output
  log_to_console: true          // Log to console
};
```

### Construction-Specific Options

```typescript
const constructionOptions = {
  // Standard HiGHS options
  time_limit: 600,              // 10 minutes for complex problems
  mip_rel_gap: 0.01,            // 1% optimality gap
  
  // Construction-specific options
  construction_heuristics: true,
  safety_constraint_weight: 1.5,
  quality_constraint_weight: 1.2,
  cost_optimization_priority: 'balance'
};
```

## Testing the Integration

### 1. Test the Solver API

```bash
# Test the solver endpoint directly
curl -X POST https://your-platform-url/api/solver/solve \
  -H "Content-Type: application/json" \
  -d '{
    "problem": {
      "variables": [
        {"name": "x", "type": "cont", "lb": 0, "ub": 10},
        {"name": "y", "type": "cont", "lb": 0, "ub": 10}
      ],
      "objective": {"linear": [1, 1]},
      "constraints": {
        "dense": [[1, 1]],
        "sense": [">="],
        "rhs": [1]
      }
    }
  }'
```

### 2. Test Script

```typescript
import { testHiGHSIntegration } from './src/pages/api/_lib/test-highs-integration';

// Run integration tests
await testHiGHSIntegration();
```

## Performance Considerations

### 1. Problem Size Guidelines

- **Small problems** (< 100 variables): Use dense format
- **Medium problems** (100-1000 variables): Use sparse format
- **Large problems** (> 1000 variables): Consider decomposition

### 2. Solver Selection

- **Linear problems**: Use simplex or IPM
- **Integer problems**: Use branch-and-bound with simplex
- **Quadratic problems**: Use IPM (interior point method)

### 3. Time Limits

- **Simple problems**: 30-60 seconds
- **Medium problems**: 2-5 minutes
- **Complex problems**: 10-30 minutes

## Error Handling

### 1. Common Issues

```typescript
try {
  const result = await solver.solveConstructionOptimization(problem);
} catch (error) {
  if (error.message.includes('infeasible')) {
    console.log('Problem is infeasible - check constraints');
  } else if (error.message.includes('unbounded')) {
    console.log('Problem is unbounded - check objective');
  } else if (error.message.includes('time_limit')) {
    console.log('Solver hit time limit - consider relaxing constraints');
  }
}
```

### 2. Solution Parsing

The HiGHS solver outputs both primal and dual solution values in its solution file. The integration automatically filters out dual solution values to avoid duplicate entries:

```typescript
// HiGHS solution file format:
# Primal solution values
# Columns 4
carpentr 5
electr 5
plumbers 3
hvac 2

# Dual solution values  
# Columns 4
carpentr -3
electr -4
plumbers -4
hvac -4
```

The parser correctly extracts only the primal solution values (the actual variable assignments) and ignores the dual values (shadow prices/reduced costs).

### 3. Fallback Behavior

If HiGHS is not available, the system automatically falls back to a simple solver for testing:

```typescript
if (solver.isSolverAvailable('highs')) {
  console.log('Using HiGHS solver');
} else {
  console.log('Using fallback solver - HiGHS not available');
}
```

## Production Deployment

### 1. Environment Variables

```bash
# HiGHS Configuration
HIGHS_ENABLED=true
HIGHS_TIMEOUT=300
HIGHS_THREADS=4
HIGHS_LOG_LEVEL=info
```

### 2. Monitoring

```typescript
// Monitor solver performance
const metrics = {
  solveTime: result.metadata.solve_time_ms,
  iterations: result.metadata.iterations,
  nodesExplored: result.metadata.nodes_explored,
  gap: result.metadata.gap,
  solverUsed: result.metadata.solver_used
};
```

## Benefits of Integrated Architecture

### ✅ **Simplified Deployment**
- Single service to deploy and manage
- No network overhead between frontend and solver
- Easier debugging and monitoring

### ✅ **Complete Optimization Pipeline**
- End-to-end optimization from data to solution
- Real mathematical optimization instead of heuristics
- Proven HiGHS solver with excellent performance

### ✅ **Construction-Specific Features**
- Pre-built templates for common construction problems
- Domain-specific variable categorization
- Construction-aware constraint handling

### ✅ **Production Ready**
- Robust error handling and fallback mechanisms
- Performance monitoring and optimization
- Scalable architecture for large problems

### ✅ **Easy Integration**
- Drop-in replacement for existing optimization needs
- Compatible with your existing agent architecture
- Minimal code changes required

## Next Steps

1. **Test the integrated solver**: Use the `/api/solver/solve` endpoint
2. **Deploy to production**: The solver is automatically included in the main deployment
3. **Monitor performance**: Track solver metrics and optimization results
4. **Optimize further**: Fine-tune solver options for your specific use cases

Your DcisionAI platform now has a complete, production-ready optimization pipeline powered by HiGHS, all integrated into a single, efficient service! 