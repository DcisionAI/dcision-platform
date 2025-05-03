# MCP Architecture Overview

## Introduction

The Model-Context-Protocol (MCP) architecture is a framework for building and deploying optimization models in a structured, maintainable, and scalable way. This document outlines our implementation of the MCP pattern, following Anthropic's guidelines, and how it integrates with our LLM-powered agents and GCP-deployed solver service.

## Core Principles

1. **Model-Context-Protocol Pattern**
   - Model: Defines the optimization problem structure
   - Context: Provides runtime and domain-specific information
   - Protocol: Specifies the execution flow and requirements

2. **LLM Integration**
   - Intent interpretation
   - Solution explanation
   - Natural language processing

3. **Cloud-Native Architecture**
   - GCP-deployed solver service
   - Scalable infrastructure
   - Managed services

## Architecture Components

### 1. MCP Core

```typescript
interface MCP {
  sessionId: string;
  version: string;
  status: MCPStatus;
  model: {
    variables: Variable[];
    constraints: Constraint[];
    objective: Objective | Objective[];
  };
  context: {
    environment: Environment;
    dataset: Dataset;
    problemType: ProblemType;
    industry?: IndustryVertical;
  };
  protocol: Protocol;
}
```

### 2. Agent Architecture

Our agent system follows a modular design:

```typescript
interface Agent {
  run(step: ProtocolStep, mcp: MCP, context: AgentRunContext): Promise<AgentRunResult>;
}
```

#### Key Agents:

1. **IntentInterpreterAgent**
   - Uses LLM to understand problem requirements
   - Maps natural language to structured MCP format
   - Validates problem feasibility

2. **DataCollectorAgent**
   - Gathers required data from internal sources
   - Validates data completeness
   - Transforms data into required format

3. **DataEnricherAgent**
   - Enhances data with additional context
   - Calculates derived metrics
   - Integrates external data sources

4. **ModelBuilderAgent**
   - Constructs optimization models
   - Validates model structure
   - Prepares model for solver

5. **ModelRunnerAgent**
   - Interfaces with GCP solver service
   - Handles solver execution
   - Manages solver responses

6. **SolutionExplainerAgent**
   - Uses LLM to explain solutions
   - Provides business context
   - Generates recommendations

### 3. Solver Service

Our solver service is deployed on GCP Cloud Run:

```
URL: https://solver-service-219323644585.us-central1.run.app
```

#### Features:
- Containerized deployment
- Auto-scaling
- Managed infrastructure
- Secure communication

#### Integration:
```typescript
class ORToolsSolver {
  private solverServiceUrl: string;

  async solve(model: any, mcp: MCP): Promise<ModelSolution> {
    const response = await axios.post(
      `${this.solverServiceUrl}/solve`,
      solveRequest
    );
    // Transform and return solution
  }
}
```

## Implementation Guidelines

### 1. Model Definition

```typescript
// Example: Vehicle Routing Problem
const model = {
  variables: [
    {
      name: 'vehicle_assignments',
      type: 'array',
      description: 'Vehicle assignments to tasks',
      min: 0,
      max: 1000
    }
  ],
  constraints: [
    {
      type: 'non_negativity',
      description: 'Vehicle assignments must be non-negative',
      field: 'vehicle_assignments',
      operator: 'gte',
      value: 0,
      priority: 'must'
    }
  ],
  objective: {
    type: 'minimize',
    field: 'total_distance',
    description: 'Minimize total distance traveled',
    weight: 1.0
  }
};
```

### 2. Context Specification

```typescript
const context = {
  environment: {
    region: 'us-central1',
    timezone: 'America/Chicago'
  },
  dataset: {
    internalSources: ['vehicles', 'locations', 'demands'],
    metadata: {
      tables: {
        vehicles: {
          name: 'vehicles',
          fields: ['id', 'capacity', 'start_location', 'end_location']
        }
      }
    }
  },
  problemType: 'vehicle_routing',
  industry: 'logistics'
};
```

### 3. Protocol Definition

```typescript
const protocol = {
  steps: [
    {
      id: 'interpret',
      action: 'interpret_intent',
      description: 'Interpret the problem intent',
      required: true
    },
    {
      id: 'collect',
      action: 'collect_data',
      description: 'Collect data from internal sources',
      required: true,
      parameters: {
        tables: ['vehicles', 'locations', 'demands']
      }
    }
  ],
  allowPartialSolutions: true,
  explainabilityEnabled: true,
  humanInTheLoop: {
    required: false,
    approvalSteps: [
      {
        step: 'review_solution',
        description: 'Review and approve the solution'
      }
    ]
  }
};
```

## Best Practices

1. **Model Design**
   - Use descriptive variable names
   - Include comprehensive constraints
   - Define clear objectives

2. **Context Management**
   - Provide complete environment information
   - Specify all required data sources
   - Include domain-specific context

3. **Protocol Implementation**
   - Define clear step sequences
   - Include error handling
   - Enable human review when needed

4. **Agent Development**
   - Follow single responsibility principle
   - Implement proper error handling
   - Include logging and monitoring

5. **Solver Integration**
   - Use proper error handling
   - Implement retry mechanisms
   - Monitor solver performance

## Future Enhancements

1. **Enhanced LLM Integration**
   - More sophisticated prompt engineering
   - Better context management
   - Improved solution explanation

2. **Solver Service**
   - Additional solver types
   - Performance optimization
   - Enhanced monitoring

3. **Agent System**
   - More specialized agents
   - Better error recovery
   - Enhanced validation

## Conclusion

Our MCP implementation provides a robust framework for optimization problems, combining:
- Structured problem definition
- LLM-powered intelligence
- Cloud-native solver service
- Modular agent architecture

This architecture enables scalable, maintainable, and efficient optimization solutions across various domains. 