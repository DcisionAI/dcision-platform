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
  // Enhanced optimization classification
  optimizationType?: string;
  modelType?: 'LP' | 'MIP' | 'QP' | 'NLP';
  problemComplexity?: 'basic' | 'intermediate' | 'advanced';
  templateRecommendations?: string[];
  extractedParameters?: Record<string, any>;
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
   * @returns { decisionType, confidence, reasoning, primaryIntent, secondaryIntent, keywords, ragQuery?, optimizationQuery?, optimizationType?, modelType?, problemComplexity?, templateRecommendations?, extractedParameters? }
   */
  async analyzeIntent(
    userInput: string, 
    sessionId?: string,
    modelProvider: 'anthropic' | 'openai' = 'anthropic',
    modelName?: string
  ): Promise<IntentResult> {
    try {
      const prompt = `You are a construction domain expert specializing in optimization problem classification. Your task is to analyze user requests and determine the best execution path and optimization problem characteristics.

EXECUTION PATHS:
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

OPTIMIZATION PROBLEM TYPES:
- crew_assignment: Workforce scheduling and crew allocation
- resource_allocation: Equipment, material, and resource distribution
- cost_optimization: Cost minimization and budget optimization
- supply_chain: Supplier selection and logistics optimization
- risk_management: Risk mitigation and safety optimization
- project_scheduling: Task sequencing and timeline optimization
- equipment_allocation: Equipment assignment and utilization
- material_optimization: Material selection and quantity optimization

MODEL TYPES:
- LP (Linear Programming): Linear objective and constraints
- MIP (Mixed Integer Programming): Some variables must be integers
- QP (Quadratic Programming): Quadratic objective function
- NLP (Non-Linear Programming): Non-linear objective or constraints

PROBLEM COMPLEXITY:
- basic: Simple problems with few variables and constraints
- intermediate: Moderate complexity with realistic constraints
- advanced: Complex problems with many variables and sophisticated constraints

Analyze this request:
"${userInput}"

Please provide a detailed response in JSON format. IMPORTANT: If the "primaryIntent" is "knowledge_retrieval", you MUST return "null" for all optimization-related fields (optimizationQuery, optimizationType, modelType, problemComplexity, templateRecommendations, extractedParameters). If the "primaryIntent" is "optimization" or "hybrid_analysis", you MUST return "null" for "ragQuery".

{
  "decisionType": "string (specific decision category)",
  "primaryIntent": "knowledge_retrieval|optimization|hybrid_analysis",
  "secondaryIntent": "string (optional secondary intent)",
  "keywords": ["array", "of", "relevant", "keywords"],
  "ragQuery": "string (refined query for knowledge base, only if RAG needed)",
  "optimizationQuery": "string (optimization problem description, only if optimization needed)",
  "optimizationType": "string (crew_assignment|resource_allocation|cost_optimization|supply_chain|risk_management|project_scheduling|equipment_allocation|material_optimization)",
  "modelType": "string (LP|MIP|QP|NLP)",
  "problemComplexity": "string (basic|intermediate|advanced)",
  "templateRecommendations": ["array", "of", "template", "IDs"],
  "extractedParameters": {
    "budget_limit": "number (if mentioned)",
    "time_limit": "number (if mentioned)",
    "crew_types": ["array", "of", "crew", "types"],
    "resource_types": ["array", "of", "resource", "types"],
    "constraints": ["array", "of", "constraint", "descriptions"]
  },
  "confidence": "number (0-1, confidence in the interpretation)",
  "reasoning": "string (explanation of the decision and path choice)"
}

Consider construction industry best practices, regulatory requirements, and optimization principles in your analysis.`;

      const request: AgnoChatRequest = {
        message: prompt,
        session_id: sessionId,
        model_provider: modelProvider,
        model_name: modelName,
        context: {
          timestamp: new Date().toISOString(),
          inputType: 'intent_analysis',
          userInputLength: userInput.length,
          agentType: 'construction_intent_analyzer'
        }
      };

      const response = await agnoClient.chat(request);
      
      if (!response.response) {
        throw new Error('No response content from Agno');
      }

      // Try to parse JSON response
      let parsedResponse: any;
      try {
        if (typeof response.response === 'object' && response.response !== null) {
          // If the response is already a JSON object, use it directly
          parsedResponse = response.response;
        } else if (typeof response.response === 'string') {
          // Sanitize the string to remove control characters before parsing
          const sanitizedString = response.response.replace(/[\\x00-\\x1F\\x7F-\\x9F]/g, '');
          const jsonMatch = sanitizedString.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsedResponse = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No JSON found in string response');
          }
        } else {
          throw new Error('Response is not a string or a valid JSON object');
        }
      } catch (parseError) {
        console.error('Failed to parse intent analysis response:', parseError);
        console.log('Raw response:', response.response);
        
        // Return fallback response
        return {
          decisionType: 'resource-allocation',
          primaryIntent: 'optimization',
          keywords: ['optimization', 'construction'],
          optimizationType: 'crew_assignment',
          modelType: 'MIP',
          problemComplexity: 'basic',
          templateRecommendations: ['crew_assignment_basic'],
          extractedParameters: {},
          confidence: 0.5,
          reasoning: 'Fallback response due to parsing error'
        };
      }

      // Validate and normalize response
      const result: IntentResult = {
        decisionType: parsedResponse.decisionType || 'resource-allocation',
        primaryIntent: parsedResponse.primaryIntent || 'optimization',
        secondaryIntent: parsedResponse.secondaryIntent,
        keywords: Array.isArray(parsedResponse.keywords) ? parsedResponse.keywords : ['optimization'],
        ragQuery: parsedResponse.ragQuery,
        optimizationQuery: parsedResponse.optimizationQuery,
        optimizationType: parsedResponse.optimizationType || 'crew_assignment',
        modelType: parsedResponse.modelType || 'MIP',
        problemComplexity: parsedResponse.problemComplexity || 'basic',
        templateRecommendations: Array.isArray(parsedResponse.templateRecommendations) ? parsedResponse.templateRecommendations : [],
        extractedParameters: parsedResponse.extractedParameters || {},
        confidence: typeof parsedResponse.confidence === 'number' ? parsedResponse.confidence : 0.8,
        reasoning: parsedResponse.reasoning || 'Intent analysis completed'
      };

      return result;

    } catch (error) {
      console.error('Error in intent analysis:', error);
      
      // Return fallback response
      return {
        decisionType: 'resource-allocation',
        primaryIntent: 'optimization',
        keywords: ['optimization', 'construction'],
        optimizationType: 'crew_assignment',
        modelType: 'MIP',
        problemComplexity: 'basic',
        templateRecommendations: ['crew_assignment_basic'],
        extractedParameters: {},
        confidence: 0.5,
        reasoning: 'Fallback response due to error in intent analysis'
      };
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
   * Get template recommendations based on intent analysis
   * @param intentResult The result from intent analysis
   * @returns Array of recommended template IDs
   */
  getTemplateRecommendations(intentResult: IntentResult): string[] {
    const recommendations: string[] = [];
    
    // Add recommendations based on optimization type
    if (intentResult.optimizationType) {
      switch (intentResult.optimizationType) {
        case 'crew_assignment':
          recommendations.push('crew_assignment_basic');
          break;
        case 'resource_allocation':
          recommendations.push('resource_allocation_basic');
          break;
        case 'cost_optimization':
          recommendations.push('cost_optimization_basic');
          break;
        case 'supply_chain':
          recommendations.push('supply_chain_basic');
          break;
        case 'risk_management':
          recommendations.push('risk_management_basic');
          break;
      }
    }
    
    // Add recommendations based on model type
    if (intentResult.modelType) {
      // Could add model-type specific templates here
    }
    
    // Add recommendations based on complexity
    if (intentResult.problemComplexity) {
      // Could add complexity-specific templates here
    }
    
    return recommendations.length > 0 ? recommendations : ['crew_assignment_basic'];
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

You must accurately classify each request and provide the appropriate parameters for the chosen path, including:
- Optimization problem type (crew_assignment, resource_allocation, etc.)
- Model type (LP, MIP, QP, NLP)
- Problem complexity (basic, intermediate, advanced)
- Template recommendations
- Extracted parameters`,
      model_provider: modelProvider,
      model_name: modelName,
      temperature: 0.1,
      markdown: true
    };

    const result = await agnoClient.createAgent(config);
    return result.agent_id;
  }
}; 