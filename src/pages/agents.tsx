import Layout from '@/components/Layout';
import { useState } from 'react';
import { Switch } from '@headlessui/react';
import { 
  BellIcon, 
  CloudIcon, 
  CogIcon, 
  ChartBarIcon,
  MagnifyingGlassIcon,
  CalculatorIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { useTheme } from '@/components/layout/ThemeContext';

interface AgentSettings {
  enabled: boolean;
  confidenceThreshold: number;
  requireHumanReview: boolean;
  autoApprove: boolean;
  notifications: {
    email: boolean;
    slack: boolean;
    webhook: string;
  };
}

const defaultSettings: AgentSettings = {
  enabled: true,
  confidenceThreshold: 0.8,
  requireHumanReview: true,
  autoApprove: false,
  notifications: {
    email: true,
    slack: false,
    webhook: ''
  }
};

const agents = [
  {
    id: 'intent',
    name: 'Intent Interpreter Agent',
    description: 'Analyzes natural language queries and determines execution path for any business domain',
    icon: MagnifyingGlassIcon,
    color: 'bg-gradient-to-br from-blue-500 to-blue-600',
  },
  {
    id: 'data-mapping',
    name: 'Data Enrichment Agent',
    description: 'Enriches enterprise data, identifies constraints, and prepares datasets for optimization modeling',
    icon: CogIcon,
    color: 'bg-gradient-to-br from-green-500 to-green-600',
  },
  {
    id: 'data-integration',
    name: 'Model Builder Agent',
    description: 'Creates mathematical optimization models using MCP protocol for complex business problems',
    icon: CalculatorIcon,
    color: 'bg-gradient-to-br from-purple-500 to-purple-600',
  },
  {
    id: 'explainability',
    name: 'Explain Agent',
    description: 'Translates optimization results into actionable insights for enterprise stakeholders',
    icon: DocumentTextIcon,
    color: 'bg-gradient-to-br from-orange-500 to-orange-600',
  }
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function AgentsPage() {
  const { theme } = useTheme();
  const [agentConfigs, setAgentConfigs] = useState<Record<string, AgentSettings>>(
    Object.fromEntries(agents.map(agent => [agent.id, { ...defaultSettings }]))
  );

  const updateAgentConfig = (agentId: string, updates: Partial<AgentSettings>) => {
    setAgentConfigs(prev => ({
      ...prev,
      [agentId]: {
        ...prev[agentId],
        ...updates
      }
    }));
  };

  return (
    <Layout>
      <div className="min-h-screen bg-docs-bg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-docs-section rounded-xl p-8 shadow-lg border border-docs-section-border">
            <div className="text-center mb-12">
              <h1 className={`text-4xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-docs-text'}`}>
                AI Agent Configuration
              </h1>
              <p className={`text-lg text-docs-muted max-w-3xl mx-auto`}>
                Configure specialized AI agents for enterprise decision-making across industries
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              {agents.map((agent) => {
                const config = agentConfigs[agent.id];
                const Icon = agent.icon;

                return (
                  <div
                    key={agent.id}
                    className="bg-docs-section rounded-lg shadow-sm border border-docs-section-border overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="p-6">
                      <div className="flex items-center mb-6">
                        <div className={classNames(
                          agent.color,
                          'rounded-lg p-3'
                        )}>
                          <Icon className="h-6 w-6 text-white" aria-hidden="true" />
                        </div>
                        <div className="ml-4">
                          <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-docs-text'}`}>
                            {agent.name}
                          </h3>
                          <p className={`text-sm text-docs-muted mt-1`}>
                            {agent.description}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-docs-text'}`}>Enabled</span>
                          <Switch
                            checked={config.enabled}
                            onChange={(enabled) => updateAgentConfig(agent.id, { enabled })}
                            className={classNames(
                              config.enabled ? 'bg-[#1F6FEB]' : 'bg-gray-300 dark:bg-gray-600',
                              'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out'
                            )}
                          >
                            <span
                              className={classNames(
                                config.enabled ? 'translate-x-5' : 'translate-x-0',
                                'pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                              )}
                            />
                          </Switch>
                        </div>

                        <div>
                          <label className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-docs-text'}`}>
                            Confidence Threshold
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={config.confidenceThreshold}
                            onChange={(e) => updateAgentConfig(agent.id, {
                              confidenceThreshold: parseFloat(e.target.value)
                            })}
                            className="mt-2 w-full"
                          />
                          <div className="mt-1 text-sm text-docs-muted text-right">
                            {(config.confidenceThreshold * 100).toFixed(0)}%
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-docs-text'}`}>
                            Require Human Review
                          </span>
                          <Switch
                            checked={config.requireHumanReview}
                            onChange={(requireHumanReview) => updateAgentConfig(agent.id, { requireHumanReview })}
                            className={classNames(
                              config.requireHumanReview ? 'bg-[#1F6FEB]' : 'bg-gray-300 dark:bg-gray-600',
                              'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out'
                            )}
                          >
                            <span
                              className={classNames(
                                config.requireHumanReview ? 'translate-x-5' : 'translate-x-0',
                                'pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                              )}
                            />
                          </Switch>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-docs-text'}`}>
                            Auto Approve
                          </span>
                          <Switch
                            checked={config.autoApprove}
                            onChange={(autoApprove) => updateAgentConfig(agent.id, { autoApprove })}
                            className={classNames(
                              config.autoApprove ? 'bg-[#1F6FEB]' : 'bg-gray-300 dark:bg-gray-600',
                              'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out'
                            )}
                          >
                            <span
                              className={classNames(
                                config.autoApprove ? 'translate-x-5' : 'translate-x-0',
                                'pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                              )}
                            />
                          </Switch>
                        </div>

                        <div>
                          <h4 className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-docs-text'} mb-3`}>Notifications</h4>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-docs-muted">Email</span>
                              <Switch
                                checked={config.notifications.email}
                                onChange={(email) => updateAgentConfig(agent.id, {
                                  notifications: { ...config.notifications, email }
                                })}
                                className={classNames(
                                  config.notifications.email ? 'bg-[#1F6FEB]' : 'bg-gray-300 dark:bg-gray-600',
                                  'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out'
                                )}
                              >
                                <span
                                  className={classNames(
                                    config.notifications.email ? 'translate-x-5' : 'translate-x-0',
                                    'pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                                  )}
                                />
                              </Switch>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-sm text-docs-muted">Slack</span>
                              <Switch
                                checked={config.notifications.slack}
                                onChange={(slack) => updateAgentConfig(agent.id, {
                                  notifications: { ...config.notifications, slack }
                                })}
                                className={classNames(
                                  config.notifications.slack ? 'bg-[#1F6FEB]' : 'bg-gray-300 dark:bg-gray-600',
                                  'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out'
                                )}
                              >
                                <span
                                  className={classNames(
                                    config.notifications.slack ? 'translate-x-5' : 'translate-x-0',
                                    'pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                                  )}
                                />
                              </Switch>
                            </div>

                            <div>
                              <label className="text-sm text-docs-muted">Webhook URL</label>
                              <input
                                type="text"
                                value={config.notifications.webhook}
                                onChange={(e) => updateAgentConfig(agent.id, {
                                  notifications: { ...config.notifications, webhook: e.target.value }
                                })}
                                className={`mt-1 block w-full rounded-md bg-docs-bg border border-docs-section-border ${theme === 'dark' ? 'text-white' : 'text-docs-text'} px-3 py-2 text-sm focus:outline-none focus:border-[#1F6FEB] focus:ring-2 focus:ring-[#1F6FEB]/20`}
                                placeholder="https://"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 