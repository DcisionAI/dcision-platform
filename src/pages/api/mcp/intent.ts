import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { MCP } from '../../../../server/mcp/types';
import { LLMProviderFactory } from '../../../../server/mcp/agents/llm/providers/LLMProviderFactory';
import { LLMService, LLMResponse } from '../../../../server/mcp/services/llm/LLMService';
import { IntentInterpreterAgent } from '../../../../server/mcp/agents/IntentInterpreterAgent';

class IntegrationLLMService implements LLMService {
  constructor(private llmProvider: any, private providerType: string) {}

  async generateConstraints(businessRules: string): Promise<{ constraints: string[], reasoning: string }> {
    throw new Error('Method not implemented.');
  }

  async validateModel(model: any, problemType: string): Promise<{ issues: string[], suggestions: string[] }> {
    throw new Error('Method not implemented.');
  }

  async interpretIntent(description: string): Promise<{ problemType: string, context: any }> {
    throw new Error('Method not implemented.');
  }

  async enrichData(data: any, context: any): Promise<{ enrichedData: any, reasoning: string }> {
    throw new Error('Method not implemented.');
  }

  async explainSolution(solution: any, problemType: string): Promise<{ explanation: string, insights: string[] }> {
    throw new Error('Method not implemented.');
  }

  async call(prompt: string, config?: any): Promise<LLMResponse> {
    const response = await this.llmProvider.call(prompt, {
      model: this.providerType === 'anthropic' ? 'claude-3-opus-20240229' : 'gpt-4-turbo-preview',
      temperature: 0.2,
      ...config
    });
    return {
      content: response
    };
  }
}

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
      { id: 'interpret_intent', action: 'interpret_intent', description: 'Interpret user intent', required: true },
      mcp,
      { llm: new IntegrationLLMService(llmProvider, providerType) }
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