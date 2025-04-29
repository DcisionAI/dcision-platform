import Layout from '@/components/Layout';
import { useState } from 'react';
import { 
  CloudArrowUpIcon, 
  CloudIcon, 
  ArrowUpTrayIcon,
  ServerIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface CloudConfig {
  region?: string;
  instance?: string;
  server?: string;
  projectUrl?: string;
  apiKey?: string;
}

interface ConnectionConfig {
  host: string;
  port: number;
  database: string;
  username: string;
}

interface AuthenticationConfig {
  password: string;
  ssl_mode: 'disable' | 'require' | 'verify-ca' | 'verify-full';
}

interface DataSourceConfig {
  connection: ConnectionConfig;
  authentication: AuthenticationConfig;
  cloud: CloudConfig;
}

type DataSourceId = 'aws' | 'azure' | 'gcp' | 'supabase' | 'postgres' | 'mysql' | 'upload';
type ConfigSection = keyof DataSourceConfig;
type ConnectionField = keyof ConnectionConfig;
type AuthenticationField = keyof AuthenticationConfig;
type CloudField = keyof CloudConfig;
type ConfigField = ConnectionField | AuthenticationField | CloudField;

const defaultConfig: DataSourceConfig = {
  connection: {
    host: '',
    port: 5432,
    database: '',
    username: ''
  },
  authentication: {
    password: '',
    ssl_mode: 'disable'
  },
  cloud: {}
};

const dataSources = [
  {
    id: 'aws' as const,
    name: 'AWS RDS',
    description: 'Connect to Amazon RDS databases',
    icon: CloudIcon,
    color: 'bg-[#FF9900]',
    fields: ['region', 'instance', 'database', 'username', 'password'] as const
  },
  {
    id: 'azure' as const,
    name: 'Azure Database',
    description: 'Connect to Azure Database services',
    icon: CloudArrowUpIcon,
    color: 'bg-[#0078D4]',
    fields: ['server', 'database', 'username', 'password'] as const
  },
  {
    id: 'gcp' as const,
    name: 'Google Cloud SQL',
    description: 'Connect to Google Cloud SQL instances',
    icon: CloudIcon,
    color: 'bg-[#4285F4]',
    fields: ['instance', 'region', 'database', 'username', 'password'] as const
  },
  {
    id: 'supabase' as const,
    name: 'Supabase',
    description: 'Connect to Supabase projects',
    icon: ServerIcon,
    color: 'bg-[#3ECF8E]',
    fields: ['projectUrl', 'apiKey'] as const
  },
  {
    id: 'postgres' as const,
    name: 'PostgreSQL',
    description: 'Connect to PostgreSQL databases',
    icon: ArrowUpTrayIcon,
    color: 'bg-[#336791]',
    fields: ['host', 'port', 'database', 'username', 'password'] as const
  },
  {
    id: 'mysql' as const,
    name: 'MySQL',
    description: 'Connect to MySQL databases',
    icon: ArrowUpTrayIcon,
    color: 'bg-[#00758F]',
    fields: ['host', 'port', 'database', 'username', 'password'] as const
  },
  {
    id: 'upload' as const,
    name: 'File Upload',
    description: 'Upload CSV, Excel, or JSON files',
    icon: ArrowUpTrayIcon,
    color: 'bg-docs-accent',
    fields: [] as const
  }
] as const;

function classNames(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

const getFieldSection = (field: ConfigField): ConfigSection => {
  if (['host', 'port', 'database', 'username'].includes(field)) return 'connection';
  if (['password', 'ssl_mode'].includes(field)) return 'authentication';
  return 'cloud';
};

const getConfigValue = (config: DataSourceConfig, field: ConfigField): string | number => {
  const section = getFieldSection(field);
  const sectionData = config[section];
  return (sectionData as any)[field] ?? '';
};

export default function DataIntegrationPage() {
  const [selectedSource, setSelectedSource] = useState<DataSourceId>('aws');
  const [config, setConfig] = useState<DataSourceConfig>(defaultConfig);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSourceSelect = (sourceId: DataSourceId) => {
    setSelectedSource(sourceId);
    setConfig(defaultConfig);
    setConnectionStatus('idle');
  };

  const handleConfigChange = (section: ConfigSection, field: string, value: string | number) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    setConnectionStatus('idle');
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setConnectionStatus('idle');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setConnectionStatus('success');
    } catch (error) {
      setConnectionStatus('error');
    } finally {
      setIsConnecting(false);
    }
  };

  const selectedSourceData = dataSources.find(source => source.id === selectedSource);

  return (
    <Layout>
      <div className="h-[calc(100vh-4rem)] bg-docs-body overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-docs-section rounded-xl p-8 shadow-lg border border-docs-section-border">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-3xl font-bold text-docs-heading mb-8">
                Connect Data Source
              </h1>

              <div className="space-y-8">
                {/* Data Source Selection */}
                <div>
                  <h2 className="text-xl font-semibold text-docs-heading mb-4">
                    Select Data Source
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {dataSources.map((source) => (
                      <button
                        key={source.id}
                        onClick={() => handleSourceSelect(source.id)}
                        className={classNames(
                          'relative rounded-lg p-4 text-left hover:bg-docs-hover focus:outline-none',
                          selectedSource === source.id ? 'ring-2 ring-docs-accent' : 'border border-docs-border'
                        )}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={classNames(
                            'flex-shrink-0 rounded-lg p-2',
                            source.color
                          )}>
                            <source.icon className="h-6 w-6 text-white" aria-hidden="true" />
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-docs-heading">
                              {source.name}
                            </h3>
                            <p className="text-sm text-docs-text">
                              {source.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Configuration Form */}
                {selectedSourceData && selectedSourceData.fields.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold text-docs-heading mb-4">
                      Configure Connection
                    </h2>
                    <div className="space-y-4">
                      {selectedSourceData.fields.map((field) => (
                        <div key={field}>
                          <label htmlFor={field} className="block text-sm font-medium text-docs-text">
                            {field.charAt(0).toUpperCase() + field.slice(1)}
                          </label>
                          <div className="mt-1">
                            <input
                              type={field === 'password' ? 'password' : 'text'}
                              value={getConfigValue(config, field as ConfigField)}
                              onChange={(e) => {
                                const newValue = field === 'port' ? parseInt(e.target.value, 10) : e.target.value;
                                handleConfigChange(getFieldSection(field as ConfigField), field, newValue);
                              }}
                              className="w-full rounded-md bg-docs-bg border-docs-border text-docs-text px-3 py-2 focus:outline-none focus:ring-2 focus:ring-docs-accent"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6">
                      <button
                        onClick={handleConnect}
                        disabled={isConnecting}
                        className={classNames(
                          'w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white',
                          isConnecting ? 'bg-docs-accent/70' : 'bg-docs-accent hover:bg-docs-accent/90'
                        )}
                      >
                        {isConnecting ? 'Connecting...' : 'Connect'}
                      </button>
                    </div>

                    {connectionStatus !== 'idle' && (
                      <div className={classNames(
                        'mt-4 p-4 rounded-md',
                        connectionStatus === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                      )}>
                        {connectionStatus === 'success' ? 'Successfully connected!' : 'Connection failed. Please check your credentials.'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 