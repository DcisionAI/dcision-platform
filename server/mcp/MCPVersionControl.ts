import { MCP } from './MCPTypes';

export interface MCPVersion {
  version: string;
  timestamp: string;
  changes: MCPChange[];
  author?: string;
  comment?: string;
}

export interface MCPChange {
  path: string[];
  operation: 'add' | 'remove' | 'modify';
  previousValue?: any;
  newValue?: any;
}

export class MCPVersionControl {
  /**
   * Generates a new version number based on semantic versioning
   */
  public static generateVersion(currentVersion: string, changeType: 'major' | 'minor' | 'patch'): string {
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    
    switch (changeType) {
      case 'major':
        return `${major + 1}.0.0`;
      case 'minor':
        return `${major}.${minor + 1}.0`;
      case 'patch':
        return `${major}.${minor}.${patch + 1}`;
      default:
        throw new Error('Invalid change type');
    }
  }

  /**
   * Determines the type of version change needed based on the differences
   */
  public static determineChangeType(changes: MCPChange[]): 'major' | 'minor' | 'patch' {
    // Major changes: modifications to core structure or breaking changes
    const hasMajorChange = changes.some(change => 
      change.path[0] === 'model' || 
      change.path[0] === 'context' ||
      (change.path[0] === 'protocol' && change.path[1] === 'steps')
    );

    if (hasMajorChange) return 'major';

    // Minor changes: additions of new features or substantial modifications
    const hasMinorChange = changes.some(change =>
      change.operation === 'add' ||
      (change.path[0] === 'protocol' && change.path[1] !== 'steps')
    );

    if (hasMinorChange) return 'minor';

    // Patch changes: small updates, bug fixes, or metadata changes
    return 'patch';
  }

  /**
   * Compares two MCP objects and returns an array of changes
   */
  public static compareVersions(oldMcp: MCP, newMcp: MCP): MCPChange[] {
    const changes: MCPChange[] = [];
    this.compareObjects([], oldMcp, newMcp, changes);
    return changes;
  }

  /**
   * Creates a new version of an MCP object with tracking information
   */
  public static createNewVersion(
    oldMcp: MCP, 
    newMcp: MCP, 
    author?: string,
    comment?: string
  ): MCPVersion {
    const changes = this.compareVersions(oldMcp, newMcp);
    const changeType = this.determineChangeType(changes);
    const newVersion = this.generateVersion(oldMcp.version, changeType);

    return {
      version: newVersion,
      timestamp: new Date().toISOString(),
      changes,
      author,
      comment
    };
  }

  /**
   * Applies a version's changes to an MCP object
   */
  public static applyVersion(mcp: MCP, version: MCPVersion): MCP {
    const newMcp = JSON.parse(JSON.stringify(mcp)) as MCP;
    
    version.changes.forEach(change => {
      let target = newMcp;
      const lastIndex = change.path.length - 1;
      
      // Navigate to the parent of the target property
      for (let i = 0; i < lastIndex; i++) {
        target = target[change.path[i] as keyof typeof target] as any;
      }

      const lastKey = change.path[lastIndex];
      
      switch (change.operation) {
        case 'add':
        case 'modify':
          (target as any)[lastKey] = change.newValue;
          break;
        case 'remove':
          delete (target as any)[lastKey];
          break;
      }
    });

    newMcp.version = version.version;
    newMcp.lastModified = version.timestamp;
    
    return newMcp;
  }

  /**
   * Recursively compares objects and records changes
   */
  private static compareObjects(
    path: string[], 
    oldObj: any, 
    newObj: any, 
    changes: MCPChange[]
  ): void {
    if (oldObj === newObj) return;

    if (typeof oldObj !== typeof newObj) {
      changes.push({
        path,
        operation: 'modify',
        previousValue: oldObj,
        newValue: newObj
      });
      return;
    }

    if (Array.isArray(oldObj) && Array.isArray(newObj)) {
      if (oldObj.length !== newObj.length || JSON.stringify(oldObj) !== JSON.stringify(newObj)) {
        changes.push({
          path,
          operation: 'modify',
          previousValue: oldObj,
          newValue: newObj
        });
      }
      return;
    }

    if (typeof oldObj !== 'object' || oldObj === null || newObj === null) {
      if (oldObj !== newObj) {
        changes.push({
          path,
          operation: 'modify',
          previousValue: oldObj,
          newValue: newObj
        });
      }
      return;
    }

    const oldKeys = Object.keys(oldObj);
    const newKeys = Object.keys(newObj);

    // Find removed properties
    oldKeys.forEach(key => {
      if (!newKeys.includes(key) && oldObj[key] !== undefined) {
        changes.push({
          path: [...path, key],
          operation: 'remove',
          previousValue: oldObj[key]
        });
      }
    });

    // Find added or modified properties
    newKeys.forEach(key => {
      const newPath = [...path, key];
      
      if (!oldKeys.includes(key) || oldObj[key] === undefined) {
        changes.push({
          path: newPath,
          operation: 'add',
          newValue: newObj[key]
        });
      } else if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
        this.compareObjects(newPath, oldObj[key], newObj[key], changes);
      }
    });
  }
} 