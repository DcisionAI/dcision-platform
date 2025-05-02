import { MCPAgent, AgentType, AgentRunContext, AgentRunResult, StepAction, DomainType } from './types';
import { ProtocolStep, MCP } from '../types/core';

export class IntentInterpreterAgent implements MCPAgent {
  name = 'Intent Interpreter Agent';
  type: AgentType = 'intent_interpreter';
  supportedActions: StepAction[] = ['interpret_intent'];

  async run(step: ProtocolStep, mcp: MCP, context?: AgentRunContext): Promise<AgentRunResult> {
    const thoughtProcess: string[] = [];
    
    if (step.action !== 'interpret_intent') {
      throw new Error(`Unsupported action: ${step.action}`);
    }

    return this.interpretIntent(mcp, thoughtProcess, context);
  }

  private async interpretIntent(mcp: MCP, thoughtProcess: string[], context?: AgentRunContext): Promise<AgentRunResult> {
    thoughtProcess.push('Interpreting optimization problem intent...');

    // Get the problem description from metadata
    const metadata = mcp.context.dataset?.metadata;
    const problemDescription = metadata && typeof metadata === 'object' && 'userInput' in metadata
      ? String(metadata.userInput)
      : '';

    // Use LLM for enhanced intent interpretation if available
    if (context?.llm && problemDescription) {
      try {
        const { problemType, context: problemContext } = await context.llm.interpretIntent(
          problemDescription
        );
        
        thoughtProcess.push(`LLM identified problem type: ${problemType}`);
        thoughtProcess.push('Problem context:');
        Object.entries(problemContext).forEach(([key, value]) => {
          thoughtProcess.push(`- ${key}: ${JSON.stringify(value)}`);
        });

        return {
          output: {
            success: true,
            problemType,
            context: problemContext,
            domain: DomainType.FLEETOPS
          },
          thoughtProcess: thoughtProcess.join('\n')
        };
      } catch (error) {
        thoughtProcess.push('Failed to interpret intent using LLM, falling back to basic interpretation');
      }
    }

    // Basic intent interpretation (fallback)
    const problemType = this.determineProblemType(problemDescription);
    thoughtProcess.push(`Determined problem type: ${problemType}`);
    
    const problemContext = this.extractBasicContext(problemDescription);
    thoughtProcess.push('Extracted basic context:');
    Object.entries(problemContext).forEach(([key, value]) => {
      thoughtProcess.push(`- ${key}: ${JSON.stringify(value)}`);
    });

    return {
      output: {
        success: true,
        problemType,
        context: problemContext,
        domain: DomainType.FLEETOPS
      },
      thoughtProcess: thoughtProcess.join('\n')
    };
  }

  private determineProblemType(description: string): string {
    // Basic problem type determination
    const descriptionLower = description.toLowerCase();
    
    if (descriptionLower.includes('vehicle') || descriptionLower.includes('route') || descriptionLower.includes('delivery')) {
      return 'vehicle_routing';
    } else if (descriptionLower.includes('job') || descriptionLower.includes('shop')) {
      return 'job_shop';
    } else if (descriptionLower.includes('bin') || descriptionLower.includes('pack')) {
      return 'bin_packing';
    } else if (descriptionLower.includes('resource') || descriptionLower.includes('schedule')) {
      return 'resource_scheduling';
    } else if (descriptionLower.includes('fleet')) {
      return 'fleet_scheduling';
    } else if (descriptionLower.includes('multi') && descriptionLower.includes('depot')) {
      return 'multi_depot_routing';
    } else if (descriptionLower.includes('pickup') && descriptionLower.includes('delivery')) {
      return 'pickup_delivery';
    } else if (descriptionLower.includes('project')) {
      return 'project_scheduling';
    } else if (descriptionLower.includes('flow') && descriptionLower.includes('shop')) {
      return 'flow_shop';
    } else if (descriptionLower.includes('nurse')) {
      return 'nurse_scheduling';
    } else if (descriptionLower.includes('inventory')) {
      return 'inventory_optimization';
    } else if (descriptionLower.includes('production')) {
      return 'production_planning';
    } else if (descriptionLower.includes('traveling') && descriptionLower.includes('salesman')) {
      return 'traveling_salesman';
    } else if (descriptionLower.includes('assign')) {
      return 'assignment';
    }
    
    return 'custom';
  }

  private extractBasicContext(description: string): Record<string, any> {
    // Basic context extraction
    const context: Record<string, any> = {};
    
    // Extract numbers that might be relevant
    const numbers = description.match(/\d+/g);
    if (numbers) {
      context.numbers = numbers.map(Number);
    }
    
    // Extract keywords
    const keywords = description.toLowerCase().match(/\b\w+\b/g);
    if (keywords) {
      context.keywords = keywords;
    }
    
    return context;
  }
} 