declare module 'agno' {
  export interface AgentConfig {
    name: string;
    model: string;
    knowledge: any;
    storage: any;
    markdown?: boolean;
    temperature?: number;
  }

  export interface KnowledgeConfig {
    urls?: string[];
    vector_db?: any;
  }

  export interface StorageConfig {
    table_name: string;
    db_file: string;
  }

  export interface EmbedderConfig {
    id: string;
    dimensions: number;
  }

  export interface PineconeStoreConfig {
    client: any;
    indexName: string;
    embedder: any;
  }

  export class Agent {
    constructor(config: AgentConfig);
    chat(prompt: string, options?: { sessionId?: string; context?: any }): Promise<string>;
    knowledge: {
      load: () => Promise<void>;
    };
  }

  export class UrlKnowledge {
    constructor(config: KnowledgeConfig);
    load(): Promise<void>;
  }

  export class OpenAIEmbedder {
    constructor(config: EmbedderConfig);
    embed(text: string): Promise<number[]>;
  }

  export class SqliteStorage {
    constructor(config: StorageConfig);
    save(sessionId: string, data: any): Promise<void>;
    load(sessionId: string): Promise<any>;
    set(key: string, value: any): Promise<void>;
    get(key: string): Promise<any>;
    keys(): Promise<string[]>;
    delete(key: string): Promise<void>;
  }

  export class PineconeStore {
    constructor(config: PineconeStoreConfig);
    upsert(vectors: Array<{ id: string; values: number[]; metadata: any }>): Promise<void>;
    query(vector: number[], topK?: number): Promise<any[]>;
  }
} 