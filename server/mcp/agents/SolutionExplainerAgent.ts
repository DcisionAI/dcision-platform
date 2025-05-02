import { AgentRunContext, AgentRunResult } from './Agent';
import { MCP, ProtocolStep } from '../types/core';
import { LLMService } from '../services/llm/LLMService';
import { LLMServiceFactory } from '../services/llm/LLMServiceFactory';
import { MCPAgent, AgentType, StepAction } from './types';

export class SolutionExplainerAgent implements MCPAgent {
  name = 'solution_explainer';
  type: AgentType = 'reporter';
  supportedActions: StepAction[] = ['generate_report'];
  private llm: LLMService;

  constructor() {
    this.llm = LLMServiceFactory.getInstance();
  }

  async run(step: ProtocolStep, mcp: MCP, context: AgentRunContext): Promise<AgentRunResult> {
    try {
      const { solution, data } = context.previousResults || {};
      const { llmConfig, format } = step.parameters || {};

      if (!solution || !data || !llmConfig || !format) {
        throw new Error('Missing required parameters in context or step parameters');
      }

      // Prepare solution data for explanation
      const solutionData = {
        routes: solution.routes,
        statistics: solution.statistics,
        constraints: solution.constraints_satisfied,
        vehicles: data.vehicles,
        locations: data.locations,
        demands: data.demands
      };

      // Get explanation from LLM
      const explanation = await this.llm.explainSolution(solutionData, mcp.context.problemType);

      // Parse and structure the explanation
      const structuredExplanation = this.structureExplanation(explanation.explanation, format);

      return {
        output: {
          success: true,
          explanation: structuredExplanation,
          insights: explanation.insights
        },
        thoughtProcess: 'Generated natural language explanation of the solution using LLM'
      };
    } catch (error) {
      return {
        output: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        },
        thoughtProcess: 'Failed to generate solution explanation'
      };
    }
  }

  private structureExplanation(explanation: string, format: any): any {
    // Split explanation into sections based on format requirements
    const sections = format.sections || ['summary', 'route_details', 'recommendations'];
    const structured: any = {};

    // Simple section extraction based on headers
    const lines = explanation.split('\n');
    let currentSection = '';

    for (const line of lines) {
      if (line.toLowerCase().includes('summary')) {
        currentSection = 'summary';
        structured[currentSection] = '';
      } else if (line.toLowerCase().includes('route')) {
        currentSection = 'route_details';
        structured[currentSection] = '';
      } else if (line.toLowerCase().includes('recommend')) {
        currentSection = 'recommendations';
        structured[currentSection] = '';
      } else if (currentSection) {
        structured[currentSection] += line + '\n';
      }
    }

    // Clean up the sections
    for (const section of Object.keys(structured)) {
      structured[section] = structured[section].trim();
    }

    return structured;
  }
} 