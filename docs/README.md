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

--- 