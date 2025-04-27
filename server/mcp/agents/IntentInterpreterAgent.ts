import { MCPAgent, AgentRunContext, AgentRunResult } from './AgentRegistry';
import { StepAction, ProtocolStep, MCP } from '../MCPTypes';
import { extractJsonFromMarkdown } from '../utils/markdown';
import { callOpenAI } from './llm/openai';

export class IntentInterpreterAgent implements MCPAgent {
  name = 'Intent Interpreter Agent';
  supportedActions: StepAction[] = ['interpret_intent'];

  async run(step: ProtocolStep, mcp: MCP, context?: AgentRunContext): Promise<AgentRunResult> {
    let userInput = '';
    const metadata = mcp.context?.dataset?.metadata;
    if (metadata && typeof metadata === 'object' && metadata !== null && 'userInput' in metadata) {
      const val = (metadata as Record<string, unknown>).userInput;
      if (typeof val === 'string') userInput = val;
    }
    const thoughtProcess: string[] = [];
    thoughtProcess.push(`Analyzing user request: "${userInput}"`);

    const prompt = this.buildPrompt(userInput);
    let llmResponse: any = {};

    try {
      const llmRaw = context?.llm
        ? await context.llm(prompt)
        : await callOpenAI(prompt);
      
      const cleanJson = extractJsonFromMarkdown(llmRaw);
      llmResponse = JSON.parse(cleanJson);
      
      thoughtProcess.push(`Identified problem type: ${llmResponse.problemType}`);
      thoughtProcess.push(`Reasoning: ${llmResponse.reasoning}`);
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error occurred';
      thoughtProcess.push(`LLM call or parsing failed: ${errorMessage}`);
      
      return {
        output: {
          success: false,
          error: 'Failed to interpret intent',
          details: errorMessage
        },
        thoughtProcess: thoughtProcess.join('\n')
      };
    }

    return {
      output: {
        success: true,
        selectedModel: llmResponse.problemType || 'unknown',
        details: {
          userInput,
          confidence: llmResponse.confidence || 1.0,
          alternativeTypes: llmResponse.alternativeTypes || []
        }
      },
      thoughtProcess: thoughtProcess.join('\n')
    };
  }

  private buildPrompt(userInput: string): string {
    return `You are an expert in operations research and optimization.
Given the following business request, identify the most appropriate optimization problem type.

Request: "${userInput}"

Consider the following problem types:
- vehicle_routing: For fleet and delivery optimization
- job_shop: For manufacturing and production scheduling
- resource_scheduling: For workforce and equipment allocation
- bin_packing: For container and storage optimization
- project_scheduling: For project planning and resource allocation
- fleet_scheduling: For vehicle fleet management
- multi_depot_routing: For multi-location delivery operations
- flow_shop: For sequential production processes
- nurse_scheduling: For healthcare staff scheduling
- inventory_optimization: For stock level management
- production_planning: For manufacturing planning
- custom: For unique optimization scenarios

Respond in JSON format with:
{
  "problemType": "selected_type",
  "reasoning": "detailed explanation of why this type fits best",
  "confidence": 0.95,
  "alternativeTypes": ["other_possible_type1", "other_possible_type2"]
}`;
  }
} 