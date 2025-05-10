import React, { useState, useEffect } from 'react';

interface Connector {
  id: string;
  name: string;
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
      {/* Search & list */}
      <div className="p-4 bg-docs-section border rounded">
        <input
          type="text"
          placeholder="Search connectors..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
        />
        <ul className="space-y-2">
          {filtered.map(c => (
            <li key={c.id} className="flex justify-between items-center">
              <span>{c.name}</span>
              {configs.find(cfg => cfg.id === c.id) ? (
                <button
                  className="text-red-600 text-sm"
                  onClick={() => handleDelete(c.id)}
                >Delete</button>
              ) : (
                <button
                  className="text-blue-600 text-sm"
                  onClick={() => {
                    setEditing(c.id);
                    setEditConfig('{}');
                  }}
                >Configure</button>
              )}
            </li>
          ))}
        </ul>
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