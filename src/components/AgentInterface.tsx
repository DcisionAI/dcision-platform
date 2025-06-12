import React, { useState, useEffect } from 'react';
import { useTheme } from '@/components/layout/ThemeContext';
import ScenarioAnalysis from './ScenarioAnalysis';

interface RequestHistory {
  method: string;
  url: string;
  body: string;
  timestamp: string;
}

interface AgentInterfaceProps {
  agentName: string;
  baseUrl: string;
  defaultRequestBody?: string;
  systemPrompt?: string;
  showScenarioAnalysis?: boolean;
}

interface Scenario {
  id: string;
  name: string;
  description: string;
  metrics: {
    [key: string]: number;
  };
  probability: number;
  impact: 'high' | 'medium' | 'low';
}

const AgentInterface: React.FC<AgentInterfaceProps> = ({
  agentName,
  baseUrl,
  defaultRequestBody = '{"message": ""}',
  systemPrompt,
  showScenarioAnalysis = false,
}) => {
  const { theme } = useTheme();
  const [method, setMethod] = useState('POST');
  const [url, setUrl] = useState(baseUrl);
  const [requestBody, setRequestBody] = useState(defaultRequestBody);
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [requestHistory, setRequestHistory] = useState<RequestHistory[]>([]);
  const [activeTab, setActiveTab] = useState<'api' | 'scenarios'>('api');
  const [scenarios, setScenarios] = useState<Scenario[]>([]);

  // Function to extract scenarios from response
  const extractScenarios = (responseText: string): Scenario[] => {
    try {
      const response = JSON.parse(responseText);
      if (response.scenarios && Array.isArray(response.scenarios)) {
        return response.scenarios.map((scenario: any, index: number) => ({
          id: `scenario-${index}`,
          name: scenario.name || `Scenario ${index + 1}`,
          description: scenario.description || '',
          metrics: scenario.metrics || {},
          probability: scenario.probability || 0,
          impact: scenario.impact || 'medium',
        }));
      }
    } catch (error) {
      console.error('Error parsing scenarios:', error);
    }
    return [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Map the URL to the actual endpoint
      const actualUrl = url.replace('/api/dcisionai/', '/api/agno/');
      
      const response = await fetch(actualUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
      });

      const data = await response.json();
      setResponse(JSON.stringify(data, null, 2));

      // Add to history with the original URL (not the mapped one)
      setRequestHistory(prev => [
        {
          method,
          url,
          body: requestBody,
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);

      // Extract scenarios if available
      if (showScenarioAnalysis) {
        const extractedScenarios = extractScenarios(JSON.stringify(data));
        if (extractedScenarios.length > 0) {
          setScenarios(extractedScenarios);
          setActiveTab('scenarios');
        }
      }
    } catch (error) {
      setResponse(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryClick = (history: RequestHistory) => {
    setMethod(history.method);
    setUrl(history.url);
    setRequestBody(history.body);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      {showScenarioAnalysis && (
        <div className="flex border-b border-docs-section-border">
          <button
            onClick={() => setActiveTab('api')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'api'
                ? 'border-b-2 border-docs-accent text-docs-accent'
                : theme === 'dark'
                ? 'text-docs-dark-muted hover:text-docs-dark-text'
                : 'text-docs-muted hover:text-docs-text'
            }`}
          >
            API Interface
          </button>
          <button
            onClick={() => setActiveTab('scenarios')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'scenarios'
                ? 'border-b-2 border-docs-accent text-docs-accent'
                : theme === 'dark'
                ? 'text-docs-dark-muted hover:text-docs-dark-text'
                : 'text-docs-muted hover:text-docs-text'
            }`}
          >
            Scenario Analysis
          </button>
        </div>
      )}

      {activeTab === 'api' ? (
        <div className="flex-1 overflow-hidden flex">
          {/* Request History */}
          <div className={`w-64 border-r ${theme === 'dark' ? 'border-docs-dark-muted' : 'border-docs-muted'}`}>
            <div className="p-3 border-b border-docs-section-border">
              <h3 className={`text-sm font-medium ${theme === 'dark' ? 'text-docs-dark-text' : 'text-docs-text'}`}>
                Request History
              </h3>
            </div>
            <div className="overflow-y-auto h-[calc(100%-2.5rem)]">
              {requestHistory.map((history, index) => (
                <button
                  key={index}
                  onClick={() => handleHistoryClick(history)}
                  className={`w-full text-left p-2 hover:bg-docs-section dark:hover:bg-docs-dark-bg border-b ${
                    theme === 'dark' ? 'border-docs-dark-muted' : 'border-docs-muted'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className={`px-1.5 py-0.5 text-xs rounded ${
                      history.method === 'GET' ? 'bg-green-100 text-green-800' :
                      history.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {history.method}
                    </span>
                    <span className={`text-xs truncate ${theme === 'dark' ? 'text-docs-dark-muted' : 'text-docs-muted'}`}>
                      {history.url}
                    </span>
                  </div>
                  <div className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-docs-dark-muted' : 'text-docs-muted'}`}>
                    {history.timestamp}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Request Form */}
            <form onSubmit={handleSubmit} className="p-4 border-b border-docs-section-border">
              <div className="flex space-x-2 mb-4">
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className={`px-3 py-2 rounded border ${
                    theme === 'dark'
                      ? 'bg-docs-dark-bg border-docs-dark-muted text-docs-dark-text'
                      : 'bg-white border-docs-muted text-docs-text'
                  }`}
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                </select>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="API Endpoint"
                  className={`flex-1 px-3 py-2 rounded border ${
                    theme === 'dark'
                      ? 'bg-docs-dark-bg border-docs-dark-muted text-docs-dark-text'
                      : 'bg-white border-docs-muted text-docs-text'
                  }`}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-4 py-2 rounded bg-docs-accent text-white font-medium ${
                    loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-docs-accent-hover'
                  }`}
                >
                  {loading ? 'Sending...' : 'Send'}
                </button>
              </div>
              <textarea
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                placeholder="Request Body (JSON)"
                rows={5}
                className={`w-full px-3 py-2 rounded border ${
                  theme === 'dark'
                    ? 'bg-docs-dark-bg border-docs-dark-muted text-docs-dark-text'
                    : 'bg-white border-docs-muted text-docs-text'
                }`}
              />
            </form>

            {/* Response */}
            <div className="flex-1 p-4 overflow-auto">
              <h3 className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-docs-dark-text' : 'text-docs-text'}`}>
                Response
              </h3>
              {response ? (
                <pre className={`p-4 rounded border ${
                  theme === 'dark'
                    ? 'bg-docs-dark-bg border-docs-dark-muted text-docs-dark-text'
                    : 'bg-white border-docs-muted text-docs-text'
                } whitespace-pre-wrap break-words`}>
                  {response}
                </pre>
              ) : (
                <div className={`text-center p-8 ${theme === 'dark' ? 'text-docs-dark-muted' : 'text-docs-muted'}`}>
                  No response yet
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <ScenarioAnalysis
          scenarios={scenarios}
          onScenarioSelect={(scenario) => {
            // Handle scenario selection if needed
            console.log('Selected scenario:', scenario);
          }}
        />
      )}
    </div>
  );
};

export default AgentInterface; 