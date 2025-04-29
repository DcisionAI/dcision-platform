import Layout from '@/components/Layout';
import { useState } from 'react';
import { Switch } from '@headlessui/react';
import { BellIcon, CloudIcon, CogIcon, ChartBarIcon } from '@heroicons/react/24/outline';

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
    description: 'Analyzes user requests to understand the optimization problem',
    icon: CogIcon,
    color: 'bg-blue-500',
  },
  {
    id: 'data-mapping',
    name: 'Data Mapping Agent',
    description: 'Maps customer data fields to required schema fields',
    icon: ChartBarIcon,
    color: 'bg-green-500',
  },
  {
    id: 'data-integration',
    name: 'Data Integration Agent',
    description: 'Connects and validates data sources for optimization',
    icon: CloudIcon,
    color: 'bg-purple-500',
  },
  {
    id: 'explainability',
    name: 'Explainability Agent',
    description: 'Provides insights and explanations for optimization decisions',
    icon: BellIcon,
    color: 'bg-yellow-500',
  }
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function AgentsPage() {
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
      <div className="h-[calc(100vh-4rem)] bg-docs-body overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-docs-section rounded-xl p-8 shadow-lg border border-docs-section-border">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-docs-heading">Agent Configuration</h1>
              <p className="mt-4 text-xl text-docs-muted">
                Configure AI agents for optimization problem-solving
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              {agents.map((agent) => {
                const config = agentConfigs[agent.id];
                const Icon = agent.icon;

                return (
                  <div
                    key={agent.id}
                    className="bg-docs-section rounded-lg shadow-sm border border-docs-border overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex items-center">
                        <div className={classNames(
                          agent.color,
                          'rounded-lg p-3'
                        )}>
                          <Icon className="h-6 w-6 text-white" aria-hidden="true" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-docs-heading">
                            {agent.name}
                          </h3>
                          <p className="text-sm text-docs-text">
                            {agent.description}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 space-y-6">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-docs-text">Enabled</span>
                          <Switch
                            checked={config.enabled}
                            onChange={(enabled) => updateAgentConfig(agent.id, { enabled })}
                            className={classNames(
                              config.enabled ? 'bg-docs-accent' : 'bg-docs-muted',
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
                          <label className="text-sm font-medium text-docs-text">
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
                          <span className="text-sm font-medium text-docs-text">
                            Require Human Review
                          </span>
                          <Switch
                            checked={config.requireHumanReview}
                            onChange={(requireHumanReview) => updateAgentConfig(agent.id, { requireHumanReview })}
                            className={classNames(
                              config.requireHumanReview ? 'bg-docs-accent' : 'bg-docs-muted',
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
                          <span className="text-sm font-medium text-docs-text">
                            Auto Approve
                          </span>
                          <Switch
                            checked={config.autoApprove}
                            onChange={(autoApprove) => updateAgentConfig(agent.id, { autoApprove })}
                            className={classNames(
                              config.autoApprove ? 'bg-docs-accent' : 'bg-docs-muted',
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
                          <h4 className="text-sm font-medium text-docs-text mb-3">Notifications</h4>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-docs-muted">Email</span>
                              <Switch
                                checked={config.notifications.email}
                                onChange={(email) => updateAgentConfig(agent.id, {
                                  notifications: { ...config.notifications, email }
                                })}
                                className={classNames(
                                  config.notifications.email ? 'bg-docs-accent' : 'bg-docs-muted',
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
                                  config.notifications.slack ? 'bg-docs-accent' : 'bg-docs-muted',
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
                                className="mt-1 block w-full rounded-md bg-docs-bg border-docs-border text-docs-text px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-docs-accent"
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