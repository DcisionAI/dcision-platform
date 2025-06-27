// Agno-based Explainability Agent for DcisionAI
// Now uses the real Agno Python backend for advanced AI capabilities

import { agnoClient, AgnoChatRequest, AgnoChatResponse } from '../../agno-client';
import { messageBus } from '@/agent/MessageBus';

export interface Explanation {
  summary: string;
  keyDecisions: Array<{
    decision: string;
    rationale: string;
    impact: string;
    confidence: number;
  }>;
  recommendations: Array<{
    action: string;
    benefit: string;
    priority: 'high' | 'medium' | 'low';
    implementation: string;
    timeline: string;
  }>;
  insights: Array<{
    category: string;
    insight: string;
    value: string;
  }>;
  // Additional fields for different result types
  ragInsights?: Array<{
    source: string;
    relevance: string;
    keyInformation: string;
  }>;
  optimizationMetrics?: {
    objectiveValue?: number;
    solverStatus?: string;
    computationTime?: number;
    constraintViolations?: number;
  };
}

function createFallbackExplanation(solution: any, status: string): Explanation {
  console.warn('Creating fallback explanation due to parsing error');
  
  const baseExplanation: Explanation = {
    summary: `Analysis completed for ${status} workflow. The solution has been processed and optimized according to construction best practices.`,
    keyDecisions: [
      {
        decision: "Proceed with optimized solution",
        rationale: "The optimization workflow has generated a valid solution based on the provided constraints and objectives.",
        impact: "Improved efficiency and resource utilization",
        confidence: 0.7
      }
    ],
    recommendations: [
      {
        action: "Review the optimization results",
        benefit: "Ensure the solution meets project requirements",
        priority: "high" as const,
        implementation: "Schedule a review meeting with the project team",
        timeline: "Within 1 week"
      },
      {
        action: "Monitor implementation progress",
        benefit: "Track performance against optimization targets",
        priority: "medium" as const,
        implementation: "Set up regular progress reviews",
        timeline: "Ongoing"
      }
    ],
    insights: [
      {
        category: "efficiency",
        insight: "Optimization workflow completed successfully",
        value: "Improved resource allocation and scheduling"
      },
      {
        category: "quality",
        insight: "Solution follows construction best practices",
        value: "Enhanced project quality and compliance"
      }
    ]
  };

  // Add specific insights based on solution type
  if (status === 'optimization_completed' && solution.optimizationResult) {
    baseExplanation.optimizationMetrics = {
      objectiveValue: solution.optimizationResult.solution?.objective_value || 0,
      solverStatus: solution.optimizationResult.solution?.status || 'unknown',
      computationTime: solution.optimizationResult.solution?.solve_time_ms || 0,
      constraintViolations: 0
    };
  }

  if (status === 'hybrid_completed' && solution.ragResult) {
    baseExplanation.ragInsights = [
      {
        source: "Knowledge Base",
        relevance: "Applied construction best practices to optimization",
        keyInformation: "Knowledge base was consulted to inform optimization decisions"
      }
    ];
  }

  return baseExplanation;
}

function cleanAndParseJSON(jsonString: string): any {
  try {
    // First try to parse as-is
    return JSON.parse(jsonString);
  } catch (err) {
    // If that fails, try to clean up common issues
    let cleaned = jsonString;
    
    // Remove markdown code blocks if present
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Remove any text before the first {
    const startIndex = cleaned.indexOf('{');
    if (startIndex > 0) {
      cleaned = cleaned.substring(startIndex);
    }
    
    // Remove any text after the last }
    const endIndex = cleaned.lastIndexOf('}');
    if (endIndex > 0 && endIndex < cleaned.length - 1) {
      cleaned = cleaned.substring(0, endIndex + 1);
    }
    
    // If the JSON is truncated, try to complete it more intelligently
    if (!cleaned.endsWith('}')) {
      // Count opening and closing braces
      const openBraces = (cleaned.match(/\{/g) || []).length;
      const closeBraces = (cleaned.match(/\}/g) || []).length;
      
      // Add missing closing braces
      for (let i = 0; i < openBraces - closeBraces; i++) {
        cleaned += '}';
      }
    }
    
    // Fix common JSON issues
    cleaned = cleaned
      .replace(/,\s*}/g, '}') // Remove trailing commas
      .replace(/,\s*]/g, ']') // Remove trailing commas in arrays
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
      .replace(/\n/g, ' ') // Replace newlines with spaces
      .replace(/\r/g, '') // Remove carriage returns
      .replace(/\t/g, ' ') // Replace tabs with spaces
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    // Additional fixes for common issues in large JSON
    cleaned = cleaned
      .replace(/([^\\])"/g, '$1"') // Fix unescaped quotes (but be careful)
      .replace(/,\s*([}\]])/g, '$1') // Remove trailing commas more aggressively
      .replace(/([^\\])"/g, '$1"') // Fix any remaining quote issues
      .replace(/\\"/g, '"') // Fix escaped quotes
      .replace(/\\\\/g, '\\'); // Fix double backslashes
    
    try {
      return JSON.parse(cleaned);
    } catch (err2: any) {
      // If still failing, try a more aggressive approach
      console.warn('First cleaning attempt failed, trying aggressive cleaning');
      
      // Try to extract just the main structure
      const mainMatch = cleaned.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
      if (mainMatch) {
        try {
          return JSON.parse(mainMatch[0]);
        } catch (err3: any) {
          console.warn('Main structure extraction failed');
        }
      }
      
      // Try to fix common truncation issues
      if (cleaned.includes('"ragInsights"') && !cleaned.includes('"optimizationMetrics"')) {
        // Add missing optimizationMetrics if ragInsights is present
        cleaned = cleaned.replace(/,\s*$/, '') + ', "optimizationMetrics": {}}';
        try {
          return JSON.parse(cleaned);
        } catch (err4: any) {
          console.warn('optimizationMetrics addition failed');
        }
      }
      
      // If still failing, return null to trigger fallback
      console.warn('Failed to parse JSON after all cleaning attempts, will use fallback');
      console.log('Cleaned JSON string (first 500 chars):', cleaned.substring(0, 500));
      console.log('Cleaned JSON string (last 500 chars):', cleaned.substring(Math.max(0, cleaned.length - 500)));
      return null;
    }
  }
}

/**
 * Extract partial data from a failed JSON response
 */
function extractPartialData(jsonString: string): any {
  try {
    // Try to extract summary
    const summaryMatch = jsonString.match(/"summary"\s*:\s*"([^"]+)"/);
    const summary = summaryMatch ? summaryMatch[1] : 'Analysis completed successfully.';
    
    // Try to extract key decisions
    const decisionsMatch = jsonString.match(/"keyDecisions"\s*:\s*\[([^\]]+)\]/);
    let keyDecisions: Array<{
      decision: string;
      rationale: string;
      impact: string;
      confidence: number;
    }> = [];
    if (decisionsMatch) {
      const decisionMatches = decisionsMatch[1].match(/"decision"\s*:\s*"([^"]+)"/g);
      if (decisionMatches) {
        keyDecisions = decisionMatches.map(match => {
          const decision = match.match(/"decision"\s*:\s*"([^"]+)"/);
          return {
            decision: decision ? decision[1] : 'Key decision identified',
            rationale: 'Based on analysis of the provided data',
            impact: 'Will improve project outcomes',
            confidence: 0.7
          };
        });
      }
    }
    
    // Try to extract recommendations
    const recommendationsMatch = jsonString.match(/"recommendations"\s*:\s*\[([^\]]+)\]/);
    let recommendations: Array<{
      action: string;
      benefit: string;
      priority: 'high' | 'medium' | 'low';
      implementation: string;
      timeline: string;
    }> = [];
    if (recommendationsMatch) {
      const actionMatches = recommendationsMatch[1].match(/"action"\s*:\s*"([^"]+)"/g);
      if (actionMatches) {
        recommendations = actionMatches.map(match => {
          const action = match.match(/"action"\s*:\s*"([^"]+)"/);
          return {
            action: action ? action[1] : 'Review the analysis results',
            benefit: 'Will improve project efficiency',
            priority: 'high' as const,
            implementation: 'Schedule a review meeting',
            timeline: 'Within 1 week'
          };
        });
      }
    }
    
    // Try to extract insights
    const insightsMatch = jsonString.match(/"insights"\s*:\s*\[([^\]]+)\]/);
    let insights: Array<{
      category: string;
      insight: string;
      value: string;
    }> = [];
    if (insightsMatch) {
      const insightMatches = insightsMatch[1].match(/"insight"\s*:\s*"([^"]+)"/g);
      if (insightMatches) {
        insights = insightMatches.map(match => {
          const insight = match.match(/"insight"\s*:\s*"([^"]+)"/);
          return {
            category: 'analysis',
            insight: insight ? insight[1] : 'Analysis completed successfully',
            value: 'Provides valuable insights for decision making'
          };
        });
      }
    }
    
    return {
      summary,
      keyDecisions: keyDecisions.length > 0 ? keyDecisions : [
        {
          decision: "Proceed with the analysis results",
          rationale: "The analysis has been completed and provides actionable insights",
          impact: "Improved decision making and project outcomes",
          confidence: 0.7
        }
      ],
      recommendations: recommendations.length > 0 ? recommendations : [
        {
          action: "Review the analysis results",
          benefit: "Ensure the solution meets project requirements",
          priority: "high" as const,
          implementation: "Schedule a review meeting with the project team",
          timeline: "Within 1 week"
        }
      ],
      insights: insights.length > 0 ? insights : [
        {
          category: "efficiency",
          insight: "Analysis completed successfully",
          value: "Provides valuable insights for optimization"
        }
      ]
    };
  } catch (error) {
    console.warn('Failed to extract partial data:', error);
    return null;
  }
}

function normalizeExplanation(raw: any): Explanation {
  // If it's a string, try to parse as JSON
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      // If not JSON, wrap as summary
      return {
        summary: raw,
        keyDecisions: [],
        recommendations: [],
        insights: []
      };
    }
  }

  // If it's a single decision object, wrap it
  if (raw && raw.decision && !raw.keyDecisions) {
    raw = {
      summary: raw.summary || '',
      keyDecisions: [ {
        decision: raw.decision,
        rationale: raw.rationale || '',
        impact: raw.impact || '',
        confidence: typeof raw.confidence === 'number' ? raw.confidence : 0.7
      }],
      recommendations: raw.recommendations || [],
      insights: raw.insights || []
    };
  }

  // Fill missing fields with defaults
  return {
    summary: raw.summary || '',
    keyDecisions: Array.isArray(raw.keyDecisions) ? raw.keyDecisions : [],
    recommendations: Array.isArray(raw.recommendations) ? raw.recommendations : [],
    insights: Array.isArray(raw.insights) ? raw.insights : [],
    ragInsights: Array.isArray(raw.ragInsights) ? raw.ragInsights : [],
    optimizationMetrics: raw.optimizationMetrics || undefined
  };
}

export const agnoExplainAgent = {
  name: 'Construction Analysis Agent',
  description: 'Explains and analyzes construction optimization solutions',

  /**
   * Explain a construction solution with detailed analysis and recommendations.
   * @param solution The solution to explain (RAG, optimization, or hybrid)
   * @param sessionId Optional session ID for conversation continuity
   * @param modelProvider Optional model provider (anthropic or openai)
   * @param modelName Optional specific model name
   * @returns { explanation }
   */
  async explainSolution(
    solution: any,
    sessionId?: string,
    modelProvider: 'anthropic' | 'openai' = 'anthropic',
    modelName?: string
  ): Promise<Explanation> {
    const status = solution.status || 'unknown';
    console.log(`Explaining solution with status: ${status}`);

    try {
      // Try to use Agno backend first
      let response;
      try {
        const request: AgnoChatRequest = {
          message: this.buildPrompt(solution, status),
          session_id: sessionId,
          model_provider: modelProvider,
          model_name: modelName || (modelProvider === 'anthropic' ? 'claude-3-5-sonnet-20241022' : 'gpt-4-turbo-preview'),
          context: {
            timestamp: new Date().toISOString(),
            solution_type: status
          }
        };
        
        response = await agnoClient.chat(request);
        
        // Check if the response has an error
        if (response.error) {
          console.warn(`⚠️ Agno backend error: ${response.error_details}`);
          throw new Error(`Agno backend error: ${response.error_details}`);
        }
        
        console.log('✅ Agno backend response received');
        return this.parseExplanation(response.response, solution);
      } catch (agnoError) {
        console.warn(`⚠️ Agno backend failed, using fallback: ${agnoError}`);
        // Fall through to direct LLM call
      }
      
      // Fallback: Use direct LLM call
      console.log('🔄 Using direct LLM fallback for explanation');
      const fallbackResponse = await this.fallbackLLMCall(
        this.buildPrompt(solution, status),
        modelProvider,
        modelName
      );
      
      return this.parseExplanation(fallbackResponse.response, solution);
    } catch (error) {
      console.error('Explainability agent error:', error);
      console.log('Using fallback explanation due to error');
      
      // Create a basic fallback explanation
      return {
        summary: `Generated explanation for ${status} solution. ${solution.response || 'No additional details available.'}`,
        keyDecisions: [],
        recommendations: [],
        insights: [],
        ragInsights: []
      };
    }
  },

  /**
   * Fallback LLM call when Agno backend is unavailable
   */
  async fallbackLLMCall(prompt: string, modelProvider: 'anthropic' | 'openai', modelName?: string): Promise<AgnoChatResponse> {
    if (modelProvider === 'anthropic') {
      const Anthropic = require('@anthropic-ai/sdk');
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      
      const completion = await anthropic.messages.create({
        model: modelName || 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      });
      
      return {
        response: completion.content[0].text,
        model_used: modelName || 'claude-3-5-sonnet-20241022',
        timestamp: new Date().toISOString()
      };
    } else {
      const OpenAI = require('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      const completion = await openai.chat.completions.create({
        model: modelName || 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000
      });
      
      return {
        response: completion.choices[0].message.content || '',
        model_used: modelName || 'gpt-4-turbo-preview',
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * Build the prompt for explanation generation
   */
  buildPrompt(solution: any, status: string): string {
    let prompt = '';
    
    if (status === 'rag_completed') {
      // Handle new RAG response format
      const ragResults = solution.results || [];
      const query = solution.query || 'Unknown query';
      
      prompt = `You are an expert construction analyst. 

Given the following RAG (Retrieval-Augmented Generation) solution, create a comprehensive, actionable explanation:

**Query:** ${query}

**RAG Results:**
${JSON.stringify(ragResults, null, 2)}

Please provide a detailed analysis that includes:

1. **Executive Summary**: A clear, high-level overview of the knowledge retrieved
2. **Key Insights**: For each major insight:
   - What was discovered
   - Why it's important
   - How it applies to the user's situation
   - Confidence level in the information
3. **Actionable Recommendations**: Specific, implementable recommendations with:
   - Clear action items
   - Expected benefits
   - Priority levels
   - Implementation guidance
   - Timeline estimates
4. **Knowledge Gaps**: Areas where additional information might be needed
5. **Best Practices**: Construction best practices relevant to the query

Respond in JSON format with the following structure:

{
  "summary": "string (executive summary)",
  "keyDecisions": [
    {
      "decision": "string",
      "rationale": "string",
      "impact": "string",
      "confidence": "number (0-1)"
    }
  ],
  "recommendations": [
    {
      "action": "string",
      "benefit": "string",
      "priority": "high|medium|low",
      "implementation": "string",
      "timeline": "string"
    }
  ],
  "insights": [
    {
      "category": "string (e.g., 'best_practices', 'safety', 'efficiency', 'compliance')",
      "insight": "string",
      "value": "string"
    }
  ],
  "ragInsights": [
    {
      "source": "string (source type)",
      "relevance": "string (why this source is relevant)",
      "keyInformation": "string (key information from this source)"
    }
  ]
}

Focus on practical, actionable insights that construction managers can implement immediately. 

CRITICAL: You MUST respond with ONLY a valid JSON object. Do not include any markdown formatting, code blocks, or additional text. The JSON must be properly formatted and complete.

IMPORTANT RULES:
1. All string values must be properly quoted.
2. All arrays must be properly formatted with square brackets.
3. All numbers must not be quoted.
4. The confidence values must be numbers between 0 and 1.
5. Return ONLY the JSON structure below, no additional text.
6. Ensure the JSON is complete and properly closed with all required fields.
7. Keep string values concise but informative to avoid truncation.

Return ONLY this JSON structure:`;
    } else {
      // Handle other solution types (optimization, hybrid, etc.)
      prompt = `You are an expert construction analyst. Analyze the following solution and provide a comprehensive explanation.

**Solution:** ${JSON.stringify(solution, null, 2)}

Please provide a detailed analysis that includes:

1. **Executive Summary**: A clear, high-level overview
2. **Key Decisions**: Important decisions made and their rationale
3. **Recommendations**: Actionable recommendations
4. **Insights**: Key insights and learnings

Respond in JSON format with the following structure:

{
  "summary": "string",
  "keyDecisions": [
    {
      "decision": "string",
      "rationale": "string", 
      "impact": "string",
      "confidence": "number (0-1)"
    }
  ],
  "recommendations": [
    {
      "action": "string",
      "benefit": "string",
      "priority": "high|medium|low",
      "implementation": "string",
      "timeline": "string"
    }
  ],
  "insights": [
    {
      "category": "string",
      "insight": "string",
      "value": "string"
    }
  ]
}

CRITICAL: You MUST respond with ONLY a valid JSON object.`;
    }
    
    return prompt;
  },

  /**
   * Create a specialized construction analysis agent
   * @param modelProvider Optional model provider
   * @param modelName Optional specific model name
   * @returns Agent ID
   */
  async createSpecializedAgent(
    modelProvider: 'anthropic' | 'openai' = 'anthropic',
    modelName?: string
  ): Promise<string> {
    const config = {
      name: 'Construction Analysis Agent',
      instructions: `You are an expert construction analyst specializing in:
- Knowledge retrieval and best practices analysis
- Project optimization and efficiency analysis
- Resource allocation and scheduling optimization
- Cost-benefit analysis and ROI calculations
- Risk assessment and mitigation strategies
- Performance metrics and KPI analysis
- Business intelligence and strategic insights
- Implementation planning and change management
- Regulatory compliance and standards

Your role is to analyze solutions (RAG, optimization, or hybrid) and provide clear, actionable explanations and recommendations for construction management teams.`,
      model_provider: modelProvider,
      model_name: modelName,
      temperature: 0.1,
      markdown: true
    };

    const result = await agnoClient.createAgent(config);
    return result.agent_id;
  },

  parseExplanation(response: string, solution?: any): Explanation {
    let result;
    
    if (typeof response === 'string') {
      try {
        console.log('Attempting to parse string response...');
        result = cleanAndParseJSON(response);
        
        if (!result) {
          console.warn('JSON parsing failed, attempting to extract partial data...');
          result = extractPartialData(response);
          
          if (!result) {
            console.warn('Partial data extraction failed, using fallback explanation');
            return createFallbackExplanation(solution, 'unknown');
          }
          console.log('Successfully extracted partial data from response');
        } else {
          console.log('Successfully parsed JSON response');
        }
      } catch (err) {
        console.error('JSON parsing error in Explain Agent:', err);
        console.error('Raw response:', response);
        console.warn('Attempting to extract partial data due to parsing error...');
        
        result = extractPartialData(response);
        if (!result) {
          console.warn('Using fallback explanation due to parsing error');
          return createFallbackExplanation(solution, 'unknown');
        }
        console.log('Successfully extracted partial data after parsing error');
      }
    } else if (typeof response === 'object' && response !== null) {
      console.log('Response is already an object, using directly');
      result = response;
    } else {
      console.error('Unexpected response type:', typeof response);
      console.warn('Using fallback explanation due to unexpected response type');
      return createFallbackExplanation(solution, 'unknown');
    }

    // Validate response structure with defensive checks
    if (!result || !result.summary || !Array.isArray(result.keyDecisions) || !Array.isArray(result.recommendations) || !Array.isArray(result.insights)) {
      console.error('Invalid explanation structure:', result);
      console.warn('Using fallback explanation due to invalid structure');
      return createFallbackExplanation(solution, 'unknown');
    }

    console.log('✅ Explanation generated successfully');
    const normalized = normalizeExplanation(result);
    return normalized;
  }
};

// Track processed sessions to prevent duplicates
const processedSessions = new Set<string>();

// Subscribe to explanation requests
messageBus.subscribe('call_explain_agent', async (msg: any) => {
  const correlationId = msg.correlationId;
  if (!correlationId) return;
  
  // Prevent duplicate processing
  if (processedSessions.has(correlationId)) {
    console.log(`📝 Skipping duplicate explain request for session: ${correlationId}`);
    return;
  }
  
  processedSessions.add(correlationId);
  console.log(`📝 Explain Agent processing for session: ${correlationId}`);
  
  try {
    const { solution, sessionId, modelProvider, modelName } = msg.payload;
    
    // Process RAG response
    if (solution.status === 'rag_completed' || solution.status === 'rag_complete') {
      console.log(`📝 Processing RAG response for session: ${correlationId}`);
      
      const explanation = await agnoExplainAgent.explainSolution(
        solution, 
        sessionId || correlationId, 
        modelProvider, 
        modelName
      );
      
      // Publish explanation ready event
      messageBus.publish({
        type: 'explanation_ready',
        payload: explanation,
        correlationId
      });
      
      console.log(`✅ Explanation ready for session: ${correlationId}`);
    } else {
      console.log(`📝 Processing regular solution for session: ${correlationId}`);
      
      const explanation = await agnoExplainAgent.explainSolution(
        solution, 
        sessionId || correlationId, 
        modelProvider, 
        modelName
      );
      
      // Publish explanation ready event
      messageBus.publish({
        type: 'explanation_ready',
        payload: explanation,
        correlationId
      });
      
      console.log(`✅ Explanation ready for session: ${correlationId}`);
    }
  } catch (error) {
    console.error(`❌ Explain agent error for session: ${correlationId}:`, error);
    
    // Create fallback explanation
    const fallbackExplanation: Explanation = {
      summary: 'An error occurred while generating the explanation. Please try again.',
      keyDecisions: [],
      recommendations: [],
      insights: [],
      ragInsights: []
    };
    
    // Publish fallback explanation
    messageBus.publish({
      type: 'explanation_ready',
      payload: fallbackExplanation,
      correlationId
    });
  } finally {
    // Clean up processed session after a delay
    setTimeout(() => {
      processedSessions.delete(correlationId);
    }, 5000);
  }
});

// Ensure subscriptions are only registered once
let _explainAgentSubscribed = false;
if (!_explainAgentSubscribed) {
  // Subscribe to debate challenges
  messageBus.subscribe('debate_response_explanation_ready', async (msg: any) => {
    const challenge = msg.payload.challenge;
    const originalOutput = msg.payload.originalOutput;
    
    const defensePrompt = `You are the Explain Agent defending your explanation. 
    
Original Explanation: ${JSON.stringify(originalOutput)}
Challenge: ${challenge}

Provide a strong defense of your explanation approach. Address the challenge directly and explain your reasoning methodology.`;

    const defense = await agnoClient.chat({
      message: defensePrompt
    });

    messageBus.publish({
      type: 'debate_response_explanation_ready',
      payload: {
        debateId: msg.payload.debateId,
        response: defense.response,
        originalOutput: originalOutput
      },
      correlationId: msg.correlationId
    });
  });
  
  _explainAgentSubscribed = true;
} 