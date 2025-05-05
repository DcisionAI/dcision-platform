import type { NextApiRequest, NextApiResponse } from 'next';

// Default to local Airbyte open-source API endpoint if not explicitly set
const AIRBYTE_API_URL = process.env.AIRBYTE_API_URL || 'http://localhost:8000';
const AIRBYTE_API_KEY = process.env.AIRBYTE_API_KEY;
const AIRBYTE_WORKSPACE_ID = process.env.AIRBYTE_WORKSPACE_ID; // optional default workspace

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Ensure the URL is defined (defaults to localhost in dev)
  if (!AIRBYTE_API_URL) {
    return res.status(500).json({ error: 'Airbyte API URL is not configured or defaulted' });
  }

  // Proxy GET /api/airbyte?type=source|destination
  if (req.method === 'GET') {
    const { type } = req.query;
    let endpoint = '';
    if (type === 'source') {
      endpoint = '/api/v1/source_definitions/list';
    } else if (type === 'destination') {
      endpoint = '/api/v1/destination_definitions/list';
    } else {
      return res.status(400).json({ error: 'Invalid type parameter' });
    }

    try {
      const airbyteRes = await fetch(`${AIRBYTE_API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(AIRBYTE_API_KEY ? { 'Authorization': `Bearer ${AIRBYTE_API_KEY}` } : {})
        },
        body: JSON.stringify({})
      });
      const data = await airbyteRes.json();
      return res.status(200).json(data);
    } catch (error) {
      console.error('Airbyte proxy error (GET):', error);
      if (process.env.NODE_ENV === 'development') {
        // In local dev, return empty list stub
        if (type === 'source') {
          return res.status(200).json({ sourceDefinitions: [] });
        } else {
          return res.status(200).json({ destinationDefinitions: [] });
        }
      }
      return res.status(500).json({ error: 'Failed to fetch from Airbyte API', details: (error as Error).message });
    }
  }

  // POST: test connection, get spec, create connection, list connections
  if (req.method === 'POST') {
    // Development stubs: avoid needing real Airbyte server for local dev
    if (process.env.NODE_ENV === 'development') {
      const { action, sourceDefinitionId, connectionConfiguration } = req.body;
      switch (action) {
        case 'test_connection':
          return res.status(200).json({ status: 'succeeded' });
        case 'get_spec':
          return res.status(200).json({ connectionSpecification: { properties: {}, required: [] } });
        case 'create_connection':
          return res.status(200).json({
            sourceId: 'demo-source-id',
            name: req.body.name ?? 'demo',
            sourceDefinitionId,
            connectionConfiguration
          });
        case 'list_connections':
          return res.status(200).json({ connections: [] });
        default:
          break;
      }
    }
    const { action } = req.body;
    if (action === 'test_connection') {
      // Test connection for a source
      // Expects: { action: 'test_connection', sourceDefinitionId, connectionConfiguration }
      const { sourceDefinitionId, connectionConfiguration } = req.body;
      if (!sourceDefinitionId || !connectionConfiguration) {
        return res.status(400).json({ error: 'Missing sourceDefinitionId or connectionConfiguration' });
      }
      try {
        const airbyteRes = await fetch(`${AIRBYTE_API_URL}/api/v1/sources/check_connection`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(AIRBYTE_API_KEY ? { 'Authorization': `Bearer ${AIRBYTE_API_KEY}` } : {})
          },
          body: JSON.stringify({
            sourceDefinitionId,
            connectionConfiguration
          })
        });
        const data = await airbyteRes.json();
        return res.status(200).json(data);
      } catch (error) {
        return res.status(500).json({ error: 'Failed to test connection', details: (error as Error).message });
      }
    }
    if (action === 'get_spec') {
      // Fetch connector spec
      // Expects: { action: 'get_spec', sourceDefinitionId }
      const { sourceDefinitionId } = req.body;
      if (!sourceDefinitionId) {
        return res.status(400).json({ error: 'Missing sourceDefinitionId' });
      }
      try {
        const airbyteRes = await fetch(`${AIRBYTE_API_URL}/api/v1/source_definition_specifications/get`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(AIRBYTE_API_KEY ? { 'Authorization': `Bearer ${AIRBYTE_API_KEY}` } : {})
          },
          body: JSON.stringify({
            sourceDefinitionId
          })
        });
        const data = await airbyteRes.json();
        return res.status(200).json(data);
      } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch connector spec', details: (error as Error).message });
      }
    }
    if (action === 'create_connection') {
      // Create a source and connection in Airbyte
      // Expects: { action: 'create_connection', sourceDefinitionId, connectionConfiguration, name, workspaceId }
      const { sourceDefinitionId, connectionConfiguration, name, workspaceId } = req.body;
      if (!sourceDefinitionId || !connectionConfiguration || !name) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      const wsId = workspaceId || AIRBYTE_WORKSPACE_ID;
      if (!wsId) {
        return res.status(400).json({ error: 'Missing workspaceId' });
      }
      try {
        // 1. Create source
        const sourceRes = await fetch(`${AIRBYTE_API_URL}/api/v1/sources/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(AIRBYTE_API_KEY ? { 'Authorization': `Bearer ${AIRBYTE_API_KEY}` } : {})
          },
          body: JSON.stringify({
            sourceDefinitionId,
            connectionConfiguration,
            name,
            workspaceId: wsId
          })
        });
        const sourceData = await sourceRes.json();
        if (!sourceData.sourceId) {
          return res.status(500).json({ error: 'Failed to create source', details: sourceData });
        }
        // 2. (Optional) Create destination here if needed
        // 3. (MVP) Return sourceId and metadata
        return res.status(200).json({
          sourceId: sourceData.sourceId,
          name: sourceData.name,
          sourceDefinitionId: sourceData.sourceDefinitionId,
          connectionConfiguration: sourceData.connectionConfiguration
        });
      } catch (error) {
        return res.status(500).json({ error: 'Failed to create connection', details: (error as Error).message });
      }
    }
    if (action === 'list_connections') {
      // List all connections for the workspace/user
      // Expects: { action: 'list_connections', workspaceId }
      const { workspaceId } = req.body;
      const wsId = workspaceId || AIRBYTE_WORKSPACE_ID;
      if (!wsId) {
        return res.status(400).json({ error: 'Missing workspaceId' });
      }
      try {
        const airbyteRes = await fetch(`${AIRBYTE_API_URL}/api/v1/connections/list`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(AIRBYTE_API_KEY ? { 'Authorization': `Bearer ${AIRBYTE_API_KEY}` } : {})
          },
          body: JSON.stringify({ workspaceId: wsId })
        });
        const data = await airbyteRes.json();
        return res.status(200).json(data);
      } catch (error) {
        return res.status(500).json({ error: 'Failed to list connections', details: (error as Error).message });
      }
    }
    return res.status(400).json({ error: 'Invalid action' });
  }

  // Future: handle POST for creating connections, etc.
  return res.status(405).json({ error: 'Method not allowed' });
} 