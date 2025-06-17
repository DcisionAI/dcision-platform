import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/components/layout/ThemeContext';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, LineChart, Line, Legend
} from 'recharts';

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

const DashboardTab: React.FC = () => {
  const { theme } = useTheme();
  const [selectedBudget, setSelectedBudget] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chat' | 'knowledge'>('dashboard');
  const svgRef = useRef<SVGSVGElement>(null);
  const [svgWidth, setSvgWidth] = useState(800);

  useEffect(() => {
    if (svgRef.current) {
      setSvgWidth(svgRef.current.clientWidth || 800);
    }
  }, []);

  // Quick actions
  const handleQuickAction = (tab: 'chat' | 'knowledge') => setActiveTab(tab);

  // Drill-down modal
  const selectedBudgetDetails: string[] =
    selectedBudget && Array.isArray(mockSummary.budget.categories.find(cat => cat.name === selectedBudget)?.details)
      ? (mockSummary.budget.categories.find(cat => cat.name === selectedBudget)?.details as string[])
      : [];

  return (
    <>
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Knowledge Base Card */}
          <div className="border rounded-lg p-6 bg-docs-section">
            <h3 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-docs-dark-text' : 'text-docs-text'}`}>Knowledge Base</h3>
            <ul className="mb-2 text-sm">
              {mockSummary.sources.map((s, idx) => (
                <li key={idx} className="mb-1">
                  <span className="font-medium">{s.name}</span> <span className="text-xs text-docs-muted">({s.type})</span> <span className="text-xs">[{s.tags.join(', ')}]</span>
                </li>
              ))}
            </ul>
            <div className="text-xs text-docs-muted">Domains: {mockSummary.domains.map(d => d.name).join(', ')}</div>
            <div className="mt-4 flex gap-2">
              <button className="px-3 py-1 rounded bg-docs-accent text-white text-xs font-semibold" onClick={() => handleQuickAction('knowledge')}>Upload More Knowledge</button>
              <button className="px-3 py-1 rounded bg-docs-accent text-white text-xs font-semibold" onClick={() => handleQuickAction('chat')}>Ask a Question</button>
            </div>
          </div>
          {/* Compliance Trend Line */}
          <div className="border rounded-lg p-6 bg-docs-section">
            <h3 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-docs-dark-text' : 'text-docs-text'}`}>Safety Compliance Trend</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={complianceTrendData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis domain={[80, 100]} fontSize={12} tickLine={false} axisLine={false} />
                <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} dot={{ r: 3 }} />
                <RechartsTooltip formatter={(v: any) => `${v}%`} />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
            <div className="text-xs text-docs-muted mt-2">Current: {Math.round(mockSummary.compliance * 100)}%</div>
          </div>
          {/* Budget Pie Chart */}
          <div className="border rounded-lg p-6 bg-docs-section">
            <h3 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-docs-dark-text' : 'text-docs-text'}`}>Budget Allocation</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={budgetData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                  {budgetData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(v: any, n: any) => [`$${v.toLocaleString()}`, n]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 text-xs text-docs-muted">Spent: ${mockSummary.budget.spent.toLocaleString()} / ${mockSummary.budget.total.toLocaleString()}</div>
            <div className="mt-2">
              <button className="text-xs text-docs-accent underline" onClick={() => setSelectedBudget('Labor')}>Drill down: Labor</button>
              {budgetData.slice(1).map((cat, idx) => (
                <button key={cat.name} className="ml-2 text-xs text-docs-accent underline" onClick={() => setSelectedBudget(cat.name)}>Drill down: {cat.name}</button>
              ))}
            </div>
          </div>
          {/* Knowledge Domain Coverage Bar Chart */}
          <div className="border rounded-lg p-6 bg-docs-section">
            <h3 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-docs-dark-text' : 'text-docs-text'}`}>Knowledge Domain Coverage</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={domainData} layout="vertical" margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="name" type="category" width={80} fontSize={12} />
                <Bar dataKey="coverage" fill="#82ca9d" barSize={18} />
                <RechartsTooltip formatter={(v: any) => `${v}%`} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Gantt Chart (Responsive SVG) */}
          <div className="border rounded-lg p-6 bg-docs-section md:col-span-2">
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
          {/* Recent RAG Answers Card */}
          <div className="border rounded-lg p-6 bg-docs-section md:col-span-2">
            <h3 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-docs-dark-text' : 'text-docs-text'}`}>Recent RAG Answers</h3>
            <ul className="text-sm list-disc ml-5">
              {mockRAG.map((item, idx) => (
                <li key={idx} className="mb-2 cursor-pointer hover:text-docs-accent" title="Click to view sources" onClick={() => alert('Sources: OSHA, PMBOK, Budget 2024')}> <span className="font-medium">Q:</span> {item.question}<br /><span className="font-medium">A:</span> {item.answer}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {/* Drill-down Modal */}
      {selectedBudget && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-docs-dark-bg rounded-lg shadow-lg p-6 min-w-[300px] max-w-[90vw]">
            <h4 className={`text-lg font-bold mb-2 ${theme === 'dark' ? 'text-docs-dark-text' : 'text-docs-text'}`}>Budget Details: {selectedBudget}</h4>
            <ul className="mb-4 text-sm">
              {selectedBudgetDetails.map((d: string, idx: number) => (
                <li key={idx}>{d}</li>
              ))}
            </ul>
            <button className="px-4 py-2 rounded bg-docs-accent text-white font-semibold" onClick={() => setSelectedBudget(null)}>Close</button>
          </div>
        </div>
      )}
      {/* Quick Action Navigation */}
      {activeTab === 'chat' && (
        <div className="p-8">
          <div className="text-lg font-bold mb-4">Chat (Quick Action)</div>
          <div className="text-docs-muted mb-2">(This would switch to the Chat tab in the main UI.)</div>
          {/* Placeholder for chat UI or navigation */}
          <button className="px-4 py-2 rounded bg-docs-accent text-white font-semibold" onClick={() => setActiveTab('dashboard')}>Back to Dashboard</button>
        </div>
      )}
      {activeTab === 'knowledge' && (
        <div className="p-8">
          <div className="text-lg font-bold mb-4">Knowledge Upload (Quick Action)</div>
          <div className="text-docs-muted mb-2">(This would switch to the Knowledge tab in the main UI.)</div>
          {/* Placeholder for knowledge upload UI or navigation */}
          <button className="px-4 py-2 rounded bg-docs-accent text-white font-semibold" onClick={() => setActiveTab('dashboard')}>Back to Dashboard</button>
        </div>
      )}
    </>
  );
};

export default DashboardTab; 