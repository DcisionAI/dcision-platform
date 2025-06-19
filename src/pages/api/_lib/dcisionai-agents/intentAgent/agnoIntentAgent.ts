// Agno-based Intent Agent for DcisionAI
// Now uses the real Agno Python backend for advanced AI capabilities

import { agnoClient, AgnoChatRequest } from '../../agno-client';

export interface IntentResult {
  decisionType: string;
  confidence: number;
  reasoning: string;
  ragQuery?: string;
  optimizationQuery?: string;
  keywords: string[];
  primaryIntent: string;
  secondaryIntent?: string;
}

function isValidIntentResult(obj: any): obj is IntentResult {
  return (
    obj &&
    typeof obj.decisionType === 'string' &&
    typeof obj.confidence === 'number' &&
    typeof obj.reasoning === 'string' &&
    typeof obj.primaryIntent === 'string' &&
    Array.isArray(obj.keywords)
  );
}

export const agnoIntentAgent = {
  name: 'Construction Intent Analysis Agent',
  description: 'Analyzes user input to determine the appropriate execution path and decision type',

  /**
   * Analyze user intent and determine the execution path (RAG vs Optimization).
   * @param userInput The user's natural language request
   * @param sessionId Optional session ID for conversation continuity
   * @param modelProvider Optional model provider (anthropic or openai)
   * @param modelName Optional specific model name
   * @returns { decisionType, confidence, reasoning, primaryIntent, secondaryIntent, keywords, ragQuery?, optimizationQuery? }
   */
  async analyzeIntent(
    userInput: string, 
    sessionId?: string,
    modelProvider: 'anthropic' | 'openai' = 'anthropic',
    modelName?: string
  ): Promise<IntentResult> {
    try {
      const prompt = `You are a construction domain expert. Your task is to analyze user requests and determine the best execution path:

1. RAG (Retrieval Augmented Generation)
   - For queries about regulations, standards, best practices
   - When user needs information from knowledge base
   - Example: "What are OSHA requirements for scaffolding?"

2. Optimization
   - For resource allocation, scheduling, planning problems
   - When mathematical optimization can find optimal solutions
   - Example: "Optimize crew assignments for next week"

3. Hybrid
   - Combines knowledge retrieval with optimization
   - When context from knowledge base helps optimization
   - Example: "What are best practices for scheduling, then optimize our plan?"

Analyze this request:
"${userInput}"

Please analyze the request carefully and provide a detailed response in JSON format:

{
  "decisionType": "string (specific decision category)",
  "primaryIntent": "knowledge_retrieval|optimization|hybrid_analysis",
  "secondaryIntent": "string (optional secondary intent)",
  "keywords": ["array", "of", "relevant", "keywords"],
  "ragQuery": "string (refined query for knowledge base, only if RAG needed)",
  "optimizationQuery": "string (optimization problem description, only if optimization needed)",
  "confidence": "number (0-1, confidence in the interpretation)",
  "reasoning": "string (explanation of the decision and path choice)"
}

Consider construction industry best practices, regulatory requirements, and optimization principles in your analysis.`;

      const request: AgnoChatRequest = {
        message: prompt,
        session_id: sessionId,
        model_provider: modelProvider,
        model_name: modelName || (modelProvider === 'anthropic' ? 'claude-3-5-sonnet-20241022' : 'gpt-4-turbo-preview'),
        context: {
          timestamp: new Date().toISOString(),
          inputType: 'intent_analysis',
          userInputLength: userInput.length,
          agentType: 'construction_intent_analyzer'
        }
      };

      const response = await agnoClient.chat(request);
      let result;
      
      if (typeof response.response === 'string') {
        try {
          result = JSON.parse(response.response);
        } catch (err) {
          throw new Error('Invalid JSON response from intent agent');
        }
      } else {
        result = response.response;
      }

      // Validate response structure
      if (!isValidIntentResult(result)) {
        throw new Error('Invalid response structure from intent agent');
      }

      return result;
    } catch (err: any) {
      console.error('Intent agent error:', err);
      throw new Error(`Intent interpretation failed: ${err.message}`);
    }
  },

  /**
   * Interpret user intent and determine the execution path (RAG vs Optimization).
   * @param userInput The user's natural language request
   * @param sessionId Optional session ID for conversation continuity
   * @param modelProvider Optional model provider (anthropic or openai)
   * @param modelName Optional specific model name
   * @returns { decisionType, modelPath, extractedParams, confidence, reasoning, executionPath, ragQuery?, optimizationType? }
   */
  async interpretIntent(
    userInput: string, 
    sessionId?: string,
    modelProvider: 'anthropic' | 'openai' = 'anthropic',
    modelName?: string
  ): Promise<IntentResult> {
    // For backward compatibility, call analyzeIntent
    return this.analyzeIntent(userInput, sessionId, modelProvider, modelName);
  },

  /**
   * Create a specialized construction intent analysis agent
   * @param modelProvider Optional model provider
   * @param modelName Optional specific model name
   * @returns Agent ID
   */
  async createSpecializedAgent(
    modelProvider: 'anthropic' | 'openai' = 'anthropic',
    modelName?: string
  ): Promise<string> {
    const config = {
      name: 'Construction Intent Analysis Agent',
      instructions: `You are an expert construction management decision analyst specializing in:
- Project planning and optimization
- Resource allocation and scheduling
- Cost management and budgeting
- Risk assessment and mitigation
- Quality control and compliance
- Supply chain optimization
- Workforce planning and management
- Knowledge retrieval and best practices

Your role is to analyze user requests and determine the appropriate execution path:
1. RAG (Retrieval-Augmented Generation) for knowledge queries
2. Optimization for decision-making problems
3. Hybrid for complex requests requiring both

You must accurately classify each request and provide the appropriate parameters for the chosen path.`,
      model_provider: modelProvider,
      model_name: modelName,
      temperature: 0.1,
      markdown: true
    };

    const result = await agnoClient.createAgent(config);
    return result.agent_id;
  }
}; 