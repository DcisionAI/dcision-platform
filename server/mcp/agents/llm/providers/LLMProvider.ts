export interface LLMProvider {
  call(prompt: string, config?: { 
    model?: string, 
    temperature?: number,
    stream?: boolean,
    onChunk?: (chunk: string) => void
  }): Promise<string>;
} 