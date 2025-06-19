import { LineChart, Line, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import React, { useEffect, useState, useRef } from 'react';
import { useTheme } from '@/components/layout/ThemeContext';
import dynamic from 'next/dynamic';
import ExpandableKnowledgeGraph from './ExpandableKnowledgeGraph';

// Dynamically import ForceGraph2D with no SSR
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full flex items-center justify-center">Loading graph...</div>
});

// Types for the static dashboard
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

interface DashboardData {
  kpi_cards: KPICard[];
  charts: Chart[];
  lastUpdated: string;
}

interface Scenario {
  name: string;
  description: string;
  probability: number;
  impact: string;
  metrics: { cost: number; duration: number; efficiency: number };
  risks: string[];
  recommendations: string[];
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c', '#d0ed57'];

const GANTT_BAR_HEIGHT = 28;
const GANTT_BAR_GAP = 16;
const GANTT_TOP = 60;
const GANTT_LEFT = 100;
const GANTT_RIGHT_PAD = 40;

// Mock data for timeline
const mockTimeline = [
  { phase: 'Planning', start: '2024-01-01', end: '2024-01-31' },
  { phase: 'Procurement', start: '2024-02-01', end: '2024-02-28' },
  { phase: 'Execution', start: '2024-03-01', end: '2024-06-30' },
  { phase: 'Closeout', start: '2024-07-01', end: '2024-07-15' },
];

const ganttPhases = mockTimeline.map((t, idx) => {
  const start = new Date(t.start).getTime();
  const end = new Date(t.end).getTime();
  return {
    ...t,
    idx,
    start,
    end,
    duration: (end - start) / (1000 * 60 * 60 * 24),
  };
});
const ganttStart = Math.min(...ganttPhases.map(p => p.start));
const ganttEnd = Math.max(...ganttPhases.map(p => p.end));
const ganttTotal = ganttEnd - ganttStart;

const initialScenarioData: Scenario[] = [
  {
    name: 'Best Case',
    description: 'Optimal conditions with minimal delays',
    probability: 20,
    impact: 'high',
    metrics: { cost: 1000000, duration: 12, efficiency: 0.9 },
    risks: ['Weather is ideal', 'No supply chain issues'],
    recommendations: ['Maintain current suppliers', 'Monitor weather forecasts']
  },
  {
    name: 'Most Likely',
    description: 'Expected conditions with minor delays',
    probability: 60,
    impact: 'medium',
    metrics: { cost: 1200000, duration: 14, efficiency: 0.8 },
    risks: ['Minor supply chain delays', 'Some weather impact'],
    recommendations: ['Increase buffer stock', 'Flexible scheduling']
  },
  {
    name: 'Worst Case',
    description: 'Adverse conditions with significant delays',
    probability: 20,
    impact: 'high',
    metrics: { cost: 1500000, duration: 18, efficiency: 0.7 },
    risks: ['Major supply chain disruption', 'Severe weather events'],
    recommendations: ['Identify alternate suppliers', 'Increase contingency budget']
  }
];

const dashboardTabs = [
  { id: 'knowledge', label: 'Knowledge Graph' },
  { id: 'kpi', label: 'KPI' },
  { id: 'timeline', label: 'Project Timelines' },
  { id: 'rag', label: 'RAG' },
  { id: 'scenario', label: 'Scenario Analysis' },
];

function getRadarData(scenarios: Scenario[]): { [key: string]: string | number }[] {
  const metrics = ['cost', 'duration', 'efficiency'] as const;
  return metrics.map(metric => {
    const entry: { [key: string]: string | number } = { metric: metric.charAt(0).toUpperCase() + metric.slice(1) };
    scenarios.forEach((s: Scenario) => {
      entry[s.name] = s.metrics[metric];
    });
    return entry;
  });
}

function StaticKPICard({ card }: { card: KPICard }) {
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

function StaticChart({ chart }: { chart: Chart }) {
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

const StaticDashboard: React.FC = () => {
  const { theme } = useTheme();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState('knowledge');
  const [scenarioData, setScenarioData] = useState(initialScenarioData);
  const [selectedScenario, setSelectedScenario] = useState('Best Case');
  const [llmPrompt, setLlmPrompt] = useState('');
  const [llmLoading, setLlmLoading] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const [svgWidth, setSvgWidth] = useState(800);
  const [knowledgeGraphData, setKnowledgeGraphData] = useState<{ nodes: any[]; edges: any[] } | null>(null);
  const [kgLoading, setKgLoading] = useState(false);
  const [kgError, setKgError] = useState<string | null>(null);

  useEffect(() => {
    if (svgRef.current) {
      setSvgWidth(svgRef.current.clientWidth || 800);
    }
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/dashboard/static');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        const data = await response.json();
        setDashboardData(data);
      } catch (err: any) {
        setError(err.message);
        console.error('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'knowledge') {
      setKgLoading(true);
      setKgError(null);
      fetch('/api/rag/list?limit=100')
        .then(res => res.json())
        .then(data => {
          if (!data.vectors || !Array.isArray(data.vectors)) throw new Error('No vectors');
          // Aggregate unique entities and relationships
          const entityMap = new Map();
          const edgeSet = new Set();
          data.vectors.forEach((v: any) => {
            (v.entities || []).forEach((e: any) => {
              if (e && e.id) entityMap.set(e.id, e);
            });
            (v.relationships || []).forEach((r: any) => {
              if (r && r.source && r.target) {
                const key = `${r.source}->${r.target}`;
                if (!edgeSet.has(key)) edgeSet.add(key);
              }
            });
          });
          // Build nodes and edges arrays
          const nodes = Array.from(entityMap.values());
          const edges: any[] = [];
          data.vectors.forEach((v: any) => {
            (v.relationships || []).forEach((r: any) => {
              if (r && r.source && r.target) {
                const key = `${r.source}->${r.target}`;
                if (edgeSet.has(key)) {
                  edges.push({ from: r.source, to: r.target, type: r.type, description: r.description });
                  edgeSet.delete(key); // Only add once
                }
              }
            });
          });
          if (nodes.length === 0 || edges.length === 0) throw new Error('No entities/edges');
          setKnowledgeGraphData({ nodes, edges });
        })
        .catch(err => {
          setKgError('Failed to load knowledge graph');
          setKnowledgeGraphData(null);
        })
        .finally(() => setKgLoading(false));
    }
  }, [activeSubTab]);

  // Handle LLM prompt submit for scenario analysis
  const handleLlmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!llmPrompt.trim()) return;
    setLlmLoading(true);
    // Simulate LLM call delay
    setTimeout(() => {
      // Mocked LLM response for "what happens if my labor is cut by 50%?"
      const newScenario = {
        name: 'Labor Cut 50%',
        description: 'Labor resources are reduced by half, impacting project delivery.',
        probability: 10,
        impact: 'high',
        metrics: { cost: 1100000, duration: 20, efficiency: 0.5 },
        risks: ['Severe labor shortage', 'Delays in all phases', 'Quality issues due to overwork'],
        recommendations: ['Hire temporary workers', 'Automate tasks', 'Negotiate with unions']
      };
      setScenarioData(prev => {
        // Avoid duplicate scenario
        if (prev.some(s => s.name === newScenario.name)) return prev;
        return [...prev, newScenario];
      });
      setSelectedScenario(newScenario.name);
      setLlmLoading(false);
      setLlmPrompt('');
    }, 1200);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading construction dashboard...</p>
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
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-docs-text'} mb-2`}>
          Construction Project Dashboard
        </h1>
        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          Real-time metrics extracted from project data files
          {dashboardData?.lastUpdated && (
            <span className="ml-2">• Last updated: {dashboardData.lastUpdated}</span>
          )}
        </p>
      </div>

      {/* Sub-tab navigation */}
      <div className="mb-4 border-b flex gap-4">
        {dashboardTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors duration-150 ${
              activeSubTab === tab.id
                ? 'border-docs-accent text-docs-accent'
                : 'border-transparent text-docs-muted hover:text-docs-accent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sub-tab content */}
      {activeSubTab === 'knowledge' && (
        <div className="border rounded-lg p-6 bg-docs-section">
          <h3 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-docs-dark-text' : 'text-docs-text'}`}>Knowledge Graph</h3>
          <div className="text-xs text-docs-muted mb-2">Click a node to expand and reveal its children.</div>
          {kgLoading ? (
            <div className="flex items-center justify-center h-64">Loading...</div>
          ) : kgError ? (
            <div className="text-red-500">{kgError}</div>
          ) : (
            <ExpandableKnowledgeGraph data={knowledgeGraphData || undefined} />
          )}
        </div>
      )}

      {activeSubTab === 'kpi' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          {dashboardData?.kpi_cards && dashboardData.kpi_cards.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {dashboardData.kpi_cards.map((card, index) => (
                <StaticKPICard key={index} card={card} />
              ))}
            </div>
          )}

          {/* Charts */}
          {dashboardData?.charts && dashboardData.charts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dashboardData.charts.map((chart, index) => (
                <StaticChart key={index} chart={chart} />
              ))}
            </div>
          )}

          {/* No Data State */}
          {(!dashboardData?.kpi_cards || dashboardData.kpi_cards.length === 0) && (
            <div className="rounded-xl p-8 shadow border bg-[#ede9dd] border-[#f4f1ea] text-center">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Project Data Available</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Upload construction project files (CSV, XLSX) to see real-time KPIs and analytics.
              </p>
              <div className="text-sm text-gray-500">
                Supported file types: CSV, XLSX, XLS
              </div>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'timeline' && (
        <div className="border rounded-lg p-6 bg-docs-section">
          <h3 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-docs-dark-text' : 'text-docs-text'}`}>Project Timeline (Gantt)</h3>
          <div className="overflow-x-auto">
            <svg ref={svgRef} width="100%" height={GANTT_TOP + ganttPhases.length * (GANTT_BAR_HEIGHT + GANTT_BAR_GAP)}>
              {/* Axis */}
              <line x1={GANTT_LEFT} y1={GANTT_TOP - 20} x2={svgWidth - GANTT_RIGHT_PAD} y2={GANTT_TOP - 20} stroke="#ccc" strokeWidth={2} />
              {/* Bars */}
              {ganttPhases.map((p, idx) => {
                const chartWidth = svgWidth - GANTT_LEFT - GANTT_RIGHT_PAD;
                const x = GANTT_LEFT + ((p.start - ganttStart) / ganttTotal) * chartWidth;
                const w = ((p.end - p.start) / ganttTotal) * chartWidth;
                const y = GANTT_TOP + idx * (GANTT_BAR_HEIGHT + GANTT_BAR_GAP);
                const textColor = w > 80 ? '#fff' : '#222';
                return (
                  <g key={p.phase}>
                    <rect x={x} y={y} width={w} height={GANTT_BAR_HEIGHT} fill={COLORS[idx % COLORS.length]} rx={8} />
                    {/* Phase name inside bar if space, else outside */}
                    <text
                      x={x + 8}
                      y={y + GANTT_BAR_HEIGHT / 2 + 6}
                      fontSize={16}
                      fill={textColor}
                      fontWeight="bold"
                      style={{ pointerEvents: 'none' }}
                    >
                      {p.phase}
                    </text>
                    {/* Start date (left) */}
                    <text
                      x={x - 10}
                      y={y + GANTT_BAR_HEIGHT / 2 + 6}
                      fontSize={12}
                      fill="#444"
                      textAnchor="end"
                    >
                      {new Date(p.start).toLocaleDateString()}
                    </text>
                    {/* End date (right) */}
                    <text
                      x={x + w + 10}
                      y={y + GANTT_BAR_HEIGHT / 2 + 6}
                      fontSize={12}
                      fill="#444"
                      textAnchor="start"
                    >
                      {new Date(p.end).toLocaleDateString()}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      )}

      {activeSubTab === 'rag' && (
        <div className="border rounded-lg p-6 bg-docs-section">
          <h3 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-docs-dark-text' : 'text-docs-text'}`}>RAG (Retrieval-Augmented Generation)</h3>
          <div className="text-xs text-docs-muted mb-2">This is a placeholder for RAG results and queries.</div>
          <div className="bg-white dark:bg-docs-dark-bg rounded p-4 shadow">
            <div className="font-semibold mb-2">Sample RAG Query:</div>
            <div className="mb-2">"What are the top 3 safety risks in this project?"</div>
            <div className="font-semibold mb-2">Sample RAG Answer:</div>
            <div>1. Falls<br />2. Electrocution<br />3. Struck-by incidents</div>
            <div className="mt-2 text-xs text-docs-muted">Sources: OSHA Safety Checklist, PMBOK Guide</div>
          </div>
        </div>
      )}

      {activeSubTab === 'scenario' && (
        <div className="border rounded-lg p-6 bg-docs-section">
          <h3 className={`font-semibold mb-4 ${theme === 'dark' ? 'text-docs-dark-text' : 'text-docs-text'}`}>Scenario Analysis</h3>
          {/* LLM Prompt Input */}
          <form onSubmit={handleLlmSubmit} className="flex flex-col md:flex-row gap-2 mb-6">
            <input
              type="text"
              className="flex-1 border rounded px-3 py-2 text-sm"
              placeholder="Ask a scenario (e.g., what happens if my labor is cut by 50%)"
              value={llmPrompt}
              onChange={e => setLlmPrompt(e.target.value)}
              disabled={llmLoading}
            />
            <button
              type="submit"
              className="px-4 py-2 rounded bg-docs-accent text-white font-semibold text-sm"
              disabled={llmLoading || !llmPrompt.trim()}
            >
              {llmLoading ? 'Analyzing...' : 'Analyze'}
            </button>
          </form>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {scenarioData.map(s => (
              <div
                key={s.name}
                className={`rounded-lg shadow p-4 cursor-pointer transition-all border-2 ${selectedScenario === s.name ? 'border-docs-accent bg-docs-accent/10' : 'border-transparent bg-white dark:bg-docs-dark-bg hover:border-docs-accent'}`}
                onClick={() => setSelectedScenario(s.name)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-lg">{s.name}</span>
                  <span className="text-xs px-2 py-1 rounded bg-docs-accent text-white">{s.impact.toUpperCase()}</span>
                </div>
                <div className="text-xs text-docs-muted mb-2">{s.description}</div>
                <div className="flex items-center gap-2 text-xs">
                  <span>Probability:</span>
                  <span className="font-semibold">{s.probability}%</span>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Radar Chart for scenario comparison */}
            <div className="bg-white dark:bg-docs-dark-bg rounded-lg p-4 shadow">
              <h4 className="font-semibold mb-2">Scenario Metrics Comparison</h4>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart cx="50%" cy="50%" outerRadius={100} data={getRadarData(scenarioData)}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis />
                  {scenarioData.map((s, idx) => (
                    <Radar
                      key={s.name}
                      name={s.name}
                      dataKey={s.name}
                      stroke={COLORS[idx % COLORS.length]}
                      fill={COLORS[idx % COLORS.length]}
                      fillOpacity={0.3}
                    />
                  ))}
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            {/* Details for selected scenario */}
            <div className="bg-white dark:bg-docs-dark-bg rounded-lg p-4 shadow flex flex-col">
              <h4 className="font-semibold mb-2">Scenario Details</h4>
              {(() => {
                const s = scenarioData.find(x => x.name === selectedScenario);
                if (!s) return null;
                return (
                  <>
                    <div className="mb-2"><span className="font-semibold">Description:</span> {s.description}</div>
                    <div className="mb-2"><span className="font-semibold">Probability:</span> {s.probability}%</div>
                    <div className="mb-2"><span className="font-semibold">Impact:</span> {s.impact}</div>
                    <div className="mb-2"><span className="font-semibold">Metrics:</span>
                      <ul className="ml-4 text-sm">
                        <li>Cost: ${s.metrics.cost.toLocaleString()}</li>
                        <li>Duration: {s.metrics.duration} months</li>
                        <li>Efficiency: {(s.metrics.efficiency * 100).toFixed(0)}%</li>
                      </ul>
                    </div>
                    <div className="mb-2"><span className="font-semibold">Risks:</span>
                      <ul className="ml-4 text-sm list-disc">
                        {s.risks.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                    </div>
                    <div className="mb-2"><span className="font-semibold">Recommendations:</span>
                      <ul className="ml-4 text-sm list-disc">
                        {s.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaticDashboard; 