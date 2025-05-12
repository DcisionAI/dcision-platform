import React, { useState, useEffect } from 'react';
const tabs = ['Analysis', 'Mapping', 'Enrich', 'Validate'];

const loadingMessages = [
  'analyzing your business problem...',
  'identifying key decision variables for your business...',
  'defining operational and business constraints...',
  'formulating the optimization objective for your goals...',
  'exploring external data sources to enhance your solution...'
];

export interface Step2DataPrepProps {
  config: any;
  // Callback when data source connectors selection changes
  onUpdate?: (update: any) => void;
}

const Step2DataPrep: React.FC<Step2DataPrepProps> = ({ config, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<string>(tabs[0]);
  const [mappingResult, setMappingResult] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [modelDef, setModelDef] = useState<any>(null);
  const [modelLoading, setModelLoading] = useState<boolean>(false);
  const [connectors, setConnectors] = useState<Array<{id: string; name: string}>>([]);
  const [selectedConnectors, setSelectedConnectors] = useState<string[]>([]);
  const lastMappingKey = React.useRef<string | null>(null);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  // Reset modelDef and mappingResult when intent changes
  useEffect(() => {
    setModelDef(null);
    setMappingResult(null);
  }, [config.intentInterpretation]);

  // Notify parent of connector selection changes
  useEffect(() => {
    if (typeof onUpdate === 'function') {
      onUpdate({ connectors: selectedConnectors });
    }
  }, [selectedConnectors, onUpdate]);

  // Fetch recommended data requirements from Data Mapping Agent
  useEffect(() => {
    const mappingKey = config.intentInterpretation + JSON.stringify(modelDef);
    if (
      config.intentInterpretation &&
      modelDef &&
      lastMappingKey.current !== mappingKey
    ) {
      setLoading(true);
      fetch('/api/mcp/map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput: config.intentInterpretation,
          intentDetails: { output: config },
          modelDefinition: modelDef
        })
      })
        .then(res => res.json())
        .then(result => {
          setMappingResult(result.output);
          lastMappingKey.current = mappingKey;
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [config.intentInterpretation, modelDef]);

  // Fetch available connectors when entering Mapping tab
  useEffect(() => {
    if (activeTab === 'Mapping') {
      fetch('/api/connectors')
        .then(res => res.json())
        .then((data) => setConnectors(data))
        .catch(console.error)
    }
  }, [activeTab]);
  
  // Fetch model definition via LLM-based agent
  useEffect(() => {
    if (config.intentInterpretation) {
      setModelLoading(true);
      fetch('/api/mcp/define', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: config.intentInterpretation })
      })
        .then(res => res.json())
        .then(data => setModelDef(data.output))
        .catch(console.error)
        .finally(() => setModelLoading(false));
    }
  }, [config.intentInterpretation]);

  useEffect(() => {
    if (modelLoading) {
      setLoadingMsgIdx(0);
      const interval = setInterval(() => {
        setLoadingMsgIdx(idx => (idx + 1) % loadingMessages.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [modelLoading]);

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold mb-4">Step 2: Data Prep</h2>
      {loading && <p className="text-docs-muted mb-4">Analyzing required data...</p>}

      <div className="border-b border-docs-section-border mb-4">
        <nav className="-mb-px flex space-x-4" aria-label="Tabs">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 font-medium text-sm focus:outline-none ${
                activeTab === tab
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-docs-muted hover:text-docs-text'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>
      <div className="w-full p-4 bg-docs-section border border-docs-section-border rounded-lg shadow">
        {/* Tab Panels */}
        {activeTab === 'Analysis' && (
          <div>
            <h3 className="text-lg font-medium text-docs-text mb-2">Model Definition</h3>
            {modelLoading ? (
              <div className="flex items-center gap-2 text-docs-muted animate-pulse">
                <svg className="animate-spin h-5 w-5 text-blue-400" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                <span>DcisionAI is {loadingMessages[loadingMsgIdx]}</span>
              </div>
            ) : modelDef ? (
              <div className="space-y-6">
                {/* Variables Table */}
                <div>
                  <h4 className="font-medium">Variables</h4>
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
                      {modelDef.variables.map((v: any, i: number) => (
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
                {/* Constraints Table */}
                <div>
                  <h4 className="font-medium">Constraints</h4>
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
                      {modelDef.constraints.map((c: any, i: number) => (
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
                {/* Objective */}
                <div>
                  <h4 className="font-medium">Objective</h4>
                  <table className="w-full text-sm border-collapse mb-4">
                    <thead>
                      <tr className="bg-docs-section-border">
                        <th className="border p-2 text-left">Type</th>
                        <th className="border p-2 text-left">Description</th>
                        <th className="border p-2 text-left">Expression</th>
                        <th className="border p-2 text-left">Business Context</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-docs-section">
                        <td className="border p-2">{modelDef.objective.type}</td>
                        <td className="border p-2">{modelDef.objective.description || '-'}</td>
                        <td className="border p-2">{modelDef.objective.expression || '-'}</td>
                        <td className="border p-2">{modelDef.objective.businessContext || '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              ) : (
              <p className="text-docs-muted">No model definition available.</p>
            )}
            {/* External Data Augmentation */}
            {modelDef && modelDef.externalDataSources && (
              <div className="mt-6">
                <h4 className="font-medium mb-2">External Data Augmentation</h4>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-docs-section-border">
                      <th className="border p-2 text-left">Source</th>
                      <th className="border p-2 text-left">Description</th>
                      <th className="border p-2 text-left">Value Add</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modelDef.externalDataSources.map((e: any, i: number) => (
                      <tr key={i} className={i % 2 === 0 ? '' : 'bg-docs-section'}>
                        <td className="border p-2">{e.source}</td>
                        <td className="border p-2">{e.description}</td>
                        <td className="border p-2">{e.valueAdd}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {activeTab === 'Mapping' && (
          <div>
            <h3 className="text-lg font-medium text-docs-text mb-2">Data Requirements</h3>
            {/* Connector Selection UI */}
            <div className="mt-4">
              <h4 className="font-medium mb-2">Select Data Connectors</h4>
              {connectors.map(c => (
                <div key={c.id} className="flex items-center mb-1">
                  <input
                    type="checkbox"
                    id={c.id}
                    className="mr-2"
                    checked={selectedConnectors.includes(c.id)}
                    onChange={() => {
                      setSelectedConnectors(prev =>
                        prev.includes(c.id) ? prev.filter(x => x !== c.id) : [...prev, c.id]
                      );
                    }}
                  />
                  <label htmlFor={c.id}>{c.name}</label>
                </div>
              ))}
            </div>
            {mappingResult ? (
              <div className="space-y-4 text-docs-text text-sm">
                {mappingResult.required_fields && (
                  <div>
                    <strong>Must-have Fields:</strong>
                    <ul className="list-disc list-inside mt-1 text-docs-muted">
                      {Object.entries(mappingResult.required_fields).map(([field, info]: any) => (
                        <li key={field}>
                          <span className="font-medium text-docs-text">{field}</span>: {info.description}
                          {info.importance && (<em> (importance: {info.importance})</em>)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {mappingResult.nice_to_have_fields && (
                  <div>
                    <strong>Good-to-have Fields:</strong>
                    <ul className="list-disc list-inside mt-1 text-docs-muted">
                      {Object.entries(mappingResult.nice_to_have_fields).map(([field, info]: any) => (
                        <li key={field}>
                          <span className="font-medium text-docs-text">{field}</span>: {info.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-docs-muted">No data requirements available.</p>
            )}
          </div>
        )}
        {activeTab === 'Enrich' && (
          <p className="text-docs-muted text-sm">Enrich tab content coming soon.</p>
        )}
        {activeTab === 'Validate' && (
          <p className="text-docs-muted text-sm">Validate tab content coming soon.</p>
        )}
      </div>
    </div>
  );
};

export default Step2DataPrep;