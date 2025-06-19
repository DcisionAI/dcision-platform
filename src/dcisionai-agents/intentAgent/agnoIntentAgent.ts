// Agno-based Intent Agent for DcisionAI
// Now uses the real Agno Python backend for advanced AI capabilities

import { agnoClient, AgnoChatRequest } from '../../lib/agno-client';

export interface IntentResult {
  decisionType: string;
  modelPath: string;
  extractedParams: Record<string, any>;
  confidence: number;
  reasoning: string;
  // New field: determines the path - RAG or optimization
  executionPath: 'rag' | 'optimization' | 'hybrid';
  // Additional context for RAG queries
  ragQuery?: string;
  // Additional context for optimization
  optimizationType?: string;
}

function isValidIntentResult(data: unknown): data is IntentResult {
  if (!data || typeof data !== 'object') return false;
  const result = data as IntentResult;
  return (
    typeof result.decisionType === 'string' &&
    typeof result.modelPath === 'string' &&
    typeof result.extractedParams === 'object' &&
    typeof result.confidence === 'number' &&
    typeof result.reasoning === 'string' &&
    typeof result.executionPath === 'string' &&
    ['rag', 'optimization', 'hybrid'].includes(result.executionPath)
  );
}

export const agnoIntentAgent = {
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
    try {
      const prompt = `You are an expert construction management decision analyst with deep expertise in optimization, resource management, and project planning. 

Your primary role is to analyze user requests and determine the BEST EXECUTION PATH:

**EXECUTION PATHS:**
1. **RAG (Retrieval-Augmented Generation)**: For questions about knowledge, best practices, regulations, historical data, or informational queries
2. **Optimization**: For decision-making requests that require mathematical modeling, resource allocation, scheduling, or cost optimization
3. **Hybrid**: For complex requests that need both knowledge retrieval AND optimization modeling

**RAG Path Examples:**
- "What are OSHA safety requirements for scaffolding?"
- "What are the best practices for concrete curing?"
- "Tell me about LEED certification requirements"
- "What are common causes of construction delays?"
- "How do I handle change orders?"

**Optimization Path Examples:**
- "Optimize crew allocation for this project"
- "Find the best schedule for these tasks"
- "Minimize costs while meeting deadlines"
- "Allocate resources optimally across multiple sites"
- "Determine the optimal equipment mix"

**Hybrid Path Examples:**
- "What are the best practices for crew scheduling, and then optimize our current schedule?"
- "Tell me about risk management strategies, then optimize our project plan considering those risks"

Given the following user request, perform a comprehensive analysis to identify:

1. **Decision Type**: The primary decision category (e.g., "resource-allocation", "scheduling", "cost-optimization", "risk-management", "quality-control", "supply-chain", "workforce-planning", "knowledge-query", "best-practices", "regulatory-compliance")
2. **Execution Path**: "rag", "optimization", or "hybrid"
3. **Model Path**: The path to the appropriate optimization model template (only if optimization is needed)
4. **RAG Query**: A refined query for knowledge base search (only if RAG is needed)
5. **Optimization Type**: The specific type of optimization problem (only if optimization is needed)
6. **Extracted Parameters**: Key parameters needed for optimization models (only if optimization is needed)
7. **Confidence**: Confidence in the interpretation (0-1)
8. **Reasoning**: Explanation of the decision and path choice

User Request: "${userInput}"

Please analyze the request carefully and provide a detailed response in JSON format:

{
  "decisionType": "string (specific decision category)",
  "executionPath": "rag|optimization|hybrid",
  "modelPath": "string (path to optimization model, only if optimization needed)",
  "ragQuery": "string (refined query for knowledge base, only if RAG needed)",
  "optimizationType": "string (type of optimization problem, only if optimization needed)",
  "extractedParams": {
    "resources": {},
    "timeline": {},
    "costs": {},
    "quality": {},
    "risks": {}
  },
  "confidence": "number (0-1, confidence in the interpretation)",
  "reasoning": "string (explanation of the decision and path choice)"
}

Consider construction industry best practices, regulatory requirements, and optimization principles in your analysis.`;

      const request: AgnoChatRequest = {
        message: prompt,
        session_id: sessionId,
        model_provider: modelProvider,
        model_name: modelName || (modelProvider === 'anthropic' ? 'claude-3-sonnet-20240229' : 'gpt-4-turbo-preview'),
        context: {
          timestamp: new Date().toISOString(),
          inputType: 'intent_analysis',
          userInputLength: userInput.length,
          agentType: 'construction_intent_analyzer'
        }
      };

      const response = await agnoClient.chat(request);
      const result = JSON.parse(response.response);

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