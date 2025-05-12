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
  /**
   * Interpret a user problem description like an expert decision maker (optimization PhD with business sense).
   * Return a structured analysis including:
   * 1) intentInterpretation: your interpretation of the user's intent.
   * 2) confidenceLevel: confidence in this interpretation (percentage).
   * 3) alternatives: alternative interpretations considered.
   * 4) explanation: why you chose this interpretation.
   * 5) useCases: typical industry use cases for this problem.
   * Respond ONLY in valid JSON with exactly these fields.
   */
  interpretIntent(description: string): Promise<{
    intentInterpretation: string;
    confidenceLevel: number;
    alternatives: string[];
    explanation: string;
    useCases: string[];
  }>;
  enrichData(data: any, context: any): Promise<{ enrichedData: any, reasoning: string }>;
  explainSolution(solution: any, problemType: string): Promise<{ explanation: string, insights: string[] }>;
  /**
   * Analyze a business problem and extract model structure.
   * Return JSON with exactly:
   * variables: list of { name, description, domain? }
   * constraints: list of { name?, description, expression? }
   * objective: { type, expression?, description? }
   */
  interpretModelDefinition(description: string): Promise<{
    variables: Array<{ name: string; description: string; domain?: string; businessContext?: string }>;
    constraints: Array<{ name?: string; description: string; expression?: string; businessContext?: string }>;
    objective: { type: string; expression?: string; description?: string; businessContext?: string };
    externalDataSources: Array<{ source: string; description: string; valueAdd: string }>;
  }>;
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

  async interpretIntent(description: string): Promise<{
    intentInterpretation: string;
    confidenceLevel: number;
    alternatives: string[];
    explanation: string;
    useCases: string[];
  }> {
    // Expert decision maker interpretation: a multi-part structured analysis
    const systemPrompt = `You are a seasoned operations research (OR) specialist with deep business domain expertise. When reviewing a business problem statement, apply rigorous decision-modeling principles to identify the core objective, constraints, and key opportunities. Explain your analysis in clear, business-friendly language without jargon. Include a concise, plain-language description of the underlying model (e.g., "minimize the sum of ... subject to ... constraints") but keep it understandable for business users.
Important: You only support two domains: Fleet Operations (e.g., vehicle routing, pickup and delivery) and Workforce Management (e.g., staff scheduling, resource allocation). If the problem description falls outside these domains, you MUST respond with the following JSON (and nothing else):
{
  "intentInterpretation": "DecisionAI currently supports Fleet Ops and Workforce Management - please stay tuned as we grow our portfolio of agents to support more domains",
  "confidenceLevel": 0,
  "alternatives": [],
  "explanation": "",
  "useCases": []
}
Provide exactly these fields in JSON:
1) intentInterpretation: how you understand the request.
2) confidenceLevel: your confidence in this interpretation (0-100).
3) alternatives: other plausible ways to frame the problem.
4) explanation: why you selected this interpretation.
5) useCases: 2-3 real-world industry examples where addressing this problem drives significant value.
Respond ONLY in valid JSON with exactly these keys.`;

    const prompt = `Problem description: ${description}`;
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
  
  async interpretModelDefinition(description: string): Promise<{
    variables: Array<{ name: string; description: string; domain?: string; businessContext?: string }>;
    constraints: Array<{ name?: string; description: string; expression?: string; businessContext?: string }>;
    objective: { type: string; expression?: string; description?: string; businessContext?: string };
    externalDataSources: Array<{ source: string; description: string; valueAdd: string }>;
  }> {
    const systemPrompt = `You are an expert in optimization modeling. Given a business problem statement, identify and extract:\n` +
      `1) variables: list of decision variables with {name, description, domain (optional), businessContext (business relevance)};\n` +
      `2) constraints: list of model constraints with {name (required, short descriptive label), description, expression (optional), businessContext}. For each constraint, always provide a short, descriptive name (e.g., "Vehicle Capacity", "Fuel Limit", "Route Coverage");\n` +
      `3) objective: model objective with {type ('minimize' or 'maximize'), expression (optional), description, businessContext};\n` +
      `4) externalDataSources: list of optional external data sources that can augment model accuracy, with {source, description, valueAdd}.\n` +
      `Respond ONLY with valid JSON containing exactly these four fields.`;
    const prompt = `Problem description: ${description}`;
    const response = await this.callLLM(prompt, systemPrompt);
    const content = response.content.trim();
    try {
      return JSON.parse(content);
    } catch (err: any) {
      const cleaned = extractJsonFromMarkdown(content);
      const first = cleaned.indexOf('{');
      const last = cleaned.lastIndexOf('}');
      if (first !== -1 && last > first) {
        const jsonOnly = cleaned.slice(first, last + 1);
        try {
          return JSON.parse(jsonOnly);
        } catch (innerErr: any) {
          throw new Error(`Failed to parse model definition JSON: ${innerErr.message}`);
        }
      }
      throw new Error(`Failed to parse JSON for model definition: ${err.message}`);
    }
  }
} 