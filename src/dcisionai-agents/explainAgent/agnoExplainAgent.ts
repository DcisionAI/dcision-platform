// Agno-based Explainability Agent for DcisionAI
import { Agent, UrlKnowledge, OpenAIEmbedder, SqliteStorage } from 'agno';
import { pineconeClient } from '../../utils/RAG/pinecone';
import { PineconeStore } from 'agno';

export interface Explanation {
  summary: string;
  keyDecisions: Array<{
    decision: string;
    rationale: string;
    impact: string;
  }>;
  recommendations: Array<{
    action: string;
    benefit: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

// Initialize shared resources
const pineconeStore = new PineconeStore({
  client: pineconeClient,
  indexName: 'construction-docs',
  embedder: new OpenAIEmbedder({ id: "text-embedding-3-small", dimensions: 1536 }),
});

const storage = new SqliteStorage({ 
  table_name: "construction_explain_sessions", 
  db_file: "tmp/construction_agent.db" 
});

const knowledge = new UrlKnowledge({
  urls: [
    "https://docs.dcisionai.com/construction/explanation-templates",
    "https://docs.dcisionai.com/construction/decision-rationales",
    "https://docs.dcisionai.com/construction/best-practices"
  ],
  vector_db: pineconeStore,
});

const agent = new Agent({
  name: "Construction Explainability Agent",
  model: "claude-3-sonnet-20240229",
  knowledge,
  storage,
  markdown: true,
  temperature: 0.1,
});

export const agnoExplainAgent = {
  /**
   * Generate a clear, actionable explanation of the optimization solution.
   * @param mcpSolution The solution returned by the MCP (optimization engine)
   * @param sessionId Optional session ID for conversation continuity
   * @returns { explanation }
   */
  async explainSolution(
    mcpSolution: any,
    sessionId?: string
  ): Promise<{ explanation: Explanation }> {
    try {
      await agent.knowledge.load();

      const prompt = `You are an expert construction optimization analyst. Given the following optimization solution:
${JSON.stringify(mcpSolution, null, 2)}

Create a clear, actionable explanation that:
1. Summarizes the key decisions made by the optimizer
2. Explains the rationale behind each decision
3. Quantifies the impact of each decision
4. Provides actionable recommendations

Respond in JSON format with the following structure:
{
  "summary": "string",
  "keyDecisions": [
    {
      "decision": "string",
      "rationale": "string",
      "impact": "string"
    }
  ],
  "recommendations": [
    {
      "action": "string",
      "benefit": "string",
      "priority": "high" | "medium" | "low"
    }
  ]
}`;

      const responseText = await agent.chat(prompt, {
        sessionId,
        context: {
          timestamp: new Date().toISOString(),
          inputType: 'solution_explanation',
          solutionType: typeof mcpSolution
        }
      });

      const response = JSON.parse(responseText);

      // Validate response structure
      if (!response.summary || !Array.isArray(response.keyDecisions) || !Array.isArray(response.recommendations)) {
        throw new Error('Invalid response structure from explainability agent');
      }

      return {
        explanation: response
      };
    } catch (err: any) {
      console.error('Explainability agent error:', err);
      throw new Error(`Solution explanation failed: ${err.message}`);
    }
  }
}; 