interface OpenAIConfig {
  apiKey: string;
  defaultModel: string;
  maxTokens: number;
  temperature: number;
  timeoutMs: number;
}

const config: OpenAIConfig = {
  apiKey: process.env.OPENAI_API_KEY || '',
  defaultModel: 'gpt-4.1-nano',
  maxTokens: 2000,
  temperature: 0.7,
  timeoutMs: 30000
};

export default config; 