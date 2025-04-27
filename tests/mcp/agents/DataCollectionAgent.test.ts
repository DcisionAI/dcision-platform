import { DataCollectionAgent, createDataCollectionAgent } from '../../../src/mcp/agents/DataCollectionAgent';
import { OrchestrationContext } from '../../../src/mcp/orchestrator/OrchestrationContext';
import { Step, MCP } from '../../../src/mcp/MCPTypes';

describe('DataCollectionAgent', () => {
  let mockStep: Step;
  let mockContext: OrchestrationContext;
  let agent: (step: Step, context: OrchestrationContext) => Promise<any>;

  beforeEach(() => {
    mockStep = {
      id: 'collect_test',
      action: 'collect_data',
      description: 'Test data collection',
      required: true,
      config: {
        dataSource: 'database'
      }
    };

    const mockMCP: MCP = {
      id: 'test-mcp',
      name: 'Test MCP',
      description: 'Test MCP',
      variables: [],
      protocol: { steps: [mockStep] }
    };

    mockContext = new OrchestrationContext(mockMCP);
    agent = createDataCollectionAgent();
  });

  it('should collect data from database source', async () => {
    const result = await agent(mockStep, mockContext);

    expect(result.success).toBe(true);
    expect(result.data.type).toBe('database');
    expect(result.data.records).toHaveLength(2);
    
    // Check if data was stored in context
    const storedData = mockContext.getVariable('collect_test_data');
    expect(storedData).toEqual(result.data);
  });

  it('should collect data from API source', async () => {
    mockStep.config = { dataSource: 'api' };
    const result = await agent(mockStep, mockContext);

    expect(result.success).toBe(true);
    expect(result.data.type).toBe('api');
    expect(result.data.data.results).toHaveLength(2);
  });

  it('should collect data from file source', async () => {
    mockStep.config = { dataSource: 'file' };
    const result = await agent(mockStep, mockContext);

    expect(result.success).toBe(true);
    expect(result.data.type).toBe('file');
    expect(result.data.metadata.format).toBe('text');
  });

  it('should fail for missing data source', async () => {
    mockStep.config = {};
    const result = await agent(mockStep, mockContext);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Data source not specified');
  });

  it('should fail for unsupported data source', async () => {
    mockStep.config = { dataSource: 'unsupported' };
    const result = await agent(mockStep, mockContext);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Unsupported data source');
  });
}); 