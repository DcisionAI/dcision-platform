import { MCP, Variable, Constraint, Objective, Step, StepAction } from '../../pages/api/_lib/mcp/MCPTypes';

interface AssembleMCPParams {
  sessionId: string;
  intent: any;
  enrichedData: any;
  modelDef: any;
  environment: any;
  dataset: any;
  protocolSteps: Step[];
  industry?: string;
  version?: string;
  status?: string;
}

export function assembleMCP({
  sessionId,
  intent,
  enrichedData,
  modelDef,
  environment,
  dataset,
  protocolSteps,
  industry = 'logistics',
  version = '1.0.0',
  status = 'pending',
}: AssembleMCPParams): MCP {
  // --- FLAT MODEL ARRAYS ---
  const variables = Array.isArray(modelDef?.variables) ? modelDef.variables : [];
  const constraints = Array.isArray(modelDef?.constraints) ? modelDef.constraints : [];
  const objective = modelDef?.objective || { type: 'minimize', field: '', description: '', weight: 1 };

  // --- MINIMAL CONTEXT ---
  let finalDataset = (modelDef && modelDef.dataset) ? modelDef.dataset : (dataset || { internalSources: [] });
  if (finalDataset) {
    if (finalDataset.delivery_requests && !finalDataset.tasks) {
      finalDataset.tasks = finalDataset.delivery_requests;
      delete finalDataset.delivery_requests;
    }
    if (!finalDataset.distance_matrix && Array.isArray(finalDataset.locations)) {
      const n = finalDataset.locations.length;
      finalDataset.distance_matrix = Array.from({ length: n }, (_, i) =>
        Array.from({ length: n }, (_, j) => (i === j ? 0 : Math.floor(Math.random() * 20) + 1))
      );
    }
    if (!finalDataset.vehicles) {
      finalDataset.vehicles = [
        { id: 1, capacity: 100, start_location: 0, end_location: 0, max_route_time_hours: 8 }
      ];
    }
    if (!finalDataset.locations) {
      finalDataset.locations = [
        { id: 0, name: 'Depot', lat: 0, lon: 0 },
        { id: 1, name: 'Customer', lat: 1, lon: 1 }
      ];
    }
    if (!finalDataset.tasks) {
      finalDataset.tasks = [
        { id: 'task_1', location_id: 1, demand: 10, time_window_start: 0, time_window_end: 24 }
      ];
    }
    if (!finalDataset.distance_matrix) {
      finalDataset.distance_matrix = [ [0, 1], [1, 0] ];
    }
  }

  // --- MINIMAL PROTOCOL ---
  const stepsToUse = protocolSteps && protocolSteps.length > 0
    ? protocolSteps
    : [
        {
          id: 'solve_step',
          action: 'solve_model' as StepAction,
          description: 'Solve the optimization model',
          required: true,
        }
      ];

  // --- ASSEMBLE MCP ---
  let model: any;
  if ((intent?.problemType || '').toLowerCase() === 'vehicle_routing') {
    // For vehicle routing, build a domain-specific model object
    model = {
      vehicles: finalDataset.vehicles || [],
      locations: finalDataset.locations || [],
      tasks: finalDataset.tasks || [],
      distance_matrix: finalDataset.distance_matrix || [],
      constraints: finalDataset.constraints || {}
    };
  } else {
    // For other problems, use the generic structure
    model = {
      variables,
      constraints,
      objective,
    };
  }

  const mcp: MCP = {
    id: sessionId,
    sessionId,
    version,
    created: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    status: status as any,
    model,
    context: {
      problemType: intent?.problemType || 'vehicle_routing',
      industry,
      environment: environment || { region: 'local', timezone: 'UTC' },
      dataset: finalDataset,
    },
    protocol: {
      steps: stepsToUse.map((step, idx) => ({
        id: step.id || `step_${idx}`,
        action: step.action,
        description: step.description || 'Protocol step',
        required: step.required,
        config: step.config
      })),
    },
  };

  return mcp;
} 