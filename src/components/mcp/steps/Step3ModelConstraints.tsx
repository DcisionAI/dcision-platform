import React, { useEffect, useState } from 'react';
import { authFetch } from '@/lib/authFetch';

export interface Step3ModelConstraintsProps {
  enrichedData: any;
  intentInterpretation: string;
}

const Step3ModelConstraints: React.FC<Step3ModelConstraintsProps> = ({ enrichedData, intentInterpretation }) => {
  const [modelDef, setModelDef] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (enrichedData && intentInterpretation) {
      setLoading(true);
      setError(null);
      authFetch('/api/mcp/model-define', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrichedData, intentInterpretation })
      })
        .then(res => res.json())
        .then(data => setModelDef(data.output))
        .catch(() => setError('Failed to generate model definition'))
        .finally(() => setLoading(false));
    }
  }, [enrichedData, intentInterpretation]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Step 3: Model & Constraints</h2>
      {loading && (
        <div className="flex items-center gap-2 text-docs-muted animate-pulse mb-4">
          <svg className="animate-spin h-5 w-5 text-blue-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span>Crafting a DcisionAI model...</span>
        </div>
      )}
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {modelDef && (
        <div className="space-y-4">
          <details open className="bg-docs-section border border-docs-section-border rounded-lg p-4">
            <summary className="font-medium text-docs-text">Variables</summary>
            <div className="mt-2 text-docs-text text-sm">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-docs-section-border">
                    <th className="border p-2 text-left">Name</th>
                    <th className="border p-2 text-left">Description</th>
                    <th className="border p-2 text-left">Domain</th>
                    <th className="border p-2 text-left">Business Context</th>
                  </tr>
                </thead>
                <tbody>
                  {modelDef.variables?.map((v: any, i: number) => (
                    <tr key={i} className={i % 2 === 0 ? '' : 'bg-docs-section'}>
                      <td className="border p-2">{v.name}</td>
                      <td className="border p-2">{v.description}</td>
                      <td className="border p-2">{v.domain || '-'}</td>
                      <td className="border p-2">{v.businessContext || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
          <details open className="bg-docs-section border border-docs-section-border rounded-lg p-4">
            <summary className="font-medium text-docs-text">Constraints</summary>
            <div className="mt-2 text-docs-text text-sm">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-docs-section-border">
                    <th className="border p-2 text-left">Name</th>
                    <th className="border p-2 text-left">Description</th>
                    <th className="border p-2 text-left">Expression</th>
                    <th className="border p-2 text-left">Business Context</th>
                  </tr>
                </thead>
                <tbody>
                  {modelDef.constraints?.map((c: any, i: number) => (
                    <tr key={i} className={i % 2 === 0 ? '' : 'bg-docs-section'}>
                      <td className="border p-2">{c.name || '-'}</td>
                      <td className="border p-2">{c.description}</td>
                      <td className="border p-2">{c.expression || '-'}</td>
                      <td className="border p-2">{c.businessContext || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
          <details open className="bg-docs-section border border-docs-section-border rounded-lg p-4">
            <summary className="font-medium text-docs-text">Objective</summary>
            <div className="mt-2 text-docs-text text-sm">
              <strong>Type:</strong> {modelDef.objective?.type}<br />
              <strong>Description:</strong> {modelDef.objective?.description || '-'}<br />
              <strong>Expression:</strong> {modelDef.objective?.expression || '-'}<br />
              <strong>Business Context:</strong> {modelDef.objective?.businessContext || '-'}
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

export default Step3ModelConstraints;