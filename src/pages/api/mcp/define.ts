import { NextApiRequest, NextApiResponse } from 'next';
import { MCP as CoreMCP, MCPStatus, ProblemType, IndustryVertical } from '@server/mcp/types/core';
import { ModelDefinitionAgent } from '../../../../server/mcp/agents/ModelDefinitionAgent';
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
    const { userInput } = req.body;
    // Build a minimal MCP instance for model definition
    const mcp: CoreMCP = {
      sessionId: `def-${Date.now()}`,
      version: '1.0.0',
      status: 'pending' as MCPStatus,
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      model: {
        variables: [],
        constraints: [],
        objective: { type: 'minimize', field: '', description: '', weight: 1 }
      },
      context: {
        environment: {},
        dataset: {
          internalSources: [],
          metadata: { userInput }
        },
        problemType: 'custom' as ProblemType,
        industry: 'logistics' as IndustryVertical
      },
      protocol: {
        steps: [
          { id: 'define_model', action: 'define_model', description: 'Define model structure', required: true }
        ],
        allowPartialSolutions: false,
        explainabilityEnabled: false,
        humanInTheLoop: { required: false, approvalSteps: [] }
      }
    };
    // Initialize LLM service
    const providerType = (process.env.LLM_PROVIDER as 'anthropic'|'openai') || 'anthropic';
    const apiKey = providerType === 'anthropic'
      ? process.env.ANTHROPIC_API_KEY!
      : process.env.OPENAI_API_KEY!;
    const llmService = new LLMServiceImpl(providerType, apiKey);
    // Run the ModelDefinitionAgent
    const agent = new ModelDefinitionAgent();
    const result = await agent.run(
      { id: 'define_model', action: 'define_model', description: 'Define model structure', required: true },
      mcp,
      { llm: llmService }
    );
    return res.status(200).json(result);
  } catch (error) {
    console.error('ModelDefinitionAgent error:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
}