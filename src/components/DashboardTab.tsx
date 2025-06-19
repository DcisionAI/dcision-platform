import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/components/layout/ThemeContext';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, LineChart, Line, Legend, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import dynamic from 'next/dynamic';
import VisNetworkGraph, { VisNode, VisEdge } from './VisNetworkGraph';
import ExpandableKnowledgeGraph from './ExpandableKnowledgeGraph';

// Dynamically import ForceGraph2D with no SSR
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full flex items-center justify-center">Loading graph...</div>
});

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c', '#d0ed57'];

const GANTT_BAR_HEIGHT = 28;
const GANTT_BAR_GAP = 16;
const GANTT_TOP = 60;
const GANTT_LEFT = 100;
const GANTT_RIGHT_PAD = 40;

const mockSummary = {
  sources: [
    { name: 'OSHA Safety Checklist', type: 'PDF', tags: ['Safety', 'OSHA'] },
    { name: 'PMBOK Guide', type: 'Web', tags: ['Planning', 'PMBOK'] },
    { name: 'Budget 2024', type: 'CSV', tags: ['Budget', 'Finance'] },
  ],
  compliance: 0.95,
  complianceTrend: [
    { date: '2024-01-01', value: 0.90 },
    { date: '2024-02-01', value: 0.92 },
    { date: '2024-03-01', value: 0.93 },
    { date: '2024-04-01', value: 0.95 },
  ],
  budget: {
    total: 1000000,
    spent: 420000,
    categories: [
      { name: 'Labor', value: 300000, details: ['Payroll Jan: $100k', 'Payroll Feb: $100k', 'Payroll Mar: $100k'] },
      { name: 'Materials', value: 250000, details: ['Concrete: $100k', 'Steel: $100k', 'Paint: $50k'] },
      { name: 'Equipment', value: 120000, details: ['Crane rental: $70k', 'Tools: $50k'] },
      { name: 'Permits', value: 50000, details: ['City permit: $30k', 'Safety permit: $20k'] },
    ],
  },
  timeline: [
    { phase: 'Planning', start: '2024-01-01', end: '2024-01-31' },
    { phase: 'Procurement', start: '2024-02-01', end: '2024-02-28' },
    { phase: 'Execution', start: '2024-03-01', end: '2024-06-30' },
    { phase: 'Closeout', start: '2024-07-01', end: '2024-07-15' },
  ],
  domains: [
    { name: 'Safety', coverage: 95 },
    { name: 'Planning', coverage: 80 },
    { name: 'Budget', coverage: 100 },
    { name: 'Quality', coverage: 60 },
  ],
};

const mockRAG = [
  { question: 'What are the top 3 safety risks?', answer: '1. Falls, 2. Electrocution, 3. Struck-by incidents.' },
  { question: 'What is the project budget?', answer: '$1,000,000' },
  { question: 'What is the next milestone?', answer: 'Procurement phase starts on Feb 1, 2024.' },
];

const budgetData = mockSummary.budget.categories.map((cat) => ({ name: cat.name, value: cat.value }));
const domainData = mockSummary.domains;
const complianceTrendData = mockSummary.complianceTrend.map(d => ({ ...d, value: Math.round(d.value * 100) }));

const ganttPhases = mockSummary.timeline.map((t, idx) => {
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

// Add mock knowledge graph data
const mockKnowledgeGraph = {
  nodes: [
    { id: 'safety', name: 'Safety', group: 'domain', val: 20 },
    { id: 'planning', name: 'Planning', group: 'domain', val: 20 },
    { id: 'budget', name: 'Budget', group: 'domain', val: 20 },
    { id: 'quality', name: 'Quality', group: 'domain', val: 20 },
    { id: 'osha', name: 'OSHA', group: 'source', val: 15 },
    { id: 'pmbok', name: 'PMBOK', group: 'source', val: 15 },
    { id: 'budget2024', name: 'Budget 2024', group: 'source', val: 15 },
    { id: 'falls', name: 'Falls', group: 'risk', val: 10 },
    { id: 'electrocution', name: 'Electrocution', group: 'risk', val: 10 },
    { id: 'struck-by', name: 'Struck-by', group: 'risk', val: 10 },
  ],
  links: [
    { source: 'safety', target: 'osha', value: 1 },
    { source: 'safety', target: 'falls', value: 1 },
    { source: 'safety', target: 'electrocution', value: 1 },
    { source: 'safety', target: 'struck-by', value: 1 },
    { source: 'planning', target: 'pmbok', value: 1 },
    { source: 'budget', target: 'budget2024', value: 1 },
    { source: 'quality', target: 'pmbok', value: 1 },
    { source: 'osha', target: 'falls', value: 1 },
    { source: 'osha', target: 'electrocution', value: 1 },
    { source: 'osha', target: 'struck-by', value: 1 },
  ]
};

// Map mockKnowledgeGraph to vis-network format
const visNodes: VisNode[] = [
  { id: 'safety', label: 'Safety', group: 'domain' },
  { id: 'planning', label: 'Planning', group: 'domain' },
  { id: 'budget', label: 'Budget', group: 'domain' },
  { id: 'quality', label: 'Quality', group: 'domain' },
  { id: 'osha', label: 'OSHA', group: 'source' },
  { id: 'pmbok', label: 'PMBOK', group: 'source' },
  { id: 'budget2024', label: 'Budget 2024', group: 'source' },
  { id: 'falls', label: 'Falls', group: 'risk' },
  { id: 'electrocution', label: 'Electrocution', group: 'risk' },
  { id: 'struck-by', label: 'Struck-by', group: 'risk' },
];
const visEdges: VisEdge[] = [
  { from: 'safety', to: 'osha' },
  { from: 'safety', to: 'falls' },
  { from: 'safety', to: 'electrocution' },
  { from: 'safety', to: 'struck-by' },
  { from: 'planning', to: 'pmbok' },
  { from: 'budget', to: 'budget2024' },
  { from: 'quality', to: 'pmbok' },
  { from: 'osha', to: 'falls' },
  { from: 'osha', to: 'electrocution' },
  { from: 'osha', to: 'struck-by' },
];
const visOptions = {
  groups: {
    domain: { color: { background: '#8884d8', border: '#8884d8' }, font: { color: '#fff' } },
    source: { color: { background: '#82ca9d', border: '#82ca9d' }, font: { color: '#fff' } },
    risk: { color: { background: '#ff8042', border: '#ff8042' }, font: { color: '#fff' } },
  },
  layout: { hierarchical: false },
  physics: { enabled: true },
  interaction: { hover: true, tooltipDelay: 200 },
};

const dashboardTabs = [
  { id: 'knowledge', label: 'Knowledge Graph' },
  { id: 'kpi', label: 'KPI' },
  { id: 'timeline', label: 'Project Timelines' },
  { id: 'rag', label: 'RAG' },
  { id: 'scenario', label: 'Scenario Analysis' },
];

const initialScenarioData = [
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

type Scenario = {
  name: string;
  description: string;
  probability: number;
  impact: string;
  metrics: { cost: number; duration: number; efficiency: number };
  risks: string[];
  recommendations: string[];
};

function getRadarData(scenarios: Scenario[]): { [key: string]: string | number }[] {
  // Dynamically build radar data for all metrics and scenarios
  const metrics = ['cost', 'duration', 'efficiency'] as const;
  return metrics.map(metric => {
    const entry: { [key: string]: string | number } = { metric: metric.charAt(0).toUpperCase() + metric.slice(1) };
    scenarios.forEach((s: Scenario) => {
      entry[s.name] = s.metrics[metric];
    });
    return entry;
  });
}

const DashboardTab: React.FC = () => {
  const { theme } = useTheme();
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

  // Handle LLM prompt submit (mocked for now)
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

  return (
    <div>
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
        <div className="border rounded-lg p-6 bg-docs-section grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-white dark:bg-docs-dark-bg rounded shadow flex flex-col items-center">
            <div className="text-3xl font-bold text-docs-accent mb-2">92%</div>
            <div className="text-sm text-docs-muted">On-time Delivery</div>
          </div>
          <div className="p-4 bg-white dark:bg-docs-dark-bg rounded shadow flex flex-col items-center">
            <div className="text-3xl font-bold text-docs-accent mb-2">$1.2M</div>
            <div className="text-sm text-docs-muted">Total Budget</div>
          </div>
          <div className="p-4 bg-white dark:bg-docs-dark-bg rounded shadow flex flex-col items-center">
            <div className="text-3xl font-bold text-docs-accent mb-2">87%</div>
            <div className="text-sm text-docs-muted">Safety Compliance</div>
          </div>
          <div className="p-4 bg-white dark:bg-docs-dark-bg rounded shadow flex flex-col items-center">
            <div className="text-3xl font-bold text-docs-accent mb-2">4</div>
            <div className="text-sm text-docs-muted">Active Projects</div>
          </div>
          <div className="col-span-1 md:col-span-2 mt-6">
            <h4 className="font-semibold mb-2">KPI Trend (Dummy Line Chart)</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={[{ name: 'Jan', value: 80 }, { name: 'Feb', value: 85 }, { name: 'Mar', value: 90 }, { name: 'Apr', value: 92 }]}
                margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis domain={[70, 100]} fontSize={12} tickLine={false} axisLine={false} />
                <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} dot={{ r: 3 }} />
                <RechartsTooltip formatter={(v: any) => `${v}%`} />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </div>
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

export default DashboardTab; 