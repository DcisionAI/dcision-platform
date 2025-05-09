import React, { useState, useEffect } from 'react';
const tabs = ['Analysis', 'Mapping', 'Enrich', 'Validate'];

export interface Step2DataPrepProps {
  config: any;
}

const Step2DataPrep: React.FC<Step2DataPrepProps> = ({ config }) => {
  const [activeTab, setActiveTab] = useState<string>(tabs[0]);
  const [mappingResult, setMappingResult] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [modelDef, setModelDef] = useState<any>(null);
  const [modelLoading, setModelLoading] = useState<boolean>(false);

  // Fetch recommended data requirements from Data Mapping Agent
  useEffect(() => {
    // Only fetch mapping after model definition is available
    if (config.intentInterpretation && modelDef && !mappingResult) {
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
        .then(result => setMappingResult(result.output))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [config, modelDef, mappingResult]);
  
  // Fetch model definition via LLM-based agent
  useEffect(() => {
    if (config.intentInterpretation && !modelDef) {
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
  }, [config, modelDef]);

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
              <p className="text-docs-muted">Loading model definition...</p>
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