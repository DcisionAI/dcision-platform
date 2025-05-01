import { DataMappingAgent } from '../../../server/mcp/agents/DataMappingAgent';
import { MCP } from '../../../server/mcp/types';
import { ProtocolStep } from '../../../server/mcp/types/core';

describe('DataMappingAgent', () => {
  let agent: DataMappingAgent;
  let mockSupabase: any;

  beforeEach(() => {
    // Mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      data: [],
      error: null
    };

    // Mock environment variables
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_KEY = 'test-service-key';

    agent = new DataMappingAgent();
    (agent as any).supabase = mockSupabase;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDatabaseSchema', () => {
    it('should return schema data when successful', async () => {
      const mockSchema = [
        { table_name: 'orders', column_name: 'id', data_type: 'uuid', is_nullable: 'NO' },
        { table_name: 'orders', column_name: 'total_value', data_type: 'numeric', is_nullable: 'NO' }
      ];
      mockSupabase.data = mockSchema;

      const schema = await (agent as any).getDatabaseSchema();
      expect(schema).toEqual(mockSchema);
      expect(mockSupabase.from).toHaveBeenCalledWith('information_schema.columns');
      expect(mockSupabase.select).toHaveBeenCalledWith('table_name, column_name, data_type, is_nullable');
      expect(mockSupabase.eq).toHaveBeenCalledWith('table_schema', 'public');
    });

    it('should throw error when Supabase query fails', async () => {
      mockSupabase.error = new Error('Database error');
      await expect((agent as any).getDatabaseSchema()).rejects.toThrow('Database error');
    });
  });

  describe('getTableRelationships', () => {
    it('should return table relationships when successful', async () => {
      const mockRelationships = [
        {
          constraint_name: 'orders_customer_id_fkey',
          table_name: 'orders',
          constraint_type: 'FOREIGN KEY',
          referenced_table_name: 'customers'
        }
      ];
      mockSupabase.data = mockRelationships;

      const relationships = await (agent as any).getTableRelationships();
      expect(relationships).toEqual(mockRelationships);
      expect(mockSupabase.from).toHaveBeenCalledWith('information_schema.table_constraints');
      expect(mockSupabase.select).toHaveBeenCalledWith(expect.stringContaining('constraint_name'));
      expect(mockSupabase.eq).toHaveBeenCalledWith('constraint_type', 'FOREIGN KEY');
    });
  });

  describe('isValidTransformation', () => {
    it('should validate transformations correctly', () => {
      const agentInstance = agent as any;
      
      // Valid transformations
      expect(agentInstance.isValidTransformation('to_lowercase', 'text')).toBe(true);
      expect(agentInstance.isValidTransformation('round', 'numeric')).toBe(true);
      expect(agentInstance.isValidTransformation('to_date', 'timestamp')).toBe(true);
      
      // Invalid transformations
      expect(agentInstance.isValidTransformation('invalid', 'text')).toBe(false);
      expect(agentInstance.isValidTransformation('to_lowercase', 'numeric')).toBe(false);
    });
  });

  describe('validateMappings', () => {
    it('should validate mappings against schema', () => {
      const agentInstance = agent as any;
      const mappings = [
        {
          customerField: 'order_total',
          requiredField: 'orders.total_value',
          confidence: 0.9,
          transformations: ['round']
        }
      ];
      const requiredFields = ['orders.total_value'];
      const schema = [
        { table_name: 'orders', column_name: 'total_value', data_type: 'numeric', is_nullable: 'NO' }
      ];

      const result = agentInstance.validateMappings(mappings, requiredFields, schema);
      expect(result).toEqual([]);
    });

    it('should detect invalid mappings', () => {
      const agentInstance = agent as any;
      const mappings = [
        {
          customerField: 'order_total',
          requiredField: 'orders.total_value',
          confidence: 0.9,
          transformations: ['invalid_transformation']
        }
      ];
      const requiredFields = ['orders.total_value'];
      const schema = [
        { table_name: 'orders', column_name: 'total_value', data_type: 'numeric', is_nullable: 'NO' }
      ];

      const result = agentInstance.validateMappings(mappings, requiredFields, schema);
      expect(result).toContain('orders.total_value (invalid transformation)');
    });
  });

  describe('run', () => {
    it('should process field mapping successfully', async () => {
      const mockMCP: MCP = {
        sessionId: 'test-session',
        version: '1.0',
        status: 'pending',
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        model: {
          variables: [],
          constraints: [],
          objective: {
            type: 'minimize',
            field: 'total_cost',
            description: 'Minimize total delivery cost',
            weight: 1.0
          }
        },
        context: {
          problemType: 'vehicle_routing',
          environment: {
            region: 'US-East',
            timezone: 'America/New_York'
          },
          dataset: {
            internalSources: ['orders', 'customers'],
            metadata: {
              customerFields: ['order_id', 'total_amount'],
              intentDetails: { type: 'delivery' }
            },
            requiredFields: ['orders.id', 'orders.total_value']
          }
        },
        protocol: {
          steps: [],
          allowPartialSolutions: true,
          explainabilityEnabled: true,
          humanInTheLoop: {
            required: false,
            approvalSteps: []
          }
        }
      };

      const mockStep: ProtocolStep = {
        action: 'map_data',
        description: 'Map customer fields to database schema',
        required: true
      };

      // Mock schema and relationships
      mockSupabase.data = [
        { table_name: 'orders', column_name: 'id', data_type: 'uuid', is_nullable: 'NO' },
        { table_name: 'orders', column_name: 'total_value', data_type: 'numeric', is_nullable: 'NO' }
      ];

      const result = await agent.run(mockStep, mockMCP);
      
      expect(result.output.success).toBe(true);
      expect(result.output.mappings).toBeDefined();
      expect(result.thoughtProcess).toBeDefined();
    });

    it('should handle missing credentials', () => {
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_KEY;
      
      expect(() => new DataMappingAgent()).toThrow('Missing required Supabase credentials in .env.local');
    });
  });
}); 