import { StepAction, ProtocolStep, MCP } from '../types';

export interface AgentRunContext {
  llm?: (prompt: string, config?: any) => Promise<any>;
  // Add more context fields as needed (user, session, etc.)
}

export interface AgentRunResult {
  output: any;
  thoughtProcess?: string;
  feedbackUrl?: string;
}

export interface MCPAgent {
  name: string;
  supportedActions: StepAction[];
  run: (step: ProtocolStep, mcp: MCP, context?: AgentRunContext) => Promise<AgentRunResult>;
}

class AgentRegistry {
  private agents: MCPAgent[] = [];

  register(agent: MCPAgent) {
    this.agents.push(agent);
  }

  getAgentForAction(action: StepAction): MCPAgent | undefined {
    return this.agents.find(agent => agent.supportedActions.includes(action));
  }

  listAgents(): MCPAgent[] {
    return this.agents;
  }
}

export const agentRegistry = new AgentRegistry(); 