import { ProtocolStep, MCP } from '../types/core';
import { MCPAgent as IMCPAgent, AgentType, StepAction } from './types';

export interface AgentRunContext {
  llm?: (prompt: string, config?: any) => Promise<any>;
  user?: any;
  session?: any;
}

export interface AgentRunResult {
  output: any;
  thoughtProcess?: string;
  feedbackUrl?: string;
}

export class AgentRegistry {
  private static instance: AgentRegistry;
  private agents: Map<string, IMCPAgent> = new Map();
  private agentTypes: Map<AgentType, IMCPAgent[]> = new Map();

  private constructor() {}

  static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }
    return AgentRegistry.instance;
  }

  register(agent: IMCPAgent): void {
    this.agents.set(agent.name, agent);
    const typeAgents = this.agentTypes.get(agent.type) || [];
    typeAgents.push(agent);
    this.agentTypes.set(agent.type, typeAgents);
  }

  getAgent(name: string): IMCPAgent | undefined {
    return this.agents.get(name);
  }

  getAgentsByType(type: AgentType): IMCPAgent[] {
    return this.agentTypes.get(type) || [];
  }

  getAgentForAction(action: StepAction): IMCPAgent | undefined {
    return Array.from(this.agents.values()).find(agent => 
      agent.supportedActions.includes(action)
    );
  }

  listAgents(): IMCPAgent[] {
    return Array.from(this.agents.values());
  }

  clear(): void {
    this.agents.clear();
    this.agentTypes.clear();
  }
} 