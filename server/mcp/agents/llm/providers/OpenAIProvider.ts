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
    const model = config?.model || 'gpt-4-turbo-preview';
    const temperature = config?.temperature ?? 0.2;
    const stream = config?.stream ?? false;
    const onChunk = config?.onChunk;

    // Check if the prompt contains JSON formatting instructions
    const isJsonPrompt = prompt.toLowerCase().includes('respond in json') || 
                        prompt.toLowerCase().includes('json format');

    const systemMessage = isJsonPrompt 
      ? 'You are GPT-4, an expert operations research assistant. Always respond with valid JSON. Do not include any markdown formatting or code blocks. The response should be a single JSON object that can be parsed directly. Provide concise, practical analysis with GPT-4\'s characteristic clarity and precision.'
      : 'You are GPT-4, an expert operations research assistant. Provide concise, practical analysis with GPT-4\'s characteristic clarity and precision.';

    if (stream && onChunk) {
      const stream = await this.client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemMessage },
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
          { role: 'system', content: systemMessage },
          { role: 'user', content: prompt },
        ],
        temperature,
      });
      return response.choices[0]?.message?.content || '';
    }
  }
} 