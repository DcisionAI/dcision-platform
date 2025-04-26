import { MCP } from './MCPTypes';

export class MCPVersionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MCPVersionError';
  }
}

export interface MCPMigration {
  sourceVersion: string;
  targetVersion: string;
  migrate: (mcp: unknown) => MCP;
}

export class MCPMigrationManager {
  private static readonly LATEST_VERSION = '1.0.0';
  private migrations: Map<string, MCPMigration>;

  constructor() {
    this.migrations = new Map();
  }

  /**
   * Register a new migration
   */
  public registerMigration(migration: MCPMigration): void {
    const key = `${migration.sourceVersion}-to-${migration.targetVersion}`;
    this.migrations.set(key, migration);
  }

  /**
   * Detect the version of an MCP object
   */
  public detectVersion(mcp: unknown): string {
    if (typeof mcp !== 'object' || mcp === null) {
      throw new MCPVersionError('Invalid MCP object');
    }

    const version = (mcp as any).version;
    if (!version) {
      // Assume oldest version if not specified
      return '1.0.0';
    }

    return version;
  }

  /**
   * Find the migration path from source to target version
   */
  private findMigrationPath(sourceVersion: string, targetVersion: string): MCPMigration[] {
    // Simple direct path for now
    // TODO: Implement graph-based path finding for complex migration paths
    const key = `${sourceVersion}-to-${targetVersion}`;
    const migration = this.migrations.get(key);
    
    if (!migration) {
      throw new MCPVersionError(`No migration path found from ${sourceVersion} to ${targetVersion}`);
    }

    return [migration];
  }

  /**
   * Migrate an MCP object to the latest version
   */
  public async migrateToLatest(mcp: unknown): Promise<MCP> {
    const sourceVersion = this.detectVersion(mcp);
    
    if (sourceVersion === MCPMigrationManager.LATEST_VERSION) {
      return mcp as MCP;
    }

    const migrations = this.findMigrationPath(sourceVersion, MCPMigrationManager.LATEST_VERSION);
    
    let currentMCP = mcp;
    for (const migration of migrations) {
      currentMCP = migration.migrate(currentMCP);
    }

    return currentMCP as MCP;
  }

  /**
   * Migrate an MCP object to a specific version
   */
  public async migrateToVersion(mcp: unknown, targetVersion: string): Promise<MCP> {
    const sourceVersion = this.detectVersion(mcp);
    
    if (sourceVersion === targetVersion) {
      return mcp as MCP;
    }

    const migrations = this.findMigrationPath(sourceVersion, targetVersion);
    
    let currentMCP = mcp;
    for (const migration of migrations) {
      currentMCP = migration.migrate(currentMCP);
    }

    return currentMCP as MCP;
  }

  /**
   * Validate that a migration path exists
   */
  public validateMigrationPath(sourceVersion: string, targetVersion: string): boolean {
    try {
      this.findMigrationPath(sourceVersion, targetVersion);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get all available migrations
   */
  public getAvailableMigrations(): MCPMigration[] {
    return Array.from(this.migrations.values());
  }
}

// Example migration implementation
export const v1_0_0_to_v1_1_0: MCPMigration = {
  sourceVersion: '1.0.0',
  targetVersion: '1.1.0',
  migrate: (mcp: unknown): MCP => {
    const oldMCP = mcp as any;
    
    // Add new optional fields with defaults
    return {
      ...oldMCP,
      version: '1.1.0',
      metadata: oldMCP.metadata || {},
      context: {
        ...oldMCP.context,
        metadata: oldMCP.context.metadata || {}
      },
      protocol: {
        ...oldMCP.protocol,
        metadata: oldMCP.protocol.metadata || {}
      }
    };
  }
}; 