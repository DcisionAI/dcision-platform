import { Configuration, DefaultApi, MCPConfig, MCPResponse } from './generated';

/**
 * Create a DcisionAI client for Decision Workflows.
 * @param apiKey - Your API key for authentication
 * @param baseUrl - Base URL for the MCP API (default: https://mcp.dcisionai.com)
 */
export function createClient(
  apiKey: string,
  baseUrl: string = 'https://mcp.dcisionai.com'
): DefaultApi {
  const config = new Configuration({
    basePath: baseUrl,
    apiKey: () => apiKey
  });
  return new DefaultApi(config);
}

/** Generic function to submit an MCP job */
/**
 * Internal: submit MCP config and return parsed response.
 * Throws on HTTP or network errors.
 */
async function submitMCP(
  apiKey: string,
  config: MCPConfig,
  baseUrl?: string
): Promise<MCPResponse> {
  const client = createClient(apiKey, baseUrl);
  try {
    const resp = await client.postMcpSubmit(config);
    return resp;
  } catch (err: any) {
    // Wrap and rethrow
    throw new Error(`MCP submission failed: ${err.message}`);
  }
}

// ==== Workflow wrappers ====
/**
 * Solve a labor scheduling problem.
 */
/** Solve labor scheduling problem. */
export async function solveLaborScheduling(
  apiKey: string,
  model: Record<string, any>,
  options?: { sessionId?: string; baseUrl?: string }
): Promise<MCPResponse> {
  const cfg: MCPConfig = {
    sessionId: options?.sessionId || `labor-scheduling-${Date.now()}`,
    protocol: { steps: [{ id: 'solve_step', action: 'solve_model', description: 'Solve labor scheduling', required: true }] },
    context: { problemType: 'labor_scheduling' },
    model: { problemType: 'labor_scheduling', ...model }
  };
  return submitMCP(apiKey, cfg, options?.baseUrl);
}

/**
 * Solve a resource (equipment) allocation problem.
 */
/** Solve resource allocation problem. */
export async function solveResourceAllocation(
  apiKey: string,
  model: Record<string, any>,
  options?: { sessionId?: string; baseUrl?: string }
): Promise<MCPResponse> {
  const cfg: MCPConfig = {
    sessionId: options?.sessionId || `equipment-allocation-${Date.now()}`,
    protocol: { steps: [{ id: 'solve_step', action: 'solve_model', description: 'Solve equipment allocation', required: true }] },
    context: { problemType: 'equipment_allocation' },
    model: { problemType: 'equipment_allocation', ...model }
  };
  return submitMCP(apiKey, cfg, options?.baseUrl);
}

/**
 * Solve a project scheduling / risk simulation problem.
 */
/** Solve project scheduling / risk simulation problem. */
export async function solveProjectScheduling(
  apiKey: string,
  model: Record<string, any>,
  options?: { sessionId?: string; baseUrl?: string }
): Promise<MCPResponse> {
  const cfg: MCPConfig = {
    sessionId: options?.sessionId || `project-scheduling-${Date.now()}`,
    protocol: { steps: [{ id: 'solve_step', action: 'solve_model', description: 'Run project risk simulation', required: true }] },
    context: { problemType: 'risk_simulation' },
    model: { problemType: 'risk_simulation', ...model }
  };
  return submitMCP(apiKey, cfg, options?.baseUrl);
}

/**
 * Solve a material delivery planning (VRPTW) problem.
 */
/** Solve material delivery planning (VRPTW) problem. */
export async function solveMaterialDeliveryPlanning(
  apiKey: string,
  model: Record<string, any>,
  options?: { sessionId?: string; baseUrl?: string }
): Promise<MCPResponse> {
  const cfg: MCPConfig = {
    sessionId: options?.sessionId || `material-delivery-${Date.now()}`,
    protocol: { steps: [{ id: 'solve_step', action: 'solve_model', description: 'Solve material delivery planning', required: true }] },
    context: { problemType: 'material_delivery_planning' },
    model: { problemType: 'material_delivery_planning', ...model }
  };
  return submitMCP(apiKey, cfg, options?.baseUrl);
}

/**
 * Solve a risk simulation problem.
 */
/** Solve risk simulation problem. */
export async function solveRiskSimulation(
  apiKey: string,
  model: Record<string, any>,
  options?: { sessionId?: string; baseUrl?: string }
): Promise<MCPResponse> {
  const cfg: MCPConfig = {
    sessionId: options?.sessionId || `risk-simulation-${Date.now()}`,
    protocol: { steps: [{ id: 'solve_step', action: 'solve_model', description: 'Run risk simulation', required: true }] },
    context: { problemType: 'risk_simulation' },
    model: { problemType: 'risk_simulation', ...model }
  };
  return submitMCP(apiKey, cfg, options?.baseUrl);
}