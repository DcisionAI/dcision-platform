import { MCPBuilder } from '@/mcp/builder/MCPBuilder';
import { MCP, Variable, Constraint, Objective, Step, StepAction } from '@/mcp/MCPTypes';

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
  const builder = MCPBuilder.create(sessionId);

  // Add variables
  if (modelDef?.variables) {
    modelDef.variables.forEach((v: Variable) => {
      builder.addVariable(v.name, v.type || 'number', {
        description: v.description,
        default: v.default,
        required: v.required,
      });
    });
  }

  // Ensure at least one protocol step is present
  const stepsToUse = protocolSteps && protocolSteps.length > 0
    ? protocolSteps
    : [
        {
          id: 'default_step',
          action: 'collect_data' as StepAction,
          description: 'Default protocol step',
          required: true,
        }
      ];

  // Add protocol steps
  stepsToUse.forEach((step: Step) => {
    builder.addStep(step.id, step.action, {
      description: step.description,
      required: step.required,
      config: step.config,
    });
  });

  // Build the MCP object
  const mcp = builder.build();

  // Set constraints and objective directly (MCPBuilder does not have addConstraint/addObjective)
  if (modelDef?.constraints) {
    mcp.model.constraints = modelDef.constraints as Constraint[];
  }
  if (modelDef?.objective) {
    mcp.model.objective = modelDef.objective as Objective;
  }

  // Set context fields
  mcp.context.environment = environment;
  // --- DATASET FIELD MAPPING FOR SOLVER COMPATIBILITY ---
  let finalDataset = (modelDef && modelDef.dataset) ? modelDef.dataset : (dataset || { internalSources: [] });
  if (finalDataset) {
    // Map delivery_requests -> tasks
    if (finalDataset.delivery_requests && !finalDataset.tasks) {
      finalDataset.tasks = finalDataset.delivery_requests;
      delete finalDataset.delivery_requests;
    }
    // Synthesize a simple distance_matrix if missing and locations exist
    if (!finalDataset.distance_matrix && Array.isArray(finalDataset.locations)) {
      const n = finalDataset.locations.length;
      finalDataset.distance_matrix = Array.from({ length: n }, (_, i) =>
        Array.from({ length: n }, (_, j) => (i === j ? 0 : Math.floor(Math.random() * 20) + 1))
      );
    }
  }
  mcp.context.dataset = finalDataset;
  mcp.context.problemType = intent?.problemType || 'vehicle_routing';
  mcp.context.industry = industry;

  // Set version and status
  mcp.version = version;
  mcp.status = status as any;

  // --- CONSTRAINTS ARRAY TO DICTIONARY ---
  if (Array.isArray(mcp.model.constraints)) {
    const constraintsDict: any = {};
    mcp.model.constraints.forEach((c: any) => {
      if (c.name) constraintsDict[c.name] = c;
    });
    mcp.model.constraints = constraintsDict;
  }

  // Optionally, add enrichedData or other metadata if needed
  // If you want to store enrichedData, you could serialize it under an allowed key, or omit for now to avoid type errors.
  // Example (uncomment if needed):
  // if (enrichedData) {
  //   mcp.metadata = { ...mcp.metadata, solver: JSON.stringify(enrichedData) };
  // }

  return mcp;
} 