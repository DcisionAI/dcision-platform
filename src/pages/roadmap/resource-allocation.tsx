import Layout from '@/components/Layout';
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const samplePayload = {
  equipment: [
    { id: 0, type: 'crane', capacity: 10, cost: 100 },
    { id: 1, type: 'forklift', capacity: 5, cost: 60 }
  ],
  tasks: [
    { id: 0, location: { id: 0, latitude: 0, longitude: 0, name: 'SiteA' }, duration: 2, required_skills: [], priority: 1, time_window: [0, 8] },
    { id: 1, location: { id: 1, latitude: 0, longitude: 0, name: 'SiteB' }, duration: 3, required_skills: [], priority: 1, time_window: [0, 8] }
  ],
  locations: [
    { id: 0, latitude: 0, longitude: 0, name: 'SiteA' },
    { id: 1, latitude: 0, longitude: 0, name: 'SiteB' }
  ],
  cost_matrix: [[10, 20], [15, 12]],
  constraints: {
    max_equipment_per_location: 1,
    min_tasks_per_equipment: 1,
    assignment_restrictions: []
  },
  objective: 'minimize_total_cost'
};

export default function ResourceAllocation() {
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
        sessionId: 'equipment-allocation-session-001',
        protocol: {
          steps: [
            {
              id: 'solve_step',
              action: 'solve_model',
              description: 'Solve the equipment allocation problem',
              required: true
            }
          ]
        },
        context: { problemType: 'equipment_allocation' },
        model: {
          problemType: 'equipment_allocation',
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
            <h1 className="text-2xl font-bold mb-4 text-docs-text">Resource Allocation Optimization</h1>
            {/* Use Case Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-docs-section border border-docs-section-border p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">What</h3>
                <p className="text-docs-muted text-sm">Assign equipment to tasks respecting capacities and constraints.</p>
              </div>
              <div className="bg-docs-section border border-docs-section-border p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">How</h3>
                <p className="text-docs-muted text-sm">Use OR-Tools MIP solver via MCP service to minimize total allocation cost.</p>
              </div>
              <div className="bg-docs-section border border-docs-section-border p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Why</h3>
                <p className="text-docs-muted text-sm">Optimize utilization of equipment and reduce operational expenses.</p>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-docs-muted font-medium mb-1">Equipment Allocation Payload (JSON):</label>
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
                {loading ? 'Solving...' : 'Solve Resource Allocation'}
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
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div className="bg-docs-section-dark border border-docs-section-border-dark p-3 rounded text-sm">
                          <strong>Equipment:</strong> {parsedInput?.equipment?.length || 0}
                        </div>
                        <div className="bg-docs-section-dark border border-docs-section-border-dark p-3 rounded text-sm">
                          <strong>Tasks:</strong> {parsedInput?.tasks?.length || 0}
                        </div>
                        <div className="bg-docs-section-dark border border-docs-section-border-dark p-3 rounded text-sm">
                          <strong>Locations:</strong> {parsedInput?.locations?.length || 0}
                        </div>
                        <div className="bg-docs-section-dark border border-docs-section-border-dark p-3 rounded text-sm">
                          <strong>Constraints:</strong> {Object.keys(parsedInput?.constraints || {}).length}
                        </div>
                        <div className="bg-docs-section-dark border border-docs-section-border-dark p-3 rounded text-sm">
                          <strong>Objective:</strong> {parsedInput?.objective}
                        </div>
                      </div>
                      {result && (
                        <div className="mt-6 w-full h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={parsedInput.equipment.map((eq: any) => ({
                                name: eq.type || `#${eq.id}`,
                                tasks: (result.results?.[0]?.result?.solution?.assignments || result.assignments || []).filter((a: any) => a.equipment_id === eq.id || a.equipmentId === eq.id || a.id === eq.id).length,
                              }))}
                              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                              <Tooltip />
                              <Bar dataKey="tasks" fill="#AEC6CF" name="Tasks" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  )}
                  {reviewTab === 'tabular' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-semibold mb-2">Equipment</h3>
                        <div className="overflow-auto">
                          <table className="w-full text-sm border-collapse">
                            <thead>
                              <tr className="bg-docs-section-border-dark">
                                <th className="p-2 text-left">ID</th>
                                <th className="p-2 text-left">Type</th>
                                <th className="p-2 text-left">Capacity</th>
                                <th className="p-2 text-left">Cost</th>
                              </tr>
                            </thead>
                            <tbody>
                              {parsedInput?.equipment?.map((eq: any) => (
                                <tr key={eq.id} className="odd:bg-docs-section-dark">
                                  <td className="p-2">{eq.id}</td>
                                  <td className="p-2">{eq.type}</td>
                                  <td className="p-2">{eq.capacity}</td>
                                  <td className="p-2">{eq.cost}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Tasks</h3>
                        <div className="overflow-auto">
                          <table className="w-full text-sm border-collapse">
                            <thead>
                              <tr className="bg-docs-section-border-dark">
                                <th className="p-2 text-left">ID</th>
                                <th className="p-2 text-left">Duration</th>
                                <th className="p-2 text-left">Priority</th>
                              </tr>
                            </thead>
                            <tbody>
                              {parsedInput?.tasks?.map((t: any) => (
                                <tr key={t.id} className="odd:bg-docs-section-dark">
                                  <td className="p-2">{t.id}</td>
                                  <td className="p-2">{t.duration}</td>
                                  <td className="p-2">{t.priority}</td>
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
            {/* Solution Visualization moved into Dashboard tab only */}
          </div>
        </div>
      </div>
    </Layout>
  );
} 