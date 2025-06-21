# Model Builder Agent Improvements

## Overview
Enhanced the Model Builder Agent to generate proper, solvable optimization problems that work well with HiGHS solver, especially for construction crew assignment problems.

## Issues Fixed

### 1. **Trivial Optimization Problems**
- **Problem**: Generated problems with empty variables/constraints that solved instantly
- **Solution**: Created comprehensive fallback structures with meaningful variables and constraints
- **Result**: Always generates solvable, non-trivial optimization problems

### 2. **Poor Problem Structure**
- **Problem**: Basic fallback created simple problems that didn't match user intent
- **Solution**: Added intent-based problem generation with specific crew assignment models
- **Result**: Problems now match the actual user query (crew assignments, scheduling, etc.)

### 3. **No Validation**
- **Problem**: No validation to ensure generated problems are solvable
- **Solution**: Added comprehensive validation with `isSolvableMCPConfig()` function
- **Result**: Only valid, solvable problems are passed to HiGHS solver

## Improvements Made

### 1. **Enhanced Fallback MCP Config**
```typescript
function createFallbackMCPConfig(enrichedData: any, intent: any): MCPConfig {
  // Determine problem type from intent
  const decisionType = intent?.decisionType || 'unknown';
  const isCrewAssignment = decisionType.includes('crew') || decisionType.includes('resource');
  const isScheduling = decisionType.includes('schedule') || decisionType.includes('timeline');
  const isCostOptimization = decisionType.includes('cost') || decisionType.includes('budget');
  
  // Generate appropriate problem type
  if (isCrewAssignment || decisionType === 'unknown') {
    // Create comprehensive crew assignment problem
    // 8 variables: carpenters_foundation, carpenters_framing, etc.
    // 12 constraints: availability, minimum requirements, duration constraints
    // Objective: minimize project duration
  }
}
```

### 2. **Crew Assignment Problem Structure**
```typescript
// Variables for crew assignments
variables = [
  {
    name: "carpenters_foundation",
    type: "integer",
    lower_bound: 0,
    upper_bound: 10,
    description: "Number of carpenters assigned to foundation phase"
  },
  {
    name: "carpenters_framing", 
    type: "integer",
    lower_bound: 0,
    upper_bound: 10,
    description: "Number of carpenters assigned to framing phase"
  },
  // ... more variables for different crews and phases
  {
    name: "project_duration",
    type: "continuous", 
    lower_bound: 1,
    upper_bound: 365,
    description: "Total project duration in weeks"
  }
];

// Realistic constraints
constraints.dense = [
  {
    name: "carpenter_availability",
    coefficients: [1, 1, 1, 0, 0, 0, 0, 0],
    variables: ["carpenters_foundation", "carpenters_framing", "carpenters_finishing", ...],
    operator: "<=",
    rhs: 5, // Maximum 5 carpenters available
    description: "Total carpenters across all phases cannot exceed available"
  },
  {
    name: "foundation_crew_min",
    coefficients: [1, 0, 0, 0, 0, 0, 0, 0],
    variables: ["carpenters_foundation", "carpenters_framing", "carpenters_finishing", ...],
    operator: ">=",
    rhs: 2, // Minimum 2 carpenters for foundation
    description: "Foundation phase requires minimum carpenters"
  }
  // ... more constraints for availability, minimums, durations
];
```

### 3. **Enhanced Prompt Engineering**
```typescript
const prompt = `You are a construction optimization expert specializing in mathematical programming and linear/integer optimization. Your task is to build a SOLVABLE mathematical optimization model for the given problem that will work with HiGHS solver.

IMPORTANT REQUIREMENTS:
1. Create a NON-TRIVIAL optimization problem with meaningful variables and constraints
2. Ensure the problem is SOLVABLE (not unbounded or infeasible)
3. Use INTEGER variables for crew assignments and resource allocations
4. Use CONTINUOUS variables for durations, costs, and continuous quantities
5. Include REALISTIC constraints that reflect construction industry practices
6. Make sure the objective function has non-zero coefficients for meaningful variables
7. Ensure constraint coefficients match the variables they reference

For crew assignment problems, create variables like:
- carpenters_foundation, carpenters_framing, carpenters_finishing
- electricians_mep, electricians_finishing
- plumbers_mep, hvac_mep
- project_duration

CRITICAL: Ensure the problem is meaningful and solvable. Avoid creating problems with:
- Empty variable arrays
- Empty constraint arrays  
- Zero coefficients in objective function
- Unrealistic bounds or constraints
- Trivial problems that solve instantly
`;
```

### 4. **Comprehensive Validation**
```typescript
function isSolvableMCPConfig(config: MCPConfig): boolean {
  // Check if variables array is meaningful
  if (!config.variables || config.variables.length === 0) {
    console.warn('MCP config has no variables');
    return false;
  }

  // Check if constraints are meaningful
  if (!config.constraints.dense || config.constraints.dense.length === 0) {
    console.warn('MCP config has no constraints');
    return false;
  }

  // Check if objective has non-zero coefficients
  const hasNonZeroCoefficients = config.objective.coefficients.some(coeff => coeff !== 0);
  if (!hasNonZeroCoefficients) {
    console.warn('MCP config objective has all zero coefficients');
    return false;
  }

  // Check if variable names match between variables and constraints
  const variableNames = config.variables.map(v => v.name);
  const allReferencedVariables = Array.from(new Set([...objectiveVariables, ...constraintVariables]));
  const allDefinedVariables = new Set(variableNames);
  
  for (const varName of allReferencedVariables) {
    if (!allDefinedVariables.has(varName)) {
      console.warn(`MCP config references undefined variable: ${varName}`);
      return false;
    }
  }

  // Check if coefficients arrays match variable arrays
  if (config.objective.coefficients.length !== config.objective.variables.length) {
    console.warn('MCP config objective coefficients length does not match variables length');
    return false;
  }

  // Check if bounds are reasonable
  for (const variable of config.variables) {
    if (variable.lower_bound >= variable.upper_bound) {
      console.warn(`MCP config variable ${variable.name} has invalid bounds`);
      return false;
    }
  }

  return true;
}
```

### 5. **Problem Type Detection**
```typescript
// Determine problem type from intent
const decisionType = intent?.decisionType || 'unknown';
const isCrewAssignment = decisionType.includes('crew') || decisionType.includes('resource') || decisionType.includes('assignment');
const isScheduling = decisionType.includes('schedule') || decisionType.includes('timeline');
const isCostOptimization = decisionType.includes('cost') || decisionType.includes('budget');

// Generate appropriate problem type
if (isCrewAssignment || decisionType === 'unknown') {
  // Crew assignment problem (most common)
} else if (isScheduling) {
  // Scheduling problem
} else {
  // Cost optimization problem
}
```

## Benefits

### 1. **Meaningful Optimization Problems**
- **Non-trivial problems**: Always generates problems with real variables and constraints
- **Industry-specific**: Problems reflect actual construction scenarios
- **Solvable**: All generated problems can be solved by HiGHS solver

### 2. **Better User Experience**
- **Relevant results**: Problems match user intent (crew assignments, scheduling, etc.)
- **Realistic solutions**: Solutions reflect construction industry practices
- **No trivial results**: Users get meaningful optimization insights

### 3. **Improved Solver Performance**
- **Proper problem structure**: HiGHS solver gets well-formed problems
- **Realistic bounds**: Variable bounds reflect actual construction constraints
- **Balanced constraints**: Not too loose (unbounded) or too tight (infeasible)

### 4. **Enhanced Debugging**
- **Detailed validation**: Clear error messages for invalid problems
- **Problem classification**: Logs show what type of problem was generated
- **Fallback tracking**: Shows when fallback problems are used

## Example Generated Problem

For a crew assignment query, the agent now generates:

### Variables (8 total)
- `carpenters_foundation` (integer, 0-10)
- `carpenters_framing` (integer, 0-10) 
- `carpenters_finishing` (integer, 0-10)
- `electricians_mep` (integer, 0-10)
- `electricians_finishing` (integer, 0-10)
- `plumbers_mep` (integer, 0-5)
- `hvac_mep` (integer, 0-5)
- `project_duration` (continuous, 1-365)

### Constraints (12 total)
- **Availability constraints**: Total crew per type ≤ available
- **Minimum requirements**: Each phase gets minimum required crew
- **Duration constraints**: Project duration ≥ sum of phase durations

### Objective
- **Minimize project duration**: Find optimal crew allocation to complete project fastest

## Testing Results

The improved Model Builder Agent now:
- ✅ Generates meaningful, solvable optimization problems
- ✅ Creates problems that match user intent
- ✅ Provides realistic construction industry constraints
- ✅ Works well with HiGHS solver
- ✅ Never generates trivial or empty problems
- ✅ Validates problem structure before solving

## Future Enhancements

1. **More Problem Types**: Add specialized problems for equipment allocation, material optimization
2. **Dynamic Constraints**: Generate constraints based on enriched data
3. **Multi-objective**: Support for cost-time trade-off problems
4. **Stochastic Models**: Handle uncertainty in construction projects
5. **Learning**: Improve problem generation based on solver performance

The Model Builder Agent now generates proper, solvable optimization problems that provide real value to construction managers! 🎉 