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
    const thoughtProcess: string[] = [];

    thoughtProcess.push('Analyzing field mappings...');
    thoughtProcess.push(`Customer fields: ${customerFields.join(', ')}`);
    thoughtProcess.push(`Required fields: ${requiredFields.join(', ')}`);

    const prompt = this.buildPrompt(customerFields, requiredFields, mcp.context.problemType);
    let llmResponse: any = {};

    try {
      const llmRaw = context?.llm
        ? await context.llm(prompt)
        : await callOpenAI(prompt);
      
      const cleanJson = extractJsonFromMarkdown(llmRaw);
      llmResponse = JSON.parse(cleanJson);
      
      thoughtProcess.push('Field mapping analysis complete');
      thoughtProcess.push(llmResponse.reasoning || '');

      // LLM-based mapping review
      const reviewPrompt = `
Review the following field mappings for a ${mcp.context.problemType} problem: ${JSON.stringify(llmResponse.mappings)}
Are there any semantic mismatches or missing fields? Respond in JSON: { "issues": ["..."], "suggestions": ["..."] }
`;
      try {
        const reviewRaw = context?.llm
          ? await context.llm(reviewPrompt)
          : await callOpenAI(reviewPrompt);
        const review = JSON.parse(extractJsonFromMarkdown(reviewRaw));
        if (review.issues?.length) {
          thoughtProcess.push(`LLM review issues: ${review.issues.join(', ')}`);
        }
        if (review.suggestions?.length) {
          thoughtProcess.push(`LLM review suggestions: ${review.suggestions.join(', ')}`);
        }
      } catch (e) {
        thoughtProcess.push('LLM mapping review response could not be parsed.');
      }

      // Validate mappings
      const missingFields = this.validateMappings(llmResponse.mappings || [], requiredFields);
      if (missingFields.length > 0) {
        thoughtProcess.push(`Warning: Missing mappings for fields: ${missingFields.join(', ')}`);
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error occurred';
      thoughtProcess.push(`LLM call or parsing failed: ${errorMessage}`);
      
      return {
        output: {
          success: false,
          error: 'Failed to map fields',
          details: errorMessage
        },
        thoughtProcess: thoughtProcess.join('\n')
      };
    }

    return {
      output: {
        success: true,
        mappings: llmResponse.mappings || [],
        needsHumanReview: llmResponse.needsHumanReview || false,
        details: {
          customerFields,
          requiredFields,
          unmappedFields: this.validateMappings(llmResponse.mappings || [], requiredFields)
        }
      },
      thoughtProcess: thoughtProcess.join('\n')
    };
  }

  private buildPrompt(customerFields: string[], requiredFields: string[], problemType: string): string {
    return `You are a data integration expert.
Map the following customer data fields to the required schema fields for a ${problemType} optimization model.

Customer fields available:
${customerFields.map(f => `- ${f}`).join('\n')}

Required fields:
${requiredFields.map(f => `- ${f}`).join('\n')}

Consider:
1. Field name similarities
2. Common variations (e.g., 'driver_id' vs 'driverId')
3. Semantic meaning in the context of ${problemType}
4. Possible transformations needed

Respond in JSON format with:
{
  "mappings": [
    {
      "customerField": "field_name",
      "requiredField": "required_name",
      "confidence": 0.95,
      "transformations": ["any_needed_transformations"]
    }
  ],
  "needsHumanReview": false,
  "reasoning": "explanation of mapping decisions"
}`;
  }

  private validateMappings(mappings: FieldMapping[], requiredFields: string[]): string[] {
    const mappedFields = new Set(mappings.map(m => m.requiredField));
    return requiredFields.filter(field => !mappedFields.has(field));
  }
} 