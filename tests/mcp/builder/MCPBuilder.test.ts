import { MCPBuilder } from '../../../src/mcp/builder/MCPBuilder';
import { MCP, Variable, Step } from '../../../src/mcp/MCPTypes';

describe('MCPBuilder', () => {
  describe('basic MCP construction', () => {
    it('should create a minimal valid MCP', () => {
      const mcp = MCPBuilder.create('test-mcp')
        .setName('Test MCP')
        .setDescription('Test Description')
        .addStep('step1', 'collect_data')
        .build();

      expect(mcp.id).toBe('test-mcp');
      expect(mcp.name).toBe('Test MCP');
      expect(mcp.description).toBe('Test Description');
      expect(mcp.protocol.steps).toHaveLength(1);
    });

    it('should fail without steps', () => {
      expect(() => {
        MCPBuilder.create('test-mcp').build();
      }).toThrow('MCP must have at least one step');
    });

    it('should handle metadata correctly', () => {
      const mcp = MCPBuilder.create('test-mcp')
        .addStep('step1', 'collect_data')
        .addMetadata('version', '1.0')
        .addMetadata('author', 'test')
        .build();

      expect(mcp.metadata).toBeDefined();
      expect(mcp.metadata?.version).toBe('1.0');
      expect(mcp.metadata?.author).toBe('test');
    });
  });

  describe('variable management', () => {
    it('should add variables with defaults', () => {
      const mcp = MCPBuilder.create('test-mcp')
        .addVariable('numVar', 'number', { default: 42 })
        .addVariable('strVar', 'string', { default: 'test' })
        .addVariable('boolVar', 'boolean', { default: true })
        .addStep('step1', 'collect_data')
        .build();

      expect(mcp.variables).toHaveLength(3);
      expect(mcp.variables[0].default).toBe(42);
      expect(mcp.variables[1].default).toBe('test');
      expect(mcp.variables[2].default).toBe(true);
    });

    it('should validate variable types', () => {
      expect(() => {
        MCPBuilder.create('test-mcp')
          .addVariable('numVar', 'number', { default: 'not-a-number' })
          .build();
      }).toThrow('Variable numVar default value must be a number');
    });

    it('should prevent duplicate variable names', () => {
      expect(() => {
        MCPBuilder.create('test-mcp')
          .addVariable('var1', 'string')
          .addVariable('var1', 'number')
          .build();
      }).toThrow('Duplicate variable name: var1');
    });
  });

  describe('step management', () => {
    it('should add steps with configuration', () => {
      const mcp = MCPBuilder.create('test-mcp')
        .addStep('step1', 'collect_data', {
          description: 'Custom description',
          config: { key: 'value' }
        })
        .build();

      const step = mcp.protocol.steps[0];
      expect(step.description).toBe('Custom description');
      expect(step.config?.key).toBe('value');
    });

    it('should prevent duplicate step IDs', () => {
      expect(() => {
        MCPBuilder.create('test-mcp')
          .addStep('step1', 'collect_data')
          .addStep('step1', 'validate_constraints')
          .build();
      }).toThrow('Duplicate step ID: step1');
    });
  });

  describe('convenience methods', () => {
    it('should create data collection step', () => {
      const mcp = MCPBuilder.create('test-mcp')
        .addDataCollectionStep('collect1', 'database', {
          description: 'Collect from DB',
          additionalConfig: { query: 'SELECT *' }
        })
        .build();

      const step = mcp.protocol.steps[0];
      expect(step.action).toBe('collect_data');
      expect(step.config?.dataSource).toBe('database');
      expect(step.config?.query).toBe('SELECT *');
    });

    it('should create validation step', () => {
      const mcp = MCPBuilder.create('test-mcp')
        .addValidationStep('validate1', 'constraints')
        .build();

      const step = mcp.protocol.steps[0];
      expect(step.action).toBe('validate_constraints');
    });

    it('should create model steps', () => {
      const mcp = MCPBuilder.create('test-mcp')
        .addModelStep('build1', 'build_model')
        .addModelStep('solve1', 'solve_model')
        .build();

      expect(mcp.protocol.steps[0].action).toBe('build_model');
      expect(mcp.protocol.steps[1].action).toBe('solve_model');
    });

    it('should create human review step', () => {
      const mcp = MCPBuilder.create('test-mcp')
        .addHumanReviewStep('review1', {
          description: 'Please review',
          config: { approver: 'manager' }
        })
        .build();

      const step = mcp.protocol.steps[0];
      expect(step.action).toBe('human_review');
      expect(step.description).toBe('Please review');
      expect(step.config?.approver).toBe('manager');
    });
  });

  describe('complex MCP construction', () => {
    it('should build a complete workflow', () => {
      const mcp = MCPBuilder.create('fleet-optimization')
        .setName('Fleet Optimization')
        .setDescription('Optimize fleet routes')
        .addMetadata('version', '1.0')
        // Add variables
        .addVariable('max_distance', 'number', { 
          default: 1000,
          description: 'Maximum route distance'
        })
        .addVariable('vehicle_ids', 'array', {
          default: [],
          description: 'Available vehicle IDs'
        })
        // Add steps
        .addDataCollectionStep('collect_vehicles', 'database', {
          description: 'Fetch vehicle data',
          additionalConfig: { table: 'vehicles' }
        })
        .addDataCollectionStep('collect_orders', 'api', {
          description: 'Fetch order data'
        })
        .addValidationStep('validate_data', 'constraints')
        .addModelStep('build_routes', 'build_model')
        .addModelStep('optimize_routes', 'solve_model')
        .addHumanReviewStep('approve_routes')
        .build();

      // Verify the complete structure
      expect(mcp.variables).toHaveLength(2);
      expect(mcp.protocol.steps).toHaveLength(6);
      expect(mcp.metadata?.version).toBe('1.0');
      
      // Verify step sequence
      const stepActions = mcp.protocol.steps.map(s => s.action);
      expect(stepActions).toEqual([
        'collect_data',
        'collect_data',
        'validate_constraints',
        'build_model',
        'solve_model',
        'human_review'
      ]);
    });
  });
}); 