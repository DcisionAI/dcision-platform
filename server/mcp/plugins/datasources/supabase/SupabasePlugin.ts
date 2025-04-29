import { AbstractDataSourcePlugin } from '../base/AbstractDataSourcePlugin';
import { DataSourceConfig, DataQuery, ValidationResult, DatabaseMetadata } from '../base/types';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class SupabasePlugin extends AbstractDataSourcePlugin {
  private client: SupabaseClient | null = null;

  constructor() {
    super('supabase', 'database', '1.0.0');
  }

  async connect(config: DataSourceConfig): Promise<void> {
    this.validateConfig();
    
    const { url, key } = config.connection;
    if (!url || !key) {
      throw new Error('Supabase URL and key are required');
    }

    this.client = createClient(url, key);
    await super.connect(config);
  }

  async validateConnection(): Promise<boolean> {
    if (!this.client) {
      throw new Error('Supabase client not initialized');
    }

    try {
      const { data, error } = await this.client.from('profiles').select('id').limit(1);
      if (error) throw error;
      return true;
    } catch (error) {
      this.setError(error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  async getSchema(): Promise<DatabaseMetadata> {
    this.validateConfig();
    if (!this.client) {
      throw new Error('Supabase client not initialized');
    }

    try {
      const { data, error } = await this.client.rpc('get_schema');
      if (error) throw error;
      return this.transformSchema(data);
    } catch (error) {
      this.setError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async getSampleData(query: DataQuery): Promise<Record<string, any[]>> {
    this.validateConfig();
    if (!this.client) {
      throw new Error('Supabase client not initialized');
    }

    try {
      const result: Record<string, any[]> = {};
      
      for (const field of query.fields) {
        const [table, column] = field.split('.');
        const { data, error } = await this.client
          .from(table)
          .select(column)
          .limit(10);
        
        if (error) throw error;
        if (data && Array.isArray(data)) {
          result[field] = data.map(row => (row as Record<string, any>)[column]);
        }
      }

      return result;
    } catch (error) {
      this.setError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async fetchData(query: DataQuery): Promise<Record<string, any>> {
    this.validateConfig();
    if (!this.client) {
      throw new Error('Supabase client not initialized');
    }

    try {
      if (!query.table) {
        throw new Error('Table name is required for fetching data');
      }

      let queryBuilder = this.client
        .from(query.table)
        .select(query.fields.join(','));

      if (query.filters) {
        Object.entries(query.filters).forEach(([key, value]) => {
          queryBuilder = queryBuilder.eq(key, value);
        });
      }

      if (query.limit) {
        queryBuilder = queryBuilder.limit(query.limit);
      }

      if (query.offset) {
        queryBuilder = queryBuilder.range(query.offset, query.offset + (query.limit || 10) - 1);
      }

      if (query.orderBy) {
        queryBuilder = queryBuilder.order(query.orderBy.field, {
          ascending: query.orderBy.direction === 'asc'
        });
      }

      const { data, error } = await queryBuilder;
      if (error) throw error;

      return { [query.table]: data };
    } catch (error) {
      this.setError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  private transformSchema(rawSchema: any): DatabaseMetadata {
    // Transform Supabase schema format to our DatabaseMetadata format
    return {
      tables: Object.entries(rawSchema).map(([tableName, tableInfo]: [string, any]) => ({
        name: tableName,
        columns: Object.entries(tableInfo.columns).map(([colName, colInfo]: [string, any]) => ({
          name: colName,
          type: colInfo.type,
          constraints: colInfo.constraints || [],
          sampleValues: colInfo.sampleValues || []
        })),
        relationships: tableInfo.relationships || []
      }))
    };
  }
} 