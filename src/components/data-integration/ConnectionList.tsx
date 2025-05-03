import { useEffect, useState } from 'react';

interface Connection {
  connectionId: string;
  name: string;
  status: string;
  lastSync?: string;
  // Add more fields as needed
}

export default function ConnectionList() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/airbyte', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'list_connections' })
    })
      .then(res => res.json())
      .then(data => {
        setConnections(data.connections || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load connections');
        setLoading(false);
      });
  }, []);

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Your Data Connections</h2>
      {loading && <div className="text-docs-muted py-4">Loading connections...</div>}
      {error && <div className="text-red-600 py-4">{error}</div>}
      {!loading && !error && connections.length === 0 && (
        <div className="text-docs-muted py-4">No connections found.</div>
      )}
      {!loading && !error && connections.length > 0 && (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-docs-bg border-b border-docs-border">
              <th className="text-left py-2 px-4">Name</th>
              <th className="text-left py-2 px-4">Status</th>
              <th className="text-left py-2 px-4">Last Sync</th>
              <th className="py-2 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {connections.map(conn => (
              <tr key={conn.connectionId} className="border-b border-docs-border">
                <td className="py-2 px-4 font-medium">{conn.name}</td>
                <td className="py-2 px-4">{conn.status}</td>
                <td className="py-2 px-4">{conn.lastSync || '-'}</td>
                <td className="py-2 px-4 flex gap-2">
                  <button className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600" disabled>
                    Sync Now
                  </button>
                  <button className="bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300" disabled>
                    View History
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
} 