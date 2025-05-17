import type { NextApiRequest, NextApiResponse } from 'next';
import { AgentRegistry } from '../../../../server/mcp/agents';
import { LLMServiceFactory } from '../../../../server/mcp/services/llm/LLMServiceFactory';
import type { MCP } from '../../../../server/mcp/types/core';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { enrichedData, intentInterpretation, problemType, dataMapping } = req.body;
  if (!enrichedData || !intentInterpretation) {
    return res.status(400).json({ error: 'Missing enrichedData or intentInterpretation' });
  }
  try {
    const agentRegistry = AgentRegistry.getInstance();
    // Get the ModelDefinitionAgent by type
    const modelDefAgent = agentRegistry.getAgentsByType('model_definition')[0];
    if (!modelDefAgent) {
      return res.status(500).json({ error: 'ModelDefinitionAgent not found' });
    }
    const llm = LLMServiceFactory.getInstance();
    const now = new Date().toISOString();
    // Attach dataMapping to dataset metadata if present
    let datasetWithMapping = { ...enrichedData };
    if (dataMapping) {
      datasetWithMapping.metadata = { ...(enrichedData.metadata || {}), ...dataMapping };
    }
    const mcp: MCP = {
      sessionId: 'api-model-define',
      version: '1.0',
      status: 'pending',
      created: now,
      lastModified: now,
      model: {
        variables: [],
        constraints: [],
        objective: { type: 'minimize', field: '', description: '', weight: 1 },
      },
      context: {
        environment: {},
        dataset: datasetWithMapping,
        problemType: problemType || enrichedData?.metadata?.problemType || 'vehicle_routing',
      },
      protocol: {
        steps: [],
        allowPartialSolutions: false,
        explainabilityEnabled: false,
        humanInTheLoop: { required: false, approvalSteps: [] },
      },
    };
    const step = {
      id: 'define_model',
      action: 'define_model',
      description: 'Define the optimization model',
      required: true
    };
    const context = { llm };
    const result = await modelDefAgent.run(step, mcp, context);
    console.log('[ModelDefinitionAgent] LLM prompt:', result.prompt);
    return res.status(200).json({ output: result.output, thoughtProcess: result.thoughtProcess, prompt: result.prompt });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to generate model definition' });
  }
} 