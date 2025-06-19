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
    Array.isArray(obj.constraints.dense) &&
    Array.isArray(obj.constraints.sparse) &&
    typeof obj.objective === 'object' &&
    typeof obj.solver_config === 'object'
  );
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

Consider construction industry best practices, regulatory requirements, and optimization principles in your model.`;

      const request: AgnoChatRequest = {
        message: prompt,
        session_id: sessionId,
        model_provider: modelProvider,
        model_name: modelName || (modelProvider === 'anthropic' ? 'claude-3-5-sonnet-20241022' : 'gpt-4-turbo-preview'),
        context: {
          timestamp: new Date().toISOString(),
          inputType: 'model_building',
          decisionType: intent.decisionType,
          dataSize: JSON.stringify(enrichedData).length,
          agentType: 'construction_model_builder'
        }
      };

      const response = await agnoClient.chat(request);
      let result;
      
      if (typeof response.response === 'string') {
        try {
          result = JSON.parse(response.response);
        } catch (err) {
          throw new Error('Invalid JSON response from model builder agent');
        }
      } else {
        result = response.response;
      }

      // Validate response structure
      if (!isValidMCPConfig(result)) {
        throw new Error('Invalid response structure from model builder agent');
      }

      return {
        mcpConfig: result,
        confidence: 0.95, // Assuming a default confidence
        reasoning: 'Reasoning not provided in the original code'
      };
    } catch (err: any) {
      console.error('Model builder agent error:', err);
      throw new Error(`Model building failed: ${err.message}`);
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