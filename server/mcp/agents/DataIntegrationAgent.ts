import { MCPAgent, AgentRunContext, AgentRunResult, AgentType } from './types';
import { ProtocolStep, MCP } from '../types/core';
import { StepAction } from './types';
import { PluginRegistry } from '../plugins';
import { DataSourcePlugin, DataQuery, ValidationResult, DataSourceType } from '../plugins/datasources/base/types';
import { LLMService } from '../services/llm/LLMService';

interface FeatureSet {
  required: {
    [key: string]: {
      description: string;
      dataType: string;
      source?: string;
      validationRules: string[];
      transformation?: string;
      optimizationRole?: 'variable' | 'constraint' | 'parameter';
      importance: 'high' | 'medium' | 'low';
    };
  };
  optional: {
    [key: string]: {
      description: string;
      dataType: string;
      source?: string;
      benefits: string[];
      priority: 'high' | 'medium' | 'low';
      optimizationRole?: 'variable' | 'constraint' | 'parameter';
    };
  };
}

interface FieldMapping {
  modelField: string;
  table: string;
  column: string;
  confidence: number;
  sampleValues?: any[];
  sourceExplanation?: string;
  featureEngineering?: {
    transformations: string[];
    reasoning: string;
  };
}

interface DataSourceConfig {
  type: DataSourceType;
  connection: {
    host: string;
    port: number;
    database: string;
  };
  authentication: {
    username: string;
    password: string;
  };
}

interface MCPContext {
  environment: any;
  dataset: {
    requiredFields: string[];
    metadata?: {
      userInput?: string;
      problemType?: string;
      confidence?: number;
      alternativeTypes?: string[];
    };
  };
  problemType: string;
  industry?: string;
  businessRules?: any;
  dataSource?: DataSourceConfig;
}

export class DataIntegrationAgent implements MCPAgent {
  name = 'Data Integration Agent';
  type: AgentType = 'data_collector';
  supportedActions: StepAction[] = ['collect_data'];
  private pluginRegistry: PluginRegistry;
  private dataSource: DataSourcePlugin | null = null;

  constructor() {
    this.pluginRegistry = PluginRegistry.getInstance();
  }

  async run(step: ProtocolStep, mcp: MCP, context?: AgentRunContext): Promise<AgentRunResult> {
    if (!context?.llm) {
      throw new Error('LLM context is required for data integration');
    }

    const thoughtProcess: string[] = [];
    thoughtProcess.push('Starting data integration process...');

    try {
      // 1. Get problem type and context from MCP
      const mcpContext = mcp.context as MCPContext;
      const problemType = mcpContext.problemType;
      const requiredFields = mcpContext.dataset.requiredFields || [];
      const intentMetadata = mcpContext.dataset.metadata;
      
      thoughtProcess.push(`Problem type: ${problemType}`);
      thoughtProcess.push(`Required fields: ${requiredFields.join(', ')}`);
      if (intentMetadata?.confidence) {
        thoughtProcess.push(`Problem type confidence: ${intentMetadata.confidence}`);
      }

      // 2. Get data source plugin
      const dataSourceType = mcpContext.dataSource?.type || 'supabase';
      const plugin = this.pluginRegistry.getPlugin(dataSourceType);
      if (!plugin) {
        throw new Error(`Data source plugin '${dataSourceType}' not found`);
      }
      this.dataSource = plugin;
      thoughtProcess.push(`Using data source: ${dataSourceType}`);

      // 3. Connect to data source
      await this.dataSource.connect({
        type: mcpContext.dataSource?.type || ('database' as DataSourceType),
        connection: mcpContext.dataSource?.connection || {
          host: 'localhost',
          port: 5432,
          database: 'postgres'
        },
        authentication: mcpContext.dataSource?.authentication || {
          username: 'postgres',
          password: 'postgres'
        }
      });
      thoughtProcess.push('Connected to data source');

      // 4. Scan entire data landscape
      const schema = await this.dataSource.getSchema();
      thoughtProcess.push('Database schema retrieved');

      // 5. Analyze required features based on problem type and optimization requirements
      const featureSet = await this.analyzeFeatures(problemType, requiredFields, schema, context.llm);
      thoughtProcess.push('Feature analysis complete');

      // 6. Map features to data source with intelligent discovery
      const fieldMappings = await this.mapFeaturesToDataSource(featureSet, schema, context.llm);
      thoughtProcess.push(`Generated ${fieldMappings.length} field mappings`);

      // 7. Validate mappings
      const validationResult = await this.validateMappings(fieldMappings, context.llm);
      if (!validationResult.isValid) {
        thoughtProcess.push('Validation failed: ' + validationResult.errors?.join(', '));
        return {
          output: {
            success: false,
            error: 'Field mapping validation failed',
            details: validationResult.errors
          },
          thoughtProcess: thoughtProcess.join('\n')
        };
      }

      // 8. Collect data
      const collectedData = await this.collectData(fieldMappings);
      thoughtProcess.push('Data collection complete');

      // 9. Check if human review is needed
      const needsHumanReview = fieldMappings.some(m => m.confidence < 0.8) || 
                             (validationResult.warnings && validationResult.warnings.length > 0);

      // 10. Generate feature engineering report
      const featureEngineeringReport = await this.generateFeatureEngineeringReport(
        featureSet,
        fieldMappings,
        context.llm
      );

      return {
        output: {
          success: true,
          featureSet,
          fieldMappings,
          collectedData,
          needsHumanReview,
          featureEngineeringReport,
          confidence: {
            min: Math.min(...fieldMappings.map(m => m.confidence)),
            max: Math.max(...fieldMappings.map(m => m.confidence)),
            avg: fieldMappings.reduce((sum, m) => sum + m.confidence, 0) / fieldMappings.length
          }
        },
        thoughtProcess: thoughtProcess.join('\n')
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      thoughtProcess.push(`Error: ${errorMessage}`);
      return {
        output: {
          success: false,
          error: 'Data integration failed',
          details: errorMessage
        },
        thoughtProcess: thoughtProcess.join('\n')
      };
    }
  }

  private async analyzeFeatures(
    problemType: string,
    requiredFields: string[],
    schema: any,
    llm: LLMService
  ): Promise<FeatureSet> {
    const prompt = `
Given the optimization problem type: ${problemType}
Required fields: ${JSON.stringify(requiredFields)}
Database schema: ${JSON.stringify(schema, null, 2)}

Analyze and suggest a complete feature set for building an optimization model.
`;
    const { enrichedData, reasoning } = await llm.enrichData({ prompt }, { problemType });
    return JSON.parse(enrichedData);
  }

  private async mapFeaturesToDataSource(
    featureSet: FeatureSet,
    schema: any,
    llm: LLMService
  ): Promise<FieldMapping[]> {
    const prompt = `
Given the feature set: ${JSON.stringify(featureSet)}
Database schema: ${JSON.stringify(schema, null, 2)}

Map features to data source columns.
`;
    const { enrichedData, reasoning } = await llm.enrichData({ prompt }, { problemType: 'mapping' });
    return JSON.parse(enrichedData);
  }

  private async validateMappings(
    mappings: FieldMapping[],
    llm: LLMService
  ): Promise<ValidationResult> {
    const prompt = `
Validate these field mappings: ${JSON.stringify(mappings)}
`;
    const { enrichedData, reasoning } = await llm.enrichData({ prompt }, { problemType: 'validation' });
    return JSON.parse(enrichedData);
  }

  private async generateFeatureEngineeringReport(
    featureSet: FeatureSet,
    fieldMappings: FieldMapping[],
    llm: LLMService
  ): Promise<string> {
    const prompt = `
Generate a feature engineering report for:
Feature set: ${JSON.stringify(featureSet)}
Field mappings: ${JSON.stringify(fieldMappings)}
`;
    const { enrichedData, reasoning } = await llm.enrichData({ prompt }, { problemType: 'report' });
    return enrichedData;
  }

  private async collectData(mappings: FieldMapping[]): Promise<Record<string, any>> {
    if (!this.dataSource) throw new Error('Data source not initialized');

    const result: Record<string, any> = {};
    
    for (const mapping of mappings) {
      const query: DataQuery = {
        table: mapping.table,
        fields: [mapping.column],
        limit: 1000 // Adjust based on needs
      };

      try {
        const data = await this.dataSource.fetchData(query);
        result[mapping.modelField] = data[mapping.table];
      } catch (error) {
        console.error(`Failed to fetch data for ${mapping.modelField}:`, error);
        result[mapping.modelField] = [];
      }
    }

    return result;
  }
} 