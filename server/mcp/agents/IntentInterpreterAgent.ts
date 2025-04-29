import { MCPAgent, AgentRunContext, AgentRunResult } from './AgentRegistry';
import { StepAction, ProtocolStep, MCP } from '../types';
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
      thoughtProcess.push(`Reasoning: ${llmResponse.reasoning.mainReason}`);

      // LLM-based validation/critique
      const critiquePrompt = `
Given the user request: "${userInput}"
And the selected problem type: "${llmResponse.problemType}"
Critique this choice. Is it the best fit? If not, suggest a better type and explain why.
Respond in JSON: { "isBestFit": true/false, "suggestedType": "...", "reasoning": "..." }
`;
      const critiqueRaw = context?.llm
        ? await context.llm(critiquePrompt)
        : await callOpenAI(critiquePrompt);
      const critiqueResponse = JSON.parse(extractJsonFromMarkdown(critiqueRaw));
      thoughtProcess.push(`LLM critique: ${critiqueResponse.reasoning}`);
      if (!critiqueResponse.isBestFit) {
        thoughtProcess.push(`Warning: LLM suggests a better fit: ${critiqueResponse.suggestedType}`);
      }

      return {
        output: {
          success: true,
          selectedModel: llmResponse.problemType || 'unknown',
          details: {
            userInput,
            confidence: {
              overall: llmResponse.confidence?.overall || 1.0,
              factors: llmResponse.confidence?.factors || {},
            },
            reasoning: llmResponse.reasoning || { mainReason: 'No reasoning provided' },
            alternatives: llmResponse.alternatives || [],
            critique: critiqueResponse
          }
        },
        thoughtProcess: thoughtProcess.join('\n')
      };
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
  "reasoning": {
    "mainReason": "Primary reason for selecting this type",
    "keyFactors": ["factor1", "factor2", "factor3"],
    "businessBenefits": ["benefit1", "benefit2"],
    "potentialChallenges": ["challenge1", "challenge2"]
  },
  "confidence": {
    "overall": 0.95,
    "factors": {
      "problemClarity": 0.9,
      "dataAvailability": 0.8,
      "constraintComplexity": 0.85,
      "domainMatch": 0.95
    }
  },
  "alternatives": [
    {
      "type": "alternative_type1",
      "reasoning": "Why this could be an alternative",
      "confidence": 0.8,
      "tradeoffs": {
        "pros": ["pro1", "pro2"],
        "cons": ["con1", "con2"]
      }
    }
  ]
}`;
  }
} 