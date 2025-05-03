# DcisionAI Platform: Agent & LLM Architecture

## Overview

The platform uses a modular, agent-based architecture to orchestrate the Model-Centric Protocol (MCP) flow. Each agent is responsible for a specific protocol step, and many leverage LLMs for advanced reasoning, data mapping, and explanation. Agents are registered in a central registry and invoked by the MCP orchestrator as needed.

---

## Agent Categories & Responsibilities

### 1. Intent & Problem Understanding Agents

#### **IntentInterpreterAgent**
- **Category:** Intent Understanding
- **Role:** Interprets the user's problem description and classifies the optimization problem type (e.g., vehicle routing, job shop, etc.).
- **LLM Use:** Uses LLMs for enhanced intent extraction and context understanding, with fallback to rule-based heuristics.
- **Flow:**
  1. Receives user input/metadata.
  2. Invokes LLM (if available) to extract problem type and context.
  3. Returns structured intent and context for downstream agents.

---

### 2. Data Agents

#### **DataIntegrationAgent**
- **Category:** Data Collection & Integration
- **Role:** Connects to data sources (e.g., Supabase, external DBs), analyzes schema, maps required features, and collects data for the optimization problem.
- **LLM Use:**
  - Analyzes required features and schema.
  - Maps features to data sources using LLM for intelligent discovery.
  - Generates feature engineering reports.
- **Flow:**
  1. Connects to the appropriate data source via plugin.
  2. Retrieves schema and analyzes required features.
  3. Uses LLM to map features and validate mappings.
  4. Collects data and generates reports.

#### **DataMappingAgent**
- **Category:** Data Mapping & Transformation
- **Role:** Maps database fields to required model fields, calculates confidence, suggests transformations, and validates mappings.
- **LLM Use:**
  - Uses LLMs for advanced mapping, transformation suggestions, and rationale generation.
- **Flow:**
  1. Fetches schema and relationships from Supabase.
  2. Uses heuristics and LLMs to match and transform fields.
  3. Validates mappings and provides confidence scores.

---

### 3. Modeling & Solving Agents

#### **ModelRunnerAgent**
- **Category:** Model Building & Solving
- **Role:** Builds and solves the optimization model using OR-Tools or other solvers.
- **LLM Use:**
  - Generates constraints from business rules.
  - Validates model structure and suggests improvements.
  - Explains solution using LLMs.
- **Flow:**
  1. Builds model components based on problem type.
  2. Uses LLM for constraint generation and validation.
  3. Solves the model and optionally invokes LLM for solution explanation.

---

### 4. Explanation & Reporting Agents

#### **SolutionExplainerAgent**
- **Category:** Solution Explanation & Reporting
- **Role:** Generates natural language explanations and structured reports for solutions.
- **LLM Use:**
  - Uses LLMs to explain solutions, extract insights, and structure reports.
- **Flow:**
  1. Receives solution and context.
  2. Invokes LLM to generate explanations and insights.
  3. Structures the output for user consumption.

---

### 5. Agent Registry & Orchestration

#### **AgentRegistry**
- **Role:** Central registry for all agents. Ensures each protocol step is handled by the appropriate agent.
- **Flow:**
  1. Registers all core agents at startup.
  2. Provides lookup and invocation for orchestrator.

---

## LLM Providers & Integration

- **Location:** `server/mcp/agents/llm/providers/`
- **Supported Providers:**
  - `AnthropicProvider.ts` (Claude, etc.)
  - `OpenAIProvider.ts` (GPT-3/4, etc.)
- **Factory Pattern:**
  - `LLMProviderFactory.ts` dynamically selects the provider based on configuration.
- **Usage:**
  - Agents receive an `llm` object in their context, abstracting provider details.

---

## Agent Flow in MCP Protocol

1. **User submits a problem** via the frontend.
2. **MCP Orchestrator** determines the protocol steps and invokes agents in sequence:
   - **IntentInterpreterAgent**: Classifies and extracts context.
   - **DataIntegrationAgent/DataMappingAgent**: Connects to data sources, maps, and collects data.
   - **ModelRunnerAgent**: Builds and solves the optimization model.
   - **SolutionExplainerAgent**: Explains and reports the solution.
3. **LLMs** are invoked by agents as needed for interpretation, mapping, validation, and explanation.
4. **Results** are returned to the frontend, with human-in-the-loop review if required.

---

## Example Agent Registration

```typescript
// server/mcp/agents/index.ts
agentRegistry.register(new IntentInterpreterAgent());
agentRegistry.register(new ModelRunnerAgent());
agentRegistry.register(new DataIntegrationAgent());
agentRegistry.register(new DataMappingAgent());
agentRegistry.register(new SolutionExplainerAgent());
```

---

## Summary Table

| Agent Name               | Category                | Key Actions                | LLM Usage                |
|--------------------------|-------------------------|----------------------------|--------------------------|
| IntentInterpreterAgent   | Intent Understanding    | interpret_intent           | Yes (intent extraction)  |
| DataIntegrationAgent     | Data Collection         | collect_data               | Yes (feature mapping)    |
| DataMappingAgent         | Data Mapping            | collect_data               | Yes (mapping, rationale) |
| ModelRunnerAgent         | Model Build & Solve     | build_model, solve_model   | Yes (constraints, explain)|
| SolutionExplainerAgent   | Explanation & Reporting | generate_report            | Yes (explanation)        |

---

## How This Maps to Anthropic MCP Guidelines

- **Protocol Steps:** Each step is handled by a specialized agent, supporting modularity and extensibility.
- **LLM Integration:** LLMs are used for interpretation, mapping, validation, and explanation, supporting explainability and human-in-the-loop workflows.
- **Orchestration:** The AgentRegistry and orchestrator ensure the right agent is invoked for each protocol step.
- **Extensibility:** New agents or LLM providers can be added with minimal changes to the core flow. 