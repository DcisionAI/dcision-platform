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

export const agnoExplainAgent = {
  /**
   * Generate a clear, actionable explanation of the solution (RAG, optimization, or hybrid).
   * @param solution The solution data (RAG result, optimization result, or both)
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
      const status = solution.status || 'unknown';
      let prompt = '';

      if (status === 'rag_completed') {
        prompt = `You are an expert construction knowledge analyst with deep expertise in industry best practices, regulations, and project management. 

Given the following RAG (Retrieval-Augmented Generation) result, create a comprehensive, actionable explanation:

**User Query:** ${solution.intent?.ragQuery || 'Unknown query'}

**RAG Answer:** ${solution.ragResult?.answer || 'No answer available'}

**Sources Used:** ${JSON.stringify(solution.ragResult?.sources?.map((s: any) => s.metadata?.sourceType) || [], null, 2)}

Please provide a detailed analysis that includes:

1. **Executive Summary**: A clear, high-level overview of the knowledge retrieved
2. **Key Information Extracted**: For each major piece of information:
   - What was found
   - Why it's relevant
   - How it applies to the user's situation
   - Confidence level in the information
3. **Actionable Recommendations**: Specific, implementable recommendations with:
   - Clear action items based on the knowledge
   - Expected benefits
   - Priority levels
   - Implementation guidance
   - Timeline estimates
4. **Knowledge Insights**: Valuable insights across different categories:
   - Best practices and standards
   - Risk mitigation strategies
   - Compliance requirements
   - Industry trends and innovations
   - Lessons learned and case studies

Respond in JSON format with the following structure:

{
  "summary": "string (executive summary)",
  "keyDecisions": [
    {
      "decision": "string (key information point)",
      "rationale": "string (why this information is important)",
      "impact": "string (how this affects the project/situation)",
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
      "category": "string (e.g., 'best_practices', 'compliance', 'risk', 'innovation')",
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

Focus on practical, actionable insights that construction managers can implement immediately.`;

      } else if (status === 'optimization_completed') {
        prompt = `You are an expert construction optimization analyst with deep expertise in project management, resource optimization, and business intelligence. 

Given the following optimization solution, create a comprehensive, actionable explanation:

${JSON.stringify(solution, null, 2)}

Please provide a detailed analysis that includes:

1. **Executive Summary**: A clear, high-level overview of the optimization results
2. **Key Decisions Analysis**: For each major decision made by the optimizer:
   - What was decided
   - Why it was chosen (rationale)
   - What impact it will have
   - Confidence level in the decision
3. **Actionable Recommendations**: Specific, implementable recommendations with:
   - Clear action items
   - Expected benefits
   - Priority levels
   - Implementation guidance
   - Timeline estimates
4. **Business Insights**: Valuable insights across different categories:
   - Cost savings and efficiency gains
   - Risk mitigation opportunities
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

Focus on practical, actionable insights that construction managers can implement immediately.`;

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

Focus on how knowledge and optimization work together to provide superior solutions.`;

      } else {
        throw new Error(`Unknown solution status: ${status}`);
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
          result = JSON.parse(response.response);
        } catch (err) {
          throw new Error('Invalid JSON response from explainability agent');
        }
      } else {
        result = response.response;
      }

      // Validate response structure
      if (!result.summary || !Array.isArray(result.keyDecisions) || !Array.isArray(result.recommendations) || !Array.isArray(result.insights)) {
        throw new Error('Invalid response structure from explainability agent');
      }

      return {
        explanation: result
      };
    } catch (err: any) {
      console.error('Explainability agent error:', err);
      throw new Error(`Solution explanation failed: ${err.message}`);
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