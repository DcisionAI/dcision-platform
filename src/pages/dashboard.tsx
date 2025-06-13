import Layout from '@/components/Layout';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import React, { useEffect, useState, useMemo } from 'react';
// import { supabase } from '@/lib/supabase'; // Removed Supabase import
import Button from '@/components/ui/Button';
import Tabs from '@/components/ui/Tabs';

// Mock data for the usage charts - separate for each function
const gpt4Usage = {
  problemUnderstanding: [
    { value: 450000 }, { value: 480000 }, { value: 460000 }, 
    { value: 470000 }, { value: 465000 }, { value: 475000 },
    { value: 455000 }, { value: 468000 }, { value: 472000 },
    { value: 458000 }, { value: 470000 }, { value: 464325 }
  ],
  solutionExplanation: [
    { value: 380000 }, { value: 390000 }, { value: 385000 }, 
    { value: 395000 }, { value: 382000 }, { value: 388000 },
    { value: 392000 }, { value: 385000 }, { value: 390000 },
    { value: 387000 }, { value: 392000 }, { value: 390000 }
  ],
  codeGeneration: [
    { value: 320000 }, { value: 380000 }, { value: 335000 }, 
    { value: 355000 }, { value: 343000 }, { value: 377000 },
    { value: 323000 }, { value: 347000 }, { value: 348000 },
    { value: 335000 }, { value: 368000 }, { value: 350000 }
  ]
};

const claude3Usage = {
  documentationGeneration: [
    { value: 320000 }, { value: 330000 }, { value: 325000 }, 
    { value: 328000 }, { value: 322000 }, { value: 327000 },
    { value: 324000 }, { value: 329000 }, { value: 326000 },
    { value: 323000 }, { value: 328000 }, { value: 325993 }
  ],
  dataAnalysis: [
    { value: 280000 }, { value: 290000 }, { value: 285000 }, 
    { value: 287000 }, { value: 283000 }, { value: 288000 },
    { value: 286000 }, { value: 289000 }, { value: 284000 },
    { value: 282000 }, { value: 287000 }, { value: 285000 }
  ],
  technicalReview: [
    { value: 220000 }, { value: 230000 }, { value: 270000 }, 
    { value: 225000 }, { value: 285000 }, { value: 245000 },
    { value: 260000 }, { value: 232000 }, { value: 270000 },
    { value: 235000 }, { value: 245000 }, { value: 246000 }
  ]
};

// Add status indicators
const systemStatus = {
  core: [
    { name: 'Decision Engine', status: 'healthy', uptime: '99.9%', latency: '45ms' },
    { name: 'Plugin Service', status: 'healthy', uptime: '99.8%', latency: '120ms' },
    { name: 'MCP Server', status: 'healthy', uptime: '99.9%', latency: '65ms' }
  ],
  integrations: [
    { name: 'Database', status: 'healthy', connections: '45/100', latency: '15ms' },
    { name: 'Message Queue', status: 'healthy', backlog: '12', throughput: '1.2k/s' },
    { name: 'Storage', status: 'healthy', usage: '65%', ops: '850/s' }
  ],
  agents: {
    data: [
      { name: 'Data Collector', status: 'healthy', active: '3/3' },
      { name: 'Data Enrichment', status: 'healthy', active: '2/2' },
      { name: 'Validator', status: 'healthy', active: '2/2' }
    ],
    decision: [
      { name: 'Decision Analyzer', status: 'healthy', active: '3/3' },
      { name: 'Model Builder', status: 'healthy', active: '2/2' },
      { name: 'Optimizer', status: 'healthy', active: '4/4' }
    ],
    insight: [
      { name: 'Solution Explainer', status: 'healthy', active: '2/2' }
    ]
  }
};

const cloudRunServices = [
  { name: 'llm-service', label: 'LLM Server', icon: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-green-400">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  ) },
  { name: 'mcp-service', label: 'MCP Server', icon: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-green-400">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
    </svg>
  ) },
  { name: 'solver-service', label: 'Decision Engine', icon: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-green-400">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25z" />
    </svg>
  ) },
];

function CloudRunMetricsCard({ service, label, icon }: { service: string; label: string; icon: React.ReactNode }) {
  const [metrics, setMetrics] = useState<{ requestCount?: any; latencyP95?: any } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchMetrics = () => {
      setLoading(true);
      setError(null);
      fetch(`/api/metrics/cloudrun?service=${service}`)
        .then(async (res) => {
          if (!res.ok) throw new Error('Failed to fetch metrics');
          return res.json();
        })
        .then((data) => {
          if (isMounted) {
            setMetrics(data);
            setLoading(false);
          }
        })
        .catch((err) => {
          if (isMounted) {
            setError(err.message);
            setLoading(false);
          }
        });
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000); // 60s
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [service]);

  return (
    <div className="rounded-xl p-6 flex flex-col items-start shadow border min-h-[120px] bg-[#ede9dd] border-[#f4f1ea] text-[#18181b] dark:bg-[#1C2128] dark:border-[#21262D] dark:text-[#E7E9EB]">
      <span className="mb-2">{icon}</span>
      <span className="text-[#4b5563] text-sm mb-1 dark:text-[#8F959E]">{label} Metrics</span>
      {loading ? (
        <span className="text-docs-muted text-xs">Loading...</span>
      ) : error ? (
        <span className="text-red-400 text-xs">{error}</span>
      ) : metrics ? (
        <div className="flex flex-col gap-1">
          <span className="text-2xl font-bold text-docs-text">
            {Array.isArray(metrics.requestCount) && metrics.requestCount.length > 0
              ? metrics.requestCount[metrics.requestCount.length - 1].points?.[0]?.value?.int64Value * 100 || '—'
              : '—'}
            <span className="text-xs text-docs-muted font-normal ml-1">req/hr</span>
          </span>
          <span className="text-sm text-docs-muted">
            Latency p95:{' '}
            {Array.isArray(metrics.latencyP95) && metrics.latencyP95.length > 0
              ? `${metrics.latencyP95[metrics.latencyP95.length - 1].points?.[0]?.value?.doubleValue?.toFixed(1) || '—'} ms`
              : '—'}
          </span>
        </div>
      ) : (
        <span className="text-docs-muted text-xs">No data</span>
      )}
    </div>
  );
}

const TABS = [
  { label: 'Usage', value: 'Usage' },
  { label: 'System Health', value: 'System Health' },
  { label: 'Agents', value: 'Agents' },
];

function SummaryCard({ title, value, icon }: { title: string; value: React.ReactNode; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl p-6 flex flex-col items-center shadow border min-h-[100px] w-full bg-[#ede9dd] border-[#f4f1ea] text-[#18181b] dark:bg-[#1C2128] dark:border-[#21262D] dark:text-[#E7E9EB]">
      <span className="mb-2">{icon}</span>
      <span className="text-[#4b5563] text-sm mb-1 dark:text-gray-400">{title}</span>
      <span className="text-2xl font-bold text-[#18181b] dark:text-white">{value}</span>
    </div>
  );
}

export default function Dashboard() {
  const [tab, setTab] = useState(TABS[0].value);
  // MCP Metrics state
  const [mcpMetrics, setMcpMetrics] = useState<{ requestCount?: any; latencyP95?: any } | null>(null);
  const [mcpLoading, setMcpLoading] = useState(false);
  const [mcpError, setMcpError] = useState<string | null>(null);

  useEffect(() => {
    setMcpLoading(true);
    setMcpError(null);
    fetch('/api/metrics/mcp')
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to fetch MCP metrics');
        return res.json();
      })
      .then((data) => {
        setMcpMetrics(data);
        setMcpLoading(false);
      })
      .catch((err) => {
        setMcpError(err.message);
        setMcpLoading(false);
      });
  }, []);

  // Summary metrics
  const summaryCards: { title: string; value: React.ReactNode; icon: React.ReactNode }[] = [];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4">
          {summaryCards.map((card) => (
            <SummaryCard key={card.title} {...card} />
          ))}
        </div>
        {/* Tabs */}
        <div className="px-4 bg-[#ede9dd] dark:bg-[#1C2128]">
          <Tabs
            tabs={TABS}
            value={tab}
            onChange={setTab}
            className="mb-4"
          />
        </div>
        {/* Tab Content */}
        <div className="p-4">
          {tab === 'Usage' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* GPT-4 Card */}
              <div className="rounded-xl p-6 shadow border min-h-[100px] w-full bg-[#ede9dd] border-[#f4f1ea] text-[#18181b] dark:bg-[#1C2128] dark:border-[#21262D] dark:text-[#E7E9EB]">
                <div className="flex items-center gap-3 mb-6">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" fill="white"/>
                  </svg>
                  <div>
                    <h3 className="text-base font-semibold text-docs-text dark:text-white">GPT-4 Turbo</h3>
                    <p className="text-xs text-docs-muted dark:text-gray-400">gpt-4-0125-preview</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {/* Business Context Analysis Row */}
                  <div>
                    <div className="flex items-center gap-4 mb-1">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-docs-text dark:text-white">Business Context Analysis</h4>
                          <div className="text-right text-sm">
                            <span className="font-medium text-docs-text dark:text-white">464K</span>
                            <span className="text-docs-muted ml-1 dark:text-gray-400">tokens</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-8">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={gpt4Usage.problemUnderstanding}>
                                <Line type="monotone" dataKey="value" stroke="#4ade80" strokeWidth={2} dot={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-docs-muted dark:text-gray-400">Analyzes business scenarios and constraints to frame complex decisions effectively</p>
                  </div>
                  {/* Decision Insights Row */}
                  <div>
                    <div className="flex items-center gap-4 mb-1">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-docs-text dark:text-white">Decision Insights</h4>
                          <div className="text-right text-sm">
                            <span className="font-medium text-docs-text dark:text-white">390K</span>
                            <span className="text-docs-muted ml-1 dark:text-gray-400">tokens</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-8">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={gpt4Usage.solutionExplanation}>
                                <Line type="monotone" dataKey="value" stroke="#4ade80" strokeWidth={2} dot={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-docs-muted dark:text-gray-400">Translates complex analysis into clear, actionable business recommendations</p>
                  </div>
                  {/* Decision Frameworks Row */}
                  <div>
                    <div className="flex items-center gap-4 mb-1">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-docs-text dark:text-white">Decision Frameworks</h4>
                          <div className="text-right text-sm">
                            <span className="font-medium text-docs-text dark:text-white">350K</span>
                            <span className="text-docs-muted ml-1 dark:text-gray-400">tokens</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-8">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={gpt4Usage.codeGeneration}>
                                <Line type="monotone" dataKey="value" stroke="#4ade80" strokeWidth={2} dot={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-docs-muted dark:text-gray-400">Creates customized decision-making templates based on your business needs</p>
                  </div>
                </div>
              </div>
              {/* Claude Card */}
              <div className="rounded-xl p-6 shadow border min-h-[100px] w-full bg-[#ede9dd] border-[#f4f1ea] text-[#18181b] dark:bg-[#1C2128] dark:border-[#21262D] dark:text-[#E7E9EB]">
                <div className="flex items-center gap-3 mb-6">
                  <svg width="32" height="32" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1L9.2 4.4L12.5 3.62L11.53 7L14.5 8.35L11.77 10.17L13.4 13.3L10.1 12.53L8.9 15.93L7.7 12.53L4.4 13.3L6.03 10.17L3.3 8.35L6.27 7L5.3 3.62L8.6 4.4L8 1Z" fill="#FF8B76"/>
                  </svg>
                  <div>
                    <h3 className="text-base font-semibold text-docs-text dark:text-white">Claude 3 Opus</h3>
                    <p className="text-xs text-docs-muted dark:text-gray-400">claude-3-opus-20240229</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {/* Knowledge Base Row */}
                  <div>
                    <div className="flex items-center gap-4 mb-1">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-docs-text dark:text-white">Knowledge Base</h4>
                          <div className="text-right text-sm">
                            <span className="font-medium text-docs-text dark:text-white">326K</span>
                            <span className="text-docs-muted ml-1 dark:text-gray-400">tokens</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-8">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={claude3Usage.documentationGeneration}>
                                <Line type="monotone" dataKey="value" stroke="#4ade80" strokeWidth={2} dot={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-docs-muted dark:text-gray-400">Maintains comprehensive guides and best practices for strategic decision-making</p>
                  </div>
                  {/* Data Intelligence Row */}
                  <div>
                    <div className="flex items-center gap-4 mb-1">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-docs-text dark:text-white">Data Intelligence</h4>
                          <div className="text-right text-sm">
                            <span className="font-medium text-docs-text dark:text-white">285K</span>
                            <span className="text-docs-muted ml-1 dark:text-gray-400">tokens</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-8">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={claude3Usage.dataAnalysis}>
                                <Line type="monotone" dataKey="value" stroke="#4ade80" strokeWidth={2} dot={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-docs-muted dark:text-gray-400">Processes and validates business data to support informed decision-making</p>
                  </div>
                  {/* Decision Quality Analysis Row */}
                  <div>
                    <div className="flex items-center gap-4 mb-1">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-docs-text dark:text-white">Decision Quality Analysis</h4>
                          <div className="text-right text-sm">
                            <span className="font-medium text-docs-text dark:text-white">246K</span>
                            <span className="text-docs-muted ml-1 dark:text-gray-400">tokens</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-8">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={claude3Usage.technicalReview}>
                                <Line type="monotone" dataKey="value" stroke="#4ade80" strokeWidth={2} dot={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-docs-muted dark:text-gray-400">Evaluates and validates decisions to ensure alignment with business objectives</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          {tab === 'System Health' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Core Services */}
              <div className="rounded-xl p-6 shadow border min-h-[100px] bg-[#ede9dd] border-[#f4f1ea] text-[#18181b] dark:bg-[#1C2128] dark:border-[#21262D] dark:text-[#E7E9EB]">
                <h3 className="text-base font-semibold text-docs-text mb-4 dark:text-white">Core Services</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-docs-muted mb-2 dark:text-gray-400">
                    <span>Service</span>
                    <div className="flex items-center gap-4">
                      <span className="w-16 text-right">Uptime</span>
                      <span className="w-16 text-right">Latency</span>
                    </div>
                  </div>
                  {systemStatus.core.map((service) => (
                    <div key={service.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${service.status === 'healthy' ? 'bg-green-400' : 'bg-red-400'}`} />
                        <span className="text-sm font-medium text-docs-text dark:text-white">{service.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-docs-muted w-16 text-right dark:text-gray-400">{service.uptime}</span>
                        <span className="text-xs text-docs-muted w-16 text-right dark:text-gray-400">{service.latency}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Integration Points */}
              <div className="rounded-xl p-6 shadow border min-h-[100px] bg-[#ede9dd] border-[#f4f1ea] text-[#18181b] dark:bg-[#1C2128] dark:border-[#21262D] dark:text-[#E7E9EB]">
                <h3 className="text-base font-semibold text-docs-text mb-4 dark:text-white">Integration Points</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-docs-muted mb-2 dark:text-gray-400">
                    <span>Integration</span>
                    <div className="flex items-center gap-4">
                      <span className="w-16 text-right">Usage</span>
                      <span className="w-16 text-right">Performance</span>
                    </div>
                  </div>
                  {systemStatus.integrations.map((integration) => (
                    <div key={integration.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${integration.status === 'healthy' ? 'bg-green-400' : 'bg-red-400'}`} />
                        <span className="text-sm font-medium text-docs-text dark:text-white">{integration.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-docs-muted w-16 text-right dark:text-gray-400">{integration.connections || integration.backlog || integration.usage}</span>
                        <span className="text-xs text-docs-muted w-16 text-right dark:text-gray-400">{integration.latency || integration.throughput || integration.ops}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Active Agents */}
              
            </div>
          )}
          
          {tab === 'Agents' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Active Agents */}
              <div className="rounded-xl p-6 shadow border min-h-[100px] bg-[#ede9dd] border-[#f4f1ea] text-[#18181b] dark:bg-[#1C2128] dark:border-[#21262D] dark:text-[#E7E9EB]">
                <h3 className="text-base font-semibold text-docs-text mb-4 dark:text-white">Active Agents</h3>
                <div className="space-y-6">
                  {/* Data Processing Agents */}
                  <div>
                    <h4 className="text-sm font-semibold text-docs-text mb-2 dark:text-white">Data Processing</h4>
                    <div className="space-y-2">
                      {systemStatus.agents.data.map((agent) => (
                        <div key={agent.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${agent.status === 'healthy' ? 'bg-green-400' : 'bg-red-400'}`} />
                            <span className="text-sm text-docs-text dark:text-white">{agent.name}</span>
                          </div>
                          <span className="text-xs text-docs-muted w-12 text-right dark:text-gray-400">{agent.active}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Decision Making Agents */}
                  <div>
                    <h4 className="text-sm font-semibold text-docs-text mb-2 dark:text-white">Decision Making</h4>
                    <div className="space-y-2">
                      {systemStatus.agents.decision.map((agent) => (
                        <div key={agent.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${agent.status === 'healthy' ? 'bg-green-400' : 'bg-red-400'}`} />
                            <span className="text-sm text-docs-text dark:text-white">{agent.name}</span>
                          </div>
                          <span className="text-xs text-docs-muted w-12 text-right dark:text-gray-400">{agent.active}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Insight Generation Agents */}
                  <div>
                    <h4 className="text-sm font-semibold text-docs-text mb-2 dark:text-white">Insight Generation</h4>
                    <div className="space-y-2">
                      {systemStatus.agents.insight.map((agent) => (
                        <div key={agent.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${agent.status === 'healthy' ? 'bg-green-400' : 'bg-red-400'}`} />
                            <span className="text-sm text-docs-text dark:text-white">{agent.name}</span>
                          </div>
                          <span className="text-xs text-docs-muted w-12 text-right dark:text-gray-400">{agent.active}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {/* Human-in-the-Loop */}
              <div className="rounded-xl p-6 flex flex-col items-start shadow border min-h-[100px] bg-[#ede9dd] border-[#f4f1ea] text-[#18181b] dark:bg-[#1C2128] dark:border-[#21262D] dark:text-[#E7E9EB]">
                <span className="mb-2 text-green-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75l3 3m0 0l3-3m-3 3v-7.5" />
                  </svg>
                </span>
                <span className="text-docs-muted text-sm mb-1 dark:text-gray-400">Human-in-the-Loop</span>
                <span className="text-3xl font-bold text-docs-text dark:text-white">120 <span className="text-xs text-docs-muted font-normal dark:text-gray-400">Auto</span> / 15 <span className="text-xs text-docs-muted font-normal dark:text-gray-400">Override</span></span>
                <span className="text-xs text-green-400 mt-1">89% Automated</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}