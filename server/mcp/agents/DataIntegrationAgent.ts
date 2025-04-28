import { MCPAgent, AgentRunContext, AgentRunResult } from './AgentRegistry';
import { StepAction, ProtocolStep, MCP } from '../types';
import { DatabaseConnector } from '../connectors/DatabaseConnector';

interface FieldMapping {
  modelField: string;
  table: string;
  column: string;
  confidence: number;
  sampleValues?: any[];
}

interface DatabaseMetadata {
  tables: {
    name: string;
    columns: Array<{
      name: string;
      type: string;
      sampleValues?: any[];
    }>;
  }[];
}

export class DataIntegrationAgent implements MCPAgent {
  name = 'Data Integration Agent';
  supportedActions: StepAction[] = ['collect_data'];
  private dbConnector: DatabaseConnector;

  constructor(dbConnector: DatabaseConnector) {
    this.dbConnector = dbConnector;
  }

  async run(step: ProtocolStep, mcp: MCP, context?: AgentRunContext): Promise<AgentRunResult> {
    if (!context?.llm) {
      throw new Error('LLM context is required for data integration');
    }

    const thoughtProcess: string[] = [];
    thoughtProcess.push('Analyzing database structure and required fields...');

    // Get database metadata
    const dbMetadata = await this.getDbMetadata();
    
    // Get required fields from MCP context
    const requiredFields = mcp.context.dataset.requiredFields || [];

    // Use LLM to analyze and map fields
    const mappingPrompt = this.buildMappingPrompt(dbMetadata, requiredFields, mcp.context.problemType);
    const llmResponse = await context.llm(mappingPrompt);
    
    // Parse LLM response to get field mappings
    const fieldMappings = this.parseFieldMappings(llmResponse);
    thoughtProcess.push(`Generated ${fieldMappings.length} field mappings`);

    // LLM-based feature engineering
    const featurePrompt = `
Given the database schema: ${JSON.stringify(dbMetadata)}
and required fields: ${JSON.stringify(requiredFields)}
for a ${mcp.context.problemType} problem,
suggest any new features or transformations that could improve the model.
Respond in JSON: { "suggestedFeatures": ["..."], "reasoning": "..." }
`;
    const featureRaw = await context.llm(featurePrompt);
    try {
      const features = JSON.parse(featureRaw);
      if (features.suggestedFeatures?.length) {
        thoughtProcess.push(`LLM suggested features: ${features.suggestedFeatures.join(', ')}`);
        thoughtProcess.push(`Feature reasoning: ${features.reasoning}`);
      }
    } catch (e) {
      thoughtProcess.push('LLM feature engineering response could not be parsed.');
    }

    // LLM-based mapping validation
    const validationPrompt = `
Given the following field mappings: ${JSON.stringify(fieldMappings)}
Are there any missing or incorrect mappings? Respond in JSON: { "issues": ["..."], "suggestions": ["..."] }
`;
    const validationRaw = await context.llm(validationPrompt);
    try {
      const validation = JSON.parse(validationRaw);
      if (validation.issues?.length) {
        thoughtProcess.push(`LLM validation issues: ${validation.issues.join(', ')}`);
      }
      if (validation.suggestions?.length) {
        thoughtProcess.push(`LLM validation suggestions: ${validation.suggestions.join(', ')}`);
      }
    } catch (e) {
      thoughtProcess.push('LLM mapping validation response could not be parsed.');
    }

    // Check confidence levels and determine if human review is needed
    const needsHumanReview = fieldMappings.some(mapping => mapping.confidence < 0.8);
    
    // Collect data based on mappings
    const collectedData: Record<string, any> = {};
    for (const mapping of fieldMappings) {
      try {
        const data = await this.dbConnector.fetchData(
          mapping.table,
          [mapping.column]
        );
        collectedData[mapping.modelField] = data;
        thoughtProcess.push(`Collected data for ${mapping.modelField} from ${mapping.table}.${mapping.column}`);
      } catch (error: any) {
        const errorMessage = error?.message || 'Unknown error occurred';
        thoughtProcess.push(`Error collecting data for ${mapping.modelField}: ${errorMessage}`);
        return {
          output: {
            success: false,
            error: `Failed to collect data for ${mapping.modelField}`,
            details: errorMessage
          },
          thoughtProcess: thoughtProcess.join('\n')
        };
      }
    }

    return {
      output: {
        success: true,
        fieldMappings,
        collectedData,
        needsHumanReview,
        confidence: {
          min: Math.min(...fieldMappings.map(m => m.confidence)),
          max: Math.max(...fieldMappings.map(m => m.confidence)),
          avg: fieldMappings.reduce((sum, m) => sum + m.confidence, 0) / fieldMappings.length
        }
      },
      thoughtProcess: thoughtProcess.join('\n')
    };
  }

  private async getDbMetadata(): Promise<DatabaseMetadata> {
    // This would typically come from your database system
    // For now, returning mock metadata
    return {
      tables: [
        {
          name: 'drivers',
          columns: [
            { name: 'id', type: 'integer' },
            { name: 'name', type: 'string' },
            { name: 'license', type: 'string' }
          ]
        },
        {
          name: 'vehicles',
          columns: [
            { name: 'id', type: 'integer' },
            { name: 'type', type: 'string' },
            { name: 'capacity', type: 'number' }
          ]
        }
      ]
    };
  }

  private buildMappingPrompt(metadata: DatabaseMetadata, requiredFields: string[], problemType: string): string {
    return `
Given the following database structure:
${JSON.stringify(metadata, null, 2)}

And these required fields for a ${problemType} problem:
${JSON.stringify(requiredFields, null, 2)}

Please map each required field to the most appropriate table and column.
Consider column names, types, and their semantic meaning in the context of ${problemType}.
For each mapping, provide a confidence score between 0 and 1.

Respond in the following JSON format:
{
  "mappings": [
    {
      "modelField": "required_field_name",
      "table": "matched_table",
      "column": "matched_column",
      "confidence": 0.95
    }
  ]
}`;
  }

  private parseFieldMappings(llmResponse: string): FieldMapping[] {
    try {
      const response = JSON.parse(llmResponse);
      return response.mappings;
    } catch (error) {
      console.error('Failed to parse LLM response:', error);
      return [];
    }
  }
} 