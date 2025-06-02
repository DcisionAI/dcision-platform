import Layout from '@/components/Layout';
import { useState } from 'react';

const samplePayload = {
  employees: [
    { id: 1, name: 'Alice', skills: ['driver'], max_hours: 40, hourly_rate: 20, availability: [] },
    { id: 2, name: 'Bob', skills: ['loader'], max_hours: 40, hourly_rate: 18, availability: [] }
  ],
  shifts: [
    { id: 1, name: 'Morning' },
    { id: 2, name: 'Evening' }
  ],
  time_horizon: 7,
  constraints: {
    min_rest_hours: 8,
    max_consecutive_hours: 8,
    coverage_requirements: { '1': 1, '2': 1 },
    skill_requirements: { '1': ['driver'], '2': ['loader'] }
  },
  objective: 'minimize_cost'
};

export default function WorkforceScheduling() {
  const [input, setInput] = useState(JSON.stringify(samplePayload, null, 2));
  const [loading, setLoading] = useState(false);
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
      const mcpConfig = {
        sessionId: 'labor-scheduling-session-001',
        protocol: {
          steps: [
            {
              id: 'solve_step',
              action: 'solve_model',
              description: 'Solve the labor scheduling problem',
              required: true
            }
          ]
        },
        context: { problemType: 'labor_scheduling' },
        model: {
          problemType: 'labor_scheduling',
          ...model
        }
      };
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
      <div className="h-[calc(100vh-4rem)] bg-docs-body">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="bg-docs-section-dark rounded-xl p-8 shadow-lg border border-docs-section-border-dark text-docs-text">
            <h1 className="text-2xl font-bold mb-4 text-docs-text">Workforce Scheduling Optimization</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-docs-muted font-medium mb-1">Labor Scheduling Payload (JSON):</label>
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
                {loading ? 'Solving...' : 'Solve Workforce Schedule'}
              </button>
            </form>
            {error && <div className="mt-4 text-red-600">Error: {error}</div>}
            {result && (
              <div className="mt-6">
                <h2 className="text-lg font-semibold mb-2">Solution:</h2>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded text-xs overflow-x-auto border border-gray-700">{JSON.stringify(result, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
} 