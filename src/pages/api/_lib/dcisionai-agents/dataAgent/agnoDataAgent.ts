// Agno-based Data Agent for DcisionAI
// Now uses the real Agno Python backend for advanced AI capabilities

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

function isValidEnrichedData(obj: any): obj is EnrichedData {
  return (
    obj &&
    typeof obj === 'object' &&
    'resources' in obj &&
    'timeline' in obj &&
    'costs' in obj &&
    'quality' in obj &&
    'risks' in obj
  );
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
      
      // If we have incomplete arrays, close them
      const openBrackets = (cleaned.match(/\[/g) || []).length;
      const closeBrackets = (cleaned.match(/\]/g) || []).length;
      
      for (let i = 0; i < openBrackets - closeBrackets; i++) {
        cleaned += ']';
      }
    }
    
    // Fix common JSON issues
    cleaned = cleaned
      .replace(/(\d+)\s+"([^"]+)"/g, '$1, "$2"') // Fix: 50 "cubic yards" -> 50, "cubic yards"
      .replace(/(\d+)\s+([a-zA-Z]+)/g, '$1, "$2"') // Fix: 50 cubic yards -> 50, "cubic yards"
      .replace(/,\s*}/g, '}') // Remove trailing commas
      .replace(/,\s*]/g, ']'); // Remove trailing commas in arrays
    
    try {
      return JSON.parse(cleaned);
    } catch (err2: any) {
      // If still failing, try to create a minimal valid structure
      console.warn('Failed to parse JSON, creating fallback structure');
      return {
        resources: { crews: [], equipment: [], materials: [] },
        timeline: { tasks: [], dependencies: [], milestones: [] },
        costs: { labor: {}, equipment: {}, materials: {}, overhead: {} },
        quality: { standards: [], inspections: [], requirements: [] },
        risks: { identified: [], mitigations: [], impacts: [] }
      };
    }
  }
}

export const agnoDataAgent = {
  name: 'Construction Data Analysis Agent',
  description: 'Analyzes and enriches construction project data',

  /**
   * Enrich customer data with construction-specific constraints and validations.
   * @param customerData The raw data uploaded by the customer
   * @param intent The intent or purpose of the data
   * @param sessionId Optional session ID for conversation continuity
   * @param modelProvider Optional model provider (anthropic or openai)
   * @param modelName Optional specific model name
   * @returns { enrichedData, constraints }
   */
  async enrichData(
    customerData: any,
    intent: any,
    sessionId?: string,
    modelProvider: 'anthropic' | 'openai' = 'anthropic',
    modelName?: string
  ): Promise<EnrichedData> {
    try {
      const prompt = `You are a construction data analysis expert. Your task is to analyze and enrich the provided data for optimization.

Customer Data:
${JSON.stringify(customerData, null, 2)}

Intent Analysis:
${JSON.stringify(intent, null, 2)}

Please analyze the data and provide enriched information in VALID JSON format. IMPORTANT: Ensure all string values are properly quoted and the JSON is complete and valid.

{
  "resources": {
    "crews": [],
    "equipment": [],
    "materials": []
  },
  "timeline": {
    "tasks": [],
    "dependencies": [],
    "milestones": []
  },
  "costs": {
    "labor": {},
    "equipment": {},
    "materials": {},
    "overhead": {}
  },
  "quality": {
    "standards": [],
    "inspections": [],
    "requirements": []
  },
  "risks": {
    "identified": [],
    "mitigations": [],
    "impacts": []
  }
}

Consider construction industry best practices, regulatory requirements, and optimization principles in your analysis. Return ONLY the JSON object, no additional text.`;

      const request: AgnoChatRequest = {
        message: prompt,
        session_id: sessionId,
        model_provider: modelProvider,
        model_name: modelName || (modelProvider === 'anthropic' ? 'claude-3-5-sonnet-20241022' : 'gpt-4-turbo-preview'),
        context: {
          timestamp: new Date().toISOString(),
          inputType: 'data_enrichment',
          dataSize: JSON.stringify(customerData).length,
          agentType: 'construction_data_analyzer'
        }
      };

      const response = await agnoClient.chat(request);
      let result;
      
      if (typeof response.response === 'string') {
        try {
          result = cleanAndParseJSON(response.response);
        } catch (err) {
          console.error('JSON parsing error:', err);
          console.error('Raw response:', response.response);
          throw new Error('Invalid JSON response from data agent');
        }
      } else {
        result = response.response;
      }

      // Validate response structure
      if (!isValidEnrichedData(result)) {
        console.error('Invalid response structure:', result);
        throw new Error('Invalid response structure from data agent');
      }

      return result;
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