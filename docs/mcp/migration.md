# MCP Migration Strategy

## Overview

This document outlines the strategy for managing changes to the MCP (Model Context Protocol) schema and ensuring smooth transitions between versions.

## Version Control Strategy

### Semantic Versioning

We follow semantic versioning (MAJOR.MINOR.PATCH) for the MCP schema:

1. **MAJOR** version changes (e.g., 1.0.0 → 2.0.0)
   - Breaking changes to the schema
   - Incompatible API changes
   - Major structural modifications

2. **MINOR** version changes (e.g., 1.0.0 → 1.1.0)
   - New features in backward-compatible manner
   - New optional fields
   - New problem types

3. **PATCH** version changes (e.g., 1.0.0 → 1.0.1)
   - Bug fixes
   - Documentation updates
   - Non-breaking refinements

## Migration Guidelines

### 1. Schema Changes

#### Adding New Fields
- Always make new fields optional
- Provide default values where appropriate
- Document the purpose and usage

Example:
```typescript
// Before (v1.0.0)
interface MCP {
  model: Model;
}

// After (v1.1.0)
interface MCP {
  model: Model;
  metadata?: Record<string, unknown>;  // New optional field
}
```

#### Modifying Existing Fields
- Never remove fields in minor versions
- Mark fields as deprecated before removal
- Provide migration utilities

Example:
```typescript
// Before (v1.0.0)
interface Vehicle {
  speed: number;  // km/h
}

// After (v1.1.0)
interface Vehicle {
  /** @deprecated Use speedKmh instead */
  speed?: number;
  speedKmh: number;  // More explicit naming
}
```

#### Breaking Changes
- Only in major versions
- Provide clear migration path
- Include code examples

### 2. Data Migration

#### Automated Migration Scripts
Located in `scripts/migrations/`:

1. **Version Detection**
```typescript
function detectMCPVersion(mcp: unknown): string {
  // Check schema version
  return mcp.version || '1.0.0';
}
```

2. **Migration Functions**
```typescript
const migrations = {
  '1.0.0-to-1.1.0': (mcp: MCPv1): MCPv1_1 => {
    // Migration logic
    return {
      ...mcp,
      version: '1.1.0',
      // Add/transform fields
    };
  },
  // Add more migrations
};
```

3. **Migration Runner**
```typescript
async function migrateMCP(mcp: unknown): Promise<MCP> {
  const version = detectMCPVersion(mcp);
  const targetVersion = LATEST_VERSION;
  
  return await applyMigrations(mcp, version, targetVersion);
}
```

### 3. Backward Compatibility

#### Compatibility Layers
- Maintain interface adapters
- Support old field names
- Validate both old and new formats

Example:
```typescript
interface CompatibilityLayer {
  adaptToLatest(oldMCP: unknown): MCP;
  adaptToVersion(mcp: MCP, version: string): unknown;
}
```

#### Validation Rules
- Version-specific validation
- Graceful handling of deprecated fields
- Clear error messages

Example:
```typescript
const validationRules = {
  '1.0.0': {
    // Original validation rules
  },
  '1.1.0': {
    // Updated rules with backward compatibility
  }
};
```

## Testing Strategy

### 1. Migration Tests
- Test each migration step
- Verify data integrity
- Check backward compatibility

```typescript
describe('MCP Migration', () => {
  it('should migrate from v1.0.0 to v1.1.0', () => {
    const oldMCP = loadFixture('v1.0.0/sample.json');
    const migrated = migrateMCP(oldMCP);
    expect(migrated.version).toBe('1.1.0');
    // Verify data integrity
  });
});
```

### 2. Compatibility Tests
- Test with old clients
- Verify API compatibility
- Check error handling

```typescript
describe('Backward Compatibility', () => {
  it('should handle old format requests', () => {
    const oldRequest = createOldFormatRequest();
    const response = processRequest(oldRequest);
    expect(response.status).toBe('success');
  });
});
```

## Deployment Strategy

### 1. Phased Rollout
1. Deploy new version alongside old
2. Migrate data incrementally
3. Switch clients gradually
4. Remove old version

### 2. Monitoring
- Track version usage
- Monitor migration success
- Alert on failures

### 3. Rollback Plan
- Keep old version available
- Maintain data backups
- Document rollback procedures

## Documentation Requirements

### 1. Change Documentation
- List all changes
- Provide migration examples
- Include validation rules

### 2. Client Guidelines
- Update instructions
- Migration checklist
- Troubleshooting guide

### 3. API Documentation
- Version-specific docs
- Deprecation notices
- New feature guides

## Support Policy

### 1. Version Support
- Support last 2 major versions
- 6-month deprecation notice
- Critical bug fixes for all supported versions

### 2. Client Support
- Migration assistance
- Technical consultation
- Issue resolution

### 3. Timeline
- Announce changes early
- Set clear deadlines
- Provide grace periods

# MCP Migration Guide

## Version History

### Current Version (2.0.0)
The latest version of MCP introduces several improvements and breaking changes.

### Previous Version (1.x)
Legacy version with basic optimization capabilities.

## Breaking Changes

### Variable Definitions
#### Before (1.x)
```typescript
{
  "variables": {
    "x": { "type": "numeric", "min": 0, "max": 100 }
  }
}
```

#### After (2.0.0)
```typescript
{
  "variables": [
    {
      "name": "x",
      "type": "numeric",
      "domain": { "min": 0, "max": 100 }
    }
  ]
}
```

### Constraint Format
#### Before (1.x)
```typescript
{
  "constraints": {
    "capacity": { "type": "less_than", "value": 100 }
  }
}
```

#### After (2.0.0)
```typescript
{
  "constraints": [
    {
      "type": "mathematical",
      "expression": "x",
      "operator": "lte",
      "rhs": 100
    }
  ]
}
```

## New Features

### Multi-Objective Optimization
```typescript
{
  "objectives": [
    {
      "type": "minimize",
      "expression": "total_cost",
      "weight": 0.7
    },
    {
      "type": "maximize",
      "expression": "quality",
      "weight": 0.3
    }
  ]
}
```

### Enhanced Protocol Steps
```typescript
{
  "protocol": {
    "steps": [
      {
        "action": "collect_data",
        "required": true
      },
      {
        "action": "validate_constraints",
        "required": true
      },
      {
        "action": "solve_model",
        "required": true
      }
    ]
  }
}
```

## Migration Steps

### 1. Update Dependencies
```bash
npm install @dcisionai/mcp@2.0.0
```

### 2. Update Variable Definitions
1. Convert object-based variables to array format
2. Move domain constraints into domain object
3. Add required metadata fields

### 3. Update Constraints
1. Convert to mathematical expression format
2. Update operator types
3. Add explicit RHS values

### 4. Update Protocol Steps
1. Add required protocol steps
2. Configure step actions
3. Set timeout and retry parameters

## Backward Compatibility

### Compatibility Layer
- Version 2.0.0 includes a compatibility layer for 1.x configs
- Use `MCPMigrationTool` for automatic upgrades
- Legacy endpoints remain supported until 3.0.0

### Validation Tools
```typescript
import { validateMCPConfig } from '@dcisionai/mcp';

// Validate new format
const isValid = await validateMCPConfig(config);

// Validate with legacy support
const isValidLegacy = await validateMCPConfig(config, { legacy: true });
```

## Support

### Migration Assistance
- Documentation
- Migration scripts
- Support channels
- Community forums

### Troubleshooting
- Common migration issues
- Version compatibility matrix
- Error resolution guide 