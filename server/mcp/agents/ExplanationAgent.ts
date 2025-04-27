import { Step, StepResult } from '../types';
import { OrchestrationContext } from '../../orchestrator/OrchestrationContext';
import OpenAI from 'openai';

export class ExplanationAgent {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  public async execute(step: Step, context: OrchestrationContext): Promise<StepResult> {
    try {
      const { format = 'text', solution, problemType } = step.config || {};
      
      if (!solution) {
        return {
          success: false,
          error: 'Missing solution data in step config'
        };
      }

      let explanation;
      switch (format) {
        case 'text':
          explanation = await this.generateTextExplanation(solution, problemType);
          break;
        case 'html':
          explanation = await this.generateHtmlExplanation(solution, problemType);
          break;
        case 'executive_summary':
          explanation = await this.generateExecutiveSummary(solution, problemType);
          break;
        case 'technical_details':
          explanation = await this.generateTechnicalDetails(solution, problemType);
          break;
        default:
          return {
            success: false,
            error: `Unsupported explanation format: ${format}`
          };
      }

      return {
        success: true,
        outputs: { explanation }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during explanation generation'
      };
    }
  }

  private async generateTextExplanation(solution: any, problemType?: string): Promise<string> {
    const prompt = `Explain the following optimization solution in clear, natural language:
    1. Summarize the key outcomes
    2. Highlight important decisions and trade-offs
    3. Explain any constraints or limitations
    4. Provide actionable insights
    
    Problem Type: ${problemType || 'Optimization'}
    Solution: ${JSON.stringify(solution, null, 2)}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in explaining complex optimization solutions to business stakeholders.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    return response.choices[0].message.content || '';
  }

  private async generateHtmlExplanation(solution: any, problemType?: string): Promise<string> {
    const prompt = `Create an HTML explanation of the following optimization solution:
    1. Use appropriate HTML structure with sections and headings
    2. Include summary at the top
    3. Break down complex aspects into digestible sections
    4. Add relevant styling classes for better presentation
    
    Problem Type: ${problemType || 'Optimization'}
    Solution: ${JSON.stringify(solution, null, 2)}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in creating structured HTML explanations of optimization solutions. Use semantic HTML and appropriate CSS classes.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    return response.choices[0].message.content || '';
  }

  private async generateExecutiveSummary(solution: any, problemType?: string): Promise<string> {
    const prompt = `Create an executive summary of the following optimization solution:
    1. Focus on business impact and value
    2. Highlight key metrics and improvements
    3. Summarize strategic implications
    4. Keep it concise and action-oriented
    
    Problem Type: ${problemType || 'Optimization'}
    Solution: ${JSON.stringify(solution, null, 2)}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in communicating optimization results to executive stakeholders. Focus on business value and strategic implications.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    return response.choices[0].message.content || '';
  }

  private async generateTechnicalDetails(solution: any, problemType?: string): Promise<string> {
    const prompt = `Provide detailed technical analysis of the following optimization solution:
    1. Explain the mathematical model and approach
    2. Analyze solution quality and optimality
    3. Discuss technical constraints and their impact
    4. Include relevant metrics and statistics
    
    Problem Type: ${problemType || 'Optimization'}
    Solution: ${JSON.stringify(solution, null, 2)}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in technical optimization analysis. Provide detailed mathematical and algorithmic insights.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    return response.choices[0].message.content || '';
  }
}

export function createExplanationAgent(apiKey: string): (step: Step, context: OrchestrationContext) => Promise<StepResult> {
  const agent = new ExplanationAgent(apiKey);
  return (step: Step, context: OrchestrationContext) => agent.execute(step, context);
} 