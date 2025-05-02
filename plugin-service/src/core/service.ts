import { DataSourceConfig, DataDestinationConfig, DataPipeline, PipelineStatus } from '../api/models';

export class DcisionAIDataService {
  private pipelines: Map<string, DataPipeline> = new Map();

  constructor() {
    // Initialize with some mock data for testing
    this.pipelines.set('test-1', {
      id: 'test-1',
      source: { type: 'test', name: 'Test Source', config: {} },
      destination: { type: 'test', name: 'Test Destination', config: {} },
      status: 'active',
      lastSync: new Date().toISOString()
    });
  }

  async createPipeline(source: DataSourceConfig, destination: DataDestinationConfig): Promise<DataPipeline> {
    const id = `pipeline-${Date.now()}`;
    const pipeline: DataPipeline = {
      id,
      source,
      destination,
      status: 'active',
      lastSync: new Date().toISOString()
    };
    this.pipelines.set(id, pipeline);
    return pipeline;
  }

  async syncPipeline(id: string): Promise<{ status: string; message: string }> {
    const pipeline = this.pipelines.get(id);
    if (!pipeline) {
      throw new Error(`Pipeline ${id} not found`);
    }
    pipeline.lastSync = new Date().toISOString();
    return { status: 'success', message: `Pipeline ${id} synced successfully` };
  }

  async getPipelineStatus(id: string): Promise<PipelineStatus> {
    const pipeline = this.pipelines.get(id);
    if (!pipeline) {
      throw new Error(`Pipeline ${id} not found`);
    }
    return {
      id,
      status: pipeline.status,
      lastSync: pipeline.lastSync,
      nextSync: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
    };
  }

  async listConnectors(): Promise<Array<{ id: string; name: string; type: string }>> {
    return [
      { id: 'test-source', name: 'Test Source', type: 'source' },
      { id: 'test-destination', name: 'Test Destination', type: 'destination' }
    ];
  }

  async getDrivers(limit: number = 10): Promise<Array<{ id: string; name: string; license: string; status: string }>> {
    return Array.from({ length: limit }, (_, i) => ({
      id: `driver-${i + 1}`,
      name: `Driver ${i + 1}`,
      license: `LIC-${i + 1}`,
      status: i % 2 === 0 ? 'active' : 'inactive'
    }));
  }
} 