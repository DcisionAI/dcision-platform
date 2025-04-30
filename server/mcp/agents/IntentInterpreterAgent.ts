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
      
      // Clean the response and extract JSON
      let cleanJson = extractJsonFromMarkdown(llmRaw);
      
      // Basic cleaning
      cleanJson = cleanJson
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
        .replace(/\n/g, ' ') // Replace newlines with spaces
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

      // Fix the most common issues in OpenAI's response
      cleanJson = cleanJson
        .replace(/"\s*:\s*"/g, '":"') // Fix extra quotes around values
        .replace(/"\s*,\s*"/g, '","') // Fix array separators
        .replace(/"\s*\[\s*"/g, '["') // Fix array starts
        .replace(/"\s*\]\s*"/g, '"]') // Fix array ends
        .replace(/"\s*{\s*"/g, '{"') // Fix object starts
        .replace(/"\s*}\s*"/g, '"}') // Fix object ends
        .replace(/"\s*:\s*\[/g, '":[') // Fix array values
        .replace(/"\s*:\s*{/g, '":{') // Fix object values
        .replace(/"\s*,\s*\[/g, '",[') // Fix array separators
        .replace(/"\s*,\s*{/g, '",{') // Fix object separators
        .replace(/"\s*\]\s*,/g, '"],') // Fix array ends with comma
        .replace(/"\s*}\s*,/g, '"},') // Fix object ends with comma
        .replace(/"\s*\]\s*}/g, '"]}') // Fix array ends in object
        .replace(/"\s*}\s*}/g, '"}}') // Fix object ends in object
        .replace(/"\s*\]\s*\]/g, '"]]') // Fix array ends in array
        .replace(/"\s*}\s*\]/g, '"}]') // Fix object ends in array
        .replace(/"\s*:\s*"/g, '":"') // Fix string values
        .replace(/"\s*:\s*([0-9.]+)/g, '":$1') // Fix number values
        .replace(/"\s*:\s*(true|false)/g, '":$1') // Fix boolean values
        .replace(/"\s*:\s*null/g, '":null'); // Fix null values
      
      // Try to parse the cleaned JSON
      let llmResponse: any;
      try {
        llmResponse = JSON.parse(cleanJson);
      } catch (parseError: unknown) {
        // If parsing fails, try to find the first valid JSON object
        const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            llmResponse = JSON.parse(jsonMatch[0]);
          } catch (secondError: unknown) {
            const errorMessage = secondError instanceof Error ? secondError.message : 'Unknown parsing error';
            throw new Error(`Failed to parse JSON response: ${errorMessage}\nCleaned JSON: ${cleanJson}`);
          }
        } else {
          const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
          throw new Error(`Failed to parse JSON response: ${errorMessage}\nCleaned JSON: ${cleanJson}`);
        }
      }
      
      // Validate the response structure
      if (!llmResponse.isDecisionProblem) {
        thoughtProcess.push(`Request is not a decision-making problem: ${llmResponse.classificationReasoning}`);
        return {
          output: {
            success: true,
            selectedModel: 'not_decision',
            details: {
              userInput,
              isDecisionProblem: false,
              classificationReasoning: llmResponse.classificationReasoning,
              analysis: llmResponse.analysis || {}
            }
          },
          thoughtProcess: thoughtProcess.join('\n')
        };
      }

      thoughtProcess.push(`Identified as decision-making problem: ${llmResponse.classificationReasoning}`);
      thoughtProcess.push(`Problem type: ${llmResponse.modelType}`);
      thoughtProcess.push(`Main reasoning: ${llmResponse.reasoning?.recommendation || 'No reasoning provided'}`);
      thoughtProcess.push(`Mathematical formulation: ${llmResponse.reasoning?.technicalAnalysis?.mathematicalFormulation || 'Not provided'}`);
      thoughtProcess.push(`Complexity: ${llmResponse.reasoning?.technicalAnalysis?.complexity || 'Not assessed'}`);

      // Get critique using the new structured prompt
      const critiquePrompt = this.buildCritiquePrompt(userInput, llmResponse.analysis, llmResponse.modelType);
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
          selectedModel: llmResponse.modelType || 'unknown',
          details: {
            userInput,
            isDecisionProblem: true,
            classificationReasoning: llmResponse.classificationReasoning,
            analysis: llmResponse.analysis || {},
            confidence: {
              overall: llmResponse.confidence?.overall || 1.0,
              factors: llmResponse.confidence?.factors || {},
            },
            reasoning: {
              recommendation: llmResponse.reasoning?.recommendation || 'No reasoning provided',
              modelBenefits: llmResponse.reasoning?.modelBenefits || 'Not provided',
              industryAdoption: llmResponse.reasoning?.industryAdoption || 'Not provided',
              decisionProcess: llmResponse.reasoning?.decisionProcess || 'Not provided',
              technicalAnalysis: {
                mathematicalFormulation: llmResponse.reasoning?.technicalAnalysis?.mathematicalFormulation || 'Not provided',
                complexity: llmResponse.reasoning?.technicalAnalysis?.complexity || 'Not assessed',
                keyFactors: llmResponse.reasoning?.technicalAnalysis?.keyFactors || []
              }
            },
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
    return `You are DcisionAI, an expert in decision intelligence and operations research.
Given the following request, follow these steps:

1. First, determine if this is a decision-making problem:
   - Check if the request involves making choices to achieve desired outcomes
   - Look for keywords like "decide", "choose", "best", "efficient", "improve"
   - Consider if there are trade-offs or constraints to balance
   - Evaluate if there are multiple possible solutions to compare

2. If it is a decision-making problem, analyze the request to identify key components:
   - Decision variables and their domains
   - Objectives and success criteria
   - Constraints and their types (hard/soft)
   - Resource limitations
   - Temporal aspects
   - Cost structures
   - Quality metrics

3. Then, identify the most appropriate decision model type from:
   - vehicle_routing: For fleet and delivery decisions
   - job_shop: For manufacturing and production scheduling
   - resource_scheduling: For workforce and equipment allocation
   - bin_packing: For container and storage decisions
   - project_scheduling: For project planning and resource allocation
   - fleet_scheduling: For vehicle fleet management
   - multi_depot_routing: For multi-location delivery operations
   - flow_shop: For sequential production processes
   - nurse_scheduling: For healthcare staff scheduling
   - inventory_management: For stock level decisions
   - production_planning: For manufacturing planning
   - custom: For unique decision scenarios

Request: "${userInput}"

IMPORTANT: You MUST respond in the following JSON format exactly:
{
  "isDecisionProblem": true/false,
  "classificationReasoning": "Explanation of why this is or isn't a decision-making problem",
  "analysis": {
    "decisionVariables": ["var1", "var2"],
    "objectives": ["obj1", "obj2"],
    "constraints": {
      "hard": ["constraint1", "constraint2"],
      "soft": ["constraint3", "constraint4"]
    },
    "resources": ["resource1", "resource2"],
    "temporalAspects": ["aspect1", "aspect2"],
    "costStructures": ["cost1", "cost2"],
    "qualityMetrics": ["metric1", "metric2"]
  },
  "modelType": "selected_type",
  "reasoning": {
    "recommendation": "Clear recommendation based on the input",
    "modelBenefits": "How this model helps with the decision",
    "industryAdoption": "Examples of how this model is used in similar industries",
    "decisionProcess": "Step-by-step explanation of the decision-making process",
    "technicalAnalysis": {
      "mathematicalFormulation": "Brief description of the mathematical approach",
      "complexity": "Assessment of problem complexity",
      "keyFactors": ["factor1", "factor2", "factor3"]
    }
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
      "reasoning": "Why this could be an alternative approach",
      "confidence": 0.8,
      "tradeoffs": {
        "pros": ["pro1", "pro2"],
        "cons": ["con1", "con2"]
      }
    }
  ]
}`;
  }

  private buildCritiquePrompt(userInput: string, analysis: any, modelType: string): string {
    return `You are DcisionAI, an expert in decision intelligence and operations research.
Given the following request and analysis:

Request: "${userInput}"
Analysis: ${JSON.stringify(analysis, null, 2)}

Critique the selected model type: "${modelType}"

Follow these steps:
1. Evaluate if this is the best model for the given decision problem
2. Consider all components of the analysis (decision variables, objectives, constraints, etc.)
3. Compare against alternative models
4. Assess the practical implementation and industry relevance

IMPORTANT: You MUST respond in the following JSON format exactly:
{
  "isBestFit": true/false,
  "suggestedType": "alternative_type_if_not_best_fit",
  "reasoning": "Explanation of why this is or isn't the best fit",
  "alternativeAnalysis": {
    "decisionVariables": ["var1", "var2"],
    "objectives": ["obj1", "obj2"],
    "constraints": {
      "hard": ["constraint1", "constraint2"],
      "soft": ["constraint3", "constraint4"]
    },
    "resources": ["resource1", "resource2"],
    "temporalAspects": ["aspect1", "aspect2"],
    "costStructures": ["cost1", "cost2"],
    "qualityMetrics": ["metric1", "metric2"]
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
  "recommendations": [
    {
      "type": "recommendation1",
      "description": "Practical recommendation",
      "priority": "high/medium/low",
      "implementationImpact": "Expected impact on the decision-making process"
    }
  ]
}`;
  }
} 