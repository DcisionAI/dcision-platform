import React, { useState } from 'react';
import { assembleMCP } from '@/components/mcp/assembleMCP';
import { MCP } from '@/mcp/MCPTypes';

export interface Step4PreviewMCPProps {
  sessionId: string;
  intent: any;
  enrichedData: any;
  modelDef: any;
  environment: any;
  dataset: any;
  protocolSteps: any[];
  industry?: string;
  version?: string;
  status?: string;
}

const Step4PreviewMCP: React.FC<Step4PreviewMCPProps> = ({
  sessionId,
  intent,
  enrichedData,
  modelDef,
  environment,
  dataset,
  protocolSteps,
  industry = 'logistics',
  version = '1.0.0',
  status = 'pending',
}) => {
  const [response, setResponse] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const mcp: MCP = assembleMCP({
    sessionId,
    intent,
    enrichedData,
    modelDef,
    environment,
    dataset,
    protocolSteps,
    industry,
    version,
    status,
  });

  const mcpJson = JSON.stringify(mcp, null, 2);

  const handleSubmit = async () => {
    setSubmitting(true);
    setResponse(null);
    try {
      const res = await fetch('https://mcp-service-219323644585.us-central1.run.app/mcp/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: mcpJson
      });
      const data = await res.json();
      setResponse(data);
    } catch (e) {
      setResponse({ error: 'Failed to submit MCP to server.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Step 4: Preview MCP</h2>
      <div className="flex space-x-4 mb-2">
        <button onClick={handleSubmit} disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded">
          {submitting ? 'Submitting...' : 'Submit to MCP Server'}
        </button>
      </div>
      <pre
        className="w-full bg-docs-section border border-docs-section-border p-4 rounded-lg shadow mb-4 text-docs-text text-sm whitespace-pre-wrap break-words overflow-auto"
        style={{ maxHeight: '400px' }}
      >
        {mcpJson}
      </pre>
      {response && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">MCP Server Response</h4>
          <pre className="bg-docs-section p-2 rounded text-xs overflow-x-auto">{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default Step4PreviewMCP;