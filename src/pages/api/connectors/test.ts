import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleAuth } from 'google-auth-library';

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
    // body already destructured above
    const projectId = process.env.GCLOUD_PROJECT || process.env.NEXT_PUBLIC_PROJECT_ID;
    const region = process.env.GCP_REGION || 'us-central1';
    if (!projectId) {
      throw new Error('GCLOUD_PROJECT env var is required');
    }
    const name = `projects/${projectId}/locations/${region}/connectors/${id}`;
    const endpoint = `https://connectors.googleapis.com/v1/${name}:test`;
    const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
    const client = await auth.getClient();
    const response = await client.request({ url: endpoint, method: 'POST', data: config });
    if (response.status === 200) {
      return res.status(200).json({ success: true, details: response.data });
    }
    return res.status(response.status).json({ success: false, details: response.data });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e.message });
  }
}