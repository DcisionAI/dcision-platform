// Agno-based Data Agent for DcisionAI
// This version simplifies the data enrichment to be more robust.

import { agnoClient, AgnoChatRequest } from '../../agno-client';

export interface EnrichedData {
  enrichedData: any;
  constraints: any[];
  metadata: {
    sourceType: string;
    enrichmentLevel: string;
    confidence: number;
  };
}

/**
 * Parses the AI's response to extract a JSON object.
 * @param response The raw string response from the AI.
 * @returns A parsed JSON object, or an empty object if parsing fails.
 */
function parseEnrichmentResponse(response: string | object): any {
  // If the response is already a parsed object, just return it.
  if (typeof response === 'object' && response !== null) {
    return response;
  }

  // If it's not a string, we can't parse it.
  if (typeof response !== 'string') {
    console.warn('Data Agent: Response is not a string or object, cannot parse.', { response });
    return {};
  }

  try {
    const startIndex = response.indexOf('{');
    const endIndex = response.lastIndexOf('}');
    if (startIndex === -1 || endIndex === -1) {
      console.warn('Data Agent: No JSON object found in AI response.');
      return {};
    }
    const jsonString = response.substring(startIndex, endIndex + 1);
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Data Agent: Failed to parse enriched data JSON from AI response.', {
      error,
      response,
    });
    return {}; // Return empty object on failure
  }
}

export const agnoDataAgent = {
  name: 'Construction Data Analysis Agent',
  description: 'Analyzes and enriches construction project data from natural language.',

  /**
   * Enrich customer data by extracting entities from natural language.
   */
  async enrichData(
    customerData: any, // This may be empty
    intent: any,
    sessionId?: string,
    modelProvider: 'anthropic' | 'openai' = 'anthropic',
    modelName?: string,
    userInput?: string
  ): Promise<EnrichedData> {
    const prompt = `
You are a data extraction expert for the construction industry. Your task is to analyze the user's request and extract key entities into a simple, valid JSON object.

User Input:
"""
${userInput || 'No user input provided.'}
"""

Based on the user's input, extract the following information:
- "crews": A list of worker types and their available counts (e.g., { "type": "carpenters", "count": 5 }).
- "tasks_or_phases": A list of project tasks or phases and their durations (e.g., { "name": "foundation", "duration": "2 weeks" }).
- "constraints": Any specific constraints mentioned (e.g., { "type": "max_workers", "limit": 15 }).
- "objective": The primary goal of the optimization (e.g., "Minimize project duration").

IMPORTANT:
- Produce ONLY a valid JSON object.
- Do not include any other text, explanations, or markdown formatting like \`\`\`json.
- If a piece of information is not present in the user input, omit the key from the JSON.

Example of a valid response:
{
  "crews": [
    { "type": "carpenters", "count": 5 },
    { "type": "electricians", "count": 5 }
  ],
  "tasks_or_phases": [
    { "name": "foundation", "duration": "2 weeks" }
  ],
  "constraints": [
    { "type": "max_workers", "limit": 15 }
  ],
  "objective": "Minimize project duration"
}
`;

    try {
      const aiResponse = await agnoClient.chat({
        message: prompt,
        session_id: sessionId,
        model_provider: modelProvider,
        model_name: modelName,
      });

      const enrichedDataPayload = parseEnrichmentResponse(aiResponse.response);

      return {
        enrichedData: enrichedDataPayload,
        constraints: enrichedDataPayload.constraints || [],
        metadata: {
          sourceType: 'natural_language_extraction',
          enrichmentLevel: 'shallow',
          confidence: Object.keys(enrichedDataPayload).length > 0 ? 0.85 : 0.2,
        },
      };
    } catch (error) {
      console.error('An error occurred in the Data Agent:', error);
      return {
        enrichedData: { error: 'Data enrichment failed.' },
        constraints: [],
        metadata: {
          sourceType: 'error',
          enrichmentLevel: 'none',
          confidence: 0,
        },
      };
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