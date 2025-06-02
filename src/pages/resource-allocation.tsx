import Layout from '@/components/Layout';
import { useState } from 'react';

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
            <h1 className="text-2xl font-bold mb-4 text-docs-text">Resource Allocation Optimization</h1>
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