import SettingsLayout from './layout';
import { useState, useEffect } from 'react';
import { KeyIcon, TrashIcon } from '@heroicons/react/24/outline';
import { authFetch } from '@/lib/authFetch';

interface APIKey {
  id: string;
  created_at: string;
}

export default function APIKeysSettings() {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch API keys on mount
  useEffect(() => {
    const fetchKeys = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await authFetch('/api/apikeys');
        if (!res.ok) throw new Error('Failed to fetch API keys');
        const data = await res.json();
        setApiKeys(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchKeys();
  }, []);

  // Create new API key
  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNewKey(null);
    try {
      const res = await authFetch('/api/apikeys', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to create API key');
      const data = await res.json();
      setNewKey(data.apiKey);
      setApiKeys((prev) => [...prev, { id: data.id, created_at: data.created_at }]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete API key
  const handleDeleteKey = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(`/api/apikeys/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete API key');
      setApiKeys((prev) => prev.filter((key) => key.id !== id));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-docs-heading">API Keys</h1>
          <p className="mt-1 text-sm text-docs-muted">
            Manage API keys for accessing DcisionAI services
          </p>
        </div>

        {/* Create New API Key */}
        <div className="bg-docs-section rounded-lg border border-docs-border">
          <div className="p-6">
            <h2 className="text-lg font-medium text-docs-heading mb-4">Create New API Key</h2>
            <form onSubmit={handleCreateKey} className="space-y-4">
              <div>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-docs-accent hover:bg-docs-accent/90"
                  disabled={loading}
                >
                  <KeyIcon className="h-4 w-4 mr-2" />
                  {loading ? 'Creating...' : 'Create API Key'}
                </button>
              </div>
            </form>
            {newKey && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
                <div className="font-mono text-sm text-green-800 break-all">{newKey}</div>
                <div className="text-xs text-green-700 mt-1">
                  Copy this key now. You won&apos;t be able to see it again!
                </div>
              </div>
            )}
            {error && <div className="mt-2 text-red-600 text-sm">{error}</div>}
          </div>
        </div>

        {/* API Keys List */}
        <div className="bg-docs-section rounded-lg border border-docs-border">
          <div className="p-6">
            <h2 className="text-lg font-medium text-docs-heading mb-4">Your API Keys</h2>
            {loading && <div>Loading...</div>}
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <div className="space-y-4">
              {apiKeys.length === 0 && !loading && <div className="text-sm text-docs-muted">No API keys found.</div>}
              {apiKeys.map((apiKey) => (
                <div
                  key={apiKey.id}
                  className="flex items-center justify-between p-4 border border-docs-border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <code className="text-xs font-mono text-docs-muted">
                        {apiKey.id}
                      </code>
                    </div>
                    <div className="text-xs text-docs-muted">
                      Created {formatDate(apiKey.created_at)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteKey(apiKey.id)}
                    className="ml-4 p-2 text-docs-muted hover:text-red-500"
                    disabled={loading}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
} 