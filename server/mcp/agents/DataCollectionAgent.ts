import { MCPAgent, AgentRunContext, AgentRunResult } from './AgentRegistry';
import { StepAction, ProtocolStep, MCP } from '../MCPTypes';
import { DatabaseConnector } from '../connectors/DatabaseConnector';

export class DataCollectionAgent implements MCPAgent {
  name = 'Data Collection Agent';
  supportedActions: StepAction[] = ['collect_data'];
  private dbConnector: DatabaseConnector;

  constructor(dbConnector: DatabaseConnector) {
    this.dbConnector = dbConnector;
  }

  async run(step: ProtocolStep, mcp: MCP, context?: AgentRunContext): Promise<AgentRunResult> {
    const { dataset } = mcp.context;
    const requiredFields = dataset.requiredFields || [];
    const thoughtProcess: string[] = [];

    thoughtProcess.push('Analyzing required data fields and sources...');

    // Collect data from internal sources
    const collectedData: Record<string, any> = {};
    for (const source of dataset.internalSources) {
      thoughtProcess.push(`Collecting data from source: ${source}`);
      try {
        const data = await this.dbConnector.fetchData(source, requiredFields);
        collectedData[source] = data;
        thoughtProcess.push(`Successfully collected ${Object.keys(data).length} records from ${source}`);
      } catch (error: any) {
        const errorMessage = error?.message || 'Unknown error occurred';
        thoughtProcess.push(`Error collecting data from ${source}: ${errorMessage}`);
        return {
          output: {
            success: false,
            error: `Failed to collect data from ${source}`,
            details: errorMessage
          },
          thoughtProcess: thoughtProcess.join('\n')
        };
      }
    }

    // Validate collected data
    const missingFields = this.validateCollectedData(collectedData, requiredFields);
    if (missingFields.length > 0) {
      thoughtProcess.push(`Missing required fields: ${missingFields.join(', ')}`);
      return {
        output: {
          success: false,
          error: 'Missing required fields',
          missingFields
        },
        thoughtProcess: thoughtProcess.join('\n')
      };
    }

    thoughtProcess.push('Data collection completed successfully');
    return {
      output: {
        success: true,
        collectedData,
        summary: {
          totalSources: dataset.internalSources.length,
          totalRecords: Object.values(collectedData).reduce((sum, data) => sum + Object.keys(data).length, 0),
          fields: requiredFields
        }
      },
      thoughtProcess: thoughtProcess.join('\n')
    };
  }

  private validateCollectedData(data: Record<string, any>, requiredFields: string[]): string[] {
    const availableFields = new Set(
      Object.values(data)
        .flatMap(sourceData => Object.keys(sourceData))
    );
    return requiredFields.filter(field => !availableFields.has(field));
  }
} 