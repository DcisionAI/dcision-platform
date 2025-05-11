import React, { useState, useEffect } from 'react';

interface Connector {
  /** Unique connector identifier */
  id: string;
  /** Human-readable connector name */
  name: string;
  /** Optional icon URL for the connector */
  icon?: string;
  /** Optional category/grouping for the connector */
  category?: string;
}

interface ConfigEntry {
  id: string;
  config: any;
}

export default function DataPluginsPage() {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [configs, setConfigs] = useState<ConfigEntry[]>([]);
  const [search, setSearch] = useState<string>('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editCredentials, setEditCredentials] = useState<string>('{}');
  const [editConfig, setEditConfig] = useState<string>('{}');
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});

  const gradients = [
    'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)', // blue
    'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)', // pink/purple
    'linear-gradient(135deg, #fceabb 0%, #f8b500 100%)', // yellow
    'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)', // green
    'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)', // purple/blue
  ];

  // Helper: default config templates per connector type
  const getTemplateForConnector = (id: string): any => {
    const base = { readOnly: true };
    switch (id) {
      case 'supabase':
        return { ...base };
      case 'bigquery':
        return {
          ...base,
          displayName: '',
          description: '',
          labels: {},
          connectorVersion: '',
          bigquery: {
            projectId: '',
            credentials: {}
          }
        };
      case 'cloud_storage':
        return {
          ...base,
          displayName: '',
          description: '',
          labels: {},
          connectorVersion: '',
          cloudStorage: {
            bucket: '',
            credentials: {}
          }
        };
      case 'cloud_sql':
        return {
          ...base,
          displayName: '',
          description: '',
          labels: {},
          connectorVersion: '',
          gcpCloudsql: {
            cloudSqlId: '',
            type: 'MYSQL',
            database: '',
            username: '',
            password: ''
          }
        };
      case 'pubsub':
        return {
          ...base,
          displayName: '',
          description: '',
          labels: {},
          connectorVersion: '',
          pubsub: {
            topic: '',
            subscription: ''
          }
        };
      default:
        return {};
    }
  };
  // Fetch available connectors
  useEffect(() => {
    fetch('/api/connectors')
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          console.log(data);
          setConnectors(data);
        } else {
          console.error('Invalid connectors response:', data);
          setConnectors([]);
        }
      })
      .catch((e) => {
        console.error('Failed to load connectors:', e);
        setConnectors([]);
      });
  }, []);

  // Fetch saved configs
  const loadConfigs = () => {
    fetch('/api/connectors/config')
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          // Always include Supabase as a configured connector
          const hasSupabase = data.some((cfg: any) => cfg.id === 'supabase');
          const merged = hasSupabase ? data : [...data, { id: 'supabase', config: {} }];
          setConfigs(merged as ConfigEntry[]);
        } else {
          console.error('Invalid connector configs response:', data);
          setConfigs([{ id: 'supabase', config: {} }]);
        }
      })
      .catch((e) => {
        console.error('Failed to load connector configs:', e);
        // Even on error, show Supabase proxy test
        setConfigs([{ id: 'supabase', config: {} }]);
      });
  };
  useEffect(loadConfigs, []);

  const filtered = connectors.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );
  const [page, setPage] = useState<number>(1);
  // Show more cards per page to reduce scrolling
  const pageSize = 20;
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  /**
   * Save connector configuration. For GCP connectors (non-supabase), first create the connector,
   * then persist the config to Supabase.
   */
  const handleSave = async (id: string) => {
    try {
      const cfg = JSON.parse(editConfig);
      const creds = JSON.parse(editCredentials);
      // Call our unified plugin configure endpoint
      const res = await fetch(`/api/plugins/${id}/configure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configParams: cfg, credentials: creds }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setEditing(null);
      loadConfigs();
      alert('Plugin configured successfully');
    } catch (e: any) {
      alert(e.message || 'Invalid JSON or API error');
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/connectors/config?id=${id}`, { method: 'DELETE' });
    loadConfigs();
  };

  const handleTest = async (id: string, cfg: any) => {
    setTestingId(id);
    const res = await fetch('/api/connectors/test', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, config: cfg })
    });
    const data = await res.json();
    setTestResults(prev => ({ ...prev, [id]: data.success }));
    setTestingId(null);
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Data Plugins</h1>
      {/* Search & connector cards */}
      <div className="p-4 bg-docs-section border rounded space-y-4">
        <input
          type="text"
          placeholder="Search plugins..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="w-full p-2 bg-docs-section border border-docs-section-border rounded text-docs-text placeholder-docs-muted focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        />
        {/* Card grid: adjust columns and gaps to fit more cards */}
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-1">
          {paged.map((c, idx) => {
            const isConfigured = configs.some(cfg => cfg.id === c.id);
            const gradient = gradients[idx % gradients.length];
            return (
              <div
                key={c.id}
                className="rounded-lg shadow flex flex-col items-center overflow-hidden transition-shadow duration-200 ease-in-out hover:shadow-xl"
                style={{ background: gradient, maxWidth: '150px', minWidth: '0', padding: '6px 0', fontFamily: `'OpenAI Sans', 'Inter', ui-sans-serif, system-ui, sans-serif` }}
              >
                <div className="flex items-center justify-center aspect-square w-full">
                  {c.icon ? (
                    <img
                      src={c.icon}
                      alt={c.name}
                      className="max-h-10 max-w-[60%] object-contain"
                      style={{ backgroundColor: 'transparent' }}
                    />
                  ) : (
                    <div className="text-lg font-bold text-white">{c.name.charAt(0)}</div>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-between p-1">
                  <h3 className="text-xs font-bold text-black truncate w-full text-center">{c.name}</h3>
                  <h4 className="text-[10px] font-normal mb-1 truncate w-full text-center" style={{ color: '#222', fontFamily: `'OpenAI Sans', 'Inter', ui-sans-serif, system-ui, sans-serif` }}>{c.category}</h4>
                  <div className="mt-auto">
                    {isConfigured ? (
                      <button
                        className="px-2 py-0.5 bg-red-600 text-white text-[10px] rounded hover:bg-red-700 transition"
                        onClick={() => handleDelete(c.id)}
                      >Delete</button>
                    ) : (
                      <button
                        className="px-2 py-0.5 bg-blue-600 text-white text-[10px] rounded hover:bg-blue-700 transition"
                        onClick={() => {
                          setEditing(c.id);
                          // Pre-fill JSON config template for this connector type
                          setEditConfig(JSON.stringify(getTemplateForConnector(c.id), null, 2));
                        }}
                      >Configure</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center space-x-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 bg-docs-sidebar-active text-docs-accent rounded disabled:opacity-50"
            >Prev</button>
            <span className="px-2 py-1">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 bg-docs-sidebar-active text-docs-accent rounded disabled:opacity-50"
            >Next</button>
          </div>
        )}
      </div>
      {/* Edit panel */}
      {editing && (
        <div className="p-4 bg-docs-section border rounded space-y-4">
          <h2 className="font-medium">Configure {editing}</h2>
          <div className="space-y-1">
            <label className="text-sm font-semibold">Credentials (Service Account JSON)</label>
            <textarea
              className="w-full h-32 p-2 border rounded font-mono text-sm"
              value={editCredentials}
              onChange={e => setEditCredentials(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold">Config Parameters (Connector Config)</label>
            <textarea
              className="w-full h-32 p-2 border rounded font-mono text-sm"
              value={editConfig}
              onChange={e => setEditConfig(e.target.value)}
            />
          </div>
          <div className="flex space-x-2">
            <button
              className="px-3 py-1 bg-green-600 text-white rounded"
              onClick={() => handleSave(editing)}
            >Save</button>
            <button
              className="px-3 py-1 bg-gray-300 rounded"
              onClick={() => setEditing(null)}
            >Cancel</button>
          </div>
        </div>
      )}
      {/* Configured list */}
      <div className="p-4 bg-docs-section border rounded">
        <h2 className="text-lg font-medium mb-2">Configured Connectors</h2>
        <ul className="space-y-2">
          {configs.map(cfg => (
            <li key={cfg.id} className="flex justify-between items-center space-x-2">
              <span className="font-medium">{cfg.id}</span>
              {cfg.config?.readOnly && (
                <span className="text-xs text-gray-500">Read-only</span>
              )}
              {!cfg.config?.readOnly && (
                <span className="text-xs text-green-600">Read/Write</span>
              )}
              <div className="space-x-2">
                <button
                  className="text-blue-600 text-sm"
                  onClick={() => {
                    setEditing(cfg.id);
                    setEditConfig(JSON.stringify(cfg.config, null, 2));
                  }}
                >Edit</button>
                <button
                  className="text-yellow-600 text-sm"
                  onClick={() => handleTest(cfg.id, cfg.config)}
                  disabled={testingId === cfg.id}
                >
                  {testingId === cfg.id ? 'Testing...' : 'Test'}
                </button>
                {testResults[cfg.id] != null && (
                  <span className={`text-sm ${testResults[cfg.id] ? 'text-green-600' : 'text-red-600'}`}>
                    {testResults[cfg.id] ? 'OK' : 'Fail'}
                  </span>
                )}
              </div>
            </li>
          ))}
          {configs.length === 0 && <li className="text-docs-muted">No connectors configured.</li>}
        </ul>
      </div>
    </div>
  );
}