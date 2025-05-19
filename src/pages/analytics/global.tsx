import Layout from '@/components/Layout';
import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/authFetch';

export default function GlobalAnalytics() {
  const [totals, setTotals] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    authFetch('/api/analytics/global')
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to fetch global analytics');
        return res.json();
      })
      .then((data) => {
        setTotals(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    setLogsLoading(true);
    setLogsError(null);
    authFetch('/api/analytics/logs')
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to fetch logs');
        return res.json();
      })
      .then((data) => {
        setLogs(data);
        setLogsLoading(false);
      })
      .catch((err) => {
        setLogsError(err.message);
        setLogsLoading(false);
      });
  }, []);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-8">
        <h1 className="text-xl font-bold text-docs-heading mb-6">API Usage (Global Analytics)</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-docs-section rounded-xl p-6 flex flex-col items-start shadow border border-docs-section-border min-h-[120px]">
            <span className="mb-2 text-blue-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
            </span>
            <span className="text-xs text-docs-muted mb-1">Total Sessions</span>
            <span className="text-xl font-bold text-docs-text">
              {loading ? '—' : error ? '!' : totals?.total_sessions ?? 0}
            </span>
          </div>
          <div className="bg-docs-section rounded-xl p-6 flex flex-col items-start shadow border border-docs-section-border min-h-[120px]">
            <span className="mb-2 text-purple-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 8.25V6.75A2.25 2.25 0 0014.25 4.5h-4.5A2.25 2.25 0 007.5 6.75v1.5m9 0v1.5m0-1.5h-9m9 0a2.25 2.25 0 012.25 2.25v6.75A2.25 2.25 0 0116.5 19.5h-9A2.25 2.25 0 015.25 17.25V10.5A2.25 2.25 0 017.5 8.25m9 0h-9" />
              </svg>
            </span>
            <span className="text-xs text-docs-muted mb-1">Total Prompts</span>
            <span className="text-xl font-bold text-docs-text">
              {loading ? '—' : error ? '!' : totals?.total_prompts ?? 0}
            </span>
          </div>
          <div className="bg-docs-section rounded-xl p-6 flex flex-col items-start shadow border border-docs-section-border min-h-[120px]">
            <span className="mb-2 text-orange-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h7.5m-7.5 3h7.5m-7.5 3h7.5m-7.5 3h7.5" />
              </svg>
            </span>
            <span className="text-xs text-docs-muted mb-1">Total Responses</span>
            <span className="text-xl font-bold text-docs-text">
              {loading ? '—' : error ? '!' : totals?.total_responses ?? 0}
            </span>
          </div>
          <div className="bg-docs-section rounded-xl p-6 flex flex-col items-start shadow border border-docs-section-border min-h-[120px]">
            <span className="mb-2 text-green-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25z" />
              </svg>
            </span>
            <span className="text-xs text-docs-muted mb-1">Total Decisions</span>
            <span className="text-xl font-bold text-docs-text">
              {loading ? '—' : error ? '!' : totals?.total_decisions ?? 0}
            </span>
          </div>
        </div>
        {/* Log Viewer */}
        <div className="bg-docs-section rounded-xl shadow border border-docs-section-border p-6">
          <h2 className="text-lg font-semibold text-docs-heading mb-4">Recent Activity Log</h2>
          {logsLoading ? (
            <div>Loading logs...</div>
          ) : logsError ? (
            <div className="text-red-600">{logsError}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-docs-muted border-b border-docs-border">
                    <th className="py-2 pr-4">Time</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">User</th>
                    <th className="py-2">Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.type + '-' + log.id} className="border-b border-docs-border last:border-0">
                      <td className="py-2 pr-4 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="py-2 pr-4 capitalize">{log.type}</td>
                      <td className="py-2 pr-4 font-mono text-xs text-docs-muted">{log.user_id}</td>
                      <td className="py-2">{log.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
} 