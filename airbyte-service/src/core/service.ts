import { ConnectionConfig, Connection, SyncResult, Connector, Driver } from '../api/models';
import { WhiteLabelConfig } from '../config/types';
import { SupabaseClient } from '@supabase/supabase-js';

export class DcisionAIAirbyteService {
  private whiteLabelConfig: WhiteLabelConfig;
  private connections: Map<string, Connection> = new Map();
  private syncs: Map<string, SyncResult> = new Map();
  private supabase: SupabaseClient;

  constructor(config: WhiteLabelConfig) {
    this.whiteLabelConfig = config;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not found');
    }

    this.supabase = new SupabaseClient(supabaseUrl, supabaseKey);
  }

  async createConnection(config: ConnectionConfig): Promise<Connection> {
    try {
      const connection: Connection = {
        id: `dcisionai-${Date.now()}`,
        name: config.name,
        status: 'active',
        source: config.source,
        destination: config.destination,
        metadata: {
          createdBy: 'DcisionAI',
          createdAt: new Date().toISOString(),
          version: '1.0.0'
        }
      };

      const { data, error } = await this.supabase
        .from('connections')
        .insert([connection])
        .select()
        .single();

      if (error) throw error;
      return data as Connection;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create connection';
      throw new Error(errorMessage);
    }
  }

  async syncConnection(connectionId: string): Promise<SyncResult> {
    try {
      const { data, error } = await this.supabase
        .from('connections')
        .select('*')
        .eq('id', connectionId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Connection not found');

      const now = new Date().toISOString();
      return {
        id: `sync-${Date.now()}`,
        connectionId,
        status: 'completed',
        startTime: now,
        endTime: now,
        metadata: {
          service: 'DcisionAI Airbyte',
          version: '1.0.0'
        }
      };
    } catch (error) {
      const now = new Date().toISOString();
      return {
        id: `sync-${Date.now()}`,
        connectionId,
        status: 'failed',
        startTime: now,
        endTime: now,
        error: error instanceof Error ? error.message : 'Failed to sync connection',
        metadata: {
          service: 'DcisionAI Airbyte',
          version: '1.0.0'
        }
      };
    }
  }

  async getConnectionStatus(connectionId: string): Promise<Connection> {
    try {
      const { data, error } = await this.supabase
        .from('connections')
        .select('*')
        .eq('id', connectionId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Connection not found');

      return data as Connection;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get connection status';
      throw new Error(errorMessage);
    }
  }

  async listConnectors(): Promise<Connector[]> {
    try {
      const { data, error } = await this.supabase
        .from('connectors')
        .select('*');

      if (error) throw error;
      return (data || []) as Connector[];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to list connectors';
      throw new Error(errorMessage);
    }
  }

  private async validateConnection(config: ConnectionConfig): Promise<void> {
    // Add DcisionAI specific validation
    if (!config.name.startsWith('dcisionai-')) {
      throw new Error('Connection name must start with "dcisionai-"');
    }
  }

  private async performSync(connection: Connection): Promise<void> {
    // TODO: Implement actual sync logic
    // This will be implemented in the next phase
    return new Promise((resolve) => setTimeout(resolve, 1000));
  }

  async getDrivers(limit: number = 10): Promise<Driver[]> {
    try {
      console.log('Fetching drivers with limit:', limit);
      const { data, error } = await this.supabase
        .from('drivers')
        .select('id, name, license, status')
        .limit(limit);

      if (error) {
        console.error('Error fetching drivers:', error);
        throw error;
      }
      console.log('Fetched drivers:', data);
      return data || [];
    } catch (error) {
      console.error('Error in getDrivers:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch drivers';
      throw new Error(errorMessage);
    }
  }

  async getOrders(limit: number = 10) {
    try {
      const { data, error } = await this.supabase
        .from('orders')
        .select('*')
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch orders';
      throw new Error(errorMessage);
    }
  }
} 