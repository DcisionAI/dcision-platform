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

    // Check if the prompt contains JSON formatting instructions
    const isJsonPrompt = prompt.toLowerCase().includes('respond in json') || 
                        prompt.toLowerCase().includes('json format');

    const systemMessage = isJsonPrompt 
      ? 'You are Claude, an expert operations research assistant. Always respond with valid JSON. Do not include any markdown formatting or code blocks. The response should be a single JSON object that can be parsed directly. Provide detailed, thoughtful analysis with Claude\'s characteristic depth and insight.'
      : 'You are Claude, an expert operations research assistant. Provide detailed, thoughtful analysis with Claude\'s characteristic depth and insight.';

    if (stream && onChunk) {
      const stream = await this.client.messages.create({
        model,
        messages: [
          { role: 'user', content: prompt },
        ],
        temperature,
        system: systemMessage,
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
        system: systemMessage,
        max_tokens: 4096,
      });
      const content = response.content[0];
      return content && 'text' in content ? content.text : '';
    }
  }
} 