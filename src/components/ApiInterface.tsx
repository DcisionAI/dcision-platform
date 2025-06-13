import React, { useState } from 'react';
import { useTheme } from '@/components/layout/ThemeContext';
import { apiFetch } from '@/utils/apiFetch';

interface RequestHistory {
  id: string;
  method: string;
  url: string;
  timestamp: string;
}

const ApiInterface: React.FC = () => {
  const { theme } = useTheme();
  const [method, setMethod] = useState('POST');
  const [url, setUrl] = useState('/api/dcisionai/chat');
  const [requestBody, setRequestBody] = useState('{\n  "message": "Your message here"\n}');
  const [response, setResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<RequestHistory[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Map the request to the actual Agno endpoint internally
      const actualUrl = url.replace('/api/dcisionai/', '/api/agno/');
      const response = await apiFetch(actualUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: method !== 'GET' ? requestBody : undefined,
      });

      const data = await response.json();
      setResponse(JSON.stringify(data, null, 2));

      // Add to history with the DcisionAI URL
      setHistory(prev => [{
        id: Date.now().toString(),
        method,
        url,
        timestamp: new Date().toLocaleTimeString(),
      }, ...prev]);
    } catch (error) {
      setResponse(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleHistoryClick = (item: RequestHistory) => {
    setMethod(item.method);
    setUrl(item.url);
  };

  return (
    <div className="flex h-full">
      {/* History Panel */}
      <div className={`w-64 border-r ${theme === 'dark' ? 'border-docs-dark-muted' : 'border-docs-muted'}`}>
        <div className="p-3 border-b border-docs-section-border">
          <h3 className={`text-sm font-medium ${theme === 'dark' ? 'text-docs-dark-text' : 'text-docs-text'}`}>
            Request History
          </h3>
        </div>
        <div className="overflow-y-auto h-[calc(100%-2.5rem)]">
          {history.map(item => (
            <button
              key={item.id}
              onClick={() => handleHistoryClick(item)}
              className={`w-full text-left p-2 hover:bg-docs-section dark:hover:bg-docs-dark-bg border-b ${
                theme === 'dark' ? 'border-docs-dark-muted' : 'border-docs-muted'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className={`px-1.5 py-0.5 rounded text-xs ${
                  item.method === 'GET' ? 'bg-green-100 text-green-800' :
                  item.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {item.method}
                </span>
                <span className={`text-xs truncate ${theme === 'dark' ? 'text-docs-dark-text' : 'text-docs-text'}`}>
                  {item.url}
                </span>
              </div>
              <div className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-docs-dark-muted' : 'text-docs-muted'}`}>
                {item.timestamp}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Request Form */}
        <form onSubmit={handleSubmit} className="p-4 border-b border-docs-section-border">
          <div className="flex space-x-4 mb-4">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className={`px-3 py-2 rounded-lg border ${
                theme === 'dark'
                  ? 'bg-docs-dark-bg border-docs-dark-muted text-docs-dark-text'
                  : 'bg-white border-docs-muted text-docs-text'
              }`}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter API endpoint"
              className={`flex-1 px-3 py-2 rounded-lg border ${
                theme === 'dark'
                  ? 'bg-docs-dark-bg border-docs-dark-muted text-docs-dark-text'
                  : 'bg-white border-docs-muted text-docs-text'
              }`}
            />
            <button
              type="submit"
              disabled={isLoading}
              className={`px-4 py-2 rounded-lg ${
                isLoading
                  ? 'bg-gray-400'
                  : 'bg-docs-accent hover:bg-opacity-90'
              } text-white transition-colors`}
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>

          {/* Request Body */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Request Body</label>
            <textarea
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
              rows={6}
              className={`w-full px-3 py-2 rounded-lg border font-mono text-sm ${
                theme === 'dark'
                  ? 'bg-docs-dark-bg border-docs-dark-muted text-docs-dark-text'
                  : 'bg-white border-docs-muted text-docs-text'
              }`}
            />
          </div>
        </form>

        {/* Response */}
        <div className="flex-1 p-4 overflow-auto">
          <h3 className="font-medium mb-2">Response</h3>
          <pre className={`p-4 rounded-lg border ${
            theme === 'dark'
              ? 'bg-docs-dark-bg border-docs-dark-muted text-docs-dark-text'
              : 'bg-white border-docs-muted text-docs-text'
          } overflow-x-auto whitespace-pre-wrap break-words`}>
            {response || 'No response yet'}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default ApiInterface; 