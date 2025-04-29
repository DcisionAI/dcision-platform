import { DataIntegrationAgent } from '../../../server/mcp/agents/DataIntegrationAgent';
import { MCP, ProtocolStep, MCPStatus } from '../../../server/mcp/types';
import { PluginRegistry } from '../../../server/mcp/plugins';
import { SupabasePlugin } from '../../../server/mcp/plugins/datasources/supabase/SupabasePlugin';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env.local') });

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn().mockReturnValue({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue({ data: [], error: null }),
    rpc: jest.fn().mockResolvedValue({ data: [], error: null })
  })
}));

describe('DataIntegrationAgent Integration Tests', () => {
  let agent: DataIntegrationAgent;
  let mockStep: ProtocolStep;
  let mockMCP: MCP;
  let mockContext: any;

  beforeAll(async () => {
    // Initialize Supabase plugin with mock configuration
    const supabasePlugin = new SupabasePlugin();
    await supabasePlugin.connect({
      type: 'database',
      connection: {
        url: 'http://mock-supabase-url',
        key: 'mock-supabase-key'
      },
      authentication: {
        username: '',
        password: ''
      }
    });

    // Register the plugin
    const pluginRegistry = PluginRegistry.getInstance();
    pluginRegistry.registerPlugin(supabasePlugin);
  });

  beforeEach(() => {
    // Initialize agent
    agent = new DataIntegrationAgent();
    
    // Mock step
    mockStep = {
      action: 'collect_data',
      description: 'Test data collection step'
    } as ProtocolStep;

    // Mock MCP with delivery optimization context
    mockMCP = {
      id: 'test_mcp',
      name: 'Test MCP',
      description: 'Test MCP',
      sessionId: 'test_session',
      version: '1.0.0',
      status: 'running' as MCPStatus,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      model: {
        variables: [
          {
            name: 'delivery_time',
            type: 'number',
            description: 'Time taken for delivery'
          },
          {
            name: 'vehicle_utilization',
            type: 'number',
            description: 'Vehicle capacity utilization'
          }
        ],
        constraints: [
          {
            type: 'time_window',
            description: 'Delivery must be within time window',
            field: 'delivery_time',
            operator: 'lte',
            value: 480,
            priority: 'must'
          },
          {
            type: 'capacity',
            description: 'Vehicle must not exceed capacity',
            field: 'vehicle_utilization',
            operator: 'lte',
            value: 1,
            priority: 'must'
          }
        ],
        objective: {
          type: 'minimize',
          field: 'delivery_time',
          description: 'Minimize total delivery time',
          weight: 1
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
      },
      context: {
        environment: {
          region: 'US',
          timezone: 'America/New_York',
          resources: {},
          constraints: {},
          parameters: {},
          metadata: {}
        },
        problemType: 'vehicle_routing',
        dataset: {
          requiredFields: [
            'customer_id',
            'order_id',
            'delivery_date',
            'delivery_location',
            'order_priority',
            'vehicle_capacity'
          ],
          internalSources: []
        },
        dataSource: {
          type: 'supabase',
          connection: {
            url: process.env.SUPABASE_URL!,
            key: process.env.SUPABASE_ANON_KEY!
          },
          authentication: {
            username: '',
            password: ''
          }
        }
      }
    } as MCP;

    // Mock context with LLM
    mockContext = {
      llm: async (prompt: string) => {
        if (prompt.includes('analyzeFeatures')) {
          return JSON.stringify({
            required: {
              "customer_id": {
                "description": "Unique customer identifier",
                "dataType": "string",
                "validationRules": ["not_null", "unique"],
                "transformation": "to_string"
              },
              "order_id": {
                "description": "Unique order identifier",
                "dataType": "string",
                "validationRules": ["not_null", "unique"],
                "transformation": "to_string"
              },
              "delivery_date": {
                "description": "Scheduled delivery date and time",
                "dataType": "timestamp",
                "validationRules": ["not_null", "future_date"],
                "transformation": "to_timestamp"
              },
              "delivery_location": {
                "description": "Delivery location coordinates",
                "dataType": "geography",
                "validationRules": ["not_null"],
                "transformation": "to_geography"
              },
              "order_priority": {
                "description": "Order priority level",
                "dataType": "string",
                "validationRules": ["not_null", "enum:low,medium,high"],
                "transformation": "to_string"
              },
              "vehicle_capacity": {
                "description": "Vehicle capacity in cubic meters",
                "dataType": "decimal",
                "validationRules": ["not_null", "positive"],
                "transformation": "to_decimal"
              }
            },
            optional: {
              "customer_name": {
                "description": "Customer's full name",
                "dataType": "string",
                "benefits": ["improved identification"],
                "priority": "high"
              },
              "vehicle_type": {
                "description": "Type of vehicle",
                "dataType": "string",
                "benefits": ["better route planning"],
                "priority": "medium"
              }
            }
          });
        }
        if (prompt.includes('mapFeaturesToDataSource')) {
          return JSON.stringify({
            mappings: [
              {
                modelField: "customer_id",
                table: "customers",
                column: "id",
                confidence: 0.95
              },
              {
                modelField: "order_id",
                table: "orders",
                column: "id",
                confidence: 0.95
              },
              {
                modelField: "delivery_date",
                table: "orders",
                column: "delivery_date",
                confidence: 0.95
              },
              {
                modelField: "delivery_location",
                table: "customers",
                column: "location",
                confidence: 0.95
              },
              {
                modelField: "order_priority",
                table: "orders",
                column: "priority",
                confidence: 0.95
              },
              {
                modelField: "vehicle_capacity",
                table: "vehicles",
                column: "capacity_m3",
                confidence: 0.95
              },
              {
                modelField: "customer_name",
                table: "customers",
                column: "name",
                confidence: 0.95
              },
              {
                modelField: "vehicle_type",
                table: "vehicles",
                column: "type",
                confidence: 0.95
              }
            ]
          });
        }
        if (prompt.includes('validateMappings')) {
          return JSON.stringify({
            isValid: true,
            errors: [],
            warnings: [],
            suggestions: []
          });
        }
        return '{}';
      }
    };
  });

  it('should successfully analyze features for delivery optimization', async () => {
    const result = await agent.run(mockStep, mockMCP, mockContext);
    
    expect(result.output.success).toBe(true);
    expect(result.output.featureSet).toBeDefined();
    expect(result.output.featureSet.required).toHaveProperty('customer_id');
    expect(result.output.featureSet.required).toHaveProperty('order_id');
    expect(result.output.featureSet.required).toHaveProperty('delivery_date');
  });

  it('should successfully map features to Supabase tables', async () => {
    const result = await agent.run(mockStep, mockMCP, mockContext);
    
    expect(result.output.success).toBe(true);
    expect(result.output.fieldMappings).toBeDefined();
    expect(result.output.fieldMappings).toHaveLength(8);
    expect(result.output.fieldMappings[0].table).toBe('customers');
    expect(result.output.fieldMappings[1].table).toBe('orders');
  });

  it('should successfully collect data from Supabase', async () => {
    const result = await agent.run(mockStep, mockMCP, mockContext);
    
    expect(result.output.success).toBe(true);
    expect(result.output.collectedData).toBeDefined();
    expect(result.output.collectedData.customer_id).toBeDefined();
    expect(result.output.collectedData.order_id).toBeDefined();
    expect(result.output.collectedData.delivery_date).toBeDefined();
  });

  it('should handle validation of mappings', async () => {
    const result = await agent.run(mockStep, mockMCP, mockContext);
    
    expect(result.output.success).toBe(true);
    expect(result.output.needsHumanReview).toBe(false);
    expect(result.output.confidence.min).toBeGreaterThanOrEqual(0.8);
  });
}); 