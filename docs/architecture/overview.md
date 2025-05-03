# DcisionAI Platform: Architecture Overview

## 1. High-Level System Components

| Component         | Description                                                                                  | Key Technologies         |
|-------------------|---------------------------------------------------------------------------------------------|-------------------------|
| **Frontend**      | User interface for problem definition, solution review, and orchestration control.           | Next.js, TypeScript     |
| **MCP Orchestrator** | Central logic that sequences protocol steps, invokes agents, and manages state.           | Node.js/TypeScript      |
| **Solver Service**| Backend service for optimization model building and solving.                                 | FastAPI, Python, OR-Tools|
| **Data Service**  | Handles data ingestion, ETL, and integration from various sources.                          | Airbyte, Node.js        |
| **Plugin Service**| Middleware for extensibility and custom logic.                                               | Node.js/TypeScript      |
| **Supabase**      | Cloud-native database for persistent storage.                                                | Supabase (Postgres)     |
| **LLM Providers** | Large Language Model integrations for reasoning, mapping, and explanation.                   | OpenAI, Anthropic, etc. |

---

## 2. System Flow Diagram

```
[Frontend] <--> [MCP Orchestrator] <--> [Agents/LLMs]
                                 |         |
                                 |         +--> [Solver Service]
                                 |         +--> [Data Service]
                                 |         +--> [Plugin Service]
                                 |
                                 +--> [Supabase]
```

---

## 3. Component Details

### **Frontend**
- Built with Next.js and TypeScript.
- Allows users to define problems, review solutions, and interact with the MCP protocol.
- Communicates with backend services via REST APIs.

---

### **MCP Orchestrator**
- Located in `server/mcp/orchestrator/`.
- Sequences protocol steps as defined in the MCP object.
- For each step:
  1. Looks up the appropriate agent from the `AgentRegistry`.
  2. Passes the current MCP state and context (including LLM access) to the agent.
  3. Collects results, errors, and thought processes for each step.
- Returns a full protocol execution trace to the frontend.

---

### **Backend Services**

#### **Solver Service**
- Located in `solver-service/`.
- Exposes REST APIs for model building, solving, and solution explanation.
- Uses OR-Tools for optimization.
- Can be invoked directly by the orchestrator or by agents (e.g., `ModelRunnerAgent`).

#### **Data Service**
- Located in `data-service/`.
- Handles data ingestion, ETL, and integration.
- Connects to external and internal data sources with over 100 connectors. 
- Supplies clean, structured data to the orchestrator and agents.

#### **Plugin Service**
- Located in `plugin-service/`.
- Provides extensibility for custom logic, integrations, and business rules.

#### **Supabase**
- Used for persistent storage of user data, problem definitions, and results.

---

### **Agent & LLM System**

#### **Agent Registry**
- Central registry for all agents.
- Ensures each protocol step is handled by the correct agent.

#### **Agents**
- Each agent is responsible for a specific protocol step.
- Many agents leverage LLMs for advanced reasoning, mapping, and explanation.
- See the detailed agent breakdown in the next section.

#### **LLM Providers**
- Abstracted via a provider/factory pattern.
- Supports OpenAI, Anthropic, and other LLMs.
- Agents receive an `llm` object in their context, abstracting provider details.

---

## 4. Agent System: Categories & Responsibilities

| Agent Name               | Category                | Key Actions                | LLM Usage                |
|--------------------------|-------------------------|----------------------------|--------------------------|
| IntentInterpreterAgent   | Intent Understanding    | interpret_intent           | Yes (intent extraction)  |
| DataIntegrationAgent     | Data Collection         | collect_data               | Yes (feature mapping)    |
| DataMappingAgent         | Data Mapping            | collect_data               | Yes (mapping, rationale) |
| ModelRunnerAgent         | Model Build & Solve     | build_model, solve_model   | Yes (constraints, explain)|
| SolutionExplainerAgent   | Explanation & Reporting | generate_report            | Yes (explanation)        |

**See the agents documentation for a detailed breakdown of each agent.**

---

## 5. Protocol Flow Example

1. **User submits a problem** via the frontend.
2. **MCP Orchestrator** loads the protocol steps and invokes agents in sequence:
   - **IntentInterpreterAgent**: Classifies and extracts context.
   - **DataIntegrationAgent/DataMappingAgent**: Connects to data sources, maps, and collects data.
   - **ModelRunnerAgent**: Builds and solves the optimization model.
   - **SolutionExplainerAgent**: Explains and reports the solution.
3. **LLMs** are invoked by agents as needed for interpretation, mapping, validation, and explanation.
4. **Results** are returned to the frontend, with human-in-the-loop review if required.

---

## 6. Extensibility & Best Practices

- **Modular agent design** allows for easy addition of new protocol steps or agent types.
- **LLM provider abstraction** enables switching or combining LLMs as needed.
- **Service-oriented architecture** supports independent scaling and deployment of each service.
- **Cloud-native deployment** (Cloud Run, Docker, etc.) for scalability and reliability.

## Related Documents

- [MCP Protocol Specification](./mcp/protocol.md)
- [Agent System Architecture](./mcp/agents.md)
- [API Documentation](./api/README.md)
- [Deployment Guide](./deployment/README.md) 