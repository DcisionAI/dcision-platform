import React, { useEffect, useState, useRef } from 'react';
import { authFetch } from '@/lib/authFetch';

export interface Step3ModelConstraintsProps {
  enrichedData: any;
  intentInterpretation: string;
  onModelDef?: (modelDef: any) => void;
  dataset?: any;
}

// Helper to render a table from an array of objects
function DataTable({ data, title }: { data: any[]; title?: string }) {
  if (!Array.isArray(data) || data.length === 0) return null;
  const columns = Object.keys(data[0]);
  return (
    <div className="mb-4">
      {title && <h4 className="font-medium mb-1">{title}</h4>}
      <table className="w-full text-sm border-collapse mb-2">
        <thead>
          <tr className="bg-docs-section-border">
            {columns.map(col => (
              <th key={col} className="border p-2 text-left">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? '' : 'bg-docs-section'}>
              {columns.map(col => (
                <td key={col} className="border p-2">
                  {typeof row[col] === 'object' && row[col] !== null
                    ? <pre className="whitespace-pre-wrap">{JSON.stringify(row[col], null, 2)}</pre>
                    : String(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const Step3ModelConstraints: React.FC<Step3ModelConstraintsProps> = ({ enrichedData, intentInterpretation, onModelDef, dataset }) => {
  const [modelDef, setModelDef] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Track last used inputs to prevent redundant API calls
  const lastInputsRef = useRef<{ enrichedData: any; intentInterpretation: string } | null>(null);

  useEffect(() => {
    // Only call API if inputs have changed
    const inputsChanged =
      !lastInputsRef.current ||
      JSON.stringify(lastInputsRef.current.enrichedData) !== JSON.stringify(enrichedData) ||
      lastInputsRef.current.intentInterpretation !== intentInterpretation;
    if (enrichedData && intentInterpretation && inputsChanged) {
      lastInputsRef.current = { enrichedData, intentInterpretation };
      setLoading(true);
      setError(null);
      authFetch('/api/mcp/model-define', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrichedData, intentInterpretation })
      })
        .then(res => res.json())
        .then(data => {
          setModelDef(data.output);
          if (onModelDef) onModelDef(data.output);
        })
        .catch(() => setError('Failed to generate model definition'))
        .finally(() => setLoading(false));
    }
  }, [enrichedData, intentInterpretation, onModelDef]);

  // Helper to render the dataset
  const renderDataset = () => {
    if (!dataset) return null;
    if (typeof dataset === 'object' && !Array.isArray(dataset)) {
      return Object.entries(dataset).map(([key, value]) =>
        Array.isArray(value) ? (
          <DataTable key={key} data={value} title={key.charAt(0).toUpperCase() + key.slice(1)} />
        ) : typeof value === 'object' ? (
          <pre key={key} className="bg-docs-section p-2 rounded text-xs overflow-x-auto">{JSON.stringify(value, null, 2)}</pre>
        ) : null
      );
    } else if (Array.isArray(dataset)) {
      return <DataTable data={dataset} />;
    } else {
      return <pre className="bg-docs-section p-2 rounded text-xs overflow-x-auto">{String(dataset)}</pre>;
    }
  };

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
          {/* DATASET DISPLAY */}
          <details open className="bg-docs-section border border-docs-section-border rounded-lg p-4">
            <summary className="font-medium text-docs-text">Dataset (Sample/Enriched)</summary>
            <div className="mt-2 text-docs-text text-sm">
              {renderDataset()}
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

export default Step3ModelConstraints;