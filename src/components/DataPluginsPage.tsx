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
  const [editConfig, setEditConfig] = useState<string>('{}');
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});

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
          setConfigs(data);
        } else {
          console.error('Invalid connector configs response:', data);
          setConfigs([]);
        }
      })
      .catch((e) => {
        console.error('Failed to load connector configs:', e);
        setConfigs([]);
      });
  };
  useEffect(loadConfigs, []);

  const filtered = connectors.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );
  const [page, setPage] = useState<number>(1);
  // Show more cards per page to reduce scrolling
  const pageSize = 10;
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleSave = async (id: string) => {
    try {
      const cfg = JSON.parse(editConfig);
      await fetch('/api/connectors/config', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, config: cfg })
      });
      setEditing(null);
      loadConfigs();
    } catch (e) {
      alert('Invalid JSON');
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {paged.map(c => {
            const isConfigured = configs.some(cfg => cfg.id === c.id);
            return (
            <div
              key={c.id}
              className="isolate bg-docs-section border border-docs-section-border rounded overflow-hidden flex flex-col"
            >
                {c.icon ? (
                  <img
                    src={c.icon}
                    alt={c.name}
                    className="h-20 w-full object-contain bg-transparent"
                  />
                ) : (
                  <div className="h-20 w-full bg-transparent flex items-center justify-center text-xl">
                    {c.name.charAt(0)}
                  </div>
                )}
                <div className="p-1 flex-1 flex flex-col justify-between">
                  <h3 className="text-base font-medium mb-2 truncate">{c.name}</h3>
                  <h3 className="text-base font-medium mb-2 truncate">{c.category}</h3>
                  <div className="mt-auto space-x-2">
                    {isConfigured ? (
                      <button
                        className="px-2 py-1 bg-red-600 text-white text-xs rounded"
                        onClick={() => handleDelete(c.id)}
                      >Delete</button>
                    ) : (
                      <button
                        className="px-2 py-1 bg-blue-600 text-white text-xs rounded"
                        onClick={() => { setEditing(c.id); setEditConfig('{}'); }}
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
        <div className="p-4 bg-docs-section border rounded">
          <h2 className="font-medium mb-2">Configure {editing}</h2>
          <textarea
            className="w-full h-32 p-2 border rounded font-mono text-sm"
            value={editConfig}
            onChange={e => setEditConfig(e.target.value)}
          />
          <div className="mt-2 space-x-2">
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
            <li key={cfg.id} className="flex justify-between items-center">
              <span>{cfg.id}</span>
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