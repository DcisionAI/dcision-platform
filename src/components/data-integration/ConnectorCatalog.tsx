import { useEffect, useState } from 'react';

interface Connector {
  sourceDefinitionId: string;
  name: string;
  icon: string;
  documentationUrl?: string;
  dockerRepository?: string;
  releaseStage?: string;
  resourceRequirements?: any;
  // Add more fields as needed
}

interface ConnectorCatalogProps {
  onSelect?: (connector: Connector) => void;
}

export default function ConnectorCatalog({ onSelect }: ConnectorCatalogProps) {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch('/api/airbyte?type=source')
      .then(res => res.json())
      .then(data => {
        setConnectors(data.sourceDefinitions || []);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load connectors');
        setLoading(false);
      });
  }, []);

  const filtered = connectors.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <input
          type="text"
          placeholder="Search connectors..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-md rounded-md border border-docs-border px-3 py-2 text-docs-text bg-docs-bg focus:outline-none focus:ring-2 focus:ring-docs-accent"
        />
      </div>
      {loading && (
        <div className="text-center text-docs-muted py-8">Loading connectors...</div>
      )}
      {error && (
        <div className="text-center text-red-600 py-8">{error}</div>
      )}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filtered.map(connector => (
            <button
              key={connector.sourceDefinitionId}
              onClick={() => onSelect?.(connector)}
              className="flex flex-col items-center p-6 bg-docs-section border border-docs-section-border shadow-sm rounded-xl hover:bg-docs-section/80 transition-colors focus:outline-none"
            >
              <img
                src={connector.icon}
                alt={connector.name}
                className="h-12 w-12 mb-3 rounded-full bg-gray-100 object-contain"
                onError={e => (e.currentTarget.style.display = 'none')}
              />
              <div className="font-semibold text-docs-heading text-lg mb-1">{connector.name}</div>
              {connector.documentationUrl && (
                <a
                  href={connector.documentationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 text-xs text-docs-accent underline"
                >
                  Docs
                </a>
              )}
            </button>
          ))}
        </div>
      )}
      {!loading && !error && filtered.length === 0 && (
        <div className="text-center text-docs-muted py-8">No connectors found.</div>
      )}
    </div>
  );
} 