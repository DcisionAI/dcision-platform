// Agno Client Library for TypeScript/Node.js
// This provides a clean interface to communicate with the Agno Python backend

export interface AgnoChatRequest {
  message: string;
  session_id?: string;
  model_provider?: 'anthropic' | 'openai';
  model_name?: string;
  context?: Record<string, any>;
}

export interface AgnoChatResponse {
  response: string;
  session_id?: string;
  model_used: string;
  timestamp: string;
}

export interface AgnoAgentConfig {
  name: string;
  instructions: string;
  model_provider?: 'anthropic' | 'openai';
  model_name?: string;
  temperature?: number;
  markdown?: boolean;
}

export interface AgnoAgent {
  id: string;
  name: string;
  model_provider: string;
}

export interface AgnoHealthStatus {
  status: string;
  anthropic_configured: boolean;
  openai_configured: boolean;
  active_agents: number;
}

export interface AgnoModelInfo {
  provider: string;
  models: string[];
}

export class AgnoClient {
  private baseUrl: string;
  private defaultProvider: 'anthropic' | 'openai';

  constructor(baseUrl?: string, defaultProvider: 'anthropic' | 'openai' = 'anthropic') {
    // Use environment variable if available, otherwise default to localhost
    this.baseUrl = baseUrl || process.env.AGNO_BACKEND_URL || 'http://localhost:8000';
    this.baseUrl = this.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.defaultProvider = defaultProvider;
  }

  /**
   * Check if the Agno backend is healthy
   */
  async healthCheck(): Promise<AgnoHealthStatus> {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Get available models for a provider
   */
  async getAvailableModels(provider: 'anthropic' | 'openai'): Promise<AgnoModelInfo> {
    const response = await fetch(`${this.baseUrl}/api/models/${provider}`);
    if (!response.ok) {
      throw new Error(`Failed to get models: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Create a new agent
   */
  async createAgent(config: AgnoAgentConfig): Promise<{ agent_id: string; message: string; model_provider: string; model_name: string }> {
    const response = await fetch(`${this.baseUrl}/api/agent/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...config,
        model_provider: config.model_provider || this.defaultProvider
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(`Failed to create agent: ${error.detail}`);
    }

    return response.json();
  }

  /**
   * List all active agents
   */
  async listAgents(): Promise<{ agents: AgnoAgent[]; total: number }> {
    const response = await fetch(`${this.baseUrl}/api/agent/list`);
    if (!response.ok) {
      throw new Error(`Failed to list agents: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Delete an agent
   */
  async deleteAgent(agentId: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/api/agent/${agentId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(`Failed to delete agent: ${error.detail}`);
    }

    return response.json();
  }

  /**
   * Chat with an agent
   */
  async chat(request: AgnoChatRequest): Promise<AgnoChatResponse> {
    const response = await fetch(`${this.baseUrl}/api/agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...request,
        model_provider: request.model_provider || this.defaultProvider
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(`Chat failed: ${error.detail}`);
    }

    return response.json();
  }

  /**
   * Convenience method for simple chat
   */
  async simpleChat(message: string, provider?: 'anthropic' | 'openai', model?: string): Promise<string> {
    const response = await this.chat({
      message,
      model_provider: provider || this.defaultProvider,
      model_name: model
    });
    return response.response;
  }

  /**
   * Create a construction-specific agent
   */
  async createConstructionAgent(modelProvider?: 'anthropic' | 'openai', modelName?: string): Promise<string> {
    const config: AgnoAgentConfig = {
      name: 'Construction Management Agent',
      instructions: `You are an expert construction management AI assistant. You help with:
- Project planning and scheduling
- Resource allocation and optimization
- Cost estimation and budget management
- Risk assessment and mitigation
- Quality control and safety compliance
- Stakeholder communication

Provide clear, actionable advice based on construction industry best practices and standards.`,
      model_provider: modelProvider || this.defaultProvider,
      model_name: modelName,
      temperature: 0.1,
      markdown: true
    };

    const result = await this.createAgent(config);
    return result.agent_id;
  }

  /**
   * Create a finance-specific agent
   */
  async createFinanceAgent(modelProvider?: 'anthropic' | 'openai', modelName?: string): Promise<string> {
    const config: AgnoAgentConfig = {
      name: 'Financial Advisor Agent',
      instructions: `You are a professional financial advisor AI assistant. You help with:
- Investment analysis and recommendations
- Portfolio management and optimization
- Risk assessment and management
- Financial planning and goal setting
- Market analysis and trends
- Tax planning and optimization

Provide clear, accurate financial advice while considering risk tolerance and financial goals.`,
      model_provider: modelProvider || this.defaultProvider,
      model_name: modelName,
      temperature: 0.1,
      markdown: true
    };

    const result = await this.createAgent(config);
    return result.agent_id;
  }

  /**
   * Create a data analysis agent
   */
  async createDataAnalysisAgent(modelProvider?: 'anthropic' | 'openai', modelName?: string): Promise<string> {
    const config: AgnoAgentConfig = {
      name: 'Data Analysis Agent',
      instructions: `You are an expert data analysis AI assistant. You help with:
- Data interpretation and insights
- Statistical analysis and modeling
- Business intelligence and reporting
- Data visualization recommendations
- Predictive analytics
- Performance metrics and KPIs

Provide clear, data-driven insights and actionable recommendations.`,
      model_provider: modelProvider || this.defaultProvider,
      model_name: modelName,
      temperature: 0.1,
      markdown: true
    };

    const result = await this.createAgent(config);
    return result.agent_id;
  }
}

// Export a default instance
export const agnoClient = new AgnoClient(); 