import { MCPAgent, AgentRunContext, AgentRunResult } from './AgentRegistry';
import { StepAction, ProtocolStep, MCP } from '../types';
import { extractJsonFromMarkdown } from '../utils/markdown';
import { callOpenAI } from './llm/openai';

interface FieldMapping {
  customerField: string;
  requiredField: string;
  confidence: number;
  transformations?: string[];
}

export class DataMappingAgent implements MCPAgent {
  name = 'Data Mapping Agent';
  supportedActions: StepAction[] = ['map_data'];

  async run(step: ProtocolStep, mcp: MCP, context?: AgentRunContext): Promise<AgentRunResult> {
    const customerFields = (mcp.context?.dataset?.metadata?.customerFields as string[]) || [];
    const requiredFields = (mcp.context?.dataset?.requiredFields as string[]) || [];
    const problemType = mcp.context?.problemType || 'custom';
    const intentDetails = mcp.context?.dataset?.metadata?.intentDetails;
    const thoughtProcess: string[] = [];
    const onProgress = context?.onProgress || (() => {});

    // Step 1: Acknowledge problem type and analyze requirements
    thoughtProcess.push(`Problem Type Analysis:\nIdentified problem type: ${problemType}`);
    if (intentDetails) {
      thoughtProcess.push(`Intent Details:\n${JSON.stringify(intentDetails, null, 2)}`);
    }
    thoughtProcess.push(`Required Fields: ${requiredFields.join(', ')}`);
    thoughtProcess.push(`Available Customer Fields: ${customerFields.join(', ')}`);

    onProgress({
      type: 'progress',
      message: 'Starting field mapping analysis',
      details: {
        problemType,
        intentDetails,
        requiredFields,
        customerFields
      }
    });

    // Step 2: Analyze field requirements
    const fieldRequirementsPrompt = `You are a JSON-only response API for field requirements analysis.

CONTEXT:
Problem Type: ${problemType}
${intentDetails ? `Intent Analysis: ${JSON.stringify(intentDetails, null, 2)}` : ''}
User's Fields: ${customerFields.join(', ')}

TASK:
Analyze and determine the required fields for this ${problemType} optimization problem.
${requiredFields.length > 0 ? `Required fields specified: ${requiredFields.join(', ')}` : 'No required fields specified - please suggest appropriate fields based on the problem type and intent.'}

RESPONSE FORMAT:
You must respond with ONLY a JSON object in the following format, and nothing else - no explanations, no conversation:
{
  "required_fields": {
    "field_name": {
      "description": "field description",
      "data_type": "string|number|boolean|array|object",
      "importance": "high|medium|low",
      "validation": ["rule1", "rule2"]
    }
  },
  "nice_to_have_fields": {
    "field_name": {
      "description": "field description",
      "data_type": "string|number|boolean|array|object",
      "benefits": ["benefit1", "benefit2"]
    }
  }
}

RULES:
1. Response must be valid JSON
2. No markdown, no explanations, just the JSON object
3. If no required fields are provided, suggest common fields for ${problemType} type problems
4. All field names should be snake_case
5. Data types must be one of: string, number, boolean, array, object
6. Consider the intent analysis when suggesting fields
7. Include fields that match the problem requirements from the intent`;

    onProgress({
      type: 'progress',
      message: 'Analyzing field requirements',
      details: {
        stage: 'field_requirements',
        prompt: fieldRequirementsPrompt.slice(0, 200) + '...'
      }
    });

    let fieldRequirements;
    try {
      const fieldReqResponse = context?.llm 
        ? await context.llm(fieldRequirementsPrompt)
        : await callOpenAI(fieldRequirementsPrompt);
      
      // Clean the response and ensure it's valid JSON
      const cleanJson = extractJsonFromMarkdown(fieldReqResponse.trim());
      try {
        fieldRequirements = JSON.parse(cleanJson);
      } catch (parseError) {
        onProgress({
          type: 'error',
          message: 'Failed to parse field requirements response',
          details: {
            error: parseError instanceof Error ? parseError.message : 'Invalid JSON',
            response: fieldReqResponse
          }
        });
        throw new Error('Invalid JSON response from LLM');
      }

      thoughtProcess.push('Field Requirements Analysis:', JSON.stringify(fieldRequirements, null, 2));

      onProgress({
        type: 'progress',
        message: 'Field requirements analysis complete',
        details: {
          stage: 'field_requirements_complete',
          fieldRequirements
        }
      });
    } catch (error) {
      thoughtProcess.push('Failed to analyze field requirements');
      onProgress({
        type: 'error',
        message: 'Failed to analyze field requirements',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }

    // Step 3: Map customer fields to required schema
    const mappingPrompt = `You are a JSON-only response API for field mapping.

CONTEXT:
Problem Type: ${problemType}
${intentDetails ? `Intent Analysis: ${JSON.stringify(intentDetails, null, 2)}` : ''}

TASK:
Map customer data fields to required schema fields for a ${problemType} optimization model.

AVAILABLE FIELDS:
Customer fields:
${customerFields.map(f => `- ${f}`).join('\n')}

Required fields and specifications:
${JSON.stringify(fieldRequirements.required_fields, null, 2)}

Nice to have fields:
${JSON.stringify(fieldRequirements.nice_to_have_fields, null, 2)}

RESPONSE FORMAT:
You must respond with ONLY a JSON object in the following format, and nothing else - no explanations, no conversation:
{
  "mappings": [
    {
      "customerField": "exact_customer_field_name",
      "requiredField": "exact_required_field_name",
      "confidence": 0.95,
      "transformations": ["transformation1", "transformation2"],
      "rationale": "brief explanation of mapping choice"
    }
  ],
  "unmapped_required_fields": ["field1", "field2"],
  "suggested_actions": ["action1", "action2"]
}

RULES:
1. Response must be valid JSON
2. No markdown, no explanations, just the JSON object
3. Use exact field names from the provided lists
4. Confidence must be between 0 and 1
5. Include clear, specific transformations when needed
6. List any required fields that couldn't be mapped
7. Suggest specific actions for handling unmapped fields
8. Consider the intent analysis when mapping fields
9. Ensure mappings align with the problem requirements from the intent`;

    onProgress({
      type: 'progress',
      message: 'Starting field mapping',
      details: {
        stage: 'field_mapping',
        prompt: mappingPrompt.slice(0, 200) + '...'
      }
    });

    try {
      const mappingResponse = context?.llm
        ? await context.llm(mappingPrompt)
        : await callOpenAI(mappingPrompt);
      
      // Clean the response and ensure it's valid JSON
      const cleanJson = extractJsonFromMarkdown(mappingResponse.trim());
      let mappingResult;
      try {
        mappingResult = JSON.parse(cleanJson);
      } catch (parseError) {
        onProgress({
          type: 'error',
          message: 'Failed to parse field mapping response',
          details: {
            error: parseError instanceof Error ? parseError.message : 'Invalid JSON',
            response: mappingResponse
          }
        });
        throw new Error('Invalid JSON response from LLM');
      }

      thoughtProcess.push('Field Mapping Analysis:', JSON.stringify(mappingResult, null, 2));

      onProgress({
        type: 'progress',
        message: 'Field mapping complete',
        details: {
          stage: 'field_mapping_complete',
          mappingResult
        }
      });

      // Step 4: Validate mappings
      const unmappedFields = this.validateMappings(mappingResult.mappings || [], requiredFields);
      if (unmappedFields.length > 0) {
        thoughtProcess.push(`Warning: Missing mappings for fields: ${unmappedFields.join(', ')}`);
        onProgress({
          type: 'warning',
          message: 'Some fields could not be mapped',
          details: {
            unmappedFields
          }
        });
      }

      return {
        output: {
          success: true,
          fieldRequirements,
          mappings: mappingResult.mappings || [],
          unmappedFields,
          suggestedActions: mappingResult.suggested_actions || [],
          needsHumanReview: unmappedFields.length > 0 || mappingResult.mappings.some((m: FieldMapping) => m.confidence < 0.8)
        },
        thoughtProcess: thoughtProcess.join('\n')
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error occurred';
      thoughtProcess.push(`Error during field mapping: ${errorMessage}`);
      
      onProgress({
        type: 'error',
        message: 'Field mapping failed',
        details: errorMessage
      });

      return {
        output: {
          success: false,
          error: 'Failed to map fields',
          details: errorMessage
        },
        thoughtProcess: thoughtProcess.join('\n')
      };
    }
  }

  private validateMappings(mappings: FieldMapping[], requiredFields: string[]): string[] {
    const mappedFields = new Set(mappings.map(m => m.requiredField));
    return requiredFields.filter(field => !mappedFields.has(field));
  }
} 