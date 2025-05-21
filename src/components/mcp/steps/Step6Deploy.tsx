import React, { useState } from 'react';
import { mockEndpoints, Endpoint } from '@/pages/endpoints';
import Button from '@/components/ui/Button';

const Step6Deploy: React.FC = () => {
  const [deploying, setDeploying] = useState(false);
  const [endpointUrl, setEndpointUrl] = useState<string>('');
  // Endpoint management state
  const [endpoints, setEndpoints] = useState<Endpoint[]>(mockEndpoints);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Add deployed endpoint to list
  const onDeployed = (url: string) => {
    const id = `ep-${Date.now()}`;
    const newEp: Endpoint = {
      id,
      name: 'MCP Endpoint',
      description: 'Your deployed MCP model endpoint.',
      status: 'active',
      lastDeployed: new Date().toISOString(),
      url,
      requests: 0,
      latency: 0,
      mcpConfig: {
        context: { domain: 'fleet_routing', description: '', examples: [] },
        model: { type: 'gpt-4', temperature: 0, maxTokens: 0 },
        protocol: { inputFormat: { type: 'json', schema: {}, validation: {} }, outputFormat: { type: 'json', schema: {} }, errorHandling: { retryStrategy: 'none', maxRetries: 0, fallbackBehavior: 'fail' } },
        prompts: { system: '', examples: [], validation: '' }
      }
    };
    setEndpoints(prev => [...prev, newEp]);
    setSelectedId(id);
  };
  const handleDeploy = async () => {
    setDeploying(true);
    // TODO: call deploy API
    setTimeout(() => {
      const url = 'https://api.your-domain.com/mcp/execute';
      setEndpointUrl(url);
      onDeployed(url);
      setDeploying(false);
    }, 1500);
  };
  return (
    <div className="flex h-full">
      {/* Sidebar: list of endpoints */}
      <div className="w-64 border-r border-gray-200 bg-white dark:bg-gray-800 overflow-y-auto">
        <div className="p-4">
          <h2 className="text-lg font-bold text-docs-heading mb-4">Endpoints</h2>
          <button
            onClick={() => endpointUrl && onDeployed(endpointUrl)}
            disabled={!endpointUrl}
            className="mb-4 w-full px-3 py-2 text-sm font-medium bg-green-500 hover:bg-green-600 text-white rounded-md disabled:opacity-50 transition-colors"
          >
            Add Deployed Endpoint
          </button>
          <nav className="space-y-2">
            {endpoints.map(ep => (
              <button
                key={ep.id}
                onClick={() => setSelectedId(ep.id)}
                className={`w-full text-left p-2 rounded ${selectedId === ep.id ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{ep.name}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 truncate">{ep.url}</div>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content: details of selected endpoint */}
      <div className="flex-1 p-6 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        <h2 className="text-xl font-bold text-docs-heading mb-2">Step 6: Deploy</h2>
        <Button
          onClick={handleDeploy}
          disabled={deploying}
          variant="primary"
          size="sm"
          className="mb-4"
        >
          {deploying ? 'Deploying...' : 'Deploy Endpoint'}
        </Button>
        {endpointUrl && (
          <p className="text-blue-600 mb-4">
            Your endpoint is live at:{' '}
            <a href={endpointUrl} target="_blank" rel="noopener noreferrer" className="underline">
              {endpointUrl}
            </a>
          </p>
        )}
        {selectedId ? (
          (() => {
            const ep = endpoints.find(e => e.id === selectedId)!;
            return (
              <div>
                <h3 className="text-base font-semibold mb-1 text-docs-heading">{ep.name}</h3>
                <p className="text-sm text-docs-text mb-1">{ep.description}</p>
                <p className="text-blue-600 text-sm mb-2">
                  URL:{' '}
                  <a href={ep.url} target="_blank" rel="noopener noreferrer" className="underline">
                    {ep.url}
                  </a>
                </p>
                <h4 className="text-sm font-semibold mb-1 text-docs-heading">MCP Config Preview</h4>
                <pre className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                  {JSON.stringify(ep.mcpConfig, null, 2)}
                </pre>
              </div>
            );
          })()
        ) : (
          <div className="text-gray-600 dark:text-gray-400">
            No endpoint selected. Use the sidebar to view a deployed endpoint or click "Add Deployed Endpoint".
          </div>
        )}
      </div>
    </div>
  );
};

export default Step6Deploy;