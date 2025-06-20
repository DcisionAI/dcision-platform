// Agno-based Model Builder Agent for DcisionAI
// Now uses the real Agno Python backend for advanced AI capabilities

import { agnoClient, AgnoChatRequest } from '../../agno-client';
import { MCPConfig } from '../../mcp/MCPTypes';

export interface ModelBuilderResult {
  mcpConfig: MCPConfig;
  confidence: number;
  reasoning: string;
}

function isValidMCPConfig(obj: any): obj is MCPConfig {
  return (
    obj &&
    typeof obj === 'object' &&
    Array.isArray(obj.variables) &&
    typeof obj.constraints === 'object' &&
    Array.isArray(obj.constraints?.dense) &&
    Array.isArray(obj.constraints?.sparse) &&
    typeof obj.objective === 'object' &&
    typeof obj.solver_config === 'object'
  );
}

function createFallbackMCPConfig(enrichedData: any, intent: any): MCPConfig {
  console.warn('Creating fallback MCP config due to invalid response');
  
  // Extract basic info from enriched data with defensive checks
  const crews = enrichedData?.resources?.crews || [];
  const tasks = enrichedData?.timeline?.tasks || [];
  const costs = enrichedData?.costs || {};
  
  // Create basic variables
  const variables: Array<{
    name: string;
    type: 'continuous' | 'integer' | 'binary';
    lower_bound: number;
    upper_bound: number;
    description: string;
  }> = [
    {
      name: "project_duration",
      type: "continuous",
      lower_bound: 1,
      upper_bound: 365,
      description: "Total project duration in days"
    },
    {
      name: "total_cost",
      type: "continuous", 
      lower_bound: 0,
      upper_bound: 10000000,
      description: "Total project cost"
    }
  ];
  
  // Add crew variables if available
  crews.forEach((crew: any, index: number) => {
    variables.push({
      name: `crew_${crew.id || index}`,
      type: "integer",
      lower_bound: 0,
      upper_bound: crew.size || 20,
      description: `Number of workers in ${crew.name || 'crew'}`
    });
  });
  
  // Create basic constraints
  const constraints = {
    dense: [
      {
        name: "budget_constraint",
        coefficients: [0, 1], // [project_duration, total_cost]
        variables: ["project_duration", "total_cost"],
        operator: "<=" as const,
        rhs: costs.labor?.total_budget || 1000000,
        description: "Total cost must not exceed budget"
      }
    ],
    sparse: []
  };
  
  // Create objective
  const objective = {
    name: "minimize_duration",
    sense: "minimize" as const,
    coefficients: [1, 0], // [project_duration, total_cost]
    variables: ["project_duration", "total_cost"],
    description: "Minimize project duration"
  };
  
  // Create solver config
  const solver_config = {
    time_limit: 300,
    gap_tolerance: 0.01,
    construction_heuristics: true
  };
  
  return {
    variables,
    constraints,
    objective,
    solver_config
  };
}

export const agnoModelBuilderAgent = {
  name: 'Construction Model Builder Agent',
  description: 'Builds optimization models for construction problems',

  /**
   * Build an OR-Tools compatible optimization model (MCP config) from enriched data and intent.
   * @param enrichedData The data enriched by the Data Agent
   * @param intent The interpreted intent from the Intent Agent
   * @param sessionId Optional session ID for conversation continuity
   * @param modelProvider Optional model provider (anthropic or openai)
   * @param modelName Optional specific model name
   * @returns { mcpConfig }
   */
  async buildModel(
    enrichedData: any, 
    intent: any, 
    sessionId?: string,
    modelProvider: 'anthropic' | 'openai' = 'anthropic',
    modelName?: string
  ): Promise<ModelBuilderResult> {
    try {
      // Validate input data
      if (!enrichedData) {
        console.warn('No enriched data provided, using fallback');
        const fallbackConfig = createFallbackMCPConfig({}, intent);
        return {
          mcpConfig: fallbackConfig,
          confidence: 0.5,
          reasoning: 'Fallback model created due to missing enriched data'
        };
      }

      // Log the input data for debugging
      console.log('Model Builder Input - Enriched Data Keys:', Object.keys(enrichedData));
      console.log('Model Builder Input - Intent:', intent?.decisionType);

      const prompt = `You are a construction optimization expert. Your task is to build a mathematical optimization model for the given problem.

Enriched Data:
${JSON.stringify(enrichedData, null, 2)}

Intent Analysis:
${JSON.stringify(intent, null, 2)}

Please build an optimization model in JSON format:

{
  "variables": [
    {
      "name": "string",
      "type": "continuous|integer|binary",
      "lower_bound": number,
      "upper_bound": number,
      "description": "string"
    }
  ],
  "constraints": {
    "dense": [
      {
        "name": "string",
        "coefficients": [number],
        "variables": ["string"],
        "operator": "<=|>=|=",
        "rhs": number,
        "description": "string"
      }
    ],
    "sparse": []
  },
  "objective": {
    "name": "string",
    "sense": "minimize|maximize",
    "coefficients": [number],
    "variables": ["string"],
    "description": "string"
  },
  "solver_config": {
    "time_limit": number,
    "gap_tolerance": number,
    "construction_heuristics": boolean
  }
}

Consider construction industry best practices, regulatory requirements, and optimization principles in your model. Return ONLY the JSON object, no additional text.`;

      const request: AgnoChatRequest = {
        message: prompt,
        session_id: sessionId,
        model_provider: modelProvider,
        model_name: modelName || (modelProvider === 'anthropic' ? 'claude-3-5-sonnet-20241022' : 'gpt-4-turbo-preview'),
        context: {
          timestamp: new Date().toISOString(),
          inputType: 'model_building',
          decisionType: intent?.decisionType || 'unknown',
          dataSize: JSON.stringify(enrichedData).length,
          agentType: 'construction_model_builder'
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
          
          result = JSON.parse(jsonString);
        } catch (err) {
          console.error('JSON parsing error in Model Builder:', err);
          console.error('Raw response:', response.response);
          throw new Error('Invalid JSON response from model builder agent');
        }
      } else {
        result = response.response;
      }

      // Validate response structure with defensive checks
      if (!isValidMCPConfig(result)) {
        console.error('Invalid MCP config structure:', result);
        console.log('Creating fallback MCP config');
        const fallbackConfig = createFallbackMCPConfig(enrichedData, intent);
        return {
          mcpConfig: fallbackConfig,
          confidence: 0.6,
          reasoning: 'Fallback model created due to invalid response structure'
        };
      }

      return {
        mcpConfig: result,
        confidence: 0.95,
        reasoning: 'Model built successfully from enriched data and intent analysis'
      };
    } catch (err: any) {
      console.error('Model builder agent error:', err);
      
      // Create fallback config on any error
      console.log('Creating fallback MCP config due to error');
      const fallbackConfig = createFallbackMCPConfig(enrichedData, intent);
      
      return {
        mcpConfig: fallbackConfig,
        confidence: 0.4,
        reasoning: `Fallback model created due to error: ${err.message}`
      };
    }
  },

  /**
   * Create a specialized construction model building agent
   * @param modelProvider Optional model provider
   * @param modelName Optional specific model name
   * @returns Agent ID
   */
  async createSpecializedAgent(
    modelProvider: 'anthropic' | 'openai' = 'anthropic',
    modelName?: string
  ): Promise<string> {
    const config = {
      name: 'Construction Model Builder Agent',
      instructions: `You are an expert construction optimization model builder specializing in:
- Mathematical programming and optimization theory
- OR-Tools and constraint programming
- Construction management optimization problems
- Resource allocation and scheduling models
- Cost optimization and budget management
- Risk assessment and mitigation modeling
- Multi-objective optimization and trade-off analysis
- Solver configuration and performance tuning

Your role is to translate construction management requirements into precise mathematical optimization models that can be solved efficiently using OR-Tools.`,
      model_provider: modelProvider,
      model_name: modelName,
      temperature: 0.1,
      markdown: true
    };

    const result = await agnoClient.createAgent(config);
    return result.agent_id;
  }
}; 