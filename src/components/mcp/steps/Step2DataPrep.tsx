import React, { useState, useEffect } from 'react';
import { authFetch } from '@/lib/authFetch';
const tabs = ['Mapping', 'Enrich'];

const loadingMessages = [
  'analyzing your business problem...',
  'identifying key decision variables for your business...',
  'defining operational and business constraints...',
  'formulating the optimization objective for your goals...',
  'exploring external data sources to enhance your solution...'
];

const mappingLoadingMessages = [
  'generating realistic sample data... 🚚',
  'simulating business scenarios...',
  'populating demo dataset with entities...',
  'crafting optimization-ready data...'
];

const enrichLoadingMessages = [
  'enriching your data with external sources... 🌦️',
  'augmenting with climate and traffic data...',
  'adding real-world context to your dataset...',
  'boosting data quality with enrichment...'
];

export interface Step2DataPrepProps {
  config: any;
  // Callback when data source connectors selection changes
  onUpdate?: (update: any) => void;
}

// Helper to render a table from an array of objects
function SampleDataTable({ data, title }: { data: any[]; title?: string }) {
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
  const [dataMode, setDataMode] = useState<'demo' | 'customer'>('demo');
  const [sampleData, setSampleData] = useState<any>(null);
  const [sampleLoading, setSampleLoading] = useState(false);
  const [enrichedData, setEnrichedData] = useState<any>(null);
  const [enrichLoading, setEnrichLoading] = useState(false);
  const [enrichSources, setEnrichSources] = useState<any>(null);
  const [enrichError, setEnrichError] = useState<string | null>(null);
  const [mappingLoadingMsgIdx, setMappingLoadingMsgIdx] = useState(0);
  const [enrichLoadingMsgIdx, setEnrichLoadingMsgIdx] = useState(0);

  // Tab completion states
  const [isAnalysisComplete, setIsAnalysisComplete] = useState(false);
  const [isMappingComplete, setIsMappingComplete] = useState(false);
  const [isEnrichComplete, setIsEnrichComplete] = useState(false);

  // Reset modelDef and mappingResult only if intent actually changes
  const prevIntent = React.useRef(config.intentInterpretation);
  useEffect(() => {
    if (prevIntent.current !== config.intentInterpretation) {
      console.log('Resetting modelDef because intent changed:', config.intentInterpretation);
      setModelDef(null);
      setMappingResult(null);
      setSampleData(null);
      prevIntent.current = config.intentInterpretation;
    }
  }, [config.intentInterpretation]);

  // Notify parent of connector selection changes
  useEffect(() => {
    if (typeof onUpdate === 'function') {
      onUpdate({ connectors: selectedConnectors });
    }
  }, [selectedConnectors, onUpdate]);

  // Only fetch sample data when Mapping tab is active, in demo mode, and intentInterpretation is available
  useEffect(() => {
    if (activeTab === 'Mapping' && dataMode === 'demo' && config.intentInterpretation) {
      setSampleLoading(true);
      authFetch('/api/mcp/sample-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intentInterpretation: config.intentInterpretation })
      })
        .then(res => res.json())
        .then(data => setSampleData(data.sample))
        .catch(console.error)
        .finally(() => setSampleLoading(false));
    }
  }, [activeTab, dataMode, config.intentInterpretation]);

  // Only fetch mapping when Mapping tab is active
  useEffect(() => {
    const mappingKey = config.intentInterpretation + JSON.stringify(modelDef) + dataMode + JSON.stringify(sampleData) + selectedConnectors.join(',');
    if (
      activeTab === 'Mapping' &&
      config.intentInterpretation &&
      modelDef &&
      lastMappingKey.current !== mappingKey
    ) {
      setLoading(true);
      if (dataMode != 'demo') {
        authFetch('/api/mcp/map', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userInput: config.intentInterpretation,
            intentDetails: { output: config },
            modelDefinition: modelDef,
            data: sampleData
          })
        })
          .then(res => res.json())
          .then(result => {
            setMappingResult(result.output);
            lastMappingKey.current = mappingKey;
          })
          .catch(console.error)
          .finally(() => setLoading(false));
      } else {
        setMappingResult({ error: 'Customer data integration not yet implemented.' });
        setLoading(false);
      }
    }
  }, [activeTab, config.intentInterpretation, modelDef, dataMode, sampleData, selectedConnectors]);

  // Only fetch connectors if Mapping tab is active AND Customer Data is selected
  useEffect(() => {
    if (activeTab === 'Mapping' && dataMode === 'customer') {
      authFetch('/api/connectors')
        .then(res => res.json())
        .then((data) => setConnectors(data))
        .catch(console.error)
    }
  }, [activeTab, dataMode]);

  useEffect(() => {
    if (modelLoading) {
      setLoadingMsgIdx(0);
      const interval = setInterval(() => {
        setLoadingMsgIdx(idx => (idx + 1) % loadingMessages.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [modelLoading]);

  // Fetch enriched data when Enrich tab is active
  useEffect(() => {
    if (activeTab === 'Enrich' && sampleData) {
      setEnrichLoading(true);
      setEnrichError(null);
      let enrichmentSuggestions = undefined;
      if (modelDef && Array.isArray(modelDef.externalDataSources) && modelDef.externalDataSources.length > 0) {
        enrichmentSuggestions = modelDef.externalDataSources;
      }
      console.log('Enriching with:', { sampleData, enrichmentSuggestions });
      authFetch('/api/mcp/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sampleData, ...(enrichmentSuggestions ? { enrichmentSuggestions } : {}) })
      })
        .then(res => res.json())
        .then(data => {
          setEnrichSources(data.enrichmentSources);
          setEnrichedData(data.enrichedData);
          setEnrichError(data.error || null);
        })
        .catch(err => setEnrichError('Failed to enrich data'))
        .finally(() => setEnrichLoading(false));
    }
  }, [activeTab, sampleData, modelDef]);

  // Animated loading for Mapping (sample data)
  useEffect(() => {
    if (sampleLoading) {
      setMappingLoadingMsgIdx(0);
      const interval = setInterval(() => {
        setMappingLoadingMsgIdx(idx => (idx + 1) % mappingLoadingMessages.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [sampleLoading]);

  // Animated loading for Enrich
  useEffect(() => {
    if (enrichLoading) {
      setEnrichLoadingMsgIdx(0);
      const interval = setInterval(() => {
        setEnrichLoadingMsgIdx(idx => (idx + 1) % enrichLoadingMessages.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [enrichLoading]);

  // After enrichment completes, update parent with enrichedData as dataset
  useEffect(() => {
    if (enrichedData && typeof onUpdate === 'function') {
      onUpdate({ enrichedData, dataset: enrichedData });
    }
  }, [enrichedData, onUpdate]);

  // When sampleData changes and no enrichedData, update parent with sampleData as dataset
  useEffect(() => {
    if (sampleData && !enrichedData && typeof onUpdate === 'function') {
      onUpdate({ dataset: sampleData });
    }
  }, [sampleData, enrichedData, onUpdate]);

  // Set completion when intent and problemType are available
  useEffect(() => {
    setIsAnalysisComplete(!!config.intentInterpretation && !!config.problemType);
  }, [config.intentInterpretation, config.problemType]);
  useEffect(() => {
    setIsMappingComplete(!!sampleData);
  }, [sampleData]);
  useEffect(() => {
    setIsEnrichComplete(!!enrichedData);
  }, [enrichedData]);

  // Pass isEnrichComplete up to parent on change
  useEffect(() => {
    if (typeof onUpdate === 'function') {
      onUpdate({ isEnrichComplete });
    }
  }, [isEnrichComplete, onUpdate]);

  // Tab navigation handler
  const handleTabClick = (tab: string) => {
    if (tab === 'Mapping' && !isAnalysisComplete) return;
    if (tab === 'Enrich' && (!isAnalysisComplete || !isMappingComplete)) return;
    setActiveTab(tab);
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold mb-4">Step 2: Data Prep</h2>
      <div className="border-b border-docs-section-border mb-4">
        <nav className="-mb-px flex space-x-4" aria-label="Tabs">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => handleTabClick(tab)}
              disabled={
                (tab === 'Mapping' && !isAnalysisComplete) ||
                (tab === 'Enrich' && (!isAnalysisComplete || !isMappingComplete))
              }
              className={`px-4 py-2 rounded ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'} ${((tab === 'Mapping' && !isAnalysisComplete) || (tab === 'Enrich' && (!isAnalysisComplete || !isMappingComplete))) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>
      <div className="w-full p-4 bg-docs-section border border-docs-section-border rounded-lg shadow">
        {/* Tab Panels */}
        {activeTab === 'Mapping' && (
          <div>
            <h3 className="text-lg font-medium text-docs-text mb-2">Data Requirements</h3>
            {/* Data Source Toggle only in Mapping tab */}
            <div className="mb-4 flex gap-6 items-center">
              <span className="font-medium">Data Source:</span>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={dataMode === 'demo'}
                  onChange={() => setDataMode('demo')}
                />
                Demo Data
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={dataMode === 'customer'}
                  onChange={() => setDataMode('customer')}
                />
                Customer Data
              </label>
              
              {dataMode === 'customer' && <span className="text-docs-muted ml-4">(Integration coming soon)</span>}
            </div>
            {/* Animated loading for sample data */}
            {dataMode === 'demo' && sampleLoading && (
              <div className="flex items-center gap-2 text-docs-muted animate-pulse mb-4">
                <svg className="animate-spin h-5 w-5 text-blue-400" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                <span>{mappingLoadingMessages[mappingLoadingMsgIdx]}</span>
              </div>
            )}
            {/* Render sample data tables for Demo Data */}
            {dataMode === 'demo' && sampleData && (() => {
              // Normalize: if sampleData is an array of single-key objects, flatten to an object
              let normalizedSampleData = sampleData;
              if (Array.isArray(sampleData) && sampleData.every(item => typeof item === 'object' && !Array.isArray(item) && Object.keys(item).length === 1)) {
                normalizedSampleData = Object.assign({}, ...sampleData);
              }
              return (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Sample Data</h4>
                  {/* If normalizedSampleData is an object with arrays, render each as a table */}
                  {typeof normalizedSampleData === 'object' && !Array.isArray(normalizedSampleData) ? (
                    Object.entries(normalizedSampleData).map(([key, value]) =>
                      Array.isArray(value) ? (
                        <SampleDataTable key={key} data={value} title={key.charAt(0).toUpperCase() + key.slice(1)} />
                      ) : typeof value === 'object' ? (
                        <pre key={key} className="bg-docs-section p-2 rounded text-xs overflow-x-auto">{JSON.stringify(value, null, 2)}</pre>
                      ) : null
                    )
                  ) : Array.isArray(normalizedSampleData) ? (
                    <SampleDataTable data={normalizedSampleData} />
                  ) : typeof normalizedSampleData === 'object' ? (
                    <pre className="bg-docs-section p-2 rounded text-xs overflow-x-auto">{JSON.stringify(normalizedSampleData, null, 2)}</pre>
                  ) : (
                    <pre className="bg-docs-section p-2 rounded text-xs overflow-x-auto">{String(normalizedSampleData)}</pre>
                  )}
                </div>
              );
            })()}
            {/* Connector Selection UI only for Customer Data */}
            {dataMode === 'customer' ? (
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
            ) : null}
            {dataMode === 'customer' &&mappingResult ? (
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
                {mappingResult.error && (
                  <div className="text-red-500">{mappingResult.error}</div>
                )}
              </div>
            ) : dataMode === 'customer'?(
              <p className="text-docs-muted">No data requirements available.</p>
            ):  <p className="text-docs-muted">Sample data.</p>}
          </div>
        )}
        {activeTab === 'Enrich' && (
          <div>
            <h3 className="text-lg font-medium text-docs-text mb-2">Data Enrichment</h3>
            {/* Animated loading for enrichment */}
            {enrichLoading && (
              <div className="flex items-center gap-2 text-docs-muted animate-pulse mb-4">
                <svg className="animate-spin h-5 w-5 text-blue-400" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                <span>{enrichLoadingMessages[enrichLoadingMsgIdx]}</span>
              </div>
            )}
            {enrichError && <p className="text-red-500">{enrichError}</p>}
            {enrichSources && (
              <div className="mb-4">
                <h4 className="font-medium mb-2">Enrichment Sources</h4>
                <ul className="list-disc list-inside text-docs-muted">
                  {Array.isArray(enrichSources)
                    ? enrichSources.map((src: any, i: number) => (
                        <li key={i}>{src.source || JSON.stringify(src)}</li>
                      ))
                    : <li>{JSON.stringify(enrichSources)}</li>}
                </ul>
              </div>
            )}
            {enrichedData && (
              <div className="mb-4">
                <h4 className="font-medium mb-2">Enriched Sample Data</h4>
                {typeof enrichedData === 'object' && !Array.isArray(enrichedData) ? (
                  Object.entries(enrichedData).map(([key, value]) =>
                    Array.isArray(value) ? (
                      <SampleDataTable key={key} data={value} title={key.charAt(0).toUpperCase() + key.slice(1)} />
                    ) : null
                  )
                ) : Array.isArray(enrichedData) ? (
                  <SampleDataTable data={enrichedData} />
                ) : typeof enrichedData === 'object' ? (
                  <pre className="bg-docs-section p-2 rounded text-xs overflow-x-auto">{JSON.stringify(enrichedData, null, 2)}</pre>
                ) : (
                  <pre className="bg-docs-section p-2 rounded text-xs overflow-x-auto">{String(enrichedData)}</pre>
                )}
              </div>
            )}
            {!enrichLoading && !enrichedData && <p className="text-docs-muted">No enrichment performed yet.</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default Step2DataPrep;