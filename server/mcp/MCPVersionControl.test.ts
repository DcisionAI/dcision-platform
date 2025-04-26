import { MCPVersionControl } from './MCPVersionControl';
import { MCP } from './MCPTypes';
import { describe, it, expect } from '@jest/globals';

describe('MCPVersionControl', () => {
  const baseMcp: MCP = {
    sessionId: 'test-session',
    version: '1.0.0',
    created: '2024-03-20T10:00:00Z',
    lastModified: '2024-03-20T10:00:00Z',
    status: 'pending',
    model: {
      variables: [
        {
          name: 'x',
          type: 'integer',
          description: 'Test variable'
        }
      ],
      constraints: [
        {
          type: 'test_constraint',
          description: 'Test constraint',
          field: 'x',
          operator: 'eq',
          value: 0,
          priority: 'must'
        }
      ],
      objective: {
        type: 'minimize',
        field: 'cost',
        description: 'Minimize cost',
        weight: 1
      }
    },
    context: {
      problemType: 'resource_scheduling',
      dataset: {
        internalSources: ['test_source']
      },
      environment: {
        region: 'test-region',
        timezone: 'UTC'
      },
      industry: 'manufacturing'
    },
    protocol: {
      steps: [
        {
          action: 'collect_data',
          description: 'Collect test data',
          required: true
        }
      ],
      humanInTheLoop: {
        required: false,
        approvalSteps: []
      },
      allowPartialSolutions: false,
      explainabilityEnabled: true
    }
  };

  it('should generate correct version numbers', () => {
    expect(MCPVersionControl.generateVersion('1.0.0', 'major')).toBe('2.0.0');
    expect(MCPVersionControl.generateVersion('1.0.0', 'minor')).toBe('1.1.0');
    expect(MCPVersionControl.generateVersion('1.0.0', 'patch')).toBe('1.0.1');
  });

  it('should determine correct change types', () => {
    const majorChanges = [{ path: ['model', 'variables'], operation: 'modify' as const }];
    const minorChanges = [{ path: ['protocol', 'allowPartialSolutions'], operation: 'modify' as const }];
    const patchChanges = [{ path: ['sessionId'], operation: 'modify' as const }];

    expect(MCPVersionControl.determineChangeType(majorChanges)).toBe('major');
    expect(MCPVersionControl.determineChangeType(minorChanges)).toBe('minor');
    expect(MCPVersionControl.determineChangeType(patchChanges)).toBe('patch');
  });

  it('should detect changes between versions', () => {
    const newMcp = JSON.parse(JSON.stringify(baseMcp)) as MCP;
    newMcp.model.variables.push({
      name: 'y',
      type: 'float',
      description: 'New variable'
    });

    const changes = MCPVersionControl.compareVersions(baseMcp, newMcp);
    expect(changes).toHaveLength(1);
    expect(changes[0].operation).toBe('modify');
    expect(changes[0].path).toEqual(['model', 'variables']);
  });

  it('should create new version with tracking information', () => {
    const newMcp = JSON.parse(JSON.stringify(baseMcp)) as MCP;
    newMcp.model.variables.push({
      name: 'y',
      type: 'float',
      description: 'New variable'
    });

    const version = MCPVersionControl.createNewVersion(
      baseMcp,
      newMcp,
      'test-author',
      'Added new variable'
    );

    expect(version.version).toBe('2.0.0');
    expect(version.author).toBe('test-author');
    expect(version.comment).toBe('Added new variable');
    expect(version.changes).toHaveLength(1);
  });

  it('should apply version changes correctly', () => {
    const newMcp = JSON.parse(JSON.stringify(baseMcp)) as MCP;
    newMcp.model.variables.push({
      name: 'y',
      type: 'float',
      description: 'New variable'
    });

    const version = MCPVersionControl.createNewVersion(baseMcp, newMcp);
    const updatedMcp = MCPVersionControl.applyVersion(baseMcp, version);

    expect(updatedMcp.version).toBe(version.version);
    expect(updatedMcp.lastModified).toBe(version.timestamp);
    expect(updatedMcp.model.variables).toHaveLength(2);
    expect(updatedMcp.model.variables[1].name).toBe('y');
  });

  it('should handle property removal', () => {
    const newMcp = JSON.parse(JSON.stringify(baseMcp)) as MCP;
    delete (newMcp.context as any).industry;

    const changes = MCPVersionControl.compareVersions(baseMcp, newMcp);
    const hasRemoval = changes.some(c => c.operation === 'remove' && c.path.join('.') === 'context.industry');
    expect(hasRemoval).toBe(true);
  });

  it('should handle nested property modifications', () => {
    const newMcp = JSON.parse(JSON.stringify(baseMcp)) as MCP;
    newMcp.protocol.humanInTheLoop.required = true;
    newMcp.protocol.humanInTheLoop.approvalSteps = ['review'];

    const changes = MCPVersionControl.compareVersions(baseMcp, newMcp);
    expect(changes.length).toBeGreaterThan(0);
    expect(changes.some(c => c.path.join('.') === 'protocol.humanInTheLoop.required')).toBe(true);
    expect(changes.some(c => c.path.join('.') === 'protocol.humanInTheLoop.approvalSteps')).toBe(true);
  });
}); 