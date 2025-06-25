// Model Configuration for DcisionAI Agents
// This file allows easy switching between different model providers and models

export interface ModelConfig {
  provider: 'anthropic' | 'openai';
  modelName: string;
  temperature: number;
  maxTokens?: number;
  useGPT4oMini: boolean;
}

// Default configuration using GPT-4o-mini for better performance and cost-effectiveness
export const defaultModelConfig: ModelConfig = {
  provider: 'openai',
  modelName: 'gpt-4o-mini',
  temperature: 0.1,
  maxTokens: 4000,
  useGPT4oMini: true
};

// Alternative configurations
export const modelConfigs = {
  // High performance, cost-effective (recommended)
  gpt4oMini: {
    provider: 'openai' as const,
    modelName: 'gpt-4o-mini',
    temperature: 0.1,
    maxTokens: 4000,
    useGPT4oMini: true
  },

  // Full GPT-4o for complex problems
  gpt4o: {
    provider: 'openai' as const,
    modelName: 'gpt-4o',
    temperature: 0.1,
    maxTokens: 8000,
    useGPT4oMini: false
  },

  // Claude for comparison
  claude: {
    provider: 'anthropic' as const,
    modelName: 'claude-3-5-sonnet-20241022',
    temperature: 0.1,
    maxTokens: 4000,
    useGPT4oMini: false
  },

  // Claude Haiku for speed
  claudeHaiku: {
    provider: 'anthropic' as const,
    modelName: 'claude-3-haiku-20240307',
    temperature: 0.1,
    maxTokens: 4000,
    useGPT4oMini: false
  }
};

// Model-specific configurations for different agents
export const agentModelConfigs = {
  // Intent Analysis - needs good reasoning
  intentAgent: modelConfigs.gpt4oMini,
  
  // Data Enrichment - needs good extraction
  dataAgent: modelConfigs.gpt4oMini,
  
  // Model Building - needs excellent mathematical understanding
  modelBuilderAgent: modelConfigs.gpt4oMini,
  
  // Explanation - needs good communication
  explainAgent: modelConfigs.gpt4oMini
};

// Environment-based configuration
export function getModelConfig(agentType?: keyof typeof agentModelConfigs): ModelConfig {
  // Check environment variables for overrides
  const envProvider = process.env.MODEL_PROVIDER as 'anthropic' | 'openai' | undefined;
  const envModel = process.env.MODEL_NAME;
  const envUseMini = process.env.USE_GPT4O_MINI === 'true';
  
  if (envProvider && envModel) {
    return {
      provider: envProvider,
      modelName: envModel,
      temperature: 0.1,
      maxTokens: 4000,
      useGPT4oMini: envUseMini
    };
  }
  
  // Use agent-specific config if provided
  if (agentType && agentModelConfigs[agentType]) {
    return agentModelConfigs[agentType];
  }
  
  // Default to GPT-4o-mini
  return defaultModelConfig;
}

// Helper function to get model name with fallback
export function getModelName(provider: 'anthropic' | 'openai', useMini: boolean = true): string {
  if (provider === 'openai') {
    return useMini ? 'gpt-4o-mini' : 'gpt-4o';
  } else {
    return 'claude-3-5-sonnet-20241022';
  }
}

// Performance comparison
export const modelPerformance = {
  'gpt-4o-mini': {
    speed: 'fast',
    cost: 'low',
    accuracy: 'high',
    mathematicalReasoning: 'excellent',
    jsonGeneration: 'reliable'
  },
  'gpt-4o': {
    speed: 'medium',
    cost: 'medium',
    accuracy: 'very high',
    mathematicalReasoning: 'excellent',
    jsonGeneration: 'very reliable'
  },
  'claude-3-5-sonnet-20241022': {
    speed: 'medium',
    cost: 'medium',
    accuracy: 'high',
    mathematicalReasoning: 'good',
    jsonGeneration: 'good'
  },
  'claude-3-haiku-20240307': {
    speed: 'very fast',
    cost: 'very low',
    accuracy: 'medium',
    mathematicalReasoning: 'fair',
    jsonGeneration: 'fair'
  }
};

// Recommendation for optimization problems
export const optimizationRecommendation = {
  primary: 'gpt-4o-mini',
  reason: 'Best balance of speed, cost, and mathematical reasoning capabilities',
  alternatives: ['gpt-4o', 'claude-3-5-sonnet-20241022']
}; 