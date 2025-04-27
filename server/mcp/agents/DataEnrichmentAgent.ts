import { MCPAgent, AgentRunContext, AgentRunResult } from './AgentRegistry';
import { StepAction, ProtocolStep, MCP } from '../MCPTypes';

interface EnrichmentSource {
  type: string;
  endpoint: string;
  parameters: Record<string, any>;
  relevance: number;
  description: string;
}

export class DataEnrichmentAgent implements MCPAgent {
  name = 'Data Enrichment Agent';
  supportedActions: StepAction[] = ['enrich_data'];

  async run(step: ProtocolStep, mcp: MCP, context?: AgentRunContext): Promise<AgentRunResult> {
    if (!context?.llm) {
      throw new Error('LLM context is required for data enrichment');
    }

    const thoughtProcess: string[] = [];
    thoughtProcess.push('Analyzing problem context for potential data enrichment...');

    // Use LLM to determine relevant external data sources
    const enrichmentPrompt = this.buildEnrichmentPrompt(mcp);
    const llmResponse = await context.llm(enrichmentPrompt);
    
    // Parse LLM response to get enrichment sources
    const enrichmentSources = this.parseEnrichmentSources(llmResponse);
    thoughtProcess.push(`Identified ${enrichmentSources.length} relevant external data sources`);

    // Fetch data from each source
    const enrichedData: Record<string, any> = {};
    for (const source of enrichmentSources) {
      if (source.relevance < 0.5) {
        thoughtProcess.push(`Skipping ${source.type} due to low relevance (${source.relevance})`);
        continue;
      }

      try {
        const data = await this.fetchExternalData(source);
        enrichedData[source.type] = data;
        thoughtProcess.push(`Successfully enriched data with ${source.type} information`);
      } catch (error: any) {
        const errorMessage = error?.message || 'Unknown error occurred';
        thoughtProcess.push(`Warning: Failed to fetch ${source.type} data: ${errorMessage}`);
        // Continue with other sources even if one fails
      }
    }

    return {
      output: {
        success: true,
        enrichedData,
        enrichmentSources: enrichmentSources.map(source => ({
          type: source.type,
          relevance: source.relevance,
          description: source.description
        }))
      },
      thoughtProcess: thoughtProcess.join('\n')
    };
  }

  private buildEnrichmentPrompt(mcp: MCP): string {
    return `
Given the following optimization problem:
Problem Type: ${mcp.context.problemType}
Industry: ${mcp.context.industry || 'Not specified'}

Consider what external data sources would be valuable for enriching the dataset.
Focus on sources that could impact:
1. Optimization constraints
2. Performance metrics
3. Solution quality

Examples:
- Weather data for outdoor operations
- Traffic patterns for routing
- Local events for demand forecasting
- Labor laws for scheduling
- Historical performance data

Respond in the following JSON format:
{
  "sources": [
    {
      "type": "source_name",
      "endpoint": "api_endpoint",
      "parameters": {"param1": "value1"},
      "relevance": 0.95,
      "description": "How this data improves the solution"
    }
  ]
}`;
  }

  private parseEnrichmentSources(llmResponse: string): EnrichmentSource[] {
    try {
      const response = JSON.parse(llmResponse);
      return response.sources;
    } catch (error) {
      console.error('Failed to parse LLM response:', error);
      return [];
    }
  }

  private async fetchExternalData(source: EnrichmentSource): Promise<any> {
    // This would be replaced with actual API calls to external services
    // Mock implementation for now
    return {
      timestamp: new Date().toISOString(),
      source: source.type,
      data: {
        // Mock data based on source type
        ...(source.type === 'weather' && {
          temperature: 20,
          conditions: 'clear'
        }),
        ...(source.type === 'traffic' && {
          congestion_level: 'medium',
          average_speed: 35
        })
      }
    };
  }
} 