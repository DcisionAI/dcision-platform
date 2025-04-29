import { MCPAgent, AgentRunContext, AgentRunResult } from './AgentRegistry';
import { StepAction, ProtocolStep, MCP } from '../types';
import { PluginRegistry } from '../plugins';
import { DataSourcePlugin, DataQuery, ValidationResult, DataSourceType } from '../plugins/datasources/base/types';

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
    llm: (prompt: string) => Promise<string>
  ): Promise<FeatureSet> {
    const prompt = `
Given the optimization problem type: ${problemType}
Required fields: ${JSON.stringify(requiredFields)}
Database schema: ${JSON.stringify(schema, null, 2)}

Analyze and suggest a complete feature set for building an optimization model:

1. Required features (must have):
   - Identify variables needed for the objective function
   - Identify parameters needed for constraints
   - Specify data types and validation rules
   - Suggest transformations if needed

2. Optional features (nice to have):
   - Additional variables that could improve the model
   - Supplementary parameters for enhanced constraints
   - Features that could enable additional optimization objectives

For each feature, specify:
- Its role in the optimization model (variable, constraint, parameter)
- Data type and validation rules
- Required transformations
- Importance level
- Source table/column if obvious from schema

Consider:
- The specific requirements of ${problemType} optimization
- Data relationships and dependencies
- Potential feature engineering opportunities
- Data quality and completeness requirements

Respond in JSON format:
{
  "required": {
    "feature_name": {
      "description": "description",
      "dataType": "type",
      "validationRules": ["rule1", "rule2"],
      "transformation": "optional transformation",
      "optimizationRole": "variable|constraint|parameter",
      "importance": "high|medium|low",
      "source": "table.column if obvious"
    }
  },
  "optional": {
    "feature_name": {
      "description": "description",
      "dataType": "type",
      "benefits": ["benefit1", "benefit2"],
      "priority": "high|medium|low",
      "optimizationRole": "variable|constraint|parameter",
      "source": "table.column if obvious"
    }
  }
}`;

    const response = await llm(prompt);
    return JSON.parse(response);
  }

  private async mapFeaturesToDataSource(
    featureSet: FeatureSet,
    schema: any,
    llm: (prompt: string) => Promise<string>
  ): Promise<FieldMapping[]> {
    if (!this.dataSource) throw new Error('Data source not initialized');

    const prompt = `
Given the database schema:
${JSON.stringify(schema, null, 2)}

And the required features for ${featureSet.required} optimization:
${JSON.stringify(featureSet.required, null, 2)}

Map each feature to the most appropriate table and column.
Consider:
- Column names and types
- Data relationships
- Required transformations
- Semantic meaning of columns
- Data quality and completeness

For each mapping:
1. Provide a confidence score between 0 and 1
2. Explain why this source was chosen
3. Suggest any necessary feature engineering steps
4. Include sample values if available

Respond in JSON format:
{
  "mappings": [
    {
      "modelField": "feature_name",
      "table": "matched_table",
      "column": "matched_column",
      "confidence": 0.95,
      "sourceExplanation": "explanation of why this source was chosen",
      "featureEngineering": {
        "transformations": ["transformation1", "transformation2"],
        "reasoning": "explanation of why these transformations are needed"
      },
      "sampleValues": ["value1", "value2"]
    }
  ]
}`;

    const response = await llm(prompt);
    return JSON.parse(response).mappings;
  }

  private async generateFeatureEngineeringReport(
    featureSet: FeatureSet,
    fieldMappings: FieldMapping[],
    llm: (prompt: string) => Promise<string>
  ): Promise<string> {
    const prompt = `
Given the feature set and field mappings for an optimization model:

Feature Set:
${JSON.stringify(featureSet, null, 2)}

Field Mappings:
${JSON.stringify(fieldMappings, null, 2)}

Generate a detailed report explaining:
1. How each feature was selected and why it's important for the optimization model
2. The data sources chosen and the reasoning behind each choice
3. Required feature engineering steps and their purpose
4. Any potential data quality issues or limitations
5. Suggestions for improving the feature set

Format the response as a markdown document with clear sections and explanations.
`;

    return await llm(prompt);
  }

  private async validateMappings(
    mappings: FieldMapping[],
    llm: (prompt: string) => Promise<string>
  ): Promise<ValidationResult> {
    const prompt = `
Validate the following field mappings for an optimization model:
${JSON.stringify(mappings, null, 2)}

Check for:
1. Data type compatibility
2. Completeness of required features
3. Quality of sample values
4. Reasonableness of confidence scores
5. Appropriateness of feature engineering steps

Respond in JSON format:
{
  "isValid": true/false,
  "errors": ["error1", "error2"],
  "warnings": ["warning1", "warning2"]
}
`;

    const response = await llm(prompt);
    return JSON.parse(response);
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