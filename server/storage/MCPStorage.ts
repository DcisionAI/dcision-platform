import { MCP } from '../mcp/types';
import { supabase } from '../utils/supabase';
import { ValidationError } from '../errors/ValidationError';

export class MCPStorage {
  private readonly TABLE_NAME = 'mcps';

  /**
   * Stores a new MCP in the database
   */
  async create(mcp: MCP): Promise<string> {
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .insert([{
        session_id: mcp.sessionId,
        version: mcp.version,
        created: mcp.created,
        last_modified: mcp.lastModified,
        status: mcp.status,
        model: mcp.model,
        context: mcp.context,
        protocol: mcp.protocol
      }])
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to create MCP: ${error.message}`);
    }

    return data.id;
  }

  /**
   * Retrieves an MCP by its session ID
   */
  async getBySessionId(sessionId: string): Promise<MCP | null> {
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error) {
      throw new Error(`Failed to retrieve MCP: ${error.message}`);
    }

    if (!data) return null;

    return this.mapToMCP(data);
  }

  /**
   * Updates an existing MCP
   */
  async update(mcp: MCP): Promise<void> {
    const { error } = await supabase
      .from(this.TABLE_NAME)
      .update({
        version: mcp.version,
        last_modified: mcp.lastModified,
        status: mcp.status,
        model: mcp.model,
        context: mcp.context,
        protocol: mcp.protocol
      })
      .eq('session_id', mcp.sessionId);

    if (error) {
      throw new Error(`Failed to update MCP: ${error.message}`);
    }
  }

  /**
   * Deletes an MCP by its session ID
   */
  async delete(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from(this.TABLE_NAME)
      .delete()
      .eq('session_id', sessionId);

    if (error) {
      throw new Error(`Failed to delete MCP: ${error.message}`);
    }
  }

  /**
   * Lists all MCPs with optional filtering and pagination
   */
  async list(options: {
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ mcps: MCP[]; total: number }> {
    let query = supabase
      .from(this.TABLE_NAME)
      .select('*', { count: 'exact' });

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to list MCPs: ${error.message}`);
    }

    return {
      mcps: data.map(this.mapToMCP),
      total: count || 0
    };
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
