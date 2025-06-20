import React, { useState } from 'react';
import { apiFetch } from '@/utils/apiFetch';

const endpoints = [
  {
    label: 'Full Construction Workflow',
    value: '/api/agno/proxy?agent=construction-workflow',
    sample: JSON.stringify({
      userInput: 'Optimize my construction schedule for cost and time.',
      customerData: { /* ... */ }
    }, null, 2),
  },
  {
    label: 'Intent Agent',
    value: '/api/agno/proxy?agent=intent',
    sample: JSON.stringify({
      userInput: 'What is the best way to reduce project risk?'
    }, null, 2),
  },
  {
    label: 'Data Agent',
    value: '/api/agno/proxy?agent=data',
    sample: JSON.stringify({
      customerData: { /* ... */ }
    }, null, 2),
  },
  {
    label: 'Model Builder Agent',
    value: '/api/agno/proxy?agent=model-builder',
    sample: JSON.stringify({
      enrichedData: { /* ... */ },
      intent: { /* ... */ }
    }, null, 2),
  },
  {
    label: 'Explainability Agent',
    value: '/api/agno/proxy?agent=explain',
    sample: JSON.stringify({
      solverSolution: { /* ... */ }
    }, null, 2),
  },
];

interface RequestHistory {
  id: string;
  method: string;
  url: string;
  timestamp: string;
  requestBody: string;
}

const ApiInterfaceConstruction: React.FC = () => {
  const [method, setMethod] = useState('POST');
  const [url, setUrl] = useState(endpoints[0].value);
  const [requestBody, setRequestBody] = useState(endpoints[0].sample);
  const [response, setResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<RequestHistory[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState(0);

  const handleEndpointChange = (idx: number) => {
    setSelectedEndpoint(idx);
    setUrl(endpoints[idx].value);
    setRequestBody(endpoints[idx].sample);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await apiFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: method !== 'GET' ? requestBody : undefined,
      });
      const data = await response.json();
      setResponse(JSON.stringify(data, null, 2));
      setHistory(prev => [{
        id: Date.now().toString(),
        method,
        url,
        timestamp: new Date().toLocaleTimeString(),
        requestBody,
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
    setRequestBody(item.requestBody);
  };

  // Code snippet generator
  const codeSnippet = `curl -X ${method} \\
  -H "Content-Type: application/json" \\
  ${url.startsWith('http') ? url : `http://localhost:3000${url}`} \\
  -d '${requestBody.replace(/'/g, "'\''")}'`;

  return (
    <div className="flex h-full bg-docs-bg text-docs-text dark:bg-docs-dark-bg dark:text-docs-dark-text">
      {/* History Panel */}
      <div className="w-64 border-r border-docs-section-border dark:border-gray-700">
        <div className="p-3 border-b border-docs-section-border dark:border-gray-700">
          <h3 className="text-sm font-medium text-docs-text dark:text-docs-dark-text">Request History</h3>
        </div>
        <div className="overflow-y-auto h-[calc(100%-2.5rem)]">
          {history.map(item => (
            <button
              key={item.id}
              onClick={() => handleHistoryClick(item)}
              className="w-full text-left p-2 hover:bg-docs-section dark:hover:bg-gray-800/50 border-b border-docs-section-border dark:border-gray-700"
            >
              <div className="flex items-center space-x-2">
                <span className={`px-1.5 py-0.5 rounded text-xs ${item.method === 'GET' ? 'bg-green-100 text-green-800' : item.method === 'POST' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{item.method}</span>
                <span className="text-xs truncate text-docs-text dark:text-docs-dark-text">{item.url}</span>
              </div>
              <div className="text-xs mt-0.5 text-docs-muted dark:text-docs-dark-muted">{item.timestamp}</div>
            </button>
          ))}
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Endpoint Selector */}
        <div className="p-4 border-b border-docs-section-border dark:border-gray-700 flex items-center gap-4">
          <label className="font-medium text-docs-text dark:text-docs-dark-text">Endpoint:</label>
          <select
            value={selectedEndpoint}
            onChange={e => handleEndpointChange(Number(e.target.value))}
            className="px-3 py-2 rounded-lg border bg-docs-bg text-docs-text border-docs-muted dark:bg-docs-dark-bg dark:text-docs-dark-text dark:border-gray-700"
          >
            {endpoints.map((ep, idx) => (
              <option key={ep.value} value={idx}>{ep.label}</option>
            ))}
          </select>
          <span className="ml-4 text-xs text-docs-muted">(POST only, for now)</span>
        </div>
        {/* Request Form */}
        <form onSubmit={handleSubmit} className="p-4 border-b border-docs-section-border dark:border-gray-700">
          <div className="flex space-x-4 mb-4">
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="Enter API endpoint"
              className="flex-1 px-3 py-2 rounded-lg border bg-docs-bg text-docs-text border-docs-muted dark:bg-docs-dark-bg dark:text-docs-dark-text dark:border-gray-700"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-lg bg-docs-accent hover:bg-opacity-90 text-white transition-colors disabled:bg-gray-400"
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
          {/* Request Body */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-docs-text dark:text-docs-dark-text">Request Body</label>
            <textarea
              value={requestBody}
              onChange={e => setRequestBody(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 rounded-lg border font-mono text-sm bg-docs-bg text-docs-text border-docs-muted dark:bg-docs-dark-bg dark:text-docs-dark-text dark:border-gray-700"
            />
          </div>
        </form>
        {/* Code Snippet */}
        <div className="p-4 border-b border-docs-section-border dark:border-gray-700 bg-docs-section dark:bg-gray-800/50">
          <div className="font-medium mb-2 text-docs-text dark:text-docs-dark-text">Code Example (cURL):</div>
          <pre className="p-3 rounded bg-docs-bg text-xs overflow-x-auto text-docs-text dark:bg-docs-dark-bg dark:text-docs-dark-text">{codeSnippet}</pre>
        </div>
        {/* Response */}
        <div className="flex-1 p-4 overflow-auto">
          <h3 className="font-medium mb-2 text-docs-text dark:text-docs-dark-text">Response</h3>
          <pre className="p-4 rounded-lg border bg-docs-bg text-docs-text border-docs-muted dark:bg-docs-dark-bg dark:text-docs-dark-text dark:border-gray-700 overflow-x-auto whitespace-pre-wrap break-words">{response || 'No response yet'}</pre>
        </div>
      </div>
    </div>
  );
};

export default ApiInterfaceConstruction; 