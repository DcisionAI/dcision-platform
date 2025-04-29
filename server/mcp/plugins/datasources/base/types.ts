export type DataSourceType = 'database' | 'api' | 'file' | 'custom';

export interface DataSourceConfig {
  type: DataSourceType;
  connection: Record<string, any>;
  authentication: Record<string, any>;
  options?: Record<string, any>;
}

export interface DataQuery {
  table?: string;
  fields: string[];
  filters?: Record<string, any>;
  limit?: number;
  offset?: number;
  orderBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
  missingFields?: string[];
  sampleData?: Record<string, any[]>;
}

export interface DatabaseMetadata {
  tables: {
    name: string;
    columns: Array<{
      name: string;
      type: string;
      constraints?: string[];
      sampleValues?: any[];
    }>;
    relationships?: Array<{
      type: 'one-to-one' | 'one-to-many' | 'many-to-many';
      targetTable: string;
      foreignKey: string;
    }>;
  }[];
}

export interface DataSourcePlugin {
  // Core plugin properties
  name: string;
  type: 'database' | 'api' | 'file' | 'custom';
  version: string;
  
  // Connection management
  connect(config: DataSourceConfig): Promise<void>;
  disconnect(): Promise<void>;
  validateConnection(): Promise<boolean>;
  
  // Schema and metadata
  getSchema(): Promise<DatabaseMetadata>;
  getSampleData(query: DataQuery): Promise<Record<string, any[]>>;
  
  // Data operations
  fetchData(query: DataQuery): Promise<Record<string, any>>;
  validateData(fields: string[]): Promise<ValidationResult>;
  
  // Plugin lifecycle
  initialize(): Promise<void>;
  cleanup(): Promise<void>;
  
  // Error handling
  getLastError(): Error | null;
  clearError(): void;
} 