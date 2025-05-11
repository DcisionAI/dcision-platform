import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleAuth } from 'google-auth-library';

// Create a new GCP Connector resource
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  const { id, config } = req.body;
  if (!id || !config) {
    return res.status(400).json({ error: 'Connector id and config are required' });
  }
  try {
    // Determine GCP project and region
    const projectId = process.env.GCLOUD_PROJECT || process.env.NEXT_PUBLIC_PROJECT_ID;
    const region = process.env.GCP_REGION || 'us-central1';
    if (!projectId) {
      throw new Error('GCLOUD_PROJECT env var is required');
    }
    // Build the create endpoint URL
    const parent = `projects/${projectId}/locations/${region}`;
    const endpoint =
      `https://connectors.googleapis.com/v1/${parent}/connectors` +
      `?connectorId=${encodeURIComponent(id)}`;
    // Authenticate with GCP, use SA key if provided, else fall back to ADC
    const saKey = process.env.GCP_SA_KEY;
    const auth = new GoogleAuth({
      credentials: saKey ? JSON.parse(saKey) : undefined,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    const client = await auth.getClient();
    // Call the Connectors API to create the connector
    const response = await client.request({
      url: endpoint,
      method: 'POST',
      data: config,
    });
    // Return the long-running operation resource
    return res.status(200).json({ success: true, operation: response.data });
  } catch (e: any) {
    console.error('Connector create error:', e);
    return res.status(500).json({ success: false, error: e.message });
  }
}