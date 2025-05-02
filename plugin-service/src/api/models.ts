export interface DataSourceConfig {
  type: string;
  name: string;
  config: Record<string, any>;
}

export interface DataDestinationConfig {
  type: string;
  name: string;
  config: Record<string, any>;
}

export interface DataPipeline {
  id: string;
  source: DataSourceConfig;
  destination: DataDestinationConfig;
  status: string;
  lastSync: string;
}

export interface PipelineStatus {
  id: string;
  status: string;
  lastSync: string;
  nextSync: string;
}

export interface SyncResult {
  id: string;
  pipelineId: string;
  status: 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  error?: string;
  metadata: {
    service: string;
    version: string;
  };
}

export interface Driver {
  id: string;
  name: string;
  license: string;
  status: string;
}

export interface DataConnector {
  id: string;
  name: string;
  type: 'source' | 'destination';
  version: string;
  documentationUrl?: string;
} 