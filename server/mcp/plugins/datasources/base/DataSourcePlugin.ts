import { DataSourceConfig, DataQuery, ValidationResult, DatabaseMetadata } from './types';

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