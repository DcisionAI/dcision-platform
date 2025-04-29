import { DataSourcePlugin, DataSourceConfig, DataQuery, ValidationResult, DatabaseMetadata } from './types';

export abstract class AbstractDataSourcePlugin implements DataSourcePlugin {
  protected config: DataSourceConfig | null = null;
  protected lastError: Error | null = null;
  protected isConnected: boolean = false;

  constructor(
    public readonly name: string,
    public readonly type: 'database' | 'api' | 'file' | 'custom',
    public readonly version: string
  ) {}

  // Core plugin properties
  abstract getSchema(): Promise<DatabaseMetadata>;
  abstract getSampleData(query: DataQuery): Promise<Record<string, any[]>>;
  abstract fetchData(query: DataQuery): Promise<Record<string, any>>;

  // Connection management
  async connect(config: DataSourceConfig): Promise<void> {
    try {
      this.config = config;
      await this.validateConnection();
      this.isConnected = true;
    } catch (error) {
      this.lastError = error instanceof Error ? error : new Error(String(error));
      throw this.lastError;
    }
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    this.config = null;
  }

  abstract validateConnection(): Promise<boolean>;

  // Data validation
  async validateData(fields: string[]): Promise<ValidationResult> {
    try {
      const schema = await this.getSchema();
      const result: ValidationResult = {
        isValid: true,
        missingFields: [],
        sampleData: {}
      };

      // Validate each field exists in schema
      for (const field of fields) {
        const [table, column] = field.split('.');
        const tableExists = schema.tables.some(t => t.name === table);
        if (!tableExists) {
          result.isValid = false;
          result.missingFields?.push(`Table ${table} not found`);
          continue;
        }

        const tableSchema = schema.tables.find(t => t.name === table);
        const columnExists = tableSchema?.columns.some(c => c.name === column);
        if (!columnExists) {
          result.isValid = false;
          result.missingFields?.push(`Column ${column} not found in table ${table}`);
        }
      }

      // Get sample data for valid fields
      if (result.isValid) {
        const validFields = fields.filter(f => !result.missingFields?.includes(f));
        if (validFields.length > 0) {
          result.sampleData = await this.getSampleData({ fields: validFields });
        }
      }

      return result;
    } catch (error) {
      this.lastError = error instanceof Error ? error : new Error(String(error));
      return {
        isValid: false,
        errors: [this.lastError.message]
      };
    }
  }

  // Plugin lifecycle
  async initialize(): Promise<void> {
    // Default implementation - can be overridden
  }

  async cleanup(): Promise<void> {
    // Default implementation - can be overridden
  }

  // Error handling
  getLastError(): Error | null {
    return this.lastError;
  }

  clearError(): void {
    this.lastError = null;
  }

  // Helper methods
  protected validateConfig(): void {
    if (!this.config) {
      throw new Error('Plugin not configured. Call connect() first.');
    }
  }

  protected setError(error: Error): void {
    this.lastError = error;
  }
} 