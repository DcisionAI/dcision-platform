// Ensure core agents are registered
import '../agents';
import { MCPAgent } from '../agents/types';
import { MCP, ProtocolStep } from '../types/core';
import { AgentRegistry } from '../agents/AgentRegistry';
import { LLMServiceImpl } from '../services/llm/LLMService';

export interface OrchestrationResult {
  step: ProtocolStep;
  agent: string | undefined;
  result: any;
  thoughtProcess?: string;
  error?: string;
}

export async function orchestrateMCP(mcp: MCP): Promise<OrchestrationResult[]> {
  const results: OrchestrationResult[] = [];
  // Initialize LLM service
  const llm = new LLMServiceImpl('openai', process.env.OPENAI_API_KEY || '');
  const agentContext = { llm };
  const agentRegistry = AgentRegistry.getInstance();

  for (const step of mcp.protocol.steps) {
    const agent = agentRegistry.getAgentForAction(step.action as any); // TODO: Fix type mismatch between core.StepAction and agents.StepAction
    if (!agent) {
      results.push({
        step,
        agent: undefined,
        result: null,
        error: `No agent found for action: ${step.action}`,
      });
      continue;
    }
    try {
      const agentResult = await agent.run(step, mcp, agentContext);
      results.push({
        step,
        agent: agent.name,
        result: agentResult.output,
        thoughtProcess: agentResult.thoughtProcess,
      });
    } catch (err) {
      results.push({
        step,
        agent: agent.name,
        result: null,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return results;
} 