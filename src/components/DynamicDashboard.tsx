import { LineChart, Line, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import React, { useEffect, useState, useMemo } from 'react';
import Button from '@/components/ui/Button';
import Tabs from '@/components/ui/Tabs';
import { useTheme } from '@/components/layout/ThemeContext';

// Types for the LLM-driven dashboard
interface KPICard {
  title: string;
  value: string | number;
  description: string;
  trend?: 'up' | 'down' | 'stable';
  color?: string;
}

interface Chart {
  type: 'line' | 'bar' | 'pie';
  title: string;
  data: any[];
  description: string;
}

interface Highlight {
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
}

interface Alert {
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  action?: string;
}

interface DashboardPlan {
  kpi_cards: KPICard[];
  charts: Chart[];
  highlights: Highlight[];
  alerts: Alert[];
  recommended_tabs: string[];
}

function KnowledgeGraphTab() {
  return (
    <div className="rounded-xl p-6 shadow border min-h-[400px] bg-[#ede9dd] border-[#f4f1ea] text-[#18181b] dark:bg-[#1C2128] dark:border-[#21262D] dark:text-[#E7E9EB]">
      <h3 className="text-lg font-semibold mb-4">Knowledge Graph</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Interactive knowledge graph showing relationships between construction entities, regulations, and best practices.
      </p>
      <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="mt-2 text-sm text-gray-500">Knowledge Graph Visualization</p>
          <p className="text-xs text-gray-400">Coming soon...</p>
        </div>
      </div>
    </div>
  );
}

function DynamicKPICard({ card }: { card: KPICard }) {
  const { theme } = useTheme();
  const getTrendIcon = (trend?: string) => {
    if (trend === 'up') return '↗';
    if (trend === 'down') return '↘';
    return '→';
  };
  const getTrendColor = (trend?: string) => {
    if (trend === 'up') return 'text-green-500';
    if (trend === 'down') return 'text-red-500';
    return 'text-gray-500';
  };
  return (
    <div className="rounded-xl p-6 shadow border min-h-[120px] bg-[#ede9dd] border-[#f4f1ea] text-[#18181b] dark:bg-[#1C2128] dark:border-[#21262D] dark:text-[#E7E9EB]">
      <div className="flex items-center justify-between mb-2">
        <h4 className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-docs-text'}`}>{card.title}</h4>
        {card.trend && (<span className={`text-lg ${getTrendColor(card.trend)}`}>{getTrendIcon(card.trend)}</span>)}
      </div>
      <div className="text-2xl font-bold text-[#18181b] dark:text-white mb-2">{card.value}</div>
      <p className="text-xs text-gray-600 dark:text-gray-400">{card.description}</p>
    </div>
  );
}

function DynamicChart({ chart }: { chart: Chart }) {
  const { theme } = useTheme();
  const colors = ['#4ade80', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'];
  const renderChart = () => {
    switch (chart.type) {
      case 'line':
        return (
          <LineChart data={chart.data} width={400} height={200}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#4ade80" strokeWidth={2} />
          </LineChart>
        );
      case 'bar':
        return (
          <BarChart data={chart.data} width={400} height={200}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#4ade80" />
          </BarChart>
        );
      case 'pie':
        return (
          <PieChart width={400} height={200}>
            <Pie
              data={chart.data}
              cx={200}
              cy={100}
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chart.data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        );
      default:
        return <div>Unsupported chart type</div>;
    }
  };
  return (
    <div className="rounded-xl p-6 shadow border min-h-[300px] bg-[#ede9dd] border-[#f4f1ea] text-[#18181b] dark:bg-[#1C2128] dark:border-[#21262D] dark:text-[#E7E9EB]">
      <h4 className={`text-base font-semibold ${theme === 'dark' ? 'text-white' : 'text-docs-text'} mb-2`}>{chart.title}</h4>
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">{chart.description}</p>
      <div className="flex justify-center">{renderChart()}</div>
    </div>
  );
}

function HighlightCard({ highlight }: { highlight: Highlight }) {
  const getHighlightColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-green-500 bg-green-50 dark:bg-green-900/20';
      case 'warning': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'error': return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      default: return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
    }
  };
  return (
    <div className={`rounded-lg p-4 border-l-4 ${getHighlightColor(highlight.type)}`}>
      <h5 className="font-semibold text-sm mb-1">{highlight.title}</h5>
      <p className="text-xs text-gray-600 dark:text-gray-400">{highlight.content}</p>
    </div>
  );
}

function AlertCard({ alert }: { alert: Alert }) {
  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'high': return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'medium': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      default: return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
    }
  };
  return (
    <div className={`rounded-lg p-4 border-l-4 ${getAlertColor(alert.severity)}`}>
      <div className="flex items-center justify-between">
        <div>
          <h5 className="font-semibold text-sm mb-1">{alert.title}</h5>
          <p className="text-xs text-gray-600 dark:text-gray-400">{alert.message}</p>
        </div>
        {alert.action && (
          <Button size="sm" variant="secondary">{alert.action}</Button>
        )}
      </div>
    </div>
  );
}

const DynamicDashboard: React.FC = () => {
  const { theme } = useTheme();
  const [dashboardPlan, setDashboardPlan] = useState<DashboardPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('Knowledge Graph');

  useEffect(() => {
    const fetchDashboardPlan = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/dashboard/plan');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard plan');
        }
        const plan = await response.json();
        setDashboardPlan(plan);
        if (plan.recommended_tabs && plan.recommended_tabs.length > 0) {
          setActiveTab(plan.recommended_tabs[0]);
        }
      } catch (err: any) {
        setError(err.message);
        console.error('Dashboard plan fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardPlan();
  }, []);

  const tabs = useMemo(() => {
    const baseTabs = [{ label: 'Knowledge Graph', value: 'Knowledge Graph' }];
    if (dashboardPlan?.recommended_tabs) {
      const recommendedTabs = dashboardPlan.recommended_tabs
        .filter(tab => tab !== 'Knowledge Graph')
        .map(tab => ({ label: tab, value: tab }));
      return [...baseTabs, ...recommendedTabs];
    }
    return baseTabs;
  }, [dashboardPlan]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Generating dynamic dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="rounded-xl p-6 shadow border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Dashboard Error</h3>
          <p className="text-red-600 dark:text-red-300">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      {/* KPI Cards */}
      {dashboardPlan?.kpi_cards && dashboardPlan.kpi_cards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {dashboardPlan.kpi_cards.map((card, index) => (
            <DynamicKPICard key={index} card={card} />
          ))}
        </div>
      )}
      {/* Tabs */}
      <div className="px-4 bg-[#ede9dd] dark:bg-[#1C2128]">
        <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} className="mb-4" />
      </div>
      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'Knowledge Graph' && <KnowledgeGraphTab />}
        {activeTab !== 'Knowledge Graph' && dashboardPlan && (
          <div className="space-y-6">
            {/* Charts */}
            {dashboardPlan.charts && dashboardPlan.charts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {dashboardPlan.charts.map((chart, index) => (
                  <DynamicChart key={index} chart={chart} />
                ))}
              </div>
            )}
            {/* Highlights and Alerts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Highlights */}
              {dashboardPlan.highlights && dashboardPlan.highlights.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#18181b] dark:text-white">Key Highlights</h3>
                  {dashboardPlan.highlights.map((highlight, index) => (
                    <HighlightCard key={index} highlight={highlight} />
                  ))}
                </div>
              )}
              {/* Alerts */}
              {dashboardPlan.alerts && dashboardPlan.alerts.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#18181b] dark:text-white">Alerts & Notifications</h3>
                  {dashboardPlan.alerts.map((alert, index) => (
                    <AlertCard key={index} alert={alert} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DynamicDashboard; 