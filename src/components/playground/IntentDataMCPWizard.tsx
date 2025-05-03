import React, { useState } from 'react';

export interface IntentDataMCPWizardProps {
  onComplete: (mcpConfig: any) => void;
}

/**
 * A three-step wizard: 1) Interpret user intent via LLM
 * 2) Discover data tables from Supabase
 * 3) Assemble a minimal MCP JSON and pass it back
 */
const IntentDataMCPWizard: React.FC<IntentDataMCPWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState<number>(1);
  const [userInput, setUserInput] = useState<string>('');
  const [intentContext, setIntentContext] = useState<any>(null);
  // Pre-populate Supabase credentials from environment (NEXT_PUBLIC_ vars)
  const defaultUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const defaultKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || '';
  const [supabaseUrl, setSupabaseUrl] = useState<string>(defaultUrl);
  const [supabaseKey, setSupabaseKey] = useState<string>(defaultKey);
  const [tables, setTables] = useState<string[]>([]);
  const [mcpJson, setMcpJson] = useState<string>('{}');

  const handleInterpret = async () => {
    // Call intent API
    const res = await fetch('/api/mcp/intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userInput })
    });
    const data = await res.json();
    setIntentContext(data);
    setStep(2);
  };

  const handleDiscover = async () => {
    // Discover tables using plugin-service
    const res = await fetch('/api/data/tables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: supabaseUrl, key: supabaseKey })
    });
    const tbls = await res.json();
    setTables(tbls);
    setStep(3);
  };

  const handleAssemble = () => {
    // Build a stub MCP config
    const mcp = {
      context: { intent: intentContext, dataset: { tables, credentials: { url: supabaseUrl, key: supabaseKey } } },
      protocol: { steps: [] }
    };
    setMcpJson(JSON.stringify(mcp, null, 2));
    setStep(4);
  };

  const handleFinish = () => {
    try {
      const mcp = JSON.parse(mcpJson);
      onComplete(mcp);
    } catch {
      // ignore parse errors
    }
  };

  return (
    <div className="space-y-6">
      {step === 1 && (
        <div>
          <textarea
            value={userInput}
            onChange={e => setUserInput(e.target.value)}
            placeholder="Describe your decision problem..."
            className="w-full p-3 border rounded"
          />
          <button
            disabled={!userInput.trim()}
            onClick={handleInterpret}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >Interpret Intent</button>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-2">
          <input
            type="text"
            value={supabaseUrl}
            onChange={e => setSupabaseUrl(e.target.value)}
            placeholder="Supabase URL"
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            value={supabaseKey}
            onChange={e => setSupabaseKey(e.target.value)}
            placeholder="Supabase Service Key"
            className="w-full p-2 border rounded"
          />
          <button
            disabled={!supabaseUrl || !supabaseKey}
            onClick={handleDiscover}
            className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
          >Discover Tables</button>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-2">
          <p>Select tables to include:</p>
          <div className="grid grid-cols-2 gap-2">
            {tables.map(tbl => (
              <label key={tbl} className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked
                  className="mr-2"
                />
                {tbl}
              </label>
            ))}
          </div>
          <button onClick={handleAssemble} className="mt-2 px-4 py-2 bg-purple-600 text-white rounded">
            Build MCP</button>
        </div>
      )}
      {step === 4 && (
        <div className="space-y-2">
          <textarea
            value={mcpJson}
            onChange={e => setMcpJson(e.target.value)}
            className="w-full p-2 border rounded h-40 font-mono text-xs"
          />
          <button onClick={handleFinish} className="px-4 py-2 bg-indigo-600 text-white rounded">
            Run MCP</button>
        </div>
      )}
    </div>
  );
};

export default IntentDataMCPWizard;