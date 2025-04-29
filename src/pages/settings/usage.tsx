import SettingsLayout from './layout';
import { useState } from 'react';
import {
  ChartBarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface UsageMetric {
  id: string;
  name: string;
  current: number;
  limit: number;
  unit: string;
  period: 'monthly' | 'daily';
}

interface UsageAlert {
  id: string;
  type: 'warning' | 'critical';
  message: string;
  timestamp: string;
}

export default function UsageSettings() {
  const [metrics] = useState<UsageMetric[]>([
    {
      id: 'api_calls',
      name: 'API Calls',
      current: 85000,
      limit: 100000,
      unit: 'calls',
      period: 'monthly'
    },
    {
      id: 'compute_hours',
      name: 'Compute Hours',
      current: 45,
      limit: 100,
      unit: 'hours',
      period: 'monthly'
    },
    {
      id: 'storage',
      name: 'Storage',
      current: 8.5,
      limit: 10,
      unit: 'GB',
      period: 'monthly'
    }
  ]);

  const [alerts] = useState<UsageAlert[]>([
    {
      id: 'alert_1',
      type: 'warning',
      message: 'API calls at 85% of monthly limit',
      timestamp: '2024-03-20T10:30:00Z'
    },
    {
      id: 'alert_2',
      type: 'critical',
      message: 'Storage usage approaching limit',
      timestamp: '2024-03-19T15:45:00Z'
    }
  ]);

  const calculatePercentage = (current: number, limit: number) => {
    return Math.round((current / limit) * 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-docs-heading">Usage & Limits</h1>
          <p className="mt-1 text-sm text-docs-muted">
            Monitor your resource usage and manage limits
          </p>
        </div>

        {/* Usage Overview */}
        <div className="bg-docs-section rounded-lg border border-docs-border">
          <div className="p-6">
            <h2 className="text-lg font-medium text-docs-heading mb-4">Usage Overview</h2>
            <div className="grid grid-cols-1 gap-6">
              {metrics.map((metric) => {
                const percentage = calculatePercentage(metric.current, metric.limit);
                return (
                  <div
                    key={metric.id}
                    className="border border-docs-border rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-docs-text">{metric.name}</h3>
                      <span className="text-sm text-docs-muted capitalize">{metric.period}</span>
                    </div>
                    <div className="relative pt-1">
                      <div className="flex mb-2 items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold inline-block text-docs-text">
                            {percentage}%
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold inline-block text-docs-muted">
                            {formatNumber(metric.current)} / {formatNumber(metric.limit)} {metric.unit}
                          </span>
                        </div>
                      </div>
                      <div className="overflow-hidden h-2 text-xs flex rounded bg-docs-bg">
                        <div
                          style={{ width: `${percentage}%` }}
                          className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${getProgressColor(
                            percentage
                          )}`}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Usage Alerts */}
        <div className="bg-docs-section rounded-lg border border-docs-border">
          <div className="p-6">
            <h2 className="text-lg font-medium text-docs-heading mb-4">Recent Alerts</h2>
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-start p-4 rounded-lg ${
                    alert.type === 'critical'
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-yellow-50 border border-yellow-200'
                  }`}
                >
                  <ExclamationTriangleIcon
                    className={`h-5 w-5 ${
                      alert.type === 'critical' ? 'text-red-400' : 'text-yellow-400'
                    }`}
                  />
                  <div className="ml-3 flex-1">
                    <h3
                      className={`text-sm font-medium ${
                        alert.type === 'critical' ? 'text-red-800' : 'text-yellow-800'
                      }`}
                    >
                      {alert.message}
                    </h3>
                    <div
                      className={`mt-1 text-xs ${
                        alert.type === 'critical' ? 'text-red-700' : 'text-yellow-700'
                      }`}
                    >
                      {formatDate(alert.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Usage Tips */}
        <div className="bg-docs-section rounded-lg border border-docs-border">
          <div className="p-6">
            <h2 className="text-lg font-medium text-docs-heading mb-4">Usage Tips</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-docs-border rounded-lg">
                <div className="flex items-center mb-2">
                  <ChartBarIcon className="h-5 w-5 text-docs-accent mr-2" />
                  <h3 className="text-sm font-medium text-docs-text">Monitor Usage</h3>
                </div>
                <p className="text-sm text-docs-muted">
                  Regularly check your usage patterns to optimize resource allocation
                </p>
              </div>
              <div className="p-4 border border-docs-border rounded-lg">
                <div className="flex items-center mb-2">
                  <ClockIcon className="h-5 w-5 text-docs-accent mr-2" />
                  <h3 className="text-sm font-medium text-docs-text">Set Alerts</h3>
                </div>
                <p className="text-sm text-docs-muted">
                  Configure alerts to get notified before reaching usage limits
                </p>
              </div>
              <div className="p-4 border border-docs-border rounded-lg">
                <div className="flex items-center mb-2">
                  <CurrencyDollarIcon className="h-5 w-5 text-docs-accent mr-2" />
                  <h3 className="text-sm font-medium text-docs-text">Optimize Costs</h3>
                </div>
                <p className="text-sm text-docs-muted">
                  Review and optimize your usage to reduce costs
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
} 