import Anthropic from '@anthropic-ai/sdk';
import { LLMProvider } from './LLMProvider';

export class AnthropicProvider implements LLMProvider {
  private client: Anthropic;
  
  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }
  
  async call(prompt: string, config?: { 
    model?: string, 
    temperature?: number,
    stream?: boolean,
    onChunk?: (chunk: string) => void
  }): Promise<string> {
    const model = config?.model || 'claude-3-opus-20240229';
    const temperature = config?.temperature ?? 0.2;
    const stream = config?.stream ?? false;
    const onChunk = config?.onChunk;

    if (stream && onChunk) {
      const stream = await this.client.messages.create({
        model,
        messages: [
          { role: 'user', content: prompt },
        ],
        temperature,
        system: 'You are an expert operations research assistant.',
        max_tokens: 4096,
        stream: true,
      });

      let fullResponse = '';
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && 'text' in chunk.delta) {
          const content = chunk.delta.text;
          if (content) {
            fullResponse += content;
            onChunk(content);
          }
        }
      }
      return fullResponse;
    } else {
      const response = await this.client.messages.create({
        model,
        messages: [
          { role: 'user', content: prompt },
        ],
        temperature,
        system: 'You are an expert operations research assistant.',
        max_tokens: 4096,
      });
      const content = response.content[0];
      return content && 'text' in content ? content.text : '';
    }
  }
} 