import { useEffect, useState } from 'react';
import Modal from './Modal';

interface Connector {
  sourceDefinitionId: string;
  name: string;
  icon: string;
  documentationUrl?: string;
  dockerRepository?: string;
  releaseStage?: string;
  resourceRequirements?: any;
}

interface ConnectorSetupWizardProps {
  open: boolean;
  onClose: () => void;
  connector: Connector | null;
  onComplete: (config: Record<string, string | number>) => void;
}

interface SpecField {
  path: string;
  type: string;
  title: string;
  description?: string;
  required?: boolean;
  airbyte_secret?: boolean;
}

function parseSpecFields(spec: any): SpecField[] {
  // Parse Airbyte JSONSchema spec into flat fields
  if (!spec?.connectionSpecification?.properties) return [];
  const props = spec.connectionSpecification.properties;
  const required = spec.connectionSpecification.required || [];
  return Object.entries(props).map(([key, val]: [string, any]) => ({
    path: key,
    type: val.type,
    title: val.title || key,
    description: val.description,
    required: required.includes(key),
    airbyte_secret: val.airbyte_secret,
  }));
}

export default function ConnectorSetupWizard({ open, onClose, connector, onComplete }: ConnectorSetupWizardProps) {
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState<Record<string, string | number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<SpecField[]>([]);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string | null>(null);

  // Fetch connector spec when connector changes
  useEffect(() => {
    if (!connector) return;
    setFields([]);
    setConfig({});
    setTestStatus('idle');
    setTestMessage(null);
    setError(null);
    setLoading(true);
    fetch('/api/airbyte', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_spec', sourceDefinitionId: connector.sourceDefinitionId })
    })
      .then(res => res.json())
      .then(data => {
        const parsed = parseSpecFields(data);
        if (parsed.length > 0) {
          setFields(parsed);
        } else {
          // fallback to mock fields
          setFields([
            { path: 'host', type: 'string', title: 'Host', required: true },
            { path: 'port', type: 'number', title: 'Port', required: true },
            { path: 'database', type: 'string', title: 'Database', required: true },
            { path: 'username', type: 'string', title: 'Username', required: true },
            { path: 'password', type: 'string', title: 'Password', required: true, airbyte_secret: true },
          ]);
        }
        setLoading(false);
      })
      .catch(() => {
        setFields([
          { path: 'host', type: 'string', title: 'Host', required: true },
          { path: 'port', type: 'number', title: 'Port', required: true },
          { path: 'database', type: 'string', title: 'Database', required: true },
          { path: 'username', type: 'string', title: 'Username', required: true },
          { path: 'password', type: 'string', title: 'Password', required: true, airbyte_secret: true },
        ]);
        setLoading(false);
      });
  }, [connector]);

  const handleFieldChange = (name: string, value: string | number) => {
    setConfig((prev: Record<string, string | number>) => ({ ...prev, [name]: value }));
    setTestStatus('idle');
    setTestMessage(null);
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage(null);
    setError(null);
    try {
      const res = await fetch('/api/airbyte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_connection',
          sourceDefinitionId: connector?.sourceDefinitionId,
          connectionConfiguration: config
        })
      });
      const data = await res.json();
      if (data.status === 'succeeded') {
        setTestStatus('success');
        setTestMessage('Connection successful!');
      } else {
        setTestStatus('error');
        setTestMessage(data.message || 'Connection failed.');
      }
    } catch (err) {
      setTestStatus('error');
      setTestMessage('Connection test failed.');
    }
  };

  const handleNext = () => {
    setStep(s => s + 1);
  };

  const handleBack = () => {
    setStep(s => s - 1);
  };

  const handleFinish = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onComplete(config);
      onClose();
    }, 1000);
  };

  if (!connector) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Set up ${connector.name}`} widthClass="max-w-xl">
      <div>
        {/* Stepper */}
        <div className="flex items-center justify-center mb-6">
          {["Configure", "Review", "Finish"].map((label, idx) => (
            <div key={label} className="flex items-center">
              <div className={`rounded-full w-8 h-8 flex items-center justify-center font-bold text-white ${step >= idx ? 'bg-docs-accent' : 'bg-docs-border'}`}>{idx + 1}</div>
              {idx < 2 && <div className="w-8 h-1 bg-docs-border mx-2" />}
            </div>
          ))}
        </div>
        {/* Step Content */}
        {step === 0 && (
          <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleNext(); }}>
            {loading && <div className="text-center text-docs-muted py-4">Loading fields...</div>}
            {!loading && fields.map(field => (
              <div key={field.path}>
                <label className="block text-sm font-medium text-docs-text mb-1">{field.title}</label>
                <input
                  type={field.airbyte_secret ? 'password' : field.type === 'number' ? 'number' : 'text'}
                  required={field.required}
                  value={config[field.path] || ''}
                  onChange={e => handleFieldChange(field.path, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                  className="w-full rounded-md border border-docs-border px-3 py-2 bg-docs-bg text-docs-text focus:outline-none focus:ring-2 focus:ring-docs-accent"
                />
                {field.description && <div className="text-xs text-docs-muted mt-1">{field.description}</div>}
              </div>
            ))}
            <div className="flex items-center gap-4 pt-2">
              <button
                type="button"
                onClick={handleTestConnection}
                className="bg-blue-500 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-600"
                disabled={testStatus === 'testing' || loading}
              >
                {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
              </button>
              <button
                type="submit"
                className="bg-docs-accent text-white px-4 py-2 rounded-md font-medium hover:bg-docs-accent/90"
                disabled={testStatus !== 'success'}
              >
                Next
              </button>
            </div>
            {testStatus !== 'idle' && (
              <div className={`mt-2 ${testStatus === 'success' ? 'text-green-600' : 'text-red-600'}`}>{testMessage}</div>
            )}
            {error && <div className="text-red-600 mt-2">{error}</div>}
          </form>
        )}
        {step === 1 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Review Configuration</h3>
            <ul className="mb-6">
              {fields.map(field => (
                <li key={field.path} className="flex justify-between py-1 border-b border-dashed border-docs-border last:border-0">
                  <span className="text-docs-muted">{field.title}</span>
                  <span className="font-mono text-docs-heading">{config[field.path] || <span className="text-red-400">(missing)</span>}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between">
              <button onClick={handleBack} className="px-4 py-2 rounded-md border border-docs-border text-docs-text hover:bg-docs-hover">Back</button>
              <button onClick={handleFinish} className="bg-docs-accent text-white px-4 py-2 rounded-md font-medium hover:bg-docs-accent/90" disabled={loading}>
                {loading ? 'Finishing...' : 'Finish'}
              </button>
            </div>
            {error && <div className="text-red-600 mt-4">{error}</div>}
          </div>
        )}
        {step === 2 && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="text-3xl mb-2">🎉</div>
            <div className="text-lg font-semibold mb-2">Connector setup complete!</div>
            <div className="text-docs-muted mb-4">You can now use this data source for model building and enrichment.</div>
            <button onClick={onClose} className="bg-docs-accent text-white px-4 py-2 rounded-md font-medium hover:bg-docs-accent/90">Close</button>
          </div>
        )}
      </div>
    </Modal>
  );
} 