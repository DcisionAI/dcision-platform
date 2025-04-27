import { Step, StepResult } from '../../../server/mcp/types';
import { OrchestrationContext } from '../../../server/orchestrator/OrchestrationContext';
import axios, { AxiosRequestConfig } from 'axios';
import { Pool, PoolConfig } from 'pg';

interface DataSourceConfig {
  type: 'api' | 'database' | 'file';
  // API specific configuration
  endpoint?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  params?: Record<string, any>;
  body?: Record<string, any>;
  // Database specific configuration
  connectionString?: string;
  query?: string;
  parameters?: any[];
  // File specific configuration
  filePath?: string;
  fileFormat?: 'csv' | 'json' | 'excel';
  // Common configuration
  authentication?: {
    type: 'basic' | 'bearer' | 'api_key';
    credentials: Record<string, string>;
  };
  transformations?: {
    type: 'filter' | 'map' | 'aggregate';
    config: Record<string, any>;
  }[];
}

export class DataCollectionAgent {
  private dbPools: Map<string, Pool>;

  constructor() {
    this.dbPools = new Map();
  }

  /**
   * Collects data based on the step configuration
   * This is a sample implementation that simulates data collection
   */
  public async execute(step: Step, context: OrchestrationContext): Promise<StepResult> {
    try {
      const config = step.config as DataSourceConfig;
      
      if (!config || !config.type) {
        throw new Error('Data source configuration is missing or invalid');
      }

      let collectedData;
      switch (config.type) {
        case 'api':
          collectedData = await this.collectFromAPI(config);
          break;
        case 'database':
          collectedData = await this.collectFromDatabase(config);
          break;
        case 'file':
          collectedData = await this.collectFromFile(config);
          break;
        default:
          throw new Error(`Unsupported data source type: ${config.type}`);
      }

      // Apply any specified transformations
      if (config.transformations) {
        collectedData = await this.applyTransformations(collectedData, config.transformations);
      }

      // Store collected data in context
      context.setVariable(`${step.id}_collected_data`, collectedData);

      return {
        success: true,
        outputs: {
          data: collectedData,
          metadata: {
            source: config.type,
            timestamp: new Date().toISOString(),
            recordCount: Array.isArray(collectedData) ? collectedData.length : 1
          }
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during data collection';
      const errorType = error instanceof Error ? error.name : 'Unknown';
      
      return {
        success: false,
        error: errorMessage,
        outputs: {
          metadata: {
            source: (step.config as DataSourceConfig)?.type || 'unknown',
            timestamp: new Date().toISOString(),
            errorType
          }
        }
      };
    }
  }

  private async collectFromAPI(config: DataSourceConfig): Promise<any> {
    if (!config.endpoint) {
      throw new Error('API endpoint is required');
    }

    const axiosConfig: AxiosRequestConfig = {
      url: config.endpoint,
      method: config.method || 'GET',
      headers: config.headers || {},
      params: config.params,
      data: config.body
    };

    // Add authentication if specified
    if (config.authentication) {
      switch (config.authentication.type) {
        case 'basic':
          axiosConfig.auth = {
            username: config.authentication.credentials.username,
            password: config.authentication.credentials.password
          };
          break;
        case 'bearer':
          axiosConfig.headers = {
            ...axiosConfig.headers,
            Authorization: `Bearer ${config.authentication.credentials.token}`
          };
          break;
        case 'api_key':
          axiosConfig.headers = {
            ...axiosConfig.headers,
            'X-API-Key': config.authentication.credentials.apiKey
          };
          break;
      }
    }

    try {
      const response = await axios(axiosConfig);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`API request failed: ${error.message}`);
      }
      throw error;
    }
  }

  private async collectFromDatabase(config: DataSourceConfig): Promise<any> {
    if (!config.connectionString || !config.query) {
      throw new Error('Database connection string and query are required');
    }

    let pool = this.dbPools.get(config.connectionString);
    if (!pool) {
      const poolConfig: PoolConfig = {
        connectionString: config.connectionString,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000
      };

      if (config.authentication) {
        poolConfig.user = config.authentication.credentials.username;
        poolConfig.password = config.authentication.credentials.password;
      }

      pool = new Pool(poolConfig);
      this.dbPools.set(config.connectionString, pool);
    }

    try {
      const result = await pool.query(config.query, config.parameters);
      return result.rows;
    } catch (error) {
      throw new Error(`Database query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async collectFromFile(config: DataSourceConfig): Promise<any> {
    if (!config.filePath) {
      throw new Error('File path is required');
    }

    // Implementation would include:
    // 1. Reading file based on format (csv, json, excel)
    // 2. Parsing file contents
    // 3. Basic data validation
    // This is a placeholder for actual file reading implementation
    return [];
  }

  private async applyTransformations(data: any, transformations: DataSourceConfig['transformations']): Promise<any> {
    if (!transformations) return data;

    let transformedData = data;
    for (const transformation of transformations) {
      switch (transformation.type) {
        case 'filter':
          transformedData = Array.isArray(transformedData) 
            ? transformedData.filter(item => this.evaluateFilterCondition(item, transformation.config))
            : transformedData;
          break;
        case 'map':
          transformedData = Array.isArray(transformedData)
            ? transformedData.map(item => this.applyMapping(item, transformation.config))
            : this.applyMapping(transformedData, transformation.config);
          break;
        case 'aggregate':
          transformedData = Array.isArray(transformedData)
            ? this.applyAggregation(transformedData, transformation.config)
            : transformedData;
          break;
      }
    }

    return transformedData;
  }

  private evaluateFilterCondition(item: any, config: Record<string, any>): boolean {
    // Implementation would include:
    // 1. Evaluating filter conditions
    // 2. Supporting various operators (equals, greater than, less than, etc.)
    // 3. Handling complex conditions (AND, OR, etc.)
    return true;
  }

  private applyMapping(item: any, config: Record<string, any>): any {
    // Implementation would include:
    // 1. Field renaming
    // 2. Value transformations
    // 3. Type conversions
    return item;
  }

  private applyAggregation(data: any[], config: Record<string, any>): any {
    // Implementation would include:
    // 1. Group by operations
    // 2. Aggregation functions (sum, average, count, etc.)
    // 3. Having conditions
    return data;
  }

  public async cleanup(): Promise<void> {
    // Clean up database connections
    const pools = Array.from(this.dbPools.values());
    for (const pool of pools) {
      await pool.end();
    }
    this.dbPools.clear();
  }
}

// Factory function to create agent handler
export function createDataCollectionAgent(): (step: Step, context: OrchestrationContext) => Promise<StepResult> {
  const agent = new DataCollectionAgent();
  return async (step: Step, context: OrchestrationContext) => {
    try {
      return await agent.execute(step, context);
    } finally {
      await agent.cleanup();
    }
  };
} 