declare module 'agno' {
  export class Agent {
    constructor(config: {
      name: string;
      model?: string;
      knowledge?: UrlKnowledge;
      storage?: SqliteStorage;
      markdown?: boolean;
      temperature?: number;
    });
    chat(prompt: string, options?: { sessionId?: string; context?: Record<string, any> }): Promise<string>;
    knowledge: UrlKnowledge;
  }

  export class UrlKnowledge {
    constructor(config: {
      urls: string[];
      vector_db: PineconeStore;
    });
    load(): Promise<void>;
  }

  export class PineconeStore {
    constructor(config: {
      client: any;
      indexName: string;
      embedder: OpenAIEmbedder;
    });
  }

  export class OpenAIEmbedder {
    constructor(config: {
      id: string;
      dimensions: number;
    });
  }

  export class SqliteStorage {
    constructor(config: {
      table_name: string;
      db_file: string;
    });
    set(key: string, value: string): Promise<void>;
    get(key: string): Promise<string | null>;
    delete(key: string): Promise<void>;
    keys(): Promise<string[]>;
  }
} 