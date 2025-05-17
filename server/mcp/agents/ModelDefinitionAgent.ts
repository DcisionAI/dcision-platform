// agent/ModelDefinitionAgent.ts
import { MCPAgent, AgentRunContext, AgentRunResult, AgentType } from './types';
import { ProtocolStep, MCP } from '../types/core';
import { StepAction } from './types';
import { getPineconeIndex } from '../../../lib/pinecone';
import { getEmbedding } from '../../../lib/openai-embedding';

/**
 * Agent to define an optimization model based on structured data and problem type.
 * Specialized for fleet operations and workforce scheduling, but designed to be extensible.
 */
export class ModelDefinitionAgent implements MCPAgent {
  name = 'Model Definition Agent';
  type: AgentType = 'model_definition';
  supportedActions: StepAction[] = ['define_model'];

  async run(
    step: ProtocolStep,
    mcp: MCP,
    context?: AgentRunContext
  ): Promise<AgentRunResult> {
    if (step.action !== 'define_model') {
      throw new Error(`Unsupported action: ${step.action}`);
    }

    const description = this.extractUserInput(mcp);
    const problemType = mcp.context.problemType || 'general_optimization';

    const enrichedDataset = this.createDataMapping(description, mcp);

    if (!context?.llm) {
      throw new Error('LLM service is required for model definition');
    }

    const prompt = this.buildModelFromData(enrichedDataset, problemType);
    console.log('[ModelDefinitionAgent] Prompt:', prompt);

    const result = await context.llm.interpretModelDefinition(prompt);
    const modelSection = typeof result === 'object' && result !== null && 'model' in result ? result.model : result;
    const cleanedModel = cleanModelOrData(modelSection);

    return {
      output: cleanedModel,
      thoughtProcess: `Generated LP model and cleaned output to match schema expectations.`,
      prompt
    };
  }

  private extractUserInput(mcp: MCP): string {
    const metadata = mcp.context.dataset?.metadata;
    return metadata && typeof metadata === 'object' && 'userInput' in metadata
      ? String(metadata.userInput)
      : '';
  }

  private createDataMapping(description: string, mcp: MCP): Record<string, any> {
    const dataset = mcp.context.dataset || {};
    const metadata = mcp.context.dataset?.metadata || {};
    return {
      description,
      metadata,
      dataset
    };
  }

  private buildModelFromData(data: Record<string, any>, problemType: string): string {
    return `You are an expert in OR-Tools modeling.

Given the following structured problem context, generate a valid LP model for a ${problemType} problem.

Data:
${JSON.stringify(data, null, 2)}

Output ONLY valid JSON with this format:
{
  "variables": [...],
  "constraints": [...],
  "objective": {...}
}
- Use only field names from the data.
- The model must be compatible with OR-Tools.
- Do not invent new fields.`;
  }
}

export function cleanModelOrData(modelOrDataset: any): any {
  const fixId = (id: string | number) => {
    if (typeof id === 'string') {
      const num = parseInt(id.replace(/\D/g, ''), 10);
      return isNaN(num) ? id : num;
    }
    return id;
  };

  for (const v of modelOrDataset?.vehicles || []) {
    v.id = fixId(v.id);
    v.type ??= 'van';
    v.operating_cost ??= 0;
    v.maintenance_interval ??= 1000;
    v.fuel_efficiency ??= 10;
  }

  for (const t of modelOrDataset?.tasks || []) {
    t.id = fixId(t.id);
    t.duration ??= 60;
    t.priority ??= 1;
    t.required_skills ??= [];
    if (!Array.isArray(t.time_window)) {
      const tw = t.time_window ?? { start: t.time_window_start, end: t.time_window_end };
      t.time_window = [tw.start || t.time_window_start, tw.end || t.time_window_end];
    }
    if (typeof t.location === 'string') {
      const match = (modelOrDataset.locations || []).find((l: any) => l.id === t.location || fixId(l.id) === fixId(t.location));
      if (match) t.location = match;
    }
  }

  for (const l of modelOrDataset?.locations || []) {
    l.id = fixId(l.id);
    if (l.coordinates) {
      l.latitude ??= l.coordinates.lat;
      l.longitude ??= l.coordinates.lng;
    }
  }

  return modelOrDataset;
}
