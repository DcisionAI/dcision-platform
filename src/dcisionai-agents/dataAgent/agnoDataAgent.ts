// Agno-based Data Agent for DcisionAI
// Leverages Agno's knowledge (RAG) and storage

import { Agent, UrlKnowledge, OpenAIEmbedder, SqliteStorage } from 'agno';
import { pineconeClient } from '../../utils/RAG/pinecone';
import { PineconeStore } from 'agno';

export interface EnrichedData {
  enrichedData: any;
  constraints: Array<{
    type: string;
    description: string;
    parameters: Record<string, any>;
  }>;
}

// Initialize shared resources
const pineconeStore = new PineconeStore({
  client: pineconeClient,
  indexName: 'construction-docs',
  embedder: new OpenAIEmbedder({ id: "text-embedding-3-small", dimensions: 1536 }),
});

const storage = new SqliteStorage({ 
  table_name: "construction_data_sessions", 
  db_file: "tmp/construction_agent.db" 
});

const knowledge = new UrlKnowledge({
  urls: [
    "https://docs.dcisionai.com/construction/data-standards",
    "https://docs.dcisionai.com/construction/constraints",
    "https://docs.dcisionai.com/construction/best-practices"
  ],
  vector_db: pineconeStore,
});

const agent = new Agent({
  name: "Construction Data Agent",
  model: "claude-3-sonnet-20240229",
  knowledge,
  storage,
  markdown: true,
  temperature: 0.1,
});

export const agnoDataAgent = {
  /**
   * Enrich customer data with construction-specific constraints and validations.
   * @param customerData The raw data uploaded by the customer
   * @param sessionId Optional session ID for conversation continuity
   * @returns { enrichedData, constraints }
   */
  async enrichData(customerData: any, sessionId?: string): Promise<EnrichedData> {
    try {
      await agent.knowledge.load();

      const prompt = `You are an expert construction data analyst. Given the following customer data:
${JSON.stringify(customerData, null, 2)}

1. Enrich the data with additional fields based on construction best practices
2. Identify and add relevant constraints based on construction standards
3. Validate the data against industry requirements

Respond in JSON format with the following structure:
{
  "enrichedData": {
    // Original data plus enriched fields
  },
  "constraints": [
    {
      "type": "string",
      "description": "string",
      "parameters": {
        "param1": "value1"
      }
    }
  ]
}`;

      const responseText = await agent.chat(prompt, {
        sessionId,
        context: {
          timestamp: new Date().toISOString(),
          inputType: 'data_enrichment',
          dataType: typeof customerData
        }
      });

      const response = JSON.parse(responseText);

      // Validate response structure
      if (!response.enrichedData || !Array.isArray(response.constraints)) {
        throw new Error('Invalid response structure from data agent');
      }

      return {
        enrichedData: response.enrichedData,
        constraints: response.constraints
      };
    } catch (err: any) {
      console.error('Data agent error:', err);
      throw new Error(`Data enrichment failed: ${err.message}`);
    }
  }
}; 