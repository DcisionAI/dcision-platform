import { NextApiRequest, NextApiResponse } from 'next';
import { MCP } from '../../../../server/mcp/types';
import { IntentInterpreterAgent } from '../../../../server/mcp/agents/IntentInterpreterAgent';
import { validateApiKey } from '@/utils/validateApiKey';

// Use the core LLMServiceImpl for intent interpretation
import { LLMServiceImpl } from '@server/mcp/services/llm/LLMService';

const agent = new IntentInterpreterAgent();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  if (!apiKey || !(await validateApiKey(apiKey))) {
    return res.status(401).json({ error: 'Invalid or missing API key' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userInput } = req.body;
    
    // Create a minimal MCP for intent interpretation
    const mcp: MCP = {
      sessionId: 'temp-' + Date.now(),
      version: '1.0',
      status: 'pending',
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      model: {
        variables: [],
        constraints: [],
        objective: {
          type: 'minimize',
          field: 'cost',
          description: 'Default objective',
          weight: 1
        }
      },
      context: {
        environment: {},
        dataset: {
          internalSources: [],
          metadata: {
            userInput
          }
        },
        problemType: 'custom'
      },
      protocol: {
        steps: [
          {
            id: 'interpret_intent',
            action: 'interpret_intent',
            description: 'Interpret user intent',
            required: true
          }
        ],
        allowPartialSolutions: false,
        explainabilityEnabled: false,
        humanInTheLoop: {
          required: false,
          approvalSteps: []
        }
      }
    };

    // Initialize LLM service for enhanced intent interpretation
    const providerType = (process.env.LLM_PROVIDER as 'anthropic' | 'openai') || 'anthropic';
    const apiKey = providerType === 'anthropic'
      ? process.env.ANTHROPIC_API_KEY
      : process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(`API key is required for ${providerType} provider`);
    }
    // Use the core LLMServiceImpl which implements interpretIntent
    const llmService = new LLMServiceImpl(providerType, apiKey);
    const result = await agent.run(
      { id: 'interpret_intent', action: 'interpret_intent', description: 'Interpret user intent', required: true },
      mcp,
      { llm: llmService }
    );

    // Add provider information to the response
    const responseWithProvider = {
      ...result,
      provider: {
        type: providerType,
        model: providerType === 'anthropic' ? 'claude-3-opus-20240229' : 'gpt-4.1-nano'
      },
      problemType: result.output.problemType
    };

    return res.status(200).json(responseWithProvider);
  } catch (error) {
    console.error('Intent interpretation error:', error);
    return res.status(500).json({
      error: 'Failed to interpret intent',
      details: error instanceof Error ? error.message : String(error)
    });
  }
} 