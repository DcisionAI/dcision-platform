import type { NextApiRequest, NextApiResponse } from 'next'

// Fallback static list of connector types if API call fails
const staticConnectorTypes = [
  { id: 'bigquery', name: 'BigQuery' },
  { id: 'cloud_storage', name: 'Cloud Storage' },
  { id: 'cloud_sql', name: 'Cloud SQL' },
  { id: 'pubsub', name: 'Pub/Sub' }
];

import { GoogleAuth } from 'google-auth-library';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  try {
    const projectId = process.env.GCLOUD_PROJECT || process.env.NEXT_PUBLIC_PROJECT_ID;
    if (!projectId) {
      throw new Error('GCLOUD_PROJECT or NEXT_PUBLIC_PROJECT_ID env var is required');
    }
    // List all connector types across all providers in global location
    const url = `https://connectors.googleapis.com/v1/projects/${projectId}/locations/global/providers/-/connectors`;
    const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
    const client = await auth.getClient();
    // Call Google Integration Connectors API
    // Call Google Integration Connectors API
    const resp = await client.request({ url, method: 'GET' });
    const data = (resp as any).data;
    // Parse the connectors array from the response
    const items: any[] = data?.connectors || [];
    const list = items.map((c: any) => {
      // Connector resource name is projects/{p}/locations/{r}/connectors/{id}
      const name = c.name || '';
      const parts = name.split('/');
      const id = parts[parts.length - 1] || name;
      return { id, name: c.displayName || id };
    });
    return res.status(200).json(list);
  } catch (error: any) {
    console.error('Failed to list connector types:', error.message || error);
    // Fallback to static types
    return res.status(200).json(staticConnectorTypes);
  }
}