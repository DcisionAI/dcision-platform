import { MCPAgent, AgentRunContext, AgentRunResult, AgentType } from './types';
import { ProtocolStep, MCP } from '../types/core';
import { StepAction } from './types';

/**
 * Agent to extract decision variables, constraints, and objective from a business problem.
 */
export class ModelDefinitionAgent implements MCPAgent {
  name = 'Model Definition Agent';
  type: AgentType = 'model_definition';
  supportedActions: StepAction[] = ['define_model'];

  async run(
    step: ProtocolStep,
    mcp: MCP,
    context?: AgentRunContext
  ): Promise<AgentRunResult> {
    if (step.action !== 'define_model') {
      throw new Error(`Unsupported action: ${step.action}`);
    }
    // Extract the problem description from MCP metadata
    const metadata = mcp.context.dataset?.metadata;
    const description = metadata && typeof metadata === 'object' && 'userInput' in metadata
      ? String(metadata.userInput)
      : '';
    if (!context?.llm) {
      throw new Error('LLM service is required for model definition');
    }
    // Use LLM service to interpret model definition
    const result = await context.llm.interpretModelDefinition(description);
    return {
      output: result,
      thoughtProcess: ''
    };
  }
}