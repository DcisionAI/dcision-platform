import Layout from '@/components/Layout';
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const samplePayload = {
  project_network: [
    { id: 1, name: 'Start', predecessors: [] },
    { id: 2, name: 'TaskA', predecessors: [1] },
    { id: 3, name: 'TaskB', predecessors: [2] }
  ],
  risk_factors: [
    { task_id: 1, mean: 2, stddev: 0.2 },
    { task_id: 2, mean: 3, stddev: 0.5 },
    { task_id: 3, mean: 4, stddev: 0.3 }
  ],
  num_simulations: 1000,
  objective: 'estimate_risk'
};

export default function ProjectScheduling() {
  const [input, setInput] = useState<string>(JSON.stringify(samplePayload, null, 2));
  const [parsedInput, setParsedInput] = useState<any>(null);
  const [mcpConfig, setMcpConfig] = useState<any>(null);
  const [reviewTab, setReviewTab] = useState<'dashboard' | 'tabular' | 'mcp'>('dashboard');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      // Build MCP config to match Postman payload exactly
      const model = JSON.parse(input);
      setParsedInput(model);
      const mcpConfig = {
        sessionId: 'project-scheduling-session-001',
        protocol: {
          steps: [
            {
              id: 'solve_step',
              action: 'solve_model',
              description: 'Run project risk simulation',
              required: true
            }
          ]
        },
        context: { problemType: 'risk_simulation' },
        model: {
          problemType: 'risk_simulation',
          ...model
        }
      };
      setMcpConfig(mcpConfig);
      const res = await fetch('https://mcp.dcisionai.com/mcp/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mcpConfig)
      });
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] bg-docs-body py-8">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-docs-section-dark rounded-xl p-8 shadow-lg border border-docs-section-border-dark text-docs-text">
            <h1 className="text-2xl font-bold mb-4 text-docs-text">Project Scheduling & Risk Simulation</h1>
            {/* Use Case Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-docs-section border border-docs-section-border p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">What</h3>
                <p className="text-docs-muted text-sm">Simulate project completion timelines under uncertainty using Monte Carlo and CPM.</p>
              </div>
              <div className="bg-docs-section border border-docs-section-border p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">How</h3>
                <p className="text-docs-muted text-sm">Leverage Monte Carlo simulation via MCP to estimate risk profiles and percentiles.</p>
              </div>
              <div className="bg-docs-section border border-docs-section-border p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Why</h3>
                <p className="text-docs-muted text-sm">Gain insights into project duration variability and identify critical risk drivers.</p>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-docs-muted font-medium mb-1">Project Scheduling / Risk Simulation Payload (JSON):</label>
              <textarea
                className="w-full h-48 p-2 border rounded font-mono text-sm bg-gray-900 text-gray-100 border-gray-700 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={loading}
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Solving...' : 'Solve Project Schedule'}
              </button>
            </form>
            {error && <div className="mt-4 text-red-600">Error: {error}</div>}
            {/* Review Configuration */}
            {mcpConfig && (
              <details open className="mt-6 bg-docs-section-dark border border-docs-section-border-dark p-4 rounded">
                <summary className="cursor-pointer text-lg font-semibold text-docs-text">Review Configuration</summary>
                <div className="mt-4">
                  {/* Tabs */}
                  <div className="flex space-x-4 mb-4">
                    {['dashboard', 'tabular', 'mcp'].map(tab => {
                      const label = tab === 'dashboard' ? 'Dashboard' : tab === 'tabular' ? 'Tabular View' : 'Review MCP';
                      return (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setReviewTab(tab as any)}
                          className={`px-3 py-1 rounded ${reviewTab === tab ? 'bg-blue-600 text-white' : 'text-docs-text hover:bg-docs-section-dark'}`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  {/* Tab Panels */}
                  {reviewTab === 'dashboard' && (
                    <div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-docs-section-dark border border-docs-section-border-dark p-3 rounded text-sm">
                          <strong>Network Nodes:</strong> {parsedInput?.project_network?.length || 0}
                        </div>
                        <div className="bg-docs-section-dark border border-docs-section-border-dark p-3 rounded text-sm">
                          <strong>Risk Factors:</strong> {parsedInput?.risk_factors?.length || 0}
                        </div>
                        <div className="bg-docs-section-dark border border-docs-section-border-dark p-3 rounded text-sm">
                          <strong>Simulations:</strong> {parsedInput?.num_simulations || 0}
                        </div>
                        <div className="bg-docs-section-dark border border-docs-section-border-dark p-3 rounded text-sm">
                          <strong>Objective:</strong> {parsedInput?.objective}
                        </div>
                      </div>
                      {/* Chart of risk means */}
                      {parsedInput?.risk_factors && (
                        <div className="mt-6 w-full h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={parsedInput.risk_factors.map((r: any) => ({ name: `Task ${r.task_id}`, mean: r.mean }))}
                              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                              <YAxis allowDecimals tick={{ fontSize: 12 }} />
                              <Tooltip />
                              <Bar dataKey="mean" fill="#AEC6CF" name="Mean Duration" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  )}
                  {reviewTab === 'tabular' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-semibold mb-2">Project Network</h3>
                        <div className="overflow-auto">
                          <table className="w-full text-sm border-collapse">
                            <thead>
                              <tr className="bg-docs-section-border-dark">
                                <th className="p-2 text-left">ID</th>
                                <th className="p-2 text-left">Name</th>
                                <th className="p-2 text-left">Predecessors</th>
                              </tr>
                            </thead>
                            <tbody>
                              {parsedInput?.project_network?.map((n: any) => (
                                <tr key={n.id} className="odd:bg-docs-section-dark">
                                  <td className="p-2">{n.id}</td>
                                  <td className="p-2">{n.name}</td>
                                  <td className="p-2">{(n.predecessors || []).join(', ')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Risk Factors</h3>
                        <div className="overflow-auto">
                          <table className="w-full text-sm border-collapse">
                            <thead>
                              <tr className="bg-docs-section-border-dark">
                                <th className="p-2 text-left">Task ID</th>
                                <th className="p-2 text-left">Mean</th>
                                <th className="p-2 text-left">Stddev</th>
                              </tr>
                            </thead>
                            <tbody>
                              {parsedInput?.risk_factors?.map((r: any) => (
                                <tr key={r.task_id} className="odd:bg-docs-section-dark">
                                  <td className="p-2">{r.task_id}</td>
                                  <td className="p-2">{r.mean}</td>
                                  <td className="p-2">{r.stddev}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                  {reviewTab === 'mcp' && (
                    <div className="overflow-auto">
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded text-xs overflow-auto">
                        {JSON.stringify(mcpConfig, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
            {/* Solution Section (collapsed by default) */}
            {result && (
              <details className="mt-6 bg-docs-section-dark border border-docs-section-border-dark p-4 rounded">
                <summary className="cursor-pointer text-lg font-semibold text-docs-text">Solution</summary>
                <div className="mt-4">
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded text-xs overflow-x-auto border border-gray-700">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </details>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
} 