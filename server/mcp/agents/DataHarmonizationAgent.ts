import { Step, StepResult } from '../types';
import { OrchestrationContext } from '../../orchestrator/OrchestrationContext';
import OpenAI from 'openai';
import config from '../../config/openai';
import { z } from 'zod';
import pino from 'pino';
import { retry } from '../utils/retry';

// Schema definitions for type safety and validation
const DataFieldSchema = z.object({
  name: z.string(),
  type: z.string(),
  format: z.string().optional(),
  constraints: z.array(z.any()).optional()
});

const DataRelationshipSchema = z.object({
  from: z.string(),
  to: z.string(),
  type: z.enum(['one-to-one', 'one-to-many', 'many-to-many'])
});

const DataSchemaSchema = z.object({
  fields: z.array(DataFieldSchema),
  relationships: z.array(DataRelationshipSchema).optional()
});

const EnrichmentSourceSchema = z.object({
  type: z.literal('llm'),
  parameters: z.record(z.any()).optional()
});

const HarmonizationConfigSchema = z.object({
  targetSchema: DataSchemaSchema,
  enrichmentSources: z.array(EnrichmentSourceSchema).optional(),
  orModelRequirements: z.object({
    dataFormat: z.string(),
    requiredFields: z.array(z.string()),
    constraints: z.record(z.any())
  }).optional()
});

// Type definitions inferred from schemas
type DataSchema = z.infer<typeof DataSchemaSchema>;
type EnrichmentSource = z.infer<typeof EnrichmentSourceSchema>;
type HarmonizationConfig = z.infer<typeof HarmonizationConfigSchema>;

interface EnrichmentResult {
  data: Record<string, any>;
  metadata: {
    enrichmentType: string;
    timestamp: string;
    changes: Array<{
      field: string;
      type: 'added' | 'modified';
      description: string;
    }>;
  };
}

export class DataHarmonizationAgent {
  private readonly openai: OpenAI;
  private readonly defaultModel: string;
  private readonly logger: pino.Logger;
  private readonly maxRetries: number = 3;
  private readonly retryDelay: number = 1000; // ms

  constructor(apiKey: string, logger?: pino.Logger) {
    this.openai = new OpenAI({ apiKey });
    this.defaultModel = config.defaultModel;
    this.logger = logger || pino({ name: 'DataHarmonizationAgent' });
  }

  public async execute(step: Step, context: OrchestrationContext): Promise<StepResult> {
    try {
      this.logger.info({ stepId: step.id }, 'Starting data harmonization');
      
      // Validate configuration
      const config = await this.validateConfig(step.config);
      
      // Track processing time
      const startTime = Date.now();

      // 1. Validate and standardize input data
      const data = step.config?.data;
      if (!data) {
        throw new Error('Input data is required');
      }

      this.logger.debug('Standardizing data');
      const standardizedData = await this.standardizeData(data, config.targetSchema);

      // 2. Enrich data with external sources if specified
      let enrichedData = standardizedData;
      if (config.enrichmentSources && config.enrichmentSources.length > 0) {
        this.logger.debug('Enriching data');
        enrichedData = await this.enrichData(standardizedData, config.enrichmentSources);
      }

      // 3. Transform data for OR model compatibility
      this.logger.debug('Preparing data for OR model');
      const preparedData = await this.prepareForORModel(
        enrichedData,
        config.orModelRequirements
      );

      // 4. Validate final dataset
      this.logger.debug('Validating final dataset');
      const validationResult = await this.validateDataset(preparedData, config);

      // Store processed data in context with version tracking
      const processedDataKey = `${step.id}_harmonized_data`;
      const version = Date.now().toString();
      context.setVariable(processedDataKey, {
        data: preparedData,
        version,
        processingTime: Date.now() - startTime
      });

      this.logger.info(
        { stepId: step.id, processingTime: Date.now() - startTime },
        'Data harmonization completed successfully'
      );

      return {
        success: true,
        outputs: {
          harmonizedData: preparedData,
          validation: validationResult,
          metadata: {
            version,
            processingTime: Date.now() - startTime,
            enrichmentSources: config.enrichmentSources?.map(source => source.type),
            dataQuality: validationResult.qualityMetrics
          }
        }
      };

    } catch (error) {
      this.logger.error(
        { stepId: step.id, error },
        'Data harmonization failed'
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during data harmonization',
        outputs: {
          metadata: {
            timestamp: new Date().toISOString(),
            errorType: error instanceof Error ? error.name : 'Unknown'
          }
        }
      };
    }
  }

  private async validateConfig(config: unknown): Promise<HarmonizationConfig> {
    try {
      return HarmonizationConfigSchema.parse(config);
    } catch (error) {
      this.logger.error({ error }, 'Configuration validation failed');
      throw new Error(`Invalid configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async standardizeData(
    data: Record<string, any>,
    schema: DataSchema
  ): Promise<Record<string, any>> {
    return retry(
      async () => {
        const prompt = `Standardize the following data according to the schema:
        
        Data: ${JSON.stringify(data, null, 2)}
        Schema: ${JSON.stringify(schema, null, 2)}
        
        Please:
        1. Convert data types to match schema
        2. Handle missing or invalid values
        3. Standardize formats (dates, numbers, etc.)
        4. Apply field constraints
        5. Return the standardized data in JSON format`;

        const response = await this.openai.chat.completions.create({
          model: this.defaultModel,
          messages: [
            {
              role: 'system',
              content: 'You are an expert in data standardization and cleaning. Transform the data to match the required schema.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          response_format: { type: 'json_object' }
        });

        const content = response.choices[0].message.content;
        if (!content) {
          throw new Error('No standardization result received');
        }

        const result = JSON.parse(content);
        this.validateDataAgainstSchema(result, schema);
        return result;
      },
      {
        maxRetries: this.maxRetries,
        delay: this.retryDelay,
        onRetry: (error, attempt) => {
          this.logger.warn(
            { error, attempt },
            `Retrying standardization (attempt ${attempt})`
          );
        }
      }
    );
  }

  private validateDataAgainstSchema(data: Record<string, any>, schema: DataSchema): void {
    for (const field of schema.fields) {
      if (!data.hasOwnProperty(field.name)) {
        throw new Error(`Required field '${field.name}' is missing`);
      }

      const value = data[field.name];
      switch (field.type.toLowerCase()) {
        case 'number':
          if (typeof value !== 'number') {
            throw new Error(`Field '${field.name}' must be a number`);
          }
          break;
        case 'string':
          if (typeof value !== 'string') {
            throw new Error(`Field '${field.name}' must be a string`);
          }
          break;
        case 'boolean':
          if (typeof value !== 'boolean') {
            throw new Error(`Field '${field.name}' must be a boolean`);
          }
          break;
        case 'date':
          if (!(value instanceof Date) && isNaN(Date.parse(value))) {
            throw new Error(`Field '${field.name}' must be a valid date`);
          }
          break;
      }

      if (field.constraints) {
        this.validateConstraints(value, field.constraints, field.name);
      }
    }
  }

  private validateConstraints(value: any, constraints: any[], fieldName: string): void {
    for (const constraint of constraints) {
      switch (constraint.type) {
        case 'range':
          if (value < constraint.min || value > constraint.max) {
            throw new Error(
              `Field '${fieldName}' value must be between ${constraint.min} and ${constraint.max}`
            );
          }
          break;
        case 'enum':
          if (!constraint.values.includes(value)) {
            throw new Error(
              `Field '${fieldName}' value must be one of: ${constraint.values.join(', ')}`
            );
          }
          break;
        case 'regex':
          if (!new RegExp(constraint.pattern).test(value)) {
            throw new Error(
              `Field '${fieldName}' value must match pattern: ${constraint.pattern}`
            );
          }
          break;
      }
    }
  }

  private async enrichData(
    data: Record<string, any>,
    sources: readonly EnrichmentSource[]
  ): Promise<Record<string, any>> {
    let enrichedData = { ...data };

    for (const source of sources) {
      if (source.type === 'llm') {
        const result = await this.enrichWithLLM(enrichedData, source);
        enrichedData = result.data;
      }
    }

    return enrichedData;
  }

  private async enrichWithLLM(
    data: Record<string, any>,
    source: EnrichmentSource
  ): Promise<EnrichmentResult> {
    return retry(
      async () => {
        const prompt = `Enrich the following dataset with additional relevant information:
        
        Data: ${JSON.stringify(data, null, 2)}
        Requirements: ${JSON.stringify(source.parameters, null, 2)}
        
        Please:
        1. Identify missing but valuable information
        2. Add relevant external data
        3. Enhance existing fields with additional context
        4. Ensure all additions are relevant to optimization
        5. Return the enriched data in JSON format with the following structure:
        {
          "data": {
            // enriched data fields
          },
          "metadata": {
            "changes": [
              {
                "field": "fieldName",
                "type": "added|modified",
                "description": "Description of what was changed and why"
              }
            ]
          }
        }`;

        const response = await this.openai.chat.completions.create({
          model: this.defaultModel,
          messages: [
            {
              role: 'system',
              content: 'You are an expert in data enrichment and optimization. Enhance the dataset with relevant information that could improve optimization results.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          response_format: { type: 'json_object' }
        });

        const content = response.choices[0].message.content;
        if (!content) {
          throw new Error('No enrichment result received');
        }

        const result = JSON.parse(content);
        return {
          data: result.data,
          metadata: {
            enrichmentType: 'llm',
            timestamp: new Date().toISOString(),
            changes: result.metadata.changes
          }
        };
      },
      {
        maxRetries: this.maxRetries,
        delay: this.retryDelay,
        onRetry: (error, attempt) => {
          this.logger.warn(
            { error, attempt },
            `Retrying LLM enrichment (attempt ${attempt})`
          );
        }
      }
    );
  }

  private async prepareForORModel(
    data: Record<string, any>,
    requirements?: HarmonizationConfig['orModelRequirements']
  ): Promise<Record<string, any>> {
    return retry(
      async () => {
        const prompt = `Prepare the following dataset for optimization:
        
        Data: ${JSON.stringify(data, null, 2)}
        Requirements: ${JSON.stringify(requirements, null, 2)}
        
        Please:
        1. Transform data into the required format
        2. Ensure all required fields are present
        3. Validate against optimization constraints
        4. Format numerical data appropriately
        5. Return the prepared data in JSON format`;

        const response = await this.openai.chat.completions.create({
          model: this.defaultModel,
          messages: [
            {
              role: 'system',
              content: 'You are an expert in preparing data for optimization models. Transform the data to meet the model requirements.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          response_format: { type: 'json_object' }
        });

        const content = response.choices[0].message.content;
        if (!content) {
          throw new Error('No preparation result received');
        }

        const result = JSON.parse(content);
        if (requirements?.requiredFields) {
          this.validateRequiredFields(result, requirements.requiredFields);
        }
        return result;
      },
      {
        maxRetries: this.maxRetries,
        delay: this.retryDelay,
        onRetry: (error, attempt) => {
          this.logger.warn(
            { error, attempt },
            `Retrying OR model preparation (attempt ${attempt})`
          );
        }
      }
    );
  }

  private validateRequiredFields(data: Record<string, any>, requiredFields: string[]): void {
    for (const field of requiredFields) {
      if (!data.hasOwnProperty(field)) {
        throw new Error(`Required field '${field}' is missing from OR model data`);
      }
    }
  }

  private async validateDataset(
    data: Record<string, any>,
    config: HarmonizationConfig
  ): Promise<Record<string, any>> {
    return retry(
      async () => {
        const prompt = `Validate the harmonized dataset:
        
        Data: ${JSON.stringify(data, null, 2)}
        Configuration: ${JSON.stringify(config, null, 2)}
        
        Please:
        1. Check data completeness
        2. Verify format compatibility
        3. Validate against schema
        4. Check optimization constraints
        5. Return validation results in JSON format`;

        const response = await this.openai.chat.completions.create({
          model: this.defaultModel,
          messages: [
            {
              role: 'system',
              content: 'You are an expert in data validation for optimization models. Verify the dataset meets all requirements.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          response_format: { type: 'json_object' }
        });

        const content = response.choices[0].message.content;
        if (!content) {
          throw new Error('No validation result received');
        }

        const result = JSON.parse(content);
        return {
          ...result,
          qualityMetrics: {
            completeness: this.calculateCompleteness(data, config.targetSchema),
            consistency: result.consistency || 1.0,
            reliability: result.reliability || 1.0
          }
        };
      },
      {
        maxRetries: this.maxRetries,
        delay: this.retryDelay,
        onRetry: (error, attempt) => {
          this.logger.warn(
            { error, attempt },
            `Retrying dataset validation (attempt ${attempt})`
          );
        }
      }
    );
  }

  private calculateCompleteness(data: Record<string, any>, schema: DataSchema): number {
    const requiredFields = schema.fields.length;
    const presentFields = schema.fields.filter(field => 
      data.hasOwnProperty(field.name) && data[field.name] !== null && data[field.name] !== undefined
    ).length;
    return presentFields / requiredFields;
  }
}

export function createDataHarmonizationAgent(
  apiKey: string,
  logger?: pino.Logger
): (step: Step, context: OrchestrationContext) => Promise<StepResult> {
  const agent = new DataHarmonizationAgent(apiKey, logger);
  return (step: Step, context: OrchestrationContext) => agent.execute(step, context);
} 