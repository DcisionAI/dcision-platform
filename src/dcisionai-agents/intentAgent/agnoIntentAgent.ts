// Agno-based Intent Agent for DcisionAI
import { Agent, UrlKnowledge, OpenAIEmbedder, SqliteStorage } from 'agno';
import { pineconeClient } from '../../utils/RAG/pinecone';
import { PineconeStore } from 'agno';
import { AgnoError, ErrorCodes, handleAgnoError, validateResponse } from '../../utils/agno/errors';

export interface IntentResult {
  decisionType: string;
  modelPath: string;
  extractedParams: Record<string, any>;
}

// Initialize shared resources
const pineconeStore = new PineconeStore({
  client: pineconeClient,
  indexName: 'construction-docs',
  embedder: new OpenAIEmbedder({ id: "text-embedding-3-small", dimensions: 1536 }),
});

const storage = new SqliteStorage({ 
  table_name: "construction_intent_sessions", 
  db_file: "tmp/construction_agent.db" 
});

const knowledge = new UrlKnowledge({
  urls: [
    "https://docs.dcisionai.com/construction/decision-types",
    "https://docs.dcisionai.com/construction/model-templates",
    "https://docs.dcisionai.com/construction/best-practices"
  ],
  vector_db: pineconeStore,
});

const agent = new Agent({
  name: "Construction Intent Agent",
  model: "claude-3-sonnet-20240229", // Using Claude 3 Sonnet for best performance
  knowledge,
  storage,
  markdown: true,
  temperature: 0.1, // Lower temperature for more consistent outputs
});

function isValidIntentResult(data: unknown): data is IntentResult {
  if (!data || typeof data !== 'object') return false;
  const result = data as IntentResult;
  return (
    typeof result.decisionType === 'string' &&
    typeof result.modelPath === 'string' &&
    typeof result.extractedParams === 'object'
  );
}

export const agnoIntentAgent = {
  /**
   * Interpret user intent and map to a decision type and optimization model.
   * @param userInput The user's natural language request
   * @param sessionId Optional session ID for conversation continuity
   * @returns { decisionType, modelPath, extractedParams }
   */
  async interpretIntent(userInput: string, sessionId?: string): Promise<IntentResult> {
    try {
      // Load knowledge base
      try {
        await agent.knowledge.load();
      } catch (error) {
        handleAgnoError(error, {
          operation: 'knowledge_load',
          sessionId,
          userInput
        });
      }

      const prompt = `You are an expert construction management decision analyst. Given the following user request, identify:
1. The decision type (e.g., "resource-allocation", "scheduling", "cost-optimization")
2. The path to the appropriate optimization model template
3. Any extracted parameters needed for the model

User Request: ${userInput}

Respond in JSON format with the following structure:
{
  "decisionType": "string",
  "modelPath": "string",
  "extractedParams": {
    "param1": "value1",
    "param2": "value2"
  }
}`;

      let responseText: string;
      try {
        responseText = await agent.chat(prompt, {
          sessionId,
          context: {
            timestamp: new Date().toISOString(),
            inputType: 'intent_analysis'
          }
        });
      } catch (error) {
        handleAgnoError(error, {
          operation: 'agent_chat',
          sessionId,
          userInput
        });
      }

      let response: unknown;
      try {
        response = JSON.parse(responseText);
      } catch (error) {
        throw new AgnoError(
          'Failed to parse agent response as JSON',
          ErrorCodes.INVALID_RESPONSE,
          { responseText, sessionId, userInput }
        );
      }

      return validateResponse(response, isValidIntentResult, {
        sessionId,
        userInput,
        responseText
      });
    } catch (error) {
      handleAgnoError(error, {
        operation: 'interpret_intent',
        sessionId,
        userInput
      });
    }
  }
}; 