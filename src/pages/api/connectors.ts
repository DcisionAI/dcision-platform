import type { NextApiRequest, NextApiResponse } from 'next'

// Fallback static list of connector types if API call fails (with icon URLs)
const staticConnectorTypes = [
  { id: 'bigquery',      name: 'BigQuery',      icon: 'https://www.gstatic.com/connectors/bigquery.svg' },
  { id: 'cloud_storage', name: 'Cloud Storage', icon: 'https://www.gstatic.com/connectors/cloud_storage.svg' },
  { id: 'cloud_sql',     name: 'Cloud SQL',     icon: 'https://www.gstatic.com/connectors/cloud_sql.svg' },
  { id: 'pubsub',        name: 'Pub/Sub',       icon: 'https://www.gstatic.com/connectors/pubsub.svg' }
];

import { GoogleAuth } from 'google-auth-library';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  try {
    // Try to fetch connector types (global catalog), fallback to connector instances
    const projectId = process.env.GCLOUD_PROJECT || process.env.NEXT_PUBLIC_PROJECT_ID;
    if (!projectId) {
      throw new Error('GCLOUD_PROJECT or NEXT_PUBLIC_PROJECT_ID env var is required');
    }
    const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
    const client = await auth.getClient();
    let items: any[] = [];
    try {
      // Global connectorTypes catalog endpoint under all providers
      const typesUrl = `https://connectors.googleapis.com/v1/projects/${projectId}/locations/global/providers/-/connectorTypes`;
      const resp = await client.request({ url: typesUrl, method: 'GET' });
      const data = (resp as any).data;
      items = Array.isArray(data?.connectorTypes) ? data.connectorTypes : [];
    } catch (_) {
      // Fallback: list connector instances under all providers
      const instUrl = `https://connectors.googleapis.com/v1/projects/${projectId}/locations/global/providers/-/connectors`;
      const resp2 = await client.request({ url: instUrl, method: 'GET' });
      const data2 = (resp2 as any).data;
      items = Array.isArray(data2?.connectors) ? data2.connectors : [];
    }
    // Map each connector type or instance to a uniform object
    const list = items.map((c: any) => {
      // Determine connector id
      let id: string;
      if (c.connectorTypeId) {
        id = c.connectorTypeId;
      } else if (typeof c.name === 'string') {
        const parts = c.name.split('/');
        id = parts[parts.length - 1] || c.name;
      } else {
        id = '';
      }
      const name = c.displayName || c.title || id;
      const icon = c.iconUri || c.iconUrl || `https://www.gstatic.com/connectors/${id}.svg`;
      return { id, name, icon };
    });
    return res.status(200).json(list);
  } catch (error: any) {
    console.error('Failed to list connector types:', error.message || error);
    // Fallback to static types
    return res.status(200).json(staticConnectorTypes);
  }
}