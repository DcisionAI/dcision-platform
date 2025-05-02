import { MCP } from '../mcp/types/core';
import { supabase } from '../utils/supabase';
import { ValidationError } from '../errors/ValidationError';

export interface ListOptions {
  limit?: number;
  offset?: number;
  filter?: Record<string, any>;
  sort?: Record<string, 'asc' | 'desc'>;
}

export class MCPStorage {
  private readonly TABLE_NAME = 'mcps';
  private mcps: MCP[] = [];

  /**
   * Stores a new MCP in the database
   */
  async create(mcp: MCP): Promise<void> {
    try {
      this.mcps.push(mcp);
    } catch (error) {
      throw new Error(`Failed to create MCP: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieves an MCP by its session ID
   */
  async get(sessionId: string): Promise<MCP | undefined> {
    try {
      return this.mcps.find(mcp => mcp.sessionId === sessionId);
    } catch (error) {
      throw new Error(`Failed to get MCP: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Updates an existing MCP
   */
  async update(sessionId: string, mcp: MCP): Promise<void> {
    try {
      const index = this.mcps.findIndex(m => m.sessionId === sessionId);
      if (index === -1) {
        throw new Error(`MCP with session ID ${sessionId} not found`);
      }
      this.mcps[index] = mcp;
    } catch (error) {
      throw new Error(`Failed to update MCP: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Deletes an MCP by its session ID
   */
  async delete(sessionId: string): Promise<void> {
    try {
      const index = this.mcps.findIndex(m => m.sessionId === sessionId);
      if (index === -1) {
        throw new Error(`MCP with session ID ${sessionId} not found`);
      }
      this.mcps.splice(index, 1);
    } catch (error) {
      throw new Error(`Failed to delete MCP: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Lists all MCPs with optional filtering and pagination
   */
  async list(options: ListOptions = {}): Promise<MCP[]> {
    try {
      let results = [...this.mcps];

      // Apply filters
      if (options.filter) {
        for (const [key, value] of Object.entries(options.filter)) {
          results = results.filter(mcp => {
            const parts = key.split('.');
            let current: any = mcp;
            for (const part of parts) {
              if (current === undefined) return false;
              current = current[part];
            }
            return current === value;
          });
        }
      }

      // Apply sorting
      if (options.sort) {
        for (const [key, direction] of Object.entries(options.sort)) {
          results.sort((a, b) => {
            const parts = key.split('.');
            let aValue: any = a;
            let bValue: any = b;
            for (const part of parts) {
              if (aValue === undefined) return direction === 'asc' ? -1 : 1;
              if (bValue === undefined) return direction === 'asc' ? 1 : -1;
              aValue = aValue[part];
              bValue = bValue[part];
            }
            if (aValue === bValue) return 0;
            if (aValue === undefined) return direction === 'asc' ? -1 : 1;
            if (bValue === undefined) return direction === 'asc' ? 1 : -1;
            return direction === 'asc' ? 
              (aValue < bValue ? -1 : 1) : 
              (aValue < bValue ? 1 : -1);
          });
        }
      }

      // Apply pagination
      const start = options.offset ?? 0;
      const end = options.limit ? start + options.limit : undefined;
      return results.slice(start, end);
    } catch (error) {
      throw new Error(`Failed to list MCPs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Maps a database record to an MCP object
   */
  private mapToMCP(record: any): MCP {
    return {
      sessionId: record.session_id,
      version: record.version,
      created: record.created,
      lastModified: record.last_modified,
      status: record.status,
      model: record.model,
      context: record.context,
      protocol: record.protocol
    };
  }
}
