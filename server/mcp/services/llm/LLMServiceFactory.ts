import { LLMService, LLMServiceImpl, LLMProvider } from './LLMService';

export class LLMServiceFactory {
  private static instance: LLMService | null = null;

  static getInstance(): LLMService {
    if (!this.instance) {
      const provider = process.env.LLM_PROVIDER as LLMProvider;
      if (!provider || !['anthropic', 'openai'].includes(provider)) {
        throw new Error('Invalid LLM_PROVIDER. Must be either "anthropic" or "openai"');
      }

      const apiKey = provider === 'anthropic' 
        ? process.env.ANTHROPIC_API_KEY 
        : process.env.OPENAI_API_KEY;

      if (!apiKey) {
        throw new Error(`Missing ${provider.toUpperCase()}_API_KEY environment variable`);
      }

      this.instance = new LLMServiceImpl(provider, apiKey);
    }
    return this.instance;
  }
} 