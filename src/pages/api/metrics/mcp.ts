import type { NextApiRequest, NextApiResponse } from 'next';
import { MetricServiceClient } from '@google-cloud/monitoring';

const client = new MetricServiceClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const projectId = process.env.GCP_PROJECT || 'dcisionai';
  const serviceName = 'mcp-service';
  const now = new Date();
  const minutes = 60;
  const start = new Date(now.getTime() - minutes * 60 * 1000);

  try {
    // Request Count
    const [requestCountSeries] = await client.listTimeSeries({
      name: client.projectPath(projectId),
      filter: `metric.type="run.googleapis.com/request_count" AND resource.labels.service_name="${serviceName}"`,
      interval: {
        startTime: { seconds: Math.floor(start.getTime() / 1000) },
        endTime: { seconds: Math.floor(now.getTime() / 1000) },
      },
      view: 'FULL',
    });

    // Latency (p95)
    const [latencySeries] = await client.listTimeSeries({
      name: client.projectPath(projectId),
      filter: `metric.type="run.googleapis.com/request_latencies" AND resource.labels.service_name="${serviceName}"`,
      interval: {
        startTime: { seconds: Math.floor(start.getTime() / 1000) },
        endTime: { seconds: Math.floor(now.getTime() / 1000) },
      },
      aggregation: {
        alignmentPeriod: { seconds: 60 },
        perSeriesAligner: 'ALIGN_PERCENTILE_95',
      },
      view: 'FULL',
    });

    res.status(200).json({
      requestCount: requestCountSeries,
      latencyP95: latencySeries
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
} 