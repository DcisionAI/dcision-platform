// Agno-based Model Builder Agent for DcisionAI
// Leverages Agno's knowledge and reasoning

import { Agent, UrlKnowledge, OpenAIEmbedder, SqliteStorage } from 'agno';
import { pineconeClient } from '../../utils/RAG/pinecone';
import { PineconeStore } from 'agno';

export interface MCPConfig {
  variables: Array<{
    name: string;
    type: string;
    bounds?: [number, number];
  }>;
  constraints: Array<{
    expression: string;
    description: string;
  }>;
  objective: {
    type: 'minimize' | 'maximize';
    expression: string;
  };
  parameters: Record<string, any>;
}

// Initialize shared resources
const pineconeStore = new PineconeStore({
  client: pineconeClient,
  indexName: 'construction-docs',
  embedder: new OpenAIEmbedder({ id: "text-embedding-3-small", dimensions: 1536 }),
});

const storage = new SqliteStorage({ 
  table_name: "construction_model_sessions", 
  db_file: "tmp/construction_agent.db" 
});

const knowledge = new UrlKnowledge({
  urls: [
    "https://docs.dcisionai.com/construction/model-templates",
    "https://docs.dcisionai.com/construction/optimization-patterns",
    "https://docs.dcisionai.com/construction/constraint-formulation"
  ],
  vector_db: pineconeStore,
});

const agent = new Agent({
  name: "Construction Model Builder Agent",
  model: "claude-3-sonnet-20240229",
  knowledge,
  storage,
  markdown: true,
  temperature: 0.1,
});

export const agnoModelBuilderAgent = {
  /**
   * Build an OR-Tools compatible optimization model (MCP config) from enriched data and intent.
   * @param enrichedData The data enriched by the Data Agent
   * @param intent The interpreted intent from the Intent Agent
   * @param sessionId Optional session ID for conversation continuity
   * @returns { mcpConfig }
   */
  async buildModel(
    enrichedData: any, 
    intent: any, 
    sessionId?: string
  ): Promise<{ mcpConfig: MCPConfig }> {
    try {
      await agent.knowledge.load();

      const prompt = `You are an expert construction optimization model builder. Given the following enriched data and intent:
Enriched Data: ${JSON.stringify(enrichedData, null, 2)}
Intent: ${JSON.stringify(intent, null, 2)}

Create an OR-Tools compatible MCP configuration that:
1. Defines all necessary variables with appropriate types and bounds
2. Formulates all constraints from the enriched data
3. Specifies the objective function based on the intent
4. Includes any additional parameters needed by the solver

Respond in JSON format with the following structure:
{
  "variables": [
    {
      "name": "string",
      "type": "string",
      "bounds": [number, number]
    }
  ],
  "constraints": [
    {
      "expression": "string",
      "description": "string"
    }
  ],
  "objective": {
    "type": "minimize" | "maximize",
    "expression": "string"
  },
  "parameters": {
    "param1": "value1"
  }
}`;

      const responseText = await agent.chat(prompt, {
        sessionId,
        context: {
          timestamp: new Date().toISOString(),
          inputType: 'model_building',
          decisionType: intent.decisionType
        }
      });

      const response = JSON.parse(responseText);

      // Validate response structure
      if (!response.variables || !response.constraints || !response.objective) {
        throw new Error('Invalid response structure from model builder agent');
      }

      return {
        mcpConfig: response
      };
    } catch (err: any) {
      console.error('Model builder agent error:', err);
      throw new Error(`Model building failed: ${err.message}`);
    }
  }
}; 