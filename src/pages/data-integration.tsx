import Layout from '@/components/Layout';
import { useState } from 'react';
import MappingResult from '@/components/data-integration/MappingResult';
import ConnectorCatalog from '@/components/data-integration/ConnectorCatalog';
import ConnectorSetupWizard from '@/components/data-integration/ConnectorSetupWizard';
import ConnectionList from '@/components/data-integration/ConnectionList';
import TableSelector from '@/components/data-integration/TableSelector';
import IntentPromptModal from '@/components/data-integration/IntentPromptModal';
import IntegrationResult from '@/components/data-integration/IntegrationResult';
import ModelBuildResult from '@/components/data-integration/ModelBuildResult';

export default function DataIntegrationPage() {
  // Selected connector and its configuration
  const [selectedConnector, setSelectedConnector] = useState<any>(null);
  const [connectorConfig, setConnectorConfig] = useState<Record<string, any> | null>(null);
  // Modals: connector setup, table selection, intent interpretation
  const [wizardOpen, setWizardOpen] = useState(false);
  const [tablesOpen, setTablesOpen] = useState(false);
  const [intentOpen, setIntentOpen] = useState(false);
  // User selections
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [intentResult, setIntentResult] = useState<any>(null);
  const [intentInput, setIntentInput] = useState<string>('');
  // Data mapping state
  const [mappingLoading, setMappingLoading] = useState(false);
  const [mappingError, setMappingError] = useState<string | null>(null);
  const [mappingResult, setMappingResult] = useState<any | null>(null);
  // Data integration (enrichment) state
  const [integrationLoading, setIntegrationLoading] = useState(false);
  const [integrationError, setIntegrationError] = useState<string | null>(null);
  const [integrationResult, setIntegrationResult] = useState<any | null>(null);
  // Model build state
  const [buildLoading, setBuildLoading] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [buildResults, setBuildResults] = useState<any[] | null>(null);

  const handleConnectorSelect = (connector: any) => {
    setSelectedConnector(connector);
    setWizardOpen(true);
  };

  // After connector setup completes, go to table selection
  const handleWizardComplete = (config: Record<string, any>) => {
    setConnectorConfig(config);
    setWizardOpen(false);
    setTablesOpen(true);
  };

  return (
    <Layout>
      <div className="h-[calc(100vh-4rem)] bg-docs-body overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-docs-section rounded-xl p-8 shadow-lg border border-docs-section-border">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-3xl font-bold text-docs-heading mb-8">
                Data Integration
              </h1>
              {/* Connector Catalog will go here */}
              <div className="my-8">
                <ConnectorCatalog onSelect={handleConnectorSelect} />
              </div>
              <ConnectorSetupWizard
                open={wizardOpen}
                onClose={() => setWizardOpen(false)}
                connector={selectedConnector}
                onComplete={handleWizardComplete}
              />
              {/* Table selection after connector setup */}
              <TableSelector
                open={tablesOpen}
                onClose={() => setTablesOpen(false)}
                onSelect={tables => {
                  setSelectedTables(tables);
                  setTablesOpen(false);
                  // Next: prompt for problem description
                  setIntentOpen(true);
                }}
                initialSelection={[]}
              />
              {/* Intent interpretation after table selection */}
              <IntentPromptModal
                open={intentOpen}
                onClose={() => setIntentOpen(false)}
                onSubmit={(result, userInput) => {
                  setIntentInput(userInput);
                  setIntentResult(result);
                  setIntentOpen(false);
                  console.log('Intent result:', result, 'Input:', userInput);
                }}
              />
              {/* Data Mapping step after intent interpretation */}
              {intentResult && (
                <div className="mt-6">
                  <h2 className="text-xl font-semibold">Intent Interpretation</h2>
                  <div className="bg-gray-50 border border-gray-200 rounded p-4 mt-2">
                    <p><strong>Problem Type:</strong> {intentResult.output.problemType}</p>
                    <p><strong>Context:</strong> {JSON.stringify(intentResult.output.context)}</p>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={async () => {
                        setMappingLoading(true);
                        setMappingError(null);
                        try {
                          const res = await fetch('/api/mcp/map', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              sessionId: selectedConnector?.sourceDefinitionId || '',
                              userInput: intentInput,
                              intentDetails: intentResult,
                              requiredFields: intentResult.output.context.requiredFields || [],
                              databaseFields: [],
                              tablesToScan: selectedTables,
                              problemType: intentResult.output.problemType
                            })
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.error || 'Mapping failed');
                          setMappingResult(data);
                        } catch (err: any) {
                          setMappingError(err.message);
                        } finally {
                          setMappingLoading(false);
                        }
                      }}
                      className="bg-docs-accent text-white px-4 py-2 rounded"
                      disabled={mappingLoading}
                    >
                      {mappingLoading ? 'Mapping...' : 'Run Data Mapping'}
                    </button>
                  </div>
                  {mappingError && <div className="text-red-600 mt-2">{mappingError}</div>}
                  {mappingResult && <MappingResult result={mappingResult} />}
                </div>
              )}
              {/* Data Mapping step after intent interpretation */}
              {intentResult && (
                <div className="mt-6">
                  <h2 className="text-xl font-semibold">Intent Interpretation</h2>
                  <div className="bg-gray-50 border border-gray-200 rounded p-4 mt-2">
                    <p><strong>Problem Type:</strong> {intentResult.output.problemType}</p>
                    <p><strong>Context:</strong> {JSON.stringify(intentResult.output.context)}</p>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={async () => {
                        setMappingLoading(true);
                        setMappingError(null);
                        setMappingResult(null);
                        try {
                          const res = await fetch('/api/mcp/map', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              sessionId: selectedConnector?.sourceDefinitionId || '',
                              userInput: intentInput,
                              intentDetails: intentResult,
                              requiredFields: intentResult.output.context.requiredFields || [],
                              databaseFields: [],
                              tablesToScan: selectedTables,
                              problemType: intentResult.output.problemType
                            })
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.error || 'Mapping failed');
                          setMappingResult(data);
                        } catch (err: any) {
                          setMappingError(err.message);
                        } finally {
                          setMappingLoading(false);
                        }
                      }}
                      className="bg-docs-accent text-white px-4 py-2 rounded"
                      disabled={mappingLoading}
                    >
                      {mappingLoading ? 'Mapping...' : 'Run Data Mapping'}
                    </button>
                    {/* Integrate Data (enrichment) button */}
                    {mappingResult && !integrationResult && (
                      <button
                        onClick={async () => {
                          setIntegrationLoading(true);
                          setIntegrationError(null);
                          try {
                            const res = await fetch('/api/mcp/integrate', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                sessionId: selectedConnector?.sourceDefinitionId || '',
                                problemType: intentResult.output.problemType,
                                userInput: intentInput
                              })
                            });
                            const data = await res.json();
                            if (!res.ok) throw new Error(data.error || 'Integration failed');
                            setIntegrationResult(data);
                          } catch (err: any) {
                            setIntegrationError(err.message);
                          } finally {
                            setIntegrationLoading(false);
                          }
                        }}
                        className="bg-green-600 text-white px-4 py-2 rounded"
                        disabled={integrationLoading}
                      >
                        {integrationLoading ? 'Integrating...' : 'Integrate Data'}
                      </button>
                    )}
                  </div>
                  {mappingError && <div className="text-red-600 mt-2">{mappingError}</div>}
                  {mappingResult && <MappingResult result={mappingResult} />}
                  {integrationError && <div className="text-red-600 mt-2">{integrationError}</div>}
                  {integrationResult && <IntegrationResult result={integrationResult} />}
                  {/* Build model after integration */}
                  {/* Build & Solve model after integration */}
                  {!buildResults && integrationResult && (
                    <div className="mt-4">
                      <button
                        onClick={async () => {
                          setBuildLoading(true);
                          setBuildError(null);
                          try {
                            const mcpPayload = {
                              sessionId: selectedConnector?.sourceDefinitionId || '',
                              version: '1.0.0',
                              status: 'pending',
                              created: new Date().toISOString(),
                              lastModified: new Date().toISOString(),
                              model: {
                                variables: [],
                                constraints: [],
                                objective: { type: 'minimize', field: '', description: '', weight: 1 }
                              },
                              context: {
                                environment: { region: 'us-east-1', timezone: 'UTC' },
                                dataset: {
                                  internalSources: ['supabase'],
                                  requiredFields: intentResult.output.context.requiredFields || [],
                                  metadata: {
                                    userInput: intentInput,
                                    intentDetails: intentResult,
                                    mappingResult,
                                    integrationResult,
                                    tables: selectedTables
                                  }
                                },
                                problemType: intentResult.output.problemType,
                                industry: 'logistics'
                              },
                              protocol: [
                                { id: 'build_model', action: 'build_model', description: 'Build optimization model', required: true },
                                { id: 'solve_model', action: 'solve_model', description: 'Solve optimization model', required: true }
                              ]
                            };
                            const res = await fetch('/api/mcp/submit', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(mcpPayload)
                            });
                            const data = await res.json();
                            if (!res.ok) throw new Error(data.error || 'Model build/solve failed');
                            setBuildResults(data.results);
                          } catch (err: any) {
                            setBuildError(err.message);
                          } finally {
                            setBuildLoading(false);
                          }
                        }}
                        className="bg-purple-600 text-white px-4 py-2 rounded"
                        disabled={buildLoading}
                      >
                        {buildLoading ? 'Building & Solving...' : 'Build & Solve Model'}
                      </button>
                    </div>
                  )}
                  {buildError && <div className="text-red-600 mt-2">{buildError}</div>}
                  {buildResults && (
                    <>
                      <ModelBuildResult results={buildResults} />
                      <div className="mt-4">
                        <h3 className="text-lg font-semibold mb-2">Decision Endpoint</h3>
                        <pre className="bg-gray-50 p-2 rounded text-sm overflow-auto">
                          {`${typeof window !== 'undefined' ? window.location.origin : ''}/api/decision/${selectedConnector?.sourceDefinitionId}`}
                        </pre>
                      </div>
                    </>
                  )}
                </div>
              )}
              {/* List existing connections */}
              <ConnectionList />
              {/* Future: Setup wizard, connection list, sync monitoring */}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 