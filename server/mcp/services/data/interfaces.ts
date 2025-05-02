export interface DataSource {
  name: string;
  type: string;
  config: Record<string, any>;
}

export interface DataServiceConfig {
  connection: {
    host: string;
    port: number;
    database?: string;
  };
  authentication: {
    username: string;
    password: string;
  };
}

export interface DataService {
  connect(config: DataServiceConfig): Promise<void>;
  disconnect(): Promise<void>;
  fetchData(source: DataSource, query: string): Promise<any>;
  validateConnection(): Promise<boolean>;
}

export interface AirbyteService extends DataService {
  syncData(source: DataSource, destination: DataSource): Promise<any>;
  getConnectors(): Promise<string[]>;
  validateConnector(connector: string): Promise<boolean>;
} 