import { DcisionAIAirbyteService } from '../core/service';
import { DEFAULT_WHITE_LABEL_CONFIG } from '../config/types';
import { ConnectionConfig } from '../api/models';
import { createClient } from '@supabase/supabase-js';

// Supabase credentials from your .env.local
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

describe('DcisionAIAirbyteService with Supabase', () => {
  let service: DcisionAIAirbyteService;
  let supabaseClient: any;

  beforeAll(() => {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error('Supabase credentials not found. Please check your environment variables.');
    }

    service = new DcisionAIAirbyteService(DEFAULT_WHITE_LABEL_CONFIG);
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
  });

  it('should create a Supabase connection', async () => {
    const config: ConnectionConfig = {
      name: 'dcisionai-supabase-test',
      source: {
        type: 'supabase',
        config: {
          url: SUPABASE_URL,
          key: SUPABASE_KEY,
          schema: 'public'
        }
      },
      destination: {
        type: 'postgres',
        config: {
          host: 'localhost',
          port: 5432,
          database: 'test',
          username: 'test',
          password: 'test'
        }
      }
    };

    const connection = await service.createConnection(config);
    expect(connection).toBeDefined();
    expect(connection.id).toContain('dcisionai-');
    expect(connection.source.type).toBe('dcisionai-supabase');
  });

  it('should sync data from Supabase', async () => {
    const config: ConnectionConfig = {
      name: 'dcisionai-supabase-sync',
      source: {
        type: 'supabase',
        config: {
          url: SUPABASE_URL,
          key: SUPABASE_KEY,
          schema: 'public',
          table: 'test_table'
        }
      },
      destination: {
        type: 'postgres',
        config: {
          host: 'localhost',
          port: 5432,
          database: 'test',
          username: 'test',
          password: 'test'
        }
      }
    };

    const connection = await service.createConnection(config);
    const syncResult = await service.syncConnection(connection.id);

    expect(syncResult).toBeDefined();
    expect(syncResult.id).toContain('dcisionai-sync-');
    expect(syncResult.connectionId).toBe(connection.id);
    expect(syncResult.status).toBe('completed');
  });

  it('should list available connectors', async () => {
    const connectors = await service.listConnectors();
    expect(connectors).toBeDefined();
    expect(connectors.length).toBeGreaterThan(0);
    expect(connectors[0].id).toContain('dcisionai-');
  });
}); 