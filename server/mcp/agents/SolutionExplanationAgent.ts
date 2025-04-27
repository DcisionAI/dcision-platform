import { MCPAgent, AgentRunContext, AgentRunResult } from './AgentRegistry';
import { StepAction, ProtocolStep, MCP } from '../MCPTypes';
import { extractJsonFromMarkdown } from '../utils/markdown';
import { callOpenAI } from './llm/openai';

interface ExplanationResult {
  summary: string;
  details: {
    metrics: Record<string, string | number>;
    improvements: string[];
    recommendations: string[];
  };
  visualizations?: string[];
}

export class SolutionExplanationAgent implements MCPAgent {
  name = 'Solution Explanation Agent';
  supportedActions: StepAction[] = ['explain_solution'];

  async run(step: ProtocolStep, mcp: MCP, context?: AgentRunContext): Promise<AgentRunResult> {
    const solution = step.parameters?.solution || {};
    const thoughtProcess: string[] = [];
    
    thoughtProcess.push('Analyzing optimization solution...');

    const prompt = this.buildPrompt(solution, mcp.context.problemType, mcp.context.industry);
    let llmResponse: any = {};

    try {
      const llmRaw = context?.llm
        ? await context.llm(prompt)
        : await callOpenAI(prompt);
      
      const cleanJson = extractJsonFromMarkdown(llmRaw);
      llmResponse = JSON.parse(cleanJson);
      
      thoughtProcess.push('Generated solution explanation');
      if (llmResponse.details?.improvements?.length > 0) {
        thoughtProcess.push('Identified potential improvements:');
        llmResponse.details.improvements.forEach((imp: string) => 
          thoughtProcess.push(`- ${imp}`)
        );
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error occurred';
      thoughtProcess.push(`LLM call or parsing failed: ${errorMessage}`);
      
      return {
        output: {
          success: false,
          error: 'Failed to explain solution',
          details: errorMessage
        },
        thoughtProcess: thoughtProcess.join('\n')
      };
    }

    return {
      output: {
        success: true,
        explanation: llmResponse as ExplanationResult,
        solution
      },
      thoughtProcess: thoughtProcess.join('\n')
    };
  }

  private buildPrompt(solution: any, problemType: string, industry?: string): string {
    return `You are an expert in explaining optimization solutions to business stakeholders.
Analyze and explain the following ${problemType} solution${industry ? ` for the ${industry} industry` : ''}.

Solution details:
${JSON.stringify(solution, null, 2)}

Provide a clear, business-friendly explanation that includes:
1. Key metrics and their business impact
2. Potential improvements or optimizations
3. Actionable recommendations
4. Suggested visualizations (if applicable)

Respond in JSON format with:
{
  "summary": "Brief, clear explanation of the solution and its value",
  "details": {
    "metrics": {
      "metric_name": "value with business context"
    },
    "improvements": [
      "potential improvement 1",
      "potential improvement 2"
    ],
    "recommendations": [
      "actionable recommendation 1",
      "actionable recommendation 2"
    ]
  },
  "visualizations": [
    "suggested chart/visualization type 1",
    "suggested chart/visualization type 2"
  ]
}`;
  }
} 