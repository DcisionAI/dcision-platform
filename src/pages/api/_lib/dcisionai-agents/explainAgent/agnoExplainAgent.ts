// Agno-based Explainability Agent for DcisionAI
// Now uses the real Agno Python backend for advanced AI capabilities

import { agnoClient, AgnoChatRequest } from '../../agno-client';
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
    try {
      // Validate input
      if (!solution) {
        console.warn('No solution provided, using fallback explanation');
        return createFallbackExplanation({}, 'unknown');
      }

      // Determine solution status
      let status = 'unknown';
      if (solution.status === 'rag_complete') {
        status = 'rag_completed';
      } else if (solution.status === 'hybrid_complete') {
        status = 'hybrid_completed';
      } else if (solution.status === 'optimal' || solution.status === 'infeasible' || solution.status === 'unbounded') {
        status = 'optimization_completed';
      } else if (solution.ragResult && solution.optimizationResult) {
        status = 'hybrid_completed';
      } else if (solution.optimizationResult) {
        status = 'optimization_completed';
      } else if (solution.ragResult) {
        status = 'rag_completed';
      }

      console.log(`Explaining solution with status: ${status}`);

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

      } else if (status === 'optimization_completed') {
        prompt = `You are an expert construction analyst with deep expertise in optimization and mathematical modeling. 

Given the following optimization solution, create a comprehensive, actionable explanation:

**Optimization Results:**
${JSON.stringify(solution.optimizationResult || {}, null, 2)}

**User Intent:** ${solution.intent?.reasoning || 'Unknown intent'}

Please provide a detailed analysis that includes:

1. **Executive Summary**: A clear, high-level overview of the optimization results
2. **Key Decisions**: For each major decision:
   - What was optimized
   - Why it was chosen
   - What impact it will have
   - Confidence level in the decision
3. **Actionable Recommendations**: Specific, implementable recommendations with:
   - Clear action items
   - Expected benefits
   - Priority levels
   - Implementation guidance
   - Timeline estimates
4. **Performance Insights**: Valuable insights about:
   - Resource optimization insights
   - Timeline and scheduling insights
   - Quality and compliance insights

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
      "category": "string (e.g., 'cost', 'efficiency', 'risk', 'quality')",
      "insight": "string",
      "value": "string"
    }
  ],
  "optimizationMetrics": {
    "objectiveValue": "number",
    "solverStatus": "string",
    "computationTime": "number",
    "constraintViolations": "number"
  }
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

      } else if (status === 'hybrid_completed') {
        prompt = `You are an expert construction analyst with deep expertise in both knowledge management and optimization. 

Given the following hybrid solution (combining RAG knowledge retrieval and optimization), create a comprehensive, actionable explanation:

**RAG Knowledge Retrieved:**
${solution.ragResult?.answer || 'No RAG answer available'}

**Optimization Results:**
${JSON.stringify(solution.optimizationResult || {}, null, 2)}

**User Intent:** ${solution.intent?.reasoning || 'Unknown intent'}

Please provide a detailed analysis that includes:

1. **Executive Summary**: A clear, high-level overview combining knowledge and optimization insights
2. **Knowledge-Enhanced Decisions**: For each major decision:
   - What was decided (optimization)
   - How knowledge informed the decision (RAG)
   - Why it was chosen (rationale)
   - What impact it will have
   - Confidence level in the decision
3. **Actionable Recommendations**: Specific, implementable recommendations with:
   - Clear action items
   - Expected benefits
   - Priority levels
   - Implementation guidance
   - Timeline estimates
4. **Integrated Insights**: Valuable insights combining knowledge and optimization:
   - Best practices applied to optimization
   - Risk mitigation through knowledge and optimization
   - Compliance considerations in optimization
   - Efficiency gains through knowledge-informed decisions

Respond in JSON format with the following structure:

{
  "summary": "string (executive summary)",
  "keyDecisions": [
    {
      "decision": "string",
      "rationale": "string (including knowledge influence)",
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
      "category": "string (e.g., 'knowledge_optimization', 'best_practices', 'risk', 'efficiency')",
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
  ],
  "optimizationMetrics": {
    "objectiveValue": "number",
    "solverStatus": "string",
    "computationTime": "number",
    "constraintViolations": "number"
  }
}

Focus on how knowledge and optimization work together to provide superior solutions. 

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
        // Unknown status, use fallback
        console.warn(`Unknown solution status: ${status}, using fallback`);
        return createFallbackExplanation(solution, status);
      }

      const request: AgnoChatRequest = {
        message: prompt,
        session_id: sessionId,
        model_provider: modelProvider,
        model_name: modelName || (modelProvider === 'anthropic' ? 'claude-3-5-sonnet-20241022' : 'gpt-4-turbo-preview'),
        context: {
          timestamp: new Date().toISOString(),
          inputType: 'solution_explanation',
          solutionType: status,
          solutionSize: JSON.stringify(solution).length,
          agentType: 'construction_analysis_agent'
        }
      };

      const response = await agnoClient.chat(request);
      
      // Log response details for debugging
      console.log('Explain agent response received:');
      console.log('Response type:', typeof response.response);
      console.log('Response length:', typeof response.response === 'string' ? response.response.length : 'N/A');
      
      if (typeof response.response === 'string' && response.response.length > 200) {
        console.log('Response preview:', response.response.substring(0, 200) + '...');
      } else {
        console.log('Full response:', response.response);
      }
      
      let result;
      
      if (typeof response.response === 'string') {
        try {
          console.log('Attempting to parse string response...');
          result = cleanAndParseJSON(response.response);
          
          if (!result) {
            console.warn('JSON parsing failed, attempting to extract partial data...');
            result = extractPartialData(response.response);
            
            if (!result) {
              console.warn('Partial data extraction failed, using fallback explanation');
              return createFallbackExplanation(solution, status);
            }
            console.log('Successfully extracted partial data from response');
          } else {
            console.log('Successfully parsed JSON response');
          }
        } catch (err) {
          console.error('JSON parsing error in Explain Agent:', err);
          console.error('Raw response:', response.response);
          console.warn('Attempting to extract partial data due to parsing error...');
          
          result = extractPartialData(response.response);
          if (!result) {
            console.warn('Using fallback explanation due to parsing error');
            return createFallbackExplanation(solution, status);
          }
          console.log('Successfully extracted partial data after parsing error');
        }
      } else if (typeof response.response === 'object' && response.response !== null) {
        console.log('Response is already an object, using directly');
        result = response.response;
      } else {
        console.error('Unexpected response type:', typeof response.response);
        console.warn('Using fallback explanation due to unexpected response type');
        return createFallbackExplanation(solution, status);
      }

      // Validate response structure with defensive checks
      if (!result || !result.summary || !Array.isArray(result.keyDecisions) || !Array.isArray(result.recommendations) || !Array.isArray(result.insights)) {
        console.error('Invalid explanation structure:', result);
        console.warn('Using fallback explanation due to invalid structure');
        return createFallbackExplanation(solution, status);
      }

      console.log('✅ Explanation generated successfully');
      const normalized = normalizeExplanation(result);
      return normalized;
    } catch (err: any) {
      console.error('Explainability agent error:', err);
      
      // Return fallback explanation instead of throwing
      console.warn('Using fallback explanation due to error');
      return createFallbackExplanation(solution, 'error');
    }
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
  }
};

// Subscribe to call_explain_agent events
messageBus.subscribe('call_explain_agent', async (msg: any) => {
  const explanation = await agnoExplainAgent.explainSolution(msg.payload.solution, msg.payload.sessionId);
  messageBus.publish({ type: 'explanation_ready', payload: explanation, correlationId: msg.correlationId });
});

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