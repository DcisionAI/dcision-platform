import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { DataIntegrationAgent } from '../../../../server/mcp/agents/DataIntegrationAgent';
import { MCP, Dataset, ProtocolStep, Environment } from '../../../../server/mcp/types';
import { LLMProviderFactory } from '../../../../server/mcp/agents/llm/providers/LLMProviderFactory';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId, problemType, userInput } = req.body;

    // Create MCP context
    const mcp: MCP = {
      sessionId: sessionId,
      version: '1.0.0',
      status: 'running',
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      model: {
        variables: [],
        constraints: [],
        objective: {
          type: 'minimize',
          field: 'total_cost',
          description: 'Minimize total cost',
          weight: 1
        }
      },
      context: {
        environment: {
          resources: {
            supabase: {
              url: supabaseUrl,
              key: supabaseKey
            }
          }
        } as Environment,
        dataset: {
          internalSources: ['supabase'],
          requiredFields: [],
          metadata: {
            userInput,
            problemType,
            confidence: 1.0
          }
        } as Dataset,
        problemType,
        industry: 'custom'
      },
      protocol: {
        steps: [],
        allowPartialSolutions: true,
        explainabilityEnabled: true,
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

    // Initialize and run DataIntegrationAgent
    const agent = new DataIntegrationAgent();
    const result = await agent.run(
      {
        action: 'collect_data',
        description: 'Collect and integrate data from Supabase',
        required: true,
        parameters: {
          dataSource: {
            type: 'supabase',
            connection: {
              host: supabaseUrl,
              port: 443,
              database: 'postgres'
            },
            authentication: {
              username: 'postgres',
              password: supabaseKey
            }
          }
        }
      } as ProtocolStep,
      mcp,
      {
        llm: async (prompt: string) => {
          return await llmProvider.call(prompt, {
            model: providerType === 'anthropic' ? 'claude-3-opus-20240229' : 'gpt-4-turbo-preview',
            temperature: 0.2
          });
        }
      }
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error('Data integration error:', error);
    return res.status(500).json({ 
      error: 'Data integration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 