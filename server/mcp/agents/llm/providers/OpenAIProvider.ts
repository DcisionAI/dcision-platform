import OpenAI from 'openai';
import { LLMProvider } from './LLMProvider';

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;
  
  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }
  
  async call(prompt: string, config?: { 
    model?: string, 
    temperature?: number,
    stream?: boolean,
    onChunk?: (chunk: string) => void
  }): Promise<string> {
    const model = config?.model || 'gpt-3.5-turbo';
    const temperature = config?.temperature ?? 0.2;
    const stream = config?.stream ?? false;
    const onChunk = config?.onChunk;

    if (stream && onChunk) {
      const stream = await this.client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: 'You are an expert operations research assistant.' },
          { role: 'user', content: prompt },
        ],
        temperature,
        stream: true,
      });

      let fullResponse = '';
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          onChunk(content);
        }
      }
      return fullResponse;
    } else {
      const response = await this.client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: 'You are an expert operations research assistant.' },
          { role: 'user', content: prompt },
        ],
        temperature,
      });
      return response.choices[0]?.message?.content || '';
    }
  }
} 