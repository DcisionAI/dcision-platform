import { DataIntegrationAgent } from '../../../server/mcp/agents/DataIntegrationAgent';
import { MCP, ProtocolStep } from '../../../server/mcp/types';
import { PluginRegistry } from '../../../server/mcp/plugins';
import { DataSourcePlugin, DataSourceType } from '../../../server/mcp/plugins/datasources/base/types';

// Mock LLM function
const mockLLM = jest.fn().mockImplementation((prompt: string) => {
  if (prompt.includes('analyzeFeatures')) {
    return Promise.resolve(JSON.stringify({
      required: {
        "customer_id": {
          "description": "Unique customer identifier",
          "dataType": "string",
          "validationRules": ["not_null", "unique"],
          "transformation": "to_string"
        }
      },
      optional: {
        "customer_name": {
          "description": "Customer's full name",
          "dataType": "string",
          "benefits": ["improved identification"],
          "priority": "high"
        }
      }
    }));
  }
  if (prompt.includes('mapFeaturesToDataSource')) {
    return Promise.resolve(JSON.stringify({
      mappings: [{
        modelField: "customer_id",
        table: "customers",
        column: "id",
        confidence: 0.95
      }]
    }));
  }
  if (prompt.includes('validateMappings')) {
    return Promise.resolve(JSON.stringify({
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    }));
  }
  return Promise.resolve('{}');
});

// Mock DataSourcePlugin
class MockDataSourcePlugin implements DataSourcePlugin {
  name = 'MockDataSource';
  type: DataSourceType = 'database';
  version = '1.0.0';

  async connect(config: any): Promise<void> {
    return Promise.resolve();
  }

  async disconnect(): Promise<void> {
    return Promise.resolve();
  }

  async getSchema(): Promise<any> {
    return {
      customers: {
        id: { type: 'string', nullable: false },
        name: { type: 'string', nullable: true }
      }
    };
  }

  async validateData(fields: string[]): Promise<any> {
    return {
      isValid: true,
      errors: [],
      warnings: [],
      missingFields: [],
      sampleData: {}
    };
  }

  async fetchData(query: any): Promise<any> {
    return {
      customers: [
        { id: '1', name: 'John Doe' },
        { id: '2', name: 'Jane Smith' }
      ]
    };
  }

  async testConnection(): Promise<boolean> {
    return true;
  }

  async getTables(): Promise<string[]> {
    return ['customers'];
  }

  async getColumns(table: string): Promise<string[]> {
    return ['id', 'name'];
  }

  async executeQuery(query: string): Promise<any> {
    return [];
  }

  async getSampleData(table: string, limit: number = 10): Promise<any[]> {
    return [
      { id: '1', name: 'John Doe' },
      { id: '2', name: 'Jane Smith' }
    ];
  }
}

describe('DataIntegrationAgent', () => {
  let agent: DataIntegrationAgent;
  let mockStep: ProtocolStep;
  let mockMCP: MCP;
  let mockContext: any;

  beforeEach(() => {
    // Initialize agent
    agent = new DataIntegrationAgent();
    
    // Mock step
    mockStep = {
      action: 'collect_data',
      description: 'Test data collection step'
    } as ProtocolStep;

    // Mock MCP
    mockMCP = {
      id: 'test_mcp',
      name: 'Test MCP',
      description: 'Test MCP',
      sessionId: 'test_session',
      version: '1.0.0',
      status: 'active',
      created: new Date(),
      updated: new Date(),
      context: {
        problemType: 'customer_analysis',
        dataset: {
          requiredFields: ['customer_id']
        },
        dataSource: {
          type: 'database',
          connection: {
            host: 'localhost',
            port: 5432,
            database: 'test_db'
          },
          authentication: {
            username: 'test',
            password: 'test'
          }
        }
      }
    } as MCP;

    // Mock context
    mockContext = {
      llm: mockLLM
    };

    // Register mock plugin
    const pluginRegistry = PluginRegistry.getInstance();
    pluginRegistry.registerPlugin('database', new MockDataSourcePlugin());
  });

  it('should successfully analyze features', async () => {
    const result = await agent.run(mockStep, mockMCP, mockContext);
    
    expect(result.output.success).toBe(true);
    expect(result.output.featureSet).toBeDefined();
    expect(result.output.featureSet.required).toHaveProperty('customer_id');
    expect(result.output.featureSet.optional).toHaveProperty('customer_name');
  });

  it('should successfully map features to data source', async () => {
    const result = await agent.run(mockStep, mockMCP, mockContext);
    
    expect(result.output.success).toBe(true);
    expect(result.output.fieldMappings).toBeDefined();
    expect(result.output.fieldMappings).toHaveLength(1);
    expect(result.output.fieldMappings[0].modelField).toBe('customer_id');
    expect(result.output.fieldMappings[0].table).toBe('customers');
  });

  it('should successfully collect data', async () => {
    const result = await agent.run(mockStep, mockMCP, mockContext);
    
    expect(result.output.success).toBe(true);
    expect(result.output.collectedData).toBeDefined();
    expect(result.output.collectedData.customer_id).toBeDefined();
    expect(result.output.collectedData.customer_id).toHaveLength(2);
  });

  it('should handle validation failures', async () => {
    // Mock validation failure
    mockLLM.mockImplementationOnce((prompt: string) => {
      if (prompt.includes('validateMappings')) {
        return Promise.resolve(JSON.stringify({
          isValid: false,
          errors: ['Invalid mapping detected'],
          warnings: [],
          suggestions: []
        }));
      }
      return mockLLM(prompt);
    });

    const result = await agent.run(mockStep, mockMCP, mockContext);
    
    expect(result.output.success).toBe(false);
    expect(result.output.error).toBe('Field mapping validation failed');
    expect(result.output.details).toContain('Invalid mapping detected');
  });

  it('should indicate when human review is needed', async () => {
    // Mock low confidence mapping
    mockLLM.mockImplementationOnce((prompt: string) => {
      if (prompt.includes('mapFeaturesToDataSource')) {
        return Promise.resolve(JSON.stringify({
          mappings: [{
            modelField: "customer_id",
            table: "customers",
            column: "id",
            confidence: 0.5 // Low confidence
          }]
        }));
      }
      return mockLLM(prompt);
    });

    const result = await agent.run(mockStep, mockMCP, mockContext);
    
    expect(result.output.success).toBe(true);
    expect(result.output.needsHumanReview).toBe(true);
    expect(result.output.confidence.min).toBeLessThan(0.8);
  });

  it('should handle data source connection failures', async () => {
    // Mock connection failure
    const mockPlugin = new MockDataSourcePlugin();
    mockPlugin.connect = jest.fn().mockRejectedValue(new Error('Connection failed'));
    
    const pluginRegistry = PluginRegistry.getInstance();
    pluginRegistry.registerPlugin('database', mockPlugin);

    const result = await agent.run(mockStep, mockMCP, mockContext);
    
    expect(result.output.success).toBe(false);
    expect(result.output.error).toBe('Data integration failed');
    expect(result.output.details).toContain('Connection failed');
  });
}); 