export interface ConnectionConfig {
  name: string;
  source: {
    type: string;
    [key: string]: any;
  };
  destination: {
    type: string;
    [key: string]: any;
  };
  schedule?: {
    cron: string;
    timezone: string;
  };
  normalization?: {
    enabled: boolean;
    config?: Record<string, any>;
  };
}

export interface Connection {
  id: string;
  name: string;
  status: string;
  source: {
    type: string;
    [key: string]: any;
  };
  destination: {
    type: string;
    [key: string]: any;
  };
  metadata: {
    createdBy: string;
    createdAt: string;
    version: string;
  };
}

export interface SyncResult {
  id: string;
  connectionId: string;
  status: 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  error?: string;
  metadata: {
    service: string;
    version: string;
  };
}

export interface Connector {
  id: string;
  name: string;
  type: 'source' | 'destination';
  version: string;
  documentationUrl?: string;
}

export interface Driver {
  id: string;
  name: string;
  license: string;
  status: string;
} 