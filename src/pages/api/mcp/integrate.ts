import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { DataIntegrationAgent } from '../../../../server/mcp/agents/DataIntegrationAgent';
import { MCP, Dataset, ProtocolStep, Environment } from '../../../../server/mcp/types';
import { callOpenAI } from '../../../../server/mcp/agents/llm/openai';

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
          // Use OpenAI for LLM calls
          return await callOpenAI(prompt, {
            model: 'gpt-4-turbo-preview',
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