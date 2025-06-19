// Agno-based Data Agent for DcisionAI
// Now uses the real Agno Python backend for advanced AI capabilities

import { agnoClient, AgnoChatRequest } from '../../lib/agno-client';

export interface EnrichedData {
  enrichedData: any;
  constraints: Array<{
    type: string;
    description: string;
    parameters: Record<string, any>;
  }>;
}

export const agnoDataAgent = {
  /**
   * Enrich customer data with construction-specific constraints and validations.
   * @param customerData The raw data uploaded by the customer
   * @param sessionId Optional session ID for conversation continuity
   * @param modelProvider Optional model provider (anthropic or openai)
   * @param modelName Optional specific model name
   * @returns { enrichedData, constraints }
   */
  async enrichData(
    customerData: any, 
    sessionId?: string,
    modelProvider: 'anthropic' | 'openai' = 'anthropic',
    modelName?: string
  ): Promise<EnrichedData> {
    try {
      const prompt = `You are an expert construction data analyst with deep knowledge of industry standards, best practices, and regulatory requirements. 

Given the following customer data:
${JSON.stringify(customerData, null, 2)}

Please perform a comprehensive analysis and enrichment:

1. **Data Enrichment**: Add missing fields based on construction best practices and industry standards
2. **Constraint Identification**: Identify and add relevant constraints based on:
   - Safety regulations and compliance requirements
   - Resource availability and capacity limits
   - Budget and cost constraints
   - Timeline and scheduling constraints
   - Quality standards and specifications
3. **Data Validation**: Validate the data against industry requirements and flag any issues
4. **Recommendations**: Suggest improvements or additional data points needed

Respond in JSON format with the following structure:
{
  "enrichedData": {
    // Original data plus enriched fields with explanations
  },
  "constraints": [
    {
      "type": "string (e.g., 'safety', 'resource', 'budget', 'timeline', 'quality')",
      "description": "string",
      "parameters": {
        "param1": "value1",
        "priority": "high|medium|low",
        "enforcement": "strict|flexible"
      }
    }
  ]
}`;

      const request: AgnoChatRequest = {
        message: prompt,
        session_id: sessionId,
        model_provider: modelProvider,
        model_name: modelName || (modelProvider === 'anthropic' ? 'claude-3-sonnet-20240229' : 'gpt-4-turbo-preview'),
        context: {
          timestamp: new Date().toISOString(),
          inputType: 'data_enrichment',
          dataType: typeof customerData,
          dataSize: JSON.stringify(customerData).length,
          agentType: 'construction_data_analyst'
        }
      };

      const response = await agnoClient.chat(request);
      const result = JSON.parse(response.response);

      // Validate response structure
      if (!result.enrichedData || !Array.isArray(result.constraints)) {
        throw new Error('Invalid response structure from data agent');
      }

      return {
        enrichedData: result.enrichedData,
        constraints: result.constraints
      };
    } catch (err: any) {
      console.error('Data agent error:', err);
      throw new Error(`Data enrichment failed: ${err.message}`);
    }
  },

  /**
   * Create a specialized construction data analysis agent
   * @param modelProvider Optional model provider
   * @param modelName Optional specific model name
   * @returns Agent ID
   */
  async createSpecializedAgent(
    modelProvider: 'anthropic' | 'openai' = 'anthropic',
    modelName?: string
  ): Promise<string> {
    return await agnoClient.createDataAnalysisAgent(modelProvider, modelName);
  }
}; 