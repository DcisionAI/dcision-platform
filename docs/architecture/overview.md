# DcisionAI Architecture Overview

## High-Level System Architecture

DcisionAI is a modular, agent-based platform for intelligent, automated decision-making. The platform is built around the Model Context Protocol (MCP), which orchestrates the flow from business intent to real-time, production-grade optimization endpoints.

---

## Key Components

- **Console (Authoring):**
  - Interactive, LLM/agent-powered workflow for intent interpretation, data prep, model building, and validation.
  - Users build, validate, and deploy MCPs via a stepwise UI.

- **Services (Serving):**
  - Hosts deployed, versioned MCP endpoints for real-time optimization/decisioning with new data.
  - Provides scalable, production-grade APIs for inference, monitoring, and management.

- **Agents:**
  - Modular services responsible for specific protocol steps (intent, data, model, solve, explain, deploy).

- **MCP Registry:**
  - Stores all MCPs, their versions, metadata, and deployment status.

- **API Gateway:**
  - Unified entry point for all API requests (authoring, deployment, serving).

---

## Authoring vs. Serving

| Phase      | Purpose                                   | Main Actors         | Typical Actions                                 |
|------------|-------------------------------------------|---------------------|-------------------------------------------------|
| Authoring  | Build, validate, and deploy MCPs          | Console, LLM/Agents | Intent, data prep, model, preview, deploy        |
| Serving    | Real-time optimization with new data      | Services, API       | POST new data, get solution/explanation          |

---

## System Flow

1. **Authoring (Console):**
   - User provides business intent.
   - LLM/agents interpret, map data, build model, validate constraints.
   - User previews and solves the MCP.
   - User deploys the MCP as a versioned endpoint.

2. **Serving (Services):**
   - Customers POST new data to the deployed endpoint.
   - The endpoint loads the MCP, injects the new data, and runs the solve/explain steps.
   - Returns results in real time.

---

## Updated Architecture Diagram

```
[User/Customer]
     |
     v
[Console (Authoring)] --(Deploy MCP)--> [MCP Registry/Services]
     |                                         |
     |                                         v
     |<-------------------[API Gateway]--------|
     |                                         |
     v                                         v
[Deployed MCP Endpoint] <---(POST new data)--- [Customer]
```

---

## Component Roles (in Both Phases)

- **Intent Interpreter Agent:**
  - Authoring: Interprets business problem, selects model template.
  - Serving: Skipped (intent already encoded in MCP).

- **Data Agents:**
  - Authoring: Data mapping, validation, enrichment.
  - Serving: Skipped (data schema already defined; new data injected).

- **Model Building & Solving Agents:**
  - Authoring: Build and validate model, solve with sample data.
  - Serving: Solve with new data, return solution/explanation.

- **Process Automation Agent:**
  - Authoring: Deploys MCP as endpoint, manages versioning.
  - Serving: Handles endpoint lifecycle, monitoring, and scaling.

---

## Reference
- See [MCP Deployment & Serving](../mcp/deployment.md) for the full deployment/serving design and API contract.
- See [MCP Protocol](./mcp/protocol.md) for protocol details and best practices.

---

## Summary

DcisionAI's architecture enables:
- Rapid, LLM/agent-powered authoring of optimization workflows.
- Seamless deployment of MCPs as production endpoints.
- Real-time, scalable serving of optimization/decisioning with new data.
- Full auditability, versioning, and extensibility for enterprise use.

## Related Documents

- [MCP Protocol Specification](./mcp/protocol.md)
- [Agent System Architecture](./mcp/agents.md)
- [API Documentation](./api/README.md)
- [Deployment Guide](./deployment/README.md) 