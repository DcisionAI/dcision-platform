# DcisionAI Documentation

Welcome to the DcisionAI documentation. This repository contains comprehensive documentation for the DcisionAI platform, including architecture, implementation details, and usage guides.

## Quick Links
- [Architecture Overview](./architecture/overview.md)
- [MCP Protocol & Deployment](./mcp/protocol.md)
- [MCP Deployment & Serving](./mcp/deployment.md)
- [API Reference](./api/README.md)
- [Onboarding](./onboarding/README.md)
- [Platform Features](./platform/agenticai-workflow.md)
- [MCP Examples](./mcp/examples/README.md)

## What's New
- **MCP Deployment & Real-Time Serving:**
  - You can now deploy a validated MCP as a production endpoint and call it with new data for instant optimization/decisioning. See [MCP Deployment & Serving](./mcp/deployment.md).
  - The platform now clearly separates the authoring (interactive, LLM/agent-powered) and serving (real-time, production) phases.

## Documentation Structure

### Architecture Documentation
- [Architecture Overview](./architecture/overview.md): High-level system architecture, component interactions, and design principles.
- [Model Context Protocol (MCP)](./architecture/mcp/protocol.md): Protocol specification, implementation details, and best practices.
- [Agent System](./architecture/mcp/agents.md): Agent architecture, types, and communication patterns.

### Implementation Guides
- [Getting Started](./onboarding/environment-setup.md)
- [Development Guide](./onboarding/codebase-overview.md)
- [Deployment Guide](./mcp/deployment.md)

### API Documentation
- [REST API](./api/README.md)
- [Deployed MCP Endpoint API](./mcp/deployment.md)

### User Guides
- [User Manual](./platform/agenticai-workflow.md)
- [Tutorials](./onboarding/examples/portfolio-management.md)

## Contributing
We welcome contributions to our documentation. Please see our [Contributing Guide](../CONTRIBUTING.md) for details on how to contribute.

## Support
For support, please:
1. Check our [FAQ](./support/faq.md)
2. Review our [Troubleshooting Guide](./support/troubleshooting.md)
3. Contact our support team at support@dcisionai.com

## License
This documentation is licensed under the [MIT License](./LICENSE).

# What is DcisionAI?

DcisionAI is an enterprise-grade platform for intelligent, automated decision-making. It leverages a modular, agent-based architecture orchestrated by the Model Context Protocol (MCP). Each agent is responsible for a specific stage in the optimization workflow, enabling flexible, scalable, and explainable automation.

## Authoring vs. Serving
- **Authoring (Console):** Interactive, LLM/agent-powered workflow for intent interpretation, data prep, model building, and validation.
- **Serving (Services):** Deployed, versioned MCP endpoints for real-time optimization/decisioning with new data.

## Agent Orchestration with MCP

### Agent Roles and Responsibilities

1. **Intent Interpreter Agent**: Understands and decomposes the business problem.
2. **Data Agents**: Data preparation, validation, and enrichment.
3. **Model Building & Solving Agents**: Build and solve the optimization model.
4. **Solution Review/Explanation Agents**: Human-in-the-loop and explainability.
5. **Process Automation Agent**: Deploys the validated workflow as a live, repeatable API endpoint.

### MCP Orchestration Flow
1. User Input → Intent Interpreter Agent → Data Agents → Model Building & Solving Agents → Solution Review/Explanation Agents → Process Automation Agent → Live, Repeatable Solution

Each step is defined as a protocol action in the MCP, with clear hand-offs between agents. The MCP ensures that the workflow is transparent, auditable, and extensible.

### Example MCP Protocol Steps
```json
[
  { "action": "interpret_intent", "agent": "Intent Interpreter Agent", "description": "Analyze user input, identify the business problem, and select the appropriate optimization template.", "required": true },
  { "action": "collect_data", "agent": "Data Agent", "description": "Identify and validate required data sources.", "required": true },
  { "action": "build_model", "agent": "Model Building Agent", "description": "Construct and validate the optimization model.", "required": true },
  { "action": "solve_model", "agent": "Solving Agent", "description": "Solve the optimization problem.", "required": true },
  { "action": "explain_solution", "agent": "Solution Review Agent", "description": "Explain and review the solution.", "required": false },
  { "action": "productionalize_workflow", "agent": "Process Automation Agent", "description": "Deploy the workflow as a live endpoint and enable scheduling.", "required": true }
]
```

### Benefits of Agent-Based MCP Orchestration
- **Modularity:** Each agent can be developed, tested, and improved independently.
- **Transparency:** Every step is explicit and auditable.
- **Extensibility:** New agents can be added for new capabilities (e.g., compliance, advanced analytics).
- **Enterprise-Readiness:** Supports production deployment, monitoring, and dynamic re-execution.

## Pinecone Integration
DcisionAI uses Pinecone as a vector database for storing and searching documentation embeddings.

### Upserting Documentation to Pinecone
To (re)ingest your documentation into Pinecone, use the upsert script. For best compatibility, use a separate TypeScript config for scripts:

1. Create a `tsconfig.scripts.json` in your project root:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "commonjs"
  },
  "include": ["scripts/**/*.ts"]
}
```

2. Run the upsert script with:

```sh
npx ts-node --project tsconfig.scripts.json scripts/upsertDocsToPinecone.ts
```

This will delete all vectors in your Pinecone namespace and upsert your documentation in section-based chunks.

See the script in `scripts/upsertDocsToPinecone.ts` for details.

--- 