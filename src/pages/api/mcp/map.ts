import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { MCP as CoreMCP, MCPStatus, ProblemType, IndustryVertical, Protocol } from '@server/mcp/types/core';
import { DataMappingAgent } from '@server/mcp/agents/DataMappingAgent';
import { LLMServiceImpl } from '@server/mcp/services/llm/LLMService';

export const config = {
  api: {
    bodyParser: true
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    // Accept optional inputs from the client for data mapping context
    const {
      sessionId,
      userInput,
      intentDetails,
      requiredFields,
      databaseFields,
      tablesToScan,
      problemType: reqProblemType
    } = req.body;
    const problemType = reqProblemType
      || intentDetails?.output?.problemType
      || intentDetails?.selectedModel
      || 'vehicle_routing';

    // Build a minimal MCP instance
    const mcp: CoreMCP = {
      sessionId: sessionId || `mcp-${Date.now()}`,
      version: '1.0.0',
      status: 'pending' as MCPStatus,
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      model: {
        variables: [],
        constraints: [],
        // Objective must match the CoreMCP Objective interface
        objective: { type: 'minimize', field: '', description: '', weight: 1 }
      },
      context: {
        environment: { region: 'us-east-1', timezone: 'UTC' },
        dataset: {
          internalSources: [],
          requiredFields: Array.isArray(requiredFields) ? requiredFields : [],
          metadata: {
            userInput,
            intentDetails,
            databaseFields: Array.isArray(databaseFields) ? databaseFields : [],
            tablesToScan: Array.isArray(tablesToScan) ? tablesToScan : []
          }
        },
        problemType: problemType as ProblemType,
        industry: 'logistics' as IndustryVertical
      },
      protocol: {
        steps: [ { id: 'map_data', action: 'collect_data', description: 'Field mapping', required: true } ],
        allowPartialSolutions: false,
        explainabilityEnabled: true,
        humanInTheLoop: { required: false, approvalSteps: [] }
      }
    };

    // Initialize LLM service
    const providerType = (process.env.LLM_PROVIDER as 'anthropic'|'openai') || 'anthropic';
    const apiKey = providerType === 'anthropic'
      ? process.env.ANTHROPIC_API_KEY!
      : process.env.OPENAI_API_KEY!;
    const llmService = new LLMServiceImpl(providerType, apiKey);

    // Run the DataMappingAgent
    const agent = new DataMappingAgent();
    const result = await agent.run(
      { id: 'map_data', action: 'collect_data', description: 'Determine data mappings', required: true },
      mcp,
      { llm: llmService }
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error('DataMappingAgent error:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
}