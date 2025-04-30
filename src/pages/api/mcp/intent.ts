import type { NextApiRequest, NextApiResponse } from 'next';
import { IntentInterpreterAgent } from '@server/mcp/agents/IntentInterpreterAgent';
import { MCP } from '@server/mcp/types';
import { LLMProviderFactory } from '@server/mcp/agents/llm/providers/LLMProviderFactory';

const agent = new IntentInterpreterAgent();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

    // Create LLM provider based on environment configuration
    const providerType = process.env.LLM_PROVIDER || 'anthropic';
    const apiKey = providerType === 'anthropic' 
      ? process.env.ANTHROPIC_API_KEY 
      : process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error(`API key is required for ${providerType} provider`);
    }

    const llmProvider = LLMProviderFactory.createProvider(providerType as 'openai' | 'anthropic', apiKey);
    
    const result = await agent.run(
      { action: 'interpret_intent', description: 'Interpret user intent', required: true },
      mcp,
      { llm: (prompt: string) => llmProvider.call(prompt) }
    );

    // Add provider information to the response
    const responseWithProvider = {
      ...result,
      provider: {
        type: providerType,
        model: providerType === 'anthropic' ? 'claude-3-opus-20240229' : 'gpt-4-turbo-preview'
      }
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