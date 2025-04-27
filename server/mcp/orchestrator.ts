import './agents'; // Ensures all agents are registered
import { MCP, ProtocolStep } from './MCPTypes';
import { agentRegistry } from './agents/AgentRegistry';
import { callOpenAI } from './agents/llm/openai';

export interface OrchestrationResult {
  step: ProtocolStep;
  agent: string | undefined;
  result: any;
  thoughtProcess?: string;
  error?: string;
}

export async function orchestrateMCP(mcp: MCP): Promise<OrchestrationResult[]> {
  const results: OrchestrationResult[] = [];
  // Provide LLM function in context for all agents
  const agentContext = { llm: callOpenAI };

  for (const step of mcp.protocol.steps) {
    const agent = agentRegistry.getAgentForAction(step.action);
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