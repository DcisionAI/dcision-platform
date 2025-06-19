# HiGHS MCP Integration Guide for DcisionAI

## Overview

This guide explains how to integrate the [highs-mcp](https://www.npmjs.com/package/highs-mcp) package with your DcisionAI construction management platform to complete the optimization pipeline.

## What is highs-mcp?

The `highs-mcp` package is a Model Context Protocol (MCP) server that provides linear programming (LP) and mixed-integer programming (MIP) optimization capabilities using the HiGHS solver. It's perfect for your construction optimization needs because it supports:

- **Linear Programming (LP)**: Resource allocation, scheduling
- **Mixed-Integer Programming (MIP)**: Project selection, workforce planning
- **Quadratic Programming (QP)**: Risk optimization, portfolio management
- **Binary and integer variables**: Yes/no decisions, discrete quantities
- **Multi-objective optimization**: Balancing multiple goals

## Installation

### 1. Install the Package

```bash
npm install highs-mcp
```

### 2. Verify Installation

```bash
npx highs-mcp --help
```

## Integration with DcisionAI

### Current Architecture

Your DcisionAI platform now has:

```
Customer Data → Data Agent → Intent Agent → Model Builder Agent → [MISSING: SOLVER] → Explain Agent
```

### With highs-mcp Integration

```
Customer Data → Data Agent → Intent Agent → Model Builder Agent → HiGHS MCP Solver → Explain Agent
```

## Implementation

### 1. Update ConstructionMCPSolver

The `ConstructionMCPSolver` class is already designed to integrate with highs-mcp:

```typescript
import ConstructionMCPSolver from './src/mcp-solver/ConstructionMCPSolver';

const solver = new ConstructionMCPSolver();

// Check if HiGHS is available
if (solver.isHighsAvailable()) {
  console.log('✅ HiGHS solver is available');
} else {
  console.log('⚠️ Using fallback solver');
}
```

### 2. Use in Workflow

The workflow orchestrator automatically uses the solver:

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

### 3. Cost Optimization

```typescript
const costProblem = {
  problem_type: 'cost_optimization',
  sense: 'minimize',
  objective: {
    linear: [50, 75, 40, 60] // Minimize total cost
  },
  variables: [
    { name: 'material_a', type: 'cont', category: 'material' },
    { name: 'material_b', type: 'cont', category: 'material' },
    { name: 'equipment_a', type: 'int', category: 'equipment' },
    { name: 'equipment_b', type: 'int', category: 'equipment' }
  ],
  constraints: {
    dense: [
      [1, 1, 0, 0], // Material requirement
      [0, 0, 1, 1], // Equipment requirement
      [2, 1, 1, 2]  // Quality constraint
    ],
    sense: ['>=', '>=', '>='],
    rhs: [100, 10, 50]
  }
};
```

## Advanced Features

### 1. Quadratic Programming for Risk Management

```typescript
const riskProblem = {
  problem_type: 'risk_management',
  sense: 'minimize',
  objective: {
    quadratic: {
      dense: [
        [0.1, 0.02, 0.01],  // Risk covariance matrix
        [0.02, 0.15, 0.03],
        [0.01, 0.03, 0.08]
      ]
    }
  },
  variables: [
    { name: 'risk_mitigation_a', type: 'cont', category: 'risk' },
    { name: 'risk_mitigation_b', type: 'cont', category: 'risk' },
    { name: 'risk_mitigation_c', type: 'cont', category: 'risk' }
  ],
  constraints: {
    dense: [
      [1, 1, 1], // Total risk budget
      [0.8, 0.6, 0.9] // Risk reduction effectiveness
    ],
    sense: ['<=', '>='],
    rhs: [100, 50]
  }
};
```

### 2. Large Sparse Problems

For large construction projects with many variables:

```typescript
const largeProblem = {
  problem_type: 'supply_chain',
  sense: 'minimize',
  objective: {
    linear: [10, 15, 12, 8, 9, 11] // Transportation costs
  },
  variables: [
    { name: 'supplier_a', type: 'cont', category: 'supplier' },
    { name: 'supplier_b', type: 'cont', category: 'supplier' },
    { name: 'supplier_c', type: 'cont', category: 'supplier' },
    { name: 'supplier_d', type: 'cont', category: 'supplier' },
    { name: 'supplier_e', type: 'cont', category: 'supplier' },
    { name: 'supplier_f', type: 'cont', category: 'supplier' }
  ],
  constraints: {
    sparse: {
      rows: [0, 0, 1, 1, 2, 2],    // Only non-zero coefficients
      cols: [0, 2, 1, 3, 2, 4],
      values: [1, 1, 1, 1, 1, 1],
      shape: [3, 6]
    },
    sense: ['>=', '>=', '>='],
    rhs: [100, 150, 200]
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

### 1. Test Script

```typescript
import { testHighsIntegration } from './src/mcp-solver/test-highs-integration';

// Run integration tests
await testHighsIntegration();
```

### 2. Example Usage

```typescript
import { runConstructionExamples } from './src/mcp-solver/construction-examples';

// Run all construction examples
await runConstructionExamples();
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

### 2. Fallback Behavior

If highs-mcp is not available, the system automatically falls back to a simple solver for testing:

```typescript
if (solver.isHighsAvailable()) {
  console.log('Using HiGHS solver');
} else {
  console.log('Using fallback solver - install highs-mcp for full functionality');
}
```

## Production Deployment

### 1. Docker Integration

Add to your `docker-compose.yml`:

```yaml
services:
  dcisionai-platform:
    build: .
    environment:
      - HIGHS_MCP_ENABLED=true
    depends_on:
      - agno-backend
```

### 2. Environment Variables

```bash
# HiGHS MCP Configuration
HIGHS_MCP_ENABLED=true
HIGHS_MCP_TIMEOUT=300
HIGHS_MCP_THREADS=4
HIGHS_MCP_LOG_LEVEL=info
```

### 3. Monitoring

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

## Benefits of This Integration

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

1. **Install highs-mcp**: `npm install highs-mcp`
2. **Test integration**: Run the test scripts
3. **Deploy to production**: Update your deployment configuration
4. **Monitor performance**: Track solver metrics
5. **Optimize further**: Fine-tune solver options for your specific use cases

Your DcisionAI platform now has a complete, production-ready optimization pipeline powered by one of the fastest open-source optimization solvers available! 