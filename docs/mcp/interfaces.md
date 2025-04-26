# MCP Interface Definitions

## Core Interfaces

### MCPModel
The main interface that defines an optimization problem using the Model Context Protocol (MCP).

```typescript
interface MCPModel {
  variables: Variable[];
  constraints: Constraint[];
  objectives: Objective[];
  metadata: ModelMetadata;
}
```

### Variable Types

#### Numeric Variables
```typescript
interface NumericVariable extends BaseVariable {
  type: 'numeric';
  domain: {
    min?: number;
    max?: number;
    step?: number;
  };
}
```

#### Binary Variables
```typescript
interface BinaryVariable extends BaseVariable {
  type: 'binary';
}
```

#### Categorical Variables
```typescript
interface CategoricalVariable extends BaseVariable {
  type: 'categorical';
  domain: {
    values: string[];
  };
}
```

## Constraint Definitions

### Mathematical Constraints
- Less than or equal (≤)
- Greater than or equal (≥)
- Equal to (=)
- Not equal to (≠)

### Example
```typescript
interface Constraint {
  type: 'mathematical';
  expression: string;
  operator: 'lte' | 'gte' | 'eq' | 'neq';
  rhs: number;
}
```

## Objective Functions

### Single Objective
```typescript
interface SingleObjective {
  type: 'minimize' | 'maximize';
  expression: string;
  weight?: number;
}
```

### Multi-Objective
```typescript
interface MultiObjective {
  objectives: SingleObjective[];
  method: 'weighted_sum' | 'pareto';
}
```

## Protocol Steps

### Step Types
1. Data Collection
2. Validation
3. Model Building
4. Solving
5. Solution Analysis

### Example Configuration
```typescript
interface ProtocolStep {
  action: StepAction;
  required: boolean;
  timeout?: number;
  retries?: number;
}
```

## Metadata

### Problem Classification
```typescript
interface ModelMetadata {
  problemType: ProblemType;
  industry?: IndustryVertical;
  complexity: 'basic' | 'intermediate' | 'advanced';
  version: string;
}
```

## Usage Examples

### Vehicle Routing Problem
```typescript
const vrpModel: MCPModel = {
  variables: [
    {
      name: 'route_assignment',
      type: 'binary',
      dimensions: ['vehicle', 'customer'],
    }
  ],
  constraints: [
    {
      type: 'mathematical',
      expression: 'sum(route_assignment[v,c] for v in vehicles) == 1',
      operator: 'eq',
      rhs: 1,
    }
  ],
  objectives: [
    {
      type: 'minimize',
      expression: 'total_distance',
    }
  ],
  metadata: {
    problemType: 'vehicle_routing',
    complexity: 'intermediate',
    version: '1.0.0',
  }
};
``` 