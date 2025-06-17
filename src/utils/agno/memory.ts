import { SqliteStorage } from 'agno';

export interface MemoryContext {
  sessionId: string;
  timestamp: string;
  type: string;
  data: any;
  metadata?: Record<string, any>;
}

export class MemoryManager {
  private storage: SqliteStorage;

  constructor(tableName: string) {
    this.storage = new SqliteStorage({
      table_name: tableName,
      db_file: 'tmp/construction_agent.db'
    });
  }

  async saveContext(context: MemoryContext): Promise<void> {
    await this.storage.set(
      `${context.sessionId}:${context.timestamp}`,
      JSON.stringify(context)
    );
  }

  async getContext(sessionId: string, type?: string): Promise<MemoryContext[]> {
    const keys = await this.storage.keys();
    const contexts: MemoryContext[] = [];

    for (const key of keys) {
      if (key.startsWith(sessionId)) {
        const value = await this.storage.get(key);
        if (value) {
          const context = JSON.parse(value) as MemoryContext;
          if (!type || context.type === type) {
            contexts.push(context);
          }
        }
      }
    }

    return contexts.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  async clearContext(sessionId: string): Promise<void> {
    const keys = await this.storage.keys();
    for (const key of keys) {
      if (key.startsWith(sessionId)) {
        await this.storage.delete(key);
      }
    }
  }

  async getLatestContext(sessionId: string, type?: string): Promise<MemoryContext | null> {
    const contexts = await this.getContext(sessionId, type);
    return contexts.length > 0 ? contexts[contexts.length - 1] : null;
  }
}

// Create memory managers for each agent type
export const intentMemory = new MemoryManager('construction_intent_memory');
export const dataMemory = new MemoryManager('construction_data_memory');
export const modelMemory = new MemoryManager('construction_model_memory');
export const explainMemory = new MemoryManager('construction_explain_memory'); 