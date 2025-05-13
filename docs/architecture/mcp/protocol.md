# Model Context Protocol (MCP) Specification

## Introduction

The Model Context Protocol (MCP) is a standardized framework for defining, executing, managing, and deploying optimization and operations research problems. MCP is both an authoring artifact (for interactive, LLM/agent-powered workflows) and a deployable, versioned contract for real-time, production-grade endpoints.

## MCP as a Deployable Contract

- **Authoring Phase:**
  - Users interactively build and validate an MCP using the console and LLM/agent-powered steps (intent, data, model, preview, solve).
  - The MCP document encodes all context, model, and protocol steps required for the problem.

- **Deployment Phase:**
  - A validated MCP can be deployed as a versioned, immutable endpoint.
  - The deployed MCP serves as a contract: new data can be POSTed to the endpoint for real-time optimization/decisioning, skipping the authoring steps.
  - See [MCP Deployment & Serving](../../mcp/deployment.md) for endpoint API and lifecycle details.

## Protocol Structure

### Core Components

1. **MCP Document**
   ```typescript
   interface MCP {
     sessionId: string;
     model: {
       variables: Variable[];
       constraints: Constraint[];
       objective: Objective;
     };
     context: Context;
     protocol: Protocol;
     version: string;
     created: string;
     lastModified: string;
     status: MCPStatus;
   }
   ```

2. **Context Definition**
   ```typescript
   interface Context {
     problemType: string;
     industry: string;
     environment: Environment;
     dataset: Dataset;
   }
   ```

3. **Protocol Definition**
   ```typescript
   interface Protocol {
     steps: ProtocolStep[];
     allowPartialSolutions: boolean;
     explainabilityEnabled: boolean;
     humanInTheLoop: {
       required: boolean;
     };
   }
   ```

## Authoring vs. Serving

| Phase      | Purpose                                   | Main Actors         | Typical Actions                                 |
|------------|-------------------------------------------|---------------------|-------------------------------------------------|
| Authoring  | Build, validate, and deploy MCPs          | Console, LLM/Agents | Intent, data prep, model, preview, deploy        |
| Serving    | Real-time optimization with new data      | Services, API       | POST new data, get solution/explanation          |

## Protocol Steps

### Step Types

1. **Data Collection**
   - `collect_data`: Gather required data from sources
   - `enrich_data`: Enhance data with additional information

2. **Validation**
   - `validate_constraints`: Verify constraint feasibility
   - `validate_network`: Check network connectivity

3. **Model Building**
   - `build_model`: Construct optimization model
   - `solve_model`: Execute solver

4. **Solution Processing**
   - `explain_solution`: Generate solution explanations
   - `human_review`: Human validation step
   - `productionalize_workflow`: Deploy as endpoint (authoring only)

### Example Protocol Flow

```json
[
  { "action": "interpret_intent", "description": "Analyze user input and select model template.", "required": true },
  { "action": "collect_data", "description": "Identify and validate required data sources.", "required": true },
  { "action": "build_model", "description": "Construct and validate the optimization model.", "required": true },
  { "action": "solve_model", "description": "Solve the optimization problem.", "required": true },
  { "action": "explain_solution", "description": "Explain and review the solution.", "required": false },
  { "action": "productionalize_workflow", "description": "Deploy the workflow as a live endpoint.", "required": true }
]
```

## Agent System

### Agent Types

1. **Data Agents**
   - Data collection
   - Data enrichment
   - Data validation

2. **Model Agents**
   - Model building
   - Constraint handling
   - Objective definition

3. **Solver Agents**
   - Model solving
   - Solution validation
   - Performance optimization

4. **Explanation Agents**
   - Solution interpretation
   - Insight generation
   - Report creation

### Agent Communication

1. **Message Passing**
   - Structured message format
   - Error handling
   - Timeout management

2. **State Management**
   - Agent state persistence
   - State synchronization
   - Recovery mechanisms

3. **Resource Management**
   - Resource allocation
   - Load balancing
   - Performance monitoring

## Best Practices for Protocol Design

- **Explicit Step Definitions:** Each protocol step should have a clear action, description, and requirements.
- **Version Management:** MCPs are versioned and immutable once deployed. Updates create new versions/endpoints.
- **Error Handling:** Define error handling and recovery strategies for each step.
- **Extensibility:** New protocol steps and agent types can be added as the platform evolves.
- **Security:** Validate all inputs, enforce access control, and audit all actions.

## Reference
- See [MCP Deployment & Serving](../../mcp/deployment.md) for endpoint API, versioning, and lifecycle.
- See [MCP Examples](../../mcp/examples/README.md) for real-world protocol flows.

## Summary

The MCP protocol is the backbone of DcisionAI's agentic workflow, enabling:
- Interactive, LLM/agent-powered authoring of optimization workflows.
- Seamless deployment as production endpoints for real-time serving.
- Full auditability, versioning, and extensibility for enterprise use. 