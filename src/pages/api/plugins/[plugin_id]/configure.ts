import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { GoogleAuth } from 'google-auth-library';
// TODO: replace stub vault with GCP Secret Manager or other secure store

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  // Initialize Supabase client with auth context
  const supabase = createServerSupabaseClient({ req, res });
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const userId = user.id;
  // Extract plugin and payload
  const pluginId = req.query.plugin_id as string;
  const { configParams, credentials } = req.body;
  if (!pluginId || !configParams || !credentials) {
    return res.status(400).json({ error: 'plugin_id, configParams and credentials are required' });
  }
  try {
    // Read GCP project/region from env
    const projectId = process.env.GCLOUD_PROJECT || process.env.NEXT_PUBLIC_PROJECT_ID;
    const region = process.env.GCP_REGION || 'us-central1';
    if (!projectId) throw new Error('GCLOUD_PROJECT env var is required');

    // STUB: store credentials securely (vault integration required)
    // For now, we store the JSON string as authTokenRef; replace with real vault key
    const authTokenRef = JSON.stringify(credentials);

    // Create GCP Connector resource
    const auth = new GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
    const client = await auth.getClient();
    const parent = `projects/${projectId}/locations/${region}`;
    const url =
      `https://connectors.googleapis.com/v1/${parent}/connectors?connectorId=${encodeURIComponent(
        pluginId
      )}`;
    const response: any = await client.request({ url, method: 'POST', data: configParams });
    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Connector create failed: HTTP ${response.status}`);
    }
    const connectionId = response.data.name || '';

    // Persist connection record
    const { error: dbError } = await supabase.from('plugin_connections').insert({
      user_id: userId,
      plugin_id: pluginId,
      gcp_connection_id: connectionId,
      config_params: configParams,
      auth_token_ref: authTokenRef,
      status: 'active',
    });
    if (dbError) throw dbError;

    return res.status(200).json({ success: true, connectionId });
  } catch (e: any) {
    console.error('Plugin configure error:', e);
    // Save error state
    try {
      await supabase.from('plugin_connections').insert({
        user_id: userId,
        plugin_id: pluginId,
        gcp_connection_id: null,
        config_params: configParams || {},
        auth_token_ref: null,
        status: 'error',
      });
    } catch {}
    return res.status(500).json({ success: false, error: e.message });
  }
}