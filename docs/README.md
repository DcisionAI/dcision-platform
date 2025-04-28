# DcisionAI Documentation

Welcome to the DcisionAI documentation. This repository contains comprehensive documentation for the DcisionAI platform, including architecture, implementation details, and usage guides.

## Documentation Structure

### Architecture Documentation

1. [Architecture Overview](./architecture/overview.md)
   - High-level system architecture
   - Component interactions
   - System design principles

2. [Model Context Protocol (MCP)](./architecture/mcp/protocol.md)
   - Protocol specification
   - Implementation details
   - Best practices

3. [Agent System](./architecture/mcp/agents.md)
   - Agent architecture
   - Agent types
   - Communication patterns

### Implementation Guides

1. [Getting Started](./implementation/getting-started.md)
   - Installation
   - Configuration
   - First steps

2. [Development Guide](./implementation/development.md)
   - Development environment
   - Coding standards
   - Testing guidelines

3. [Deployment Guide](./implementation/deployment.md)
   - Deployment process
   - Configuration management
   - Monitoring setup

### API Documentation

1. [REST API](./api/rest.md)
   - API endpoints
   - Authentication
   - Error handling

2. [WebSocket API](./api/websocket.md)
   - Real-time communication
   - Event types
   - Connection management

### User Guides

1. [User Manual](./user/manual.md)
   - Platform features
   - Usage instructions
   - Best practices

2. [Tutorials](./user/tutorials.md)
   - Step-by-step guides
   - Example problems
   - Solution walkthroughs

## Contributing

We welcome contributions to our documentation. Please see our [Contributing Guide](./CONTRIBUTING.md) for details on how to contribute.

## Support

For support, please:
1. Check our [FAQ](./support/faq.md)
2. Review our [Troubleshooting Guide](./support/troubleshooting.md)
3. Contact our support team at support@dcisionai.com

## License

This documentation is licensed under the [MIT License](./LICENSE).

# What is DcisionAI?

DcisionAI is an enterprise-grade platform for intelligent, automated decision-making. It leverages a modular, agent-based architecture orchestrated by the Model Context Protocol (MCP). Each agent is responsible for a specific stage in the optimization workflow, enabling flexible, scalable, and explainable automation.

## Agent Orchestration with MCP

### Agent Roles and Responsibilities

**1. Intent Interpreter Agent**
- First in the pipeline.
- Receives conversational or API input from the user.
- Understands and decomposes the business problem.
- Selects the appropriate optimization model/template.
- Sets up the context for downstream agents.

**2. Data Agents**
- Data preparation and validation.
- Identify required data sources.
- Validate and preprocess data.
- Enrich data as needed for the selected optimization model.

**3. Model Building & Solving Agents**
- Core optimization logic.
- Build the mathematical or ML model based on the selected template and data.
- Validate model constraints and structure.
- Solve the optimization problem using the appropriate solver or algorithm.

**4. Solution Review/Explanation Agents**
- Human-in-the-loop and explainability.
- Review the generated solution for business or operational feasibility.
- Provide explanations, justifications, or visualizations of the solution.
- Collect feedback or approval from human users if required.

**5. Process Automation Agent**
- Productionalization and operationalization.
- Deploy the validated workflow as a live, repeatable API endpoint.
- Enable scheduling (e.g., daily runs, event-driven triggers).
- Support dynamic re-execution (e.g., when new data or events occur).
- Monitor, version, and manage access to the deployed workflow.

### MCP Orchestration Flow

1. User Input  
   → Intent Interpreter Agent  
   → Data Agents  
   → Model Building & Solving Agents  
   → Solution Review/Explanation Agents  
   → Process Automation Agent  
   → Live, Repeatable Solution

Each step is defined as a protocol action in the MCP, with clear hand-offs between agents. The MCP ensures that the workflow is transparent, auditable, and extensible.

#### Example MCP Protocol Steps

```json
[
  {
    "action": "interpret_intent",
    "agent": "Intent Interpreter Agent",
    "description": "Analyze user input, identify the business problem, and select the appropriate optimization template.",
    "required": true
  },
  {
    "action": "collect_data",
    "agent": "Data Agent",
    "description": "Identify and validate required data sources.",
    "required": true
  },
  {
    "action": "build_model",
    "agent": "Model Building Agent",
    "description": "Construct and validate the optimization model.",
    "required": true
  },
  {
    "action": "solve_model",
    "agent": "Solving Agent",
    "description": "Solve the optimization problem.",
    "required": true
  },
  {
    "action": "explain_solution",
    "agent": "Solution Review Agent",
    "description": "Explain and review the solution.",
    "required": false
  },
  {
    "action": "productionalize_workflow",
    "agent": "Process Automation Agent",
    "description": "Deploy the workflow as a live endpoint and enable scheduling.",
    "required": true
  }
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