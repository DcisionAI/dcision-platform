import Layout from '@/components/Layout';
import { useState } from 'react';
import {
  CloudArrowUpIcon,
  CodeBracketIcon,
  CogIcon,
  KeyIcon,
  ClockIcon,
  CircleStackIcon,
  ArrowPathIcon,
  BoltIcon,
  CubeIcon,
  AdjustmentsHorizontalIcon,
  DocumentTextIcon,
  ChatBubbleBottomCenterTextIcon
} from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface MCPConfig {
  context: {
    domain: 'fleet_routing' | 'workforce_scheduling' | 'resource_allocation' | 'project_scheduling';
    description: string;
    examples: string[];
  };
  model: {
    type: 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3';
    temperature: number;
    maxTokens: number;
  };
  protocol: {
    inputFormat: {
      type: 'json' | 'text' | 'structured';
      schema?: Record<string, any>;
      validation?: Record<string, any>;
    };
    outputFormat: {
      type: 'json' | 'text' | 'structured';
      schema?: Record<string, any>;
    };
    errorHandling: {
      retryStrategy: 'none' | 'exponential' | 'fixed';
      maxRetries: number;
      fallbackBehavior: 'fail' | 'default' | 'alternate';
    };
  };
  prompts: {
    system: string;
    examples: Array<{
      input: string;
      output: string;
    }>;
    validation?: string;
  };
}

interface Endpoint {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'error';
  lastDeployed?: string;
  url: string;
  requests: number;
  latency: number;
  mcpConfig: MCPConfig;
}

interface NewEndpointFormData {
  name: string;
  description: string;
  context: {
    domain: MCPConfig['context']['domain'];
    description: string;
    examples: string[];
  };
  model: {
    type: MCPConfig['model']['type'];
    temperature: number;
    maxTokens: number;
  };
  protocol: {
    inputFormat: {
      type: MCPConfig['protocol']['inputFormat']['type'];
      schema: string;
    };
    outputFormat: {
      type: MCPConfig['protocol']['outputFormat']['type'];
      schema: string;
    };
    errorHandling: {
      retryStrategy: MCPConfig['protocol']['errorHandling']['retryStrategy'];
      maxRetries: number;
      fallbackBehavior: MCPConfig['protocol']['errorHandling']['fallbackBehavior'];
    };
  };
  prompts: {
    system: string;
    examples: string;
    validation: string;
  };
}

const mockEndpoints: Endpoint[] = [
  {
    id: 'fleet-opt-1',
    name: 'Fleet Optimization API',
    description: 'Route optimization and vehicle allocation endpoint',
    status: 'active',
    lastDeployed: '2024-03-15T10:30:00Z',
    url: 'https://api.dcision.ai/v1/fleet-optimization',
    requests: 15243,
    latency: 245,
    mcpConfig: {
      context: {
        domain: 'fleet_routing',
        description: 'Optimize vehicle routes and schedules for efficient delivery operations',
        examples: [
          'Optimize delivery routes for 20 vehicles across 100 locations',
          'Schedule deliveries with time windows and vehicle capacity constraints',
          'Balance workload across drivers while minimizing total distance'
        ]
      },
      model: {
        type: 'gpt-4',
        temperature: 0.2,
        maxTokens: 2000
      },
      protocol: {
        inputFormat: {
          type: 'json',
          schema: {
            vehicles: 'array',
            locations: 'array',
            timeWindows: 'array'
          },
          validation: {
            required: ['vehicles', 'locations']
          }
        },
        outputFormat: {
          type: 'json',
          schema: {
            routes: 'array',
            metrics: 'object'
          }
        },
        errorHandling: {
          retryStrategy: 'exponential',
          maxRetries: 3,
          fallbackBehavior: 'fail'
        }
      },
      prompts: {
        system: "You are a fleet routing expert. Analyze the input data and provide optimized routes that minimize total distance while respecting vehicle capacities and time windows.",
        examples: [
          {
            input: '{"vehicles": [...], "locations": [...]}',
            output: '{"routes": [...], "metrics": {...}}'
          }
        ],
        validation: "Ensure all routes respect vehicle capacity constraints and delivery time windows."
      }
    }
  },
  {
    id: 'demand-pred-1',
    name: 'Demand Prediction API',
    description: 'Time series forecasting for demand prediction',
    status: 'active',
    lastDeployed: '2024-03-14T15:45:00Z',
    url: 'https://api.dcision.ai/v1/demand-prediction',
    requests: 8721,
    latency: 180,
    mcpConfig: {
      context: {
        domain: 'resource_allocation',
        description: 'Predict future demand patterns using historical data and contextual factors',
        examples: [
          'Forecast weekly demand for next 3 months based on historical sales',
          'Predict seasonal demand variations with external factors',
          'Estimate required inventory levels based on demand forecast'
        ]
      },
      model: {
        type: 'gpt-4',
        temperature: 0.1,
        maxTokens: 1500
      },
      protocol: {
        inputFormat: {
          type: 'json',
          schema: {
            historicalData: 'array',
            externalFactors: 'array',
            forecastPeriod: 'number'
          },
          validation: {
            required: ['historicalData', 'forecastPeriod']
          }
        },
        outputFormat: {
          type: 'json',
          schema: {
            forecast: 'array',
            confidence: 'array'
          }
        },
        errorHandling: {
          retryStrategy: 'exponential',
          maxRetries: 3,
          fallbackBehavior: 'default'
        }
      },
      prompts: {
        system: "You are a demand forecasting expert. Analyze historical data and provide detailed demand predictions with confidence intervals.",
        examples: [
          {
            input: '{"historicalData": [...], "forecastPeriod": 12}',
            output: '{"forecast": [...], "confidence": [...]}'
          }
        ],
        validation: "Ensure forecasts are within reasonable bounds and confidence intervals are properly calculated."
      }
    }
  }
];

const defaultFormData: NewEndpointFormData = {
  name: '',
  description: '',
  context: {
    domain: 'fleet_routing',
    description: '',
    examples: ['']
  },
  model: {
    type: 'gpt-4',
    temperature: 0.2,
    maxTokens: 2000
  },
  protocol: {
    inputFormat: {
      type: 'json',
      schema: '{}'
    },
    outputFormat: {
      type: 'json',
      schema: '{}'
    },
    errorHandling: {
      retryStrategy: 'exponential',
      maxRetries: 3,
      fallbackBehavior: 'fail'
    }
  },
  prompts: {
    system: '',
    examples: '[]',
    validation: ''
  }
};

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

function NewEndpointModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [formData, setFormData] = useState<NewEndpointFormData>(defaultFormData);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the data to your backend
    console.log('Submitting new endpoint:', formData);
    onClose();
  };

  const updateFormData = (section: keyof NewEndpointFormData, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: typeof prev[section] === 'object'
        ? { ...prev[section], [field]: value }
        : value
    }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-docs-text mb-1">
                Endpoint Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateFormData('name', '', e.target.value)}
                className="w-full rounded-md bg-docs-bg border-docs-border text-docs-text px-3 py-2 text-sm"
                placeholder="e.g., Fleet Optimization API"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-docs-text mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormData('description', '', e.target.value)}
                className="w-full rounded-md bg-docs-bg border-docs-border text-docs-text px-3 py-2 text-sm"
                rows={3}
                placeholder="Describe what this endpoint does..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-docs-text mb-1">
                Domain
              </label>
              <select
                value={formData.context.domain}
                onChange={(e) => updateFormData('context', 'domain', e.target.value)}
                className="w-full rounded-md bg-docs-bg border-docs-border text-docs-text px-3 py-2 text-sm"
              >
                <option value="fleet_routing">Fleet Routing</option>
                <option value="workforce_scheduling">Workforce Scheduling</option>
                <option value="resource_allocation">Resource Allocation</option>
                <option value="project_scheduling">Project Scheduling</option>
              </select>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-docs-text mb-1">
                Model Type
              </label>
              <select
                value={formData.model.type}
                onChange={(e) => updateFormData('model', 'type', e.target.value)}
                className="w-full rounded-md bg-docs-bg border-docs-border text-docs-text px-3 py-2 text-sm"
              >
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="claude-3">Claude 3</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-docs-text mb-1">
                Temperature
              </label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={formData.model.temperature}
                onChange={(e) => updateFormData('model', 'temperature', parseFloat(e.target.value))}
                className="w-full rounded-md bg-docs-bg border-docs-border text-docs-text px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-docs-text mb-1">
                Max Tokens
              </label>
              <input
                type="number"
                min="1"
                max="8000"
                value={formData.model.maxTokens}
                onChange={(e) => updateFormData('model', 'maxTokens', parseInt(e.target.value))}
                className="w-full rounded-md bg-docs-bg border-docs-border text-docs-text px-3 py-2 text-sm"
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-docs-text mb-1">
                Input Format
              </label>
              <select
                value={formData.protocol.inputFormat.type}
                onChange={(e) => updateFormData('protocol', 'inputFormat', { ...formData.protocol.inputFormat, type: e.target.value })}
                className="w-full rounded-md bg-docs-bg border-docs-border text-docs-text px-3 py-2 text-sm"
              >
                <option value="json">JSON</option>
                <option value="text">Text</option>
                <option value="structured">Structured</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-docs-text mb-1">
                Input Schema
              </label>
              <textarea
                value={formData.protocol.inputFormat.schema}
                onChange={(e) => updateFormData('protocol', 'inputFormat', { ...formData.protocol.inputFormat, schema: e.target.value })}
                className="w-full rounded-md bg-docs-bg border-docs-border text-docs-text px-3 py-2 text-sm font-mono"
                rows={4}
                placeholder="Enter JSON schema..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-docs-text mb-1">
                Output Format
              </label>
              <select
                value={formData.protocol.outputFormat.type}
                onChange={(e) => updateFormData('protocol', 'outputFormat', { ...formData.protocol.outputFormat, type: e.target.value })}
                className="w-full rounded-md bg-docs-bg border-docs-border text-docs-text px-3 py-2 text-sm"
              >
                <option value="json">JSON</option>
                <option value="text">Text</option>
                <option value="structured">Structured</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-docs-text mb-1">
                Output Schema
              </label>
              <textarea
                value={formData.protocol.outputFormat.schema}
                onChange={(e) => updateFormData('protocol', 'outputFormat', { ...formData.protocol.outputFormat, schema: e.target.value })}
                className="w-full rounded-md bg-docs-bg border-docs-border text-docs-text px-3 py-2 text-sm font-mono"
                rows={4}
                placeholder="Enter JSON schema..."
              />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-docs-text mb-1">
                System Prompt
              </label>
              <textarea
                value={formData.prompts.system}
                onChange={(e) => updateFormData('prompts', 'system', e.target.value)}
                className="w-full rounded-md bg-docs-bg border-docs-border text-docs-text px-3 py-2 text-sm"
                rows={4}
                placeholder="Enter system prompt..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-docs-text mb-1">
                Examples
              </label>
              <textarea
                value={formData.prompts.examples}
                onChange={(e) => updateFormData('prompts', 'examples', e.target.value)}
                className="w-full rounded-md bg-docs-bg border-docs-border text-docs-text px-3 py-2 text-sm font-mono"
                rows={4}
                placeholder="Enter examples in JSON array format..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-docs-text mb-1">
                Validation Prompt
              </label>
              <textarea
                value={formData.prompts.validation}
                onChange={(e) => updateFormData('prompts', 'validation', e.target.value)}
                className="w-full rounded-md bg-docs-bg border-docs-border text-docs-text px-3 py-2 text-sm"
                rows={3}
                placeholder="Enter validation prompt..."
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-xl bg-docs-section p-6 shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium text-docs-heading mb-4">
                  Create New Endpoint - Step {currentStep} of {totalSteps}
                </Dialog.Title>

                <form onSubmit={handleSubmit}>
                  <div className="mb-6">
                    {renderStep()}
                  </div>

                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                      className="px-4 py-2 text-sm font-medium text-docs-text bg-docs-bg rounded-lg border border-docs-border hover:bg-docs-hover"
                      disabled={currentStep === 1}
                    >
                      Previous
                    </button>
                    <div className="space-x-3">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-docs-text bg-docs-bg rounded-lg border border-docs-border hover:bg-docs-hover"
                      >
                        Cancel
                      </button>
                      {currentStep < totalSteps ? (
                        <button
                          type="button"
                          onClick={() => setCurrentStep(prev => Math.min(totalSteps, prev + 1))}
                          className="px-4 py-2 text-sm font-medium text-white bg-docs-accent rounded-lg hover:bg-docs-accent/90"
                        >
                          Next
                        </button>
                      ) : (
                        <button
                          type="submit"
                          className="px-4 py-2 text-sm font-medium text-white bg-docs-accent rounded-lg hover:bg-docs-accent/90"
                        >
                          Create Endpoint
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default function EndpointsPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);
  const [showNewEndpointModal, setShowNewEndpointModal] = useState(false);

  const getStatusColor = (status: Endpoint['status']) => {
    switch (status) {
      case 'active':
        return 'text-green-400';
      case 'inactive':
        return 'text-gray-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <Layout>
      <div className="h-[calc(100vh-4rem)] bg-docs-body overflow-hidden">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-80 border-r border-docs-border bg-docs-section overflow-y-auto">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-docs-heading">
                  Endpoints
                </h2>
                <button
                  onClick={() => setShowNewEndpointModal(true)}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-docs-accent rounded-lg hover:bg-docs-accent/90"
                >
                  New Endpoint
                </button>
              </div>
              <nav className="space-y-2">
                {mockEndpoints.map((endpoint) => (
                  <button
                    key={endpoint.id}
                    onClick={() => setSelectedEndpoint(endpoint.id)}
                    className={classNames(
                      'w-full flex items-start p-3 text-left rounded-lg transition-colors',
                      selectedEndpoint === endpoint.id
                        ? 'bg-docs-accent/10 text-docs-accent'
                        : 'hover:bg-docs-hover text-docs-text'
                    )}
                  >
                    <div className="w-full">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{endpoint.name}</span>
                        <span className={classNames('text-xs', getStatusColor(endpoint.status))}>
                          ● {endpoint.status}
                        </span>
                      </div>
                      <p className="text-xs text-docs-muted mt-1">
                        {endpoint.description}
                      </p>
                      <div className="mt-2 flex items-center space-x-4 text-xs text-docs-muted">
                        <span className="flex items-center">
                          <ClockIcon className="h-3.5 w-3.5 mr-1" />
                          {new Date(endpoint.lastDeployed!).toLocaleDateString()}
                        </span>
                        <span className="flex items-center">
                          <BoltIcon className="h-3.5 w-3.5 mr-1" />
                          {endpoint.requests.toLocaleString()} reqs
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            {selectedEndpoint ? (
              <div className="p-8">
                {/* Header */}
                <div className="mb-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-docs-heading">
                        {mockEndpoints.find(e => e.id === selectedEndpoint)?.name}
                      </h1>
                      <p className="mt-2 text-docs-muted">
                        Domain: {mockEndpoints.find(e => e.id === selectedEndpoint)?.mcpConfig.context.domain.replace('_', ' ')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button className="px-4 py-2 text-sm font-medium text-docs-text bg-docs-section rounded-lg border border-docs-border hover:bg-docs-hover">
                        Test
                      </button>
                      <button className="px-4 py-2 text-sm font-medium text-white bg-docs-accent rounded-lg hover:bg-docs-accent/90">
                        Deploy
                      </button>
                    </div>
                  </div>
                </div>

                {/* Configuration Sections */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Context & Model */}
                  <div className="bg-docs-section rounded-xl p-6 shadow-lg border border-docs-section-border">
                    <h3 className="text-lg font-medium text-docs-heading mb-4 flex items-center">
                      <ChatBubbleBottomCenterTextIcon className="h-5 w-5 mr-2" />
                      Context & Model
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-docs-text mb-1">
                          Description
                        </label>
                        <p className="text-sm text-docs-text">
                          {mockEndpoints.find(e => e.id === selectedEndpoint)?.mcpConfig.context.description}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-docs-text mb-1">
                          Examples
                        </label>
                        <ul className="list-disc list-inside space-y-1">
                          {mockEndpoints.find(e => e.id === selectedEndpoint)?.mcpConfig.context.examples.map((example, index) => (
                            <li key={index} className="text-sm text-docs-text">{example}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-docs-text mb-1">
                          Model Configuration
                        </label>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-docs-muted">Type</span>
                            <span className="text-docs-text">{mockEndpoints.find(e => e.id === selectedEndpoint)?.mcpConfig.model.type}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-docs-muted">Temperature</span>
                            <span className="text-docs-text">{mockEndpoints.find(e => e.id === selectedEndpoint)?.mcpConfig.model.temperature}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-docs-muted">Max Tokens</span>
                            <span className="text-docs-text">{mockEndpoints.find(e => e.id === selectedEndpoint)?.mcpConfig.model.maxTokens}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Protocol */}
                  <div className="bg-docs-section rounded-xl p-6 shadow-lg border border-docs-section-border">
                    <h3 className="text-lg font-medium text-docs-heading mb-4 flex items-center">
                      <DocumentTextIcon className="h-5 w-5 mr-2" />
                      Protocol
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-docs-text mb-1">
                          Input Format
                        </label>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-docs-muted">Type</span>
                            <span className="text-docs-text">{mockEndpoints.find(e => e.id === selectedEndpoint)?.mcpConfig.protocol.inputFormat.type}</span>
                          </div>
                          {mockEndpoints.find(e => e.id === selectedEndpoint)?.mcpConfig.protocol.inputFormat.schema && (
                            <div className="text-sm">
                              <span className="text-docs-muted">Schema</span>
                              <pre className="mt-1 p-2 bg-docs-bg rounded text-xs overflow-auto">
                                {JSON.stringify(mockEndpoints.find(e => e.id === selectedEndpoint)?.mcpConfig.protocol.inputFormat.schema, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-docs-text mb-1">
                          Output Format
                        </label>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-docs-muted">Type</span>
                            <span className="text-docs-text">{mockEndpoints.find(e => e.id === selectedEndpoint)?.mcpConfig.protocol.outputFormat.type}</span>
                          </div>
                          {mockEndpoints.find(e => e.id === selectedEndpoint)?.mcpConfig.protocol.outputFormat.schema && (
                            <div className="text-sm">
                              <span className="text-docs-muted">Schema</span>
                              <pre className="mt-1 p-2 bg-docs-bg rounded text-xs overflow-auto">
                                {JSON.stringify(mockEndpoints.find(e => e.id === selectedEndpoint)?.mcpConfig.protocol.outputFormat.schema, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-docs-text mb-1">
                          Error Handling
                        </label>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-docs-muted">Retry Strategy</span>
                            <span className="text-docs-text">{mockEndpoints.find(e => e.id === selectedEndpoint)?.mcpConfig.protocol.errorHandling.retryStrategy}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-docs-muted">Max Retries</span>
                            <span className="text-docs-text">{mockEndpoints.find(e => e.id === selectedEndpoint)?.mcpConfig.protocol.errorHandling.maxRetries}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-docs-muted">Fallback</span>
                            <span className="text-docs-text">{mockEndpoints.find(e => e.id === selectedEndpoint)?.mcpConfig.protocol.errorHandling.fallbackBehavior}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Prompts */}
                  <div className="bg-docs-section rounded-xl p-6 shadow-lg border border-docs-section-border col-span-2">
                    <h3 className="text-lg font-medium text-docs-heading mb-4 flex items-center">
                      <ChatBubbleBottomCenterTextIcon className="h-5 w-5 mr-2" />
                      Prompts
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-docs-text mb-1">
                          System Prompt
                        </label>
                        <pre className="p-3 bg-docs-bg rounded text-sm text-docs-text font-mono whitespace-pre-wrap">
                          {mockEndpoints.find(e => e.id === selectedEndpoint)?.mcpConfig.prompts.system}
                        </pre>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-docs-text mb-1">
                          Examples
                        </label>
                        <div className="space-y-4">
                          {mockEndpoints.find(e => e.id === selectedEndpoint)?.mcpConfig.prompts.examples.map((example, index) => (
                            <div key={index} className="space-y-2">
                              <div>
                                <span className="text-xs font-medium text-docs-muted">Input:</span>
                                <pre className="mt-1 p-2 bg-docs-bg rounded text-xs overflow-auto">
                                  {example.input}
                                </pre>
                              </div>
                              <div>
                                <span className="text-xs font-medium text-docs-muted">Output:</span>
                                <pre className="mt-1 p-2 bg-docs-bg rounded text-xs overflow-auto">
                                  {example.output}
                                </pre>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      {mockEndpoints.find(e => e.id === selectedEndpoint)?.mcpConfig.prompts.validation && (
                        <div>
                          <label className="block text-sm font-medium text-docs-text mb-1">
                            Validation
                          </label>
                          <pre className="p-3 bg-docs-bg rounded text-sm text-docs-text font-mono whitespace-pre-wrap">
                            {mockEndpoints.find(e => e.id === selectedEndpoint)?.mcpConfig.prompts.validation}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* API Configuration */}
                  <div className="bg-docs-section rounded-xl p-6 shadow-lg border border-docs-section-border">
                    <h3 className="text-lg font-medium text-docs-heading mb-4 flex items-center">
                      <CodeBracketIcon className="h-5 w-5 mr-2" />
                      API Configuration
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-docs-text mb-1">
                          Endpoint URL
                        </label>
                        <input
                          type="text"
                          value={mockEndpoints.find(e => e.id === selectedEndpoint)?.url}
                          readOnly
                          className="w-full rounded-md bg-docs-bg border-docs-border text-docs-text px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-docs-text mb-1">
                          Version
                        </label>
                        <select className="w-full rounded-md bg-docs-bg border-docs-border text-docs-text px-3 py-2 text-sm">
                          <option>v1</option>
                          <option>v2</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Authentication */}
                  <div className="bg-docs-section rounded-xl p-6 shadow-lg border border-docs-section-border">
                    <h3 className="text-lg font-medium text-docs-heading mb-4 flex items-center">
                      <KeyIcon className="h-5 w-5 mr-2" />
                      Authentication
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-docs-text mb-1">
                          API Key
                        </label>
                        <div className="flex">
                          <input
                            type="password"
                            value="••••••••••••••••"
                            readOnly
                            className="flex-1 rounded-l-md bg-docs-bg border-docs-border text-docs-text px-3 py-2 text-sm"
                          />
                          <button className="px-3 py-2 bg-docs-bg border-l-0 border border-docs-border rounded-r-md text-docs-text hover:bg-docs-hover">
                            Regenerate
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-docs-text mb-1">
                          Access Control
                        </label>
                        <select className="w-full rounded-md bg-docs-bg border-docs-border text-docs-text px-3 py-2 text-sm">
                          <option>Public</option>
                          <option>Private</option>
                          <option>IP Restricted</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Performance */}
                  <div className="bg-docs-section rounded-xl p-6 shadow-lg border border-docs-section-border">
                    <h3 className="text-lg font-medium text-docs-heading mb-4 flex items-center">
                      <BoltIcon className="h-5 w-5 mr-2" />
                      Performance
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-docs-text mb-1">
                          Rate Limit
                        </label>
                        <select className="w-full rounded-md bg-docs-bg border-docs-border text-docs-text px-3 py-2 text-sm">
                          <option>1000 requests/minute</option>
                          <option>5000 requests/minute</option>
                          <option>Unlimited</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-docs-text mb-1">
                          Timeout
                        </label>
                        <select className="w-full rounded-md bg-docs-bg border-docs-border text-docs-text px-3 py-2 text-sm">
                          <option>30 seconds</option>
                          <option>60 seconds</option>
                          <option>120 seconds</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Monitoring */}
                  <div className="bg-docs-section rounded-xl p-6 shadow-lg border border-docs-section-border">
                    <h3 className="text-lg font-medium text-docs-heading mb-4 flex items-center">
                      <CircleStackIcon className="h-5 w-5 mr-2" />
                      Monitoring
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-docs-text mb-1">
                          Logging Level
                        </label>
                        <select className="w-full rounded-md bg-docs-bg border-docs-border text-docs-text px-3 py-2 text-sm">
                          <option>Error</option>
                          <option>Warning</option>
                          <option>Info</option>
                          <option>Debug</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-docs-text mb-1">
                          Alerts
                        </label>
                        <select className="w-full rounded-md bg-docs-bg border-docs-border text-docs-text px-3 py-2 text-sm">
                          <option>Email</option>
                          <option>Slack</option>
                          <option>Webhook</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-docs-muted">
                <div className="text-center">
                  <CloudArrowUpIcon className="h-12 w-12 mx-auto mb-4 text-docs-accent/20" />
                  <p>Select an endpoint to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <NewEndpointModal
        isOpen={showNewEndpointModal}
        onClose={() => setShowNewEndpointModal(false)}
      />
    </Layout>
  );
} 