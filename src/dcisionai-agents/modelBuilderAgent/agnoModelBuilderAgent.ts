// Agno-based Model Builder Agent for DcisionAI
// Now uses the real Agno Python backend for advanced AI capabilities

import { agnoClient, AgnoChatRequest } from '../../lib/agno-client';

export interface MCPConfig {
  variables: Array<{
    name: string;
    type: string;
    bounds?: [number, number];
    description: string;
  }>;
  constraints: Array<{
    expression: string;
    description: string;
    type: 'equality' | 'inequality' | 'bound';
    priority: 'hard' | 'soft';
  }>;
  objective: {
    type: 'minimize' | 'maximize';
    expression: string;
    description: string;
  };
  parameters: Record<string, any>;
  solver_config: {
    solver_type: string;
    timeout_seconds: number;
    tolerance: number;
  };
}

export const agnoModelBuilderAgent = {
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
  ): Promise<{ mcpConfig: MCPConfig }> {
    try {
      const prompt = `You are an expert construction optimization model builder with deep expertise in mathematical programming, OR-Tools, and construction management optimization. 

Given the following enriched data and intent, create a comprehensive OR-Tools compatible MCP configuration:

**Enriched Data:**
${JSON.stringify(enrichedData, null, 2)}

**Intent:**
${JSON.stringify(intent, null, 2)}

Please create a detailed optimization model configuration that includes:

1. **Variables**: All necessary decision variables with:
   - Clear naming conventions
   - Appropriate types (integer, continuous, binary)
   - Realistic bounds based on construction constraints
   - Descriptive names and explanations

2. **Constraints**: All relevant constraints including:
   - Resource capacity constraints
   - Timeline and scheduling constraints
   - Budget and cost constraints
   - Quality and safety requirements
   - Logical and operational constraints
   - Priority levels (hard vs soft constraints)

3. **Objective Function**: A well-defined objective that:
   - Aligns with the decision type and intent
   - Balances multiple objectives if needed
   - Uses appropriate weights and scaling
   - Is clearly explained and justified

4. **Solver Configuration**: Appropriate solver settings for:
   - Construction-scale optimization problems
   - Reasonable timeouts and tolerances
   - Robust solution methods

Respond in JSON format with the following structure:

{
  "variables": [
    {
      "name": "string",
      "type": "integer|continuous|binary",
      "bounds": [number, number],
      "description": "string"
    }
  ],
  "constraints": [
    {
      "expression": "string (mathematical expression)",
      "description": "string",
      "type": "equality|inequality|bound",
      "priority": "hard|soft"
    }
  ],
  "objective": {
    "type": "minimize|maximize",
    "expression": "string (mathematical expression)",
    "description": "string"
  },
  "parameters": {
    "param1": "value1"
  },
  "solver_config": {
    "solver_type": "string",
    "timeout_seconds": "number",
    "tolerance": "number"
  }
}

Ensure all mathematical expressions are valid OR-Tools syntax and consider construction industry best practices.`;

      const request: AgnoChatRequest = {
        message: prompt,
        session_id: sessionId,
        model_provider: modelProvider,
        model_name: modelName || (modelProvider === 'anthropic' ? 'claude-3-sonnet-20240229' : 'gpt-4-turbo-preview'),
        context: {
          timestamp: new Date().toISOString(),
          inputType: 'model_building',
          decisionType: intent.decisionType,
          dataSize: JSON.stringify(enrichedData).length,
          agentType: 'construction_model_builder'
        }
      };

      const response = await agnoClient.chat(request);
      const result = JSON.parse(response.response);

      // Validate response structure
      if (!result.variables || !result.constraints || !result.objective || !result.solver_config) {
        throw new Error('Invalid response structure from model builder agent');
      }

      return {
        mcpConfig: result
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