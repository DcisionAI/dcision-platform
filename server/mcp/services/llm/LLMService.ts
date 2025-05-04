import { Anthropic } from '@anthropic-ai/sdk';
import OpenAI from 'openai';
// Utility to strip Markdown code fences when extracting JSON
import { extractJsonFromMarkdown } from '../../utils/markdown';

export type LLMProvider = 'anthropic' | 'openai';

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMService {
  generateConstraints(businessRules: string): Promise<{ constraints: string[], reasoning: string }>;
  validateModel(model: any, problemType: string): Promise<{ issues: string[], suggestions: string[] }>;
  interpretIntent(description: string): Promise<{ problemType: string, context: any }>;
  enrichData(data: any, context: any): Promise<{ enrichedData: any, reasoning: string }>;
  explainSolution(solution: any, problemType: string): Promise<{ explanation: string, insights: string[] }>;
}

export class LLMServiceImpl implements LLMService {
  private provider: LLMProvider;
  private anthropic?: Anthropic;
  private openai?: OpenAI;

  constructor(provider: LLMProvider, apiKey: string) {
    if (!apiKey) {
      throw new Error(`API key is required for ${provider} provider`);
    }
    this.provider = provider;
    if (provider === 'anthropic') {
      this.anthropic = new Anthropic({ apiKey });
    } else {
      this.openai = new OpenAI({ apiKey });
    }
  }

  private async callLLM(prompt: string, systemPrompt?: string): Promise<LLMResponse> {
    try {
      if (this.provider === 'anthropic' && this.anthropic) {
        const messages: Anthropic.MessageParam[] = [];
        if (systemPrompt) {
          messages.push({ role: 'assistant', content: systemPrompt });
        }
        messages.push({ role: 'user', content: prompt });

        const response = await this.anthropic.messages.create({
          model: 'claude-3-opus-20240229',
          max_tokens: 4000,
          messages
        });

        const content = response.content[0].type === 'text' ? response.content[0].text : '';
        
        return {
          content,
          usage: {
            promptTokens: response.usage.input_tokens,
            completionTokens: response.usage.output_tokens,
            totalTokens: response.usage.input_tokens + response.usage.output_tokens
          }
        };
      } else if (this.provider === 'openai' && this.openai) {
        const messages: OpenAI.ChatCompletionMessageParam[] = [];
        if (systemPrompt) {
          messages.push({ role: 'system', content: systemPrompt });
        }
        messages.push({ role: 'user', content: prompt });

        const response = await this.openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages
        });

        return {
          content: response.choices[0].message.content || '',
          usage: {
            promptTokens: response.usage?.prompt_tokens || 0,
            completionTokens: response.usage?.completion_tokens || 0,
            totalTokens: response.usage?.total_tokens || 0
          }
        };
      }
      throw new Error('LLM provider not properly initialized');
    } catch (error: any) {
      if (error?.response?.status === 401) {
        throw new Error('Invalid API key');
      }
      throw new Error(`LLM call failed: ${error.message}`);
    }
  }

  async generateConstraints(businessRules: string): Promise<{ constraints: string[], reasoning: string }> {
    const systemPrompt = `You are an expert in optimization modeling. Your task is to convert business rules into mathematical constraints.
    Respond in JSON format with two fields: "constraints" (array of constraint strings) and "reasoning" (explanation of how you derived the constraints).`;
    
    const prompt = `Given these business rules: ${businessRules}
    Generate mathematical constraints for an optimization model.`;
    
    const response = await this.callLLM(prompt, systemPrompt);
    return JSON.parse(response.content);
  }

  async validateModel(model: any, problemType: string): Promise<{ issues: string[], suggestions: string[] }> {
    const systemPrompt = `You are an expert in optimization modeling. Your task is to validate model components and suggest improvements.
    Respond in JSON format with two fields: "issues" (array of potential problems) and "suggestions" (array of improvement suggestions).`;
    
    const prompt = `Validate this ${problemType} optimization model: ${JSON.stringify(model, null, 2)}
    Check for completeness, correctness, and potential improvements.`;
    
    const response = await this.callLLM(prompt, systemPrompt);
    return JSON.parse(response.content);
  }

  async interpretIntent(description: string): Promise<{ problemType: string, context: any }> {
    const systemPrompt = `You are an expert in optimization problems. Your task is to interpret problem descriptions and identify the appropriate problem type and context.
    Respond in JSON format with two fields: "problemType" (one of: vehicle_routing, job_shop, bin_packing, etc.) and "context" (relevant problem parameters and constraints).`;
    
    const prompt = `Interpret this optimization problem description: ${description}
    Identify the problem type and extract relevant context.`;
    
    const response = await this.callLLM(prompt, systemPrompt);
    const content = response.content.trim();
    try {
      return JSON.parse(content);
    } catch (err: any) {
      // Fallback: strip Markdown fences and extract JSON blob
      const cleaned = extractJsonFromMarkdown(content);
      const first = cleaned.indexOf('{');
      const last = cleaned.lastIndexOf('}');
      if (first !== -1 && last !== -1 && last > first) {
        const jsonOnly = cleaned.slice(first, last + 1);
        try {
          return JSON.parse(jsonOnly);
        } catch (innerErr: any) {
          throw new Error(`Failed to parse JSON after cleanup: ${innerErr.message}`);
        }
      }
      throw new Error(`Failed to parse JSON from LLM response: ${err.message}`);
    }
  }

  async enrichData(data: any, context: any): Promise<{ enrichedData: any, reasoning: string }> {
    const systemPrompt = `You are an expert in data enrichment for optimization problems. Your task is to enhance data with derived features and insights.
    Respond in JSON format with two fields: "enrichedData" (the enhanced data structure) and "reasoning" (explanation of the enrichment process).`;
    
    const prompt = `Enrich this data for a ${context.problemType} problem:
    Original data: ${JSON.stringify(data, null, 2)}
    Context: ${JSON.stringify(context, null, 2)}
    Suggest derived features and data transformations that would be valuable for optimization.`;
    
    const response = await this.callLLM(prompt, systemPrompt);
    return JSON.parse(response.content);
  }

  async explainSolution(solution: any, problemType: string): Promise<{ explanation: string, insights: string[] }> {
    const systemPrompt = `You are an expert in optimization solutions. Your task is to explain solutions in clear, business-relevant terms.
    Respond in JSON format with two fields: "explanation" (detailed explanation of the solution) and "insights" (array of key business insights).`;
    
    const prompt = `Explain this solution for a ${problemType} problem:
    Solution: ${JSON.stringify(solution, null, 2)}
    Provide a clear explanation and highlight key business insights.`;
    
    const response = await this.callLLM(prompt, systemPrompt);
    return JSON.parse(response.content);
  }
} 