import { MCPMigrationManager, MCPVersionError, v1_0_0_to_v1_1_0 } from './MCPMigration';
import { MCP } from './MCPTypes';

describe('MCPMigrationManager', () => {
  let migrationManager: MCPMigrationManager;

  beforeEach(() => {
    migrationManager = new MCPMigrationManager();
    migrationManager.registerMigration(v1_0_0_to_v1_1_0);
  });

  describe('detectVersion', () => {
    it('should detect version from MCP object', () => {
      const mcp = { version: '1.0.0' };
      expect(migrationManager.detectVersion(mcp)).toBe('1.0.0');
    });

    it('should assume 1.0.0 for objects without version', () => {
      const mcp = { someField: 'value' };
      expect(migrationManager.detectVersion(mcp)).toBe('1.0.0');
    });

    it('should throw error for invalid objects', () => {
      expect(() => migrationManager.detectVersion(null)).toThrow(MCPVersionError);
      expect(() => migrationManager.detectVersion('not an object')).toThrow(MCPVersionError);
    });
  });

  describe('migration', () => {
    const oldMCP: MCP = {
      sessionId: 'test-session',
      model: {
        variables: [],
        constraints: [],
        objective: { type: 'minimize', field: 'cost', description: 'Minimize cost', weight: 1 }
      },
      context: {
        environment: {},
        dataset: { internalSources: [] },
        problemType: 'vehicle_routing'
      },
      protocol: {
        steps: [],
        allowPartialSolutions: false,
        explainabilityEnabled: true,
        humanInTheLoop: { required: false, approvalSteps: [] }
      },
      version: '1.0.0',
      created: '2024-03-20T10:00:00Z',
      lastModified: '2024-03-20T10:00:00Z',
      status: 'pending'
    };

    it('should migrate MCP to version 1.1.0', async () => {
      const migrated = await migrationManager.migrateToVersion(oldMCP, '1.1.0');
      
      expect(migrated.version).toBe('1.1.0');
    });

    it('should return same object if already at target version', async () => {
      const result = await migrationManager.migrateToVersion(oldMCP, '1.0.0');
      expect(result).toBe(oldMCP);
    });

    it('should throw error if no migration path exists', async () => {
      await expect(migrationManager.migrateToVersion(oldMCP, '2.0.0'))
        .rejects
        .toThrow(MCPVersionError);
    });
  });

  describe('validateMigrationPath', () => {
    it('should return true for valid migration paths', () => {
      expect(migrationManager.validateMigrationPath('1.0.0', '1.1.0')).toBe(true);
    });

    it('should return false for invalid migration paths', () => {
      expect(migrationManager.validateMigrationPath('1.0.0', '2.0.0')).toBe(false);
    });
  });

  describe('getAvailableMigrations', () => {
    it('should return all registered migrations', () => {
      const migrations = migrationManager.getAvailableMigrations();
      expect(migrations).toHaveLength(1);
      expect(migrations[0]).toBe(v1_0_0_to_v1_1_0);
    });
  });
}); 