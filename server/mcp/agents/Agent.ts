import { MCP, ProtocolStep } from '../types/core';

export interface AgentRunContext {
  previousResults?: any;
  llmConfig?: {
    model: string;
    temperature: number;
    maxTokens: number;
  };
  [key: string]: any;
}

export interface AgentRunResult {
  output: {
    success: boolean;
    error?: string;
    [key: string]: any;
  };
  thoughtProcess: string;
}

export interface Agent {
  run(step: ProtocolStep, mcp: MCP, context: AgentRunContext): Promise<AgentRunResult>;
} 