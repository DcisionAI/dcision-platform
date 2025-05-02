import { ProtocolStep, MCP } from '../types/core';
import { LLMService } from '../services/llm/LLMService';

// Define the domain types
export const DomainType = {
  FLEETOPS: 'fleetops',
  WORKFORCE: 'workforce'
} as const;

export type DomainType = typeof DomainType[keyof typeof DomainType];

// Define the interface for our domain agents
export interface DomainAgent {
  identify_problem(input: string): Promise<{
    problem_type: string;
    context: Record<string, any>;
    constraints: Record<string, any>;
    objectives: Record<string, any>;
  }>;
}

// Define the interface for Python domain agents
export interface PythonDomainAgent extends DomainAgent {
  // Additional methods specific to Python agents
  get_available_problem_types(): string[];
}

// Define the interface for the factory
export interface IntentAgentFactory {
  get_agent(domain: DomainType): DomainAgent;
}

export interface DomainAgentBridge {
  create_agent(domain: DomainType): DomainAgent;
}

// Data Collection Requirements
export interface DataSource {
  name: string;
  description: string;
  requiredFields: string[];
  optionalFields?: string[];
  constraints?: Record<string, any>;
}

export interface DataCollectionConfig {
  tables: string[];
  schema?: Record<string, any>;
  filters?: Record<string, any>;
  requiredFields?: string[];
}

// MCP Agent Types
export type AgentType = 
  | 'intent_interpreter'
  | 'data_collector'
  | 'data_enricher'
  | 'model_builder'
  | 'solver'
  | 'validator'
  | 'reporter';

export interface MCPAgent {
  name: string;
  type: AgentType;
  supportedActions: StepAction[];
  run(step: ProtocolStep, mcp: MCP, context?: AgentRunContext): Promise<AgentRunResult>;
}

export interface AgentRunContext {
  previousResults?: any;
  metadata?: Record<string, any>;
  llm?: LLMService;
  parameters?: Record<string, any>;
}

export interface AgentRunResult {
  output: any;
  thoughtProcess: string;
}

export type StepAction = 
  | 'interpret_intent'
  | 'collect_data'
  | 'enrich_data'
  | 'build_model'
  | 'solve_model'
  | 'validate_solution'
  | 'generate_report'; 