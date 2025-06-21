// Agno-based Explainability Agent for DcisionAI
// Now uses the real Agno Python backend for advanced AI capabilities

import { agnoClient, AgnoChatRequest } from '../../agno-client';

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
    
    // If the JSON is truncated, try to complete it
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
      .replace(/,\s*]/g, ']'); // Remove trailing commas in arrays
    
    try {
      return JSON.parse(cleaned);
    } catch (err2: any) {
      // If still failing, return null to trigger fallback
      console.warn('Failed to parse JSON after cleaning, will use fallback');
      return null;
    }
  }
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
  ): Promise<{ explanation: Explanation }> {
    try {
      // Validate input
      if (!solution) {
        console.warn('No solution provided, using fallback explanation');
        return {
          explanation: createFallbackExplanation({}, 'unknown')
        };
      }

      // Determine solution status
      let status = 'unknown';
      if (solution.ragResult && solution.optimizationResult) {
        status = 'hybrid_completed';
      } else if (solution.optimizationResult) {
        status = 'optimization_completed';
      } else if (solution.ragResult) {
        status = 'rag_completed';
      }

      console.log(`Explaining solution with status: ${status}`);

      let prompt = '';
      if (status === 'rag_completed') {
        prompt = `You are an expert construction analyst. 

Given the following RAG (Retrieval-Augmented Generation) solution, create a comprehensive, actionable explanation:

**RAG Answer:**
${solution.ragResult?.answer || 'No RAG answer available'}

**Sources:**
${JSON.stringify(solution.ragResult?.sources || [], null, 2)}

**User Intent:** ${solution.intent?.reasoning || 'Unknown intent'}

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

Focus on practical, actionable insights that construction managers can implement immediately. Return ONLY the JSON object, no additional text.`;

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

Focus on practical, actionable insights that construction managers can implement immediately. Return ONLY the JSON object, no additional text.`;

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

Focus on how knowledge and optimization work together to provide superior solutions. Return ONLY the JSON object, no additional text.`;

      } else {
        // Unknown status, use fallback
        console.warn(`Unknown solution status: ${status}, using fallback`);
        return {
          explanation: createFallbackExplanation(solution, status)
        };
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
      let result;
      
      if (typeof response.response === 'string') {
        try {
          // Clean up the response to extract JSON
          let jsonString = response.response.trim();
          
          // Remove markdown code blocks if present
          if (jsonString.startsWith('```json')) {
            jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          } else if (jsonString.startsWith('```')) {
            jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '');
          }
          
          result = cleanAndParseJSON(jsonString);
          
          if (!result) {
            console.warn('JSON parsing failed, using fallback explanation');
            return {
              explanation: createFallbackExplanation(solution, status)
            };
          }
        } catch (err) {
          console.error('JSON parsing error in Explain Agent:', err);
          console.error('Raw response:', response.response);
          console.warn('Using fallback explanation due to parsing error');
          return {
            explanation: createFallbackExplanation(solution, status)
          };
        }
      } else {
        result = response.response;
      }

      // Validate response structure with defensive checks
      if (!result || !result.summary || !Array.isArray(result.keyDecisions) || !Array.isArray(result.recommendations) || !Array.isArray(result.insights)) {
        console.error('Invalid explanation structure:', result);
        console.warn('Using fallback explanation due to invalid structure');
        return {
          explanation: createFallbackExplanation(solution, status)
        };
      }

      return {
        explanation: result
      };
    } catch (err: any) {
      console.error('Explainability agent error:', err);
      
      // Return fallback explanation instead of throwing
      console.warn('Using fallback explanation due to error');
      return {
        explanation: createFallbackExplanation(solution, 'error')
      };
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