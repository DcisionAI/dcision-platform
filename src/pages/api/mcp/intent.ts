import type { NextApiRequest, NextApiResponse } from 'next';
import { IntentInterpreterAgent } from '@server/mcp/agents/IntentInterpreterAgent';
import { MCP } from '@server/mcp/types';
import { callOpenAI } from '../../../../server/mcp/agents/llm/openai';

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

    const result = await agent.run(
      { action: 'interpret_intent', description: 'Interpret user intent', required: true },
      mcp,
      { llm: callOpenAI }
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error('Intent interpretation error:', error);
    return res.status(500).json({
      error: 'Failed to interpret intent',
      details: error instanceof Error ? error.message : String(error)
    });
  }
} 