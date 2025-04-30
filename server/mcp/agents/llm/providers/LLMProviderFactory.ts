import { LLMProvider } from './LLMProvider';
import { OpenAIProvider } from './OpenAIProvider';
import { AnthropicProvider } from './AnthropicProvider';

export class LLMProviderFactory {
  static createProvider(type: 'openai' | 'anthropic', apiKey: string): LLMProvider {
    console.log('Creating LLM provider with type:', type);
    console.log('API Key length:', apiKey.length);
    console.log('Environment variables:', {
      LLM_PROVIDER: process.env.LLM_PROVIDER,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? '***' : 'undefined',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '***' : 'undefined'
    });

    if (!apiKey) {
      throw new Error(`API key is required for ${type} provider`);
    }

    switch (type) {
      case 'openai':
        return new OpenAIProvider(apiKey);
      case 'anthropic':
        return new AnthropicProvider(apiKey);
      default:
        throw new Error(`Unsupported LLM provider: ${type}`);
    }
  }
} 