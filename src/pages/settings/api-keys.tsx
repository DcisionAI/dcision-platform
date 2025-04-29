import SettingsLayout from './layout';
import { useState } from 'react';
import { KeyIcon, TrashIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface APIKey {
  id: string;
  name: string;
  key: string;
  lastUsed: string;
  createdAt: string;
}

export default function APIKeysSettings() {
  const [newKeyName, setNewKeyName] = useState('');
  const [showKey, setShowKey] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<APIKey[]>([
    {
      id: 'key_1',
      name: 'Production API Key',
      key: 'sk_prod_2eF9X4kL8mN7vP3',
      lastUsed: '2024-03-20T10:30:00Z',
      createdAt: '2024-03-01T00:00:00Z'
    },
    {
      id: 'key_2',
      name: 'Development API Key',
      key: 'sk_dev_5hJ2Y7pQ9wR4tM8',
      lastUsed: '2024-03-19T15:45:00Z',
      createdAt: '2024-03-10T00:00:00Z'
    }
  ]);

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle API key creation
    console.log('Creating new API key:', newKeyName);
    setNewKeyName('');
  };

  const handleDeleteKey = (id: string) => {
    setApiKeys(apiKeys.filter(key => key.id !== id));
  };

  const toggleKeyVisibility = (id: string) => {
    setShowKey(showKey === id ? null : id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
                <label htmlFor="keyName" className="block text-sm font-medium text-docs-text">
                  Key Name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="keyName"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g., Production API Key"
                    className="block w-full rounded-md border-docs-border bg-docs-bg shadow-sm text-docs-text sm:text-sm px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-docs-accent hover:bg-docs-accent/90"
                >
                  <KeyIcon className="h-4 w-4 mr-2" />
                  Create API Key
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* API Keys List */}
        <div className="bg-docs-section rounded-lg border border-docs-border">
          <div className="p-6">
            <h2 className="text-lg font-medium text-docs-heading mb-4">Your API Keys</h2>
            <div className="space-y-4">
              {apiKeys.map((apiKey) => (
                <div
                  key={apiKey.id}
                  className="flex items-center justify-between p-4 border border-docs-border rounded-lg"
                >
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-docs-text">{apiKey.name}</h3>
                    <div className="flex items-center space-x-2">
                      <code className="text-xs font-mono text-docs-muted">
                        {showKey === apiKey.id ? apiKey.key : '••••••••••••••••'}
                      </code>
                      <button
                        onClick={() => toggleKeyVisibility(apiKey.id)}
                        className="text-docs-muted hover:text-docs-text"
                      >
                        {showKey === apiKey.id ? (
                          <EyeSlashIcon className="h-4 w-4" />
                        ) : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <div className="text-xs text-docs-muted">
                      Created {formatDate(apiKey.createdAt)} • Last used {formatDate(apiKey.lastUsed)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteKey(apiKey.id)}
                    className="ml-4 p-2 text-docs-muted hover:text-red-500"
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