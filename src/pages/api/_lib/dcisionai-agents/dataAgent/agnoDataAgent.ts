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
 * Robust JSON parsing function that handles various response formats
 */
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
      .replace(/,\s*]/g, ']') // Remove trailing commas in arrays
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
      .replace(/\n/g, ' ') // Replace newlines with spaces
      .replace(/\r/g, '') // Remove carriage returns
      .replace(/\t/g, ' ') // Replace tabs with spaces
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    try {
      return JSON.parse(cleaned);
    } catch (err2: any) {
      // If still failing, return null to trigger fallback
      console.warn('Failed to parse JSON after cleaning, will use fallback');
      console.log('Cleaned JSON string:', cleaned);
      return null;
    }
  }
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
    const result = cleanAndParseJSON(response);
    if (!result) {
      console.warn('Data Agent: JSON parsing failed after cleaning');
      return {};
    }
    return result;
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

CRITICAL: You MUST respond with ONLY a valid JSON object. Do not include any markdown formatting, code blocks, or additional text. The JSON must be properly formatted and complete.

IMPORTANT RULES:
1. All string values must be properly quoted.
2. All arrays must be properly formatted with square brackets.
3. All numbers must not be quoted.
4. If a piece of information is not present in the user input, omit the key from the JSON.
5. Return ONLY the JSON structure below, no additional text.

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

Return ONLY the JSON object:`;

    try {
      const aiResponse = await agnoClient.chat({
        message: prompt,
        session_id: sessionId,
        model_provider: modelProvider,
        model_name: modelName,
      });

      // Log response details for debugging
      console.log('Data agent response received:');
      console.log('Response type:', typeof aiResponse.response);
      console.log('Response length:', typeof aiResponse.response === 'string' ? aiResponse.response.length : 'N/A');
      
      if (typeof aiResponse.response === 'string' && aiResponse.response.length > 200) {
        console.log('Response preview:', aiResponse.response.substring(0, 200) + '...');
      } else {
        console.log('Full response:', aiResponse.response);
      }

      const enrichedDataPayload = parseEnrichmentResponse(aiResponse.response);

      console.log('✅ Data enrichment completed successfully');
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