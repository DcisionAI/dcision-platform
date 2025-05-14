# MCP Usage Examples

## Overview

This section provides practical, production-ready examples of how to define, deploy, and invoke optimization problems using the Model Context Protocol (MCP) on the DcisionAI platform.

---

## Authoring vs. Serving
- **Authoring:** Build and validate a full MCP (model, context, protocol) using the console and LLM/agent-powered workflow.
- **Serving:** Deploy the MCP as a versioned endpoint and call it with new data for real-time optimization/decisioning.

See [MCP Deployment & Serving](../deployment.md) for full details.

---

## Example 1: Vehicle Routing Problem (VRP) — Full MCP

### Problem Statement
Assign a fleet of vehicles to deliver goods to customers while minimizing total distance.

### Full MCP (Authoring/Deployment)
```json
{
  "sessionId": "vrp-demo-001",
  "version": "1.0.0",
  "status": "pending",
  "created": "2024-06-01T12:00:00Z",
  "lastModified": "2024-06-01T12:00:00Z",
  "model": {
    "variables": [
      {
        "name": "route_assignment",
        "type": "binary",
        "dimensions": ["vehicle", "customer"],
        "description": "1 if vehicle is assigned to customer, 0 otherwise."
      }
    ],
    "constraints": [
      {
        "type": "mathematical",
        "expression": "sum(route_assignment[v,c] for v in vehicles) == 1",
        "operator": "eq",
        "rhs": 1,
        "description": "Each customer is visited exactly once."
      }
    ],
    "objective": {
      "type": "minimize",
      "field": "total_distance",
      "description": "Minimize total distance traveled."
    }
  },
  "context": {
    "problemType": "vehicle_routing",
    "industry": "logistics",
    "environment": { "region": "us-east-1", "timezone": "UTC" },
    "dataset": { "internalSources": ["vehicles", "customers"] }
  },
  "protocol": {
    "steps": [
      { "id": "collect_data", "action": "collect_data", "description": "Collect vehicle and customer data.", "required": true },
      { "id": "build_model", "action": "build_model", "description": "Build VRP model.", "required": true },
      { "id": "solve_model", "action": "solve_model", "description": "Solve the VRP.", "required": true },
      { "id": "explain_solution", "action": "explain_solution", "description": "Explain the solution.", "required": false }
    ],
    "allowPartialSolutions": true,
    "explainabilityEnabled": true
  }
}
```

---

## Example 2: Deployed MCP — Real-Time Serving

### Endpoint URL
```
POST /api/mcp/execute/vrp-demo-001-v1
```

### Request Body (New Data)
```json
{
  "dataset": {
    "vehicles": [ ... ],
    "customers": [ ... ]
  },
  "environment": {
    "region": "us-east-1",
    "timezone": "UTC"
  }
}
```

### Response
```json
{
  "success": true,
  "solution": { /* assignment, routes, cost, etc. */ },
  "explanation": { /* key insights, constraint satisfaction, etc. */ },
  "metrics": { "total_distance": 123.4 },
  "warnings": [],
  "errors": []
}
```

---

## Example 3: Nurse Scheduling (Full MCP)

```json
{
  "sessionId": "nurse-schedule-001",
  "version": "1.0.0",
  "status": "pending",
  "created": "2024-06-01T12:00:00Z",
  "lastModified": "2024-06-01T12:00:00Z",
  "model": {
    "variables": [
      { "name": "nurse_shift_assignment", "type": "binary", "dimensions": ["nurse", "shift"], "description": "1 if nurse assigned to shift, 0 otherwise." }
    ],
    "constraints": [
      { "type": "mathematical", "expression": "sum(nurse_shift_assignment[n,s] for s in shifts) <= max_shifts_per_nurse", "operator": "lte", "rhs": 5, "description": "Max shifts per nurse." }
    ],
    "objective": { "type": "maximize", "field": "total_coverage", "description": "Maximize shift coverage." }
  },
  "context": {
    "problemType": "nurse_scheduling",
    "industry": "healthcare",
    "environment": { "region": "us-east-1", "timezone": "UTC" },
    "dataset": { "internalSources": ["nurses", "shifts"] }
  },
  "protocol": {
    "steps": [
      { "id": "collect_data", "action": "collect_data", "description": "Collect nurse and shift data.", "required": true },
      { "id": "build_model", "action": "build_model", "description": "Build scheduling model.", "required": true },
      { "id": "solve_model", "action": "solve_model", "description": "Solve the schedule.", "required": true },
      { "id": "explain_solution", "action": "explain_solution", "description": "Explain the schedule.", "required": false }
    ],
    "allowPartialSolutions": true,
    "explainabilityEnabled": true
  }
}
```

---

## Best Practices for MCP Construction
- Always include full context, model, and protocol sections.
- Use clear, descriptive names and documentation for variables, constraints, and objectives.
- Version and document each MCP for auditability and reproducibility.
- For deployed MCPs, ensure the protocol steps match the serving workflow (no LLM/agent steps).

---

For more advanced examples, see the [API Reference](../../api/README.md) and [Interface Definitions](../interfaces.md). 