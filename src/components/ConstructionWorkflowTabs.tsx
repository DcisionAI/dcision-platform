import React, { useState, useEffect } from 'react';
import { useTheme } from '@/components/layout/ThemeContext';
import ApiInterfaceConstruction from '@/components/ApiInterfaceConstruction';
import AgentChat from '@/components/AgentChat';
import StaticDashboard from '@/components/StaticDashboard';
import IntentAnalysisDisplay from '@/components/IntentAnalysisDisplay';
import axios from 'axios';
import {
  DocumentTextIcon,
  CpuChipIcon,
  ChartBarIcon,
  LightBulbIcon,
  ArrowPathRoundedSquareIcon,
  CogIcon,
  RocketLaunchIcon,
  CommandLineIcon,
  BeakerIcon,
  ChatBubbleLeftRightIcon,
  ChartPieIcon,
} from '@heroicons/react/24/outline';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const mainTabs = [
  {
    id: 'knowledge',
    label: 'Knowledge Base',
    icon: <DocumentTextIcon className="w-5 h-5" />,
    description: 'Manage and query your construction knowledge base'
  },
  {
    id: 'chat',
    label: 'AI Assistant',
    icon: <ChatBubbleLeftRightIcon className="w-5 h-5" />,
    description: 'Your intelligent construction assistant'
  },
  {
    id: 'scenario',
    label: 'Scenario Analysis',
    icon: <ChartPieIcon className="w-5 h-5" />,
    description: 'Analyze different project scenarios and their impacts'
  },
  {
    id: 'api',
    label: 'API',
    icon: <CommandLineIcon className="w-5 h-5" />,
    description: 'Access the construction workflow API'
  },
];

const tagOptions = ['Safety', 'OSHA', 'Planning', 'PMBOK', 'Budget', 'Quality'];

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c', '#d0ed57'];

const ConstructionWorkflowTabs: React.FC = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('chat');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [ragResult, setRagResult] = useState<{ answer: string, sources: string[] } | null>(null);
  const [ingestLoading, setIngestLoading] = useState(false);
  const [queryLoading, setQueryLoading] = useState(false);
  const [ragMatches, setRagMatches] = useState<any[]>([]);
  const [llmAnswer, setLlmAnswer] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [filterType, setFilterType] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [total, setTotal] = useState(0);
  const [addToGraphLoading, setAddToGraphLoading] = useState<string | null>(null);
  const [llmPrompt, setLlmPrompt] = useState('');
  const [llmLoading, setLlmLoading] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [scenarioData, setScenarioData] = useState([
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
  ]);

  const baseFont = 'font-sans';
  const primaryText = theme === 'dark' ? 'text-docs-dark-text' : 'text-docs-text';
  const mutedText = theme === 'dark' ? 'text-docs-dark-muted' : 'text-docs-muted';
  const cardBg = theme === 'dark' ? 'bg-docs-dark-bg' : 'bg-docs-section';
  const borderColor = theme === 'dark' ? 'border-docs-dark-muted' : 'border-docs-muted';
  const accent = 'text-docs-accent';
  const accentBg = 'bg-docs-accent';
  const tableHeaderBg = theme === 'dark' ? 'bg-docs-dark-bg' : 'bg-white';
  const tableCellBg = theme === 'dark' ? 'bg-docs-dark-bg' : 'bg-white';
  const tableHeaderText = theme === 'dark' ? 'text-docs-accent' : 'text-docs-accent';
  const tableCellText = theme === 'dark' ? 'text-docs-dark-text' : 'text-docs-text';

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploadedFiles(Array.from(files));
      setIngestLoading(true);
      const formData = new FormData();
      formData.append('file', files[0]);
      try {
        await axios.post('/api/rag/ingest', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        setSources(prev => [
          ...prev,
          { id: Date.now().toString(), name: files[0].name, type: files[0].type, tags: selectedTags, status: 'Ready' }
        ]);
      } catch (err) {
        alert('Failed to ingest file');
      }
      setIngestLoading(false);
    }
  };

  const handleUrlIngest = async () => {
    if (urlInput) {
      setIngestLoading(true);
      const formData = new FormData();
      formData.append('url', urlInput);
      try {
        await axios.post('/api/rag/ingest', formData);
        setSources(prev => [
          ...prev,
          { id: Date.now().toString(), name: urlInput, type: 'Web', tags: selectedTags, status: 'Ready' }
        ]);
        setUrlInput('');
        setSelectedTags([]);
      } catch (err) {
        alert('Failed to ingest URL');
      }
      setIngestLoading(false);
    }
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag]);
  };

  const handleDeleteSource = async (id: string) => {
    try {
      await axios.post('/api/rag/delete', { id });
      setSources(sources.filter(s => s.id !== id));
    } catch (err) {
      alert('Failed to delete entry');
    }
  };

  const handleTestQuery = async () => {
    if (!query) return;
    setQueryLoading(true);
    setRagResult(null);
    setRagMatches([]);
    setLlmAnswer(null);
    try {
      const res = await axios.post('/api/rag/query', { query });
      setRagMatches(res.data.matches || []);
      setLlmAnswer(res.data.answer || null);
      setRagResult({
        answer: res.data.matches && res.data.matches.length > 0
          ? res.data.matches.map((m: any) => m.metadata?.chunk).join('\n---\n')
          : 'No results',
        sources: res.data.matches ? res.data.matches.map((m: any) => m.metadata?.sourceType || 'unknown') : []
      });
    } catch (err) {
      setRagResult({ answer: 'Error querying knowledge base', sources: [] });
    }
    setQueryLoading(false);
  };

  const fetchSources = async () => {
    try {
      const params = {
        limit,
        page,
        ...(filterType && { type: filterType }),
        ...(filterTag && { tag: filterTag }),
        ...(filterStatus && { status: filterStatus }),
      };
      const res = await axios.get('/api/rag/list', { params });
      setSources(res.data.vectors);
      setTotal(res.data.total || 0);
    } catch (err) {
      setSources([]);
      setTotal(0);
    }
  };

  const handleAddToKnowledgeGraph = async (source: string) => {
    setAddToGraphLoading(source);
    try {
      const res = await axios.post('/api/rag/add-to-graph', { source, domain: 'construction' });
      // Optionally update the global knowledge graph here if you want
      alert('Successfully added to knowledge graph!');
    } catch (err: any) {
      alert('Failed to add to knowledge graph: ' + (err?.response?.data?.error || err.message));
    }
    setAddToGraphLoading(null);
  };

  const getRadarData = (scenarios: any[]) => {
    const metrics = ['cost', 'duration', 'efficiency'] as const;
    return metrics.map(metric => {
      const entry: { [key: string]: string | number } = { metric: metric.charAt(0).toUpperCase() + metric.slice(1) };
      scenarios.forEach((s) => {
        entry[s.name] = s.metrics[metric];
      });
      return entry;
    });
  };

  const handleScenarioAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!llmPrompt.trim()) return;
    setLlmLoading(true);
    
    try {
      // In a real implementation, this would call your backend
      // Simulating API call for now
      setTimeout(() => {
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
          if (prev.some(s => s.name === newScenario.name)) return prev;
          return [...prev, newScenario];
        });
        setSelectedScenario(newScenario.name);
        setLlmLoading(false);
        setLlmPrompt('');
      }, 1500);
    } catch (error) {
      console.error('Failed to analyze scenario:', error);
      setLlmLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'knowledge') fetchSources();
    // eslint-disable-next-line
  }, [activeTab, page, limit, filterType, filterTag, filterStatus]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'knowledge':
        return (
          <div className={`px-6 py-4 ${baseFont} ${primaryText}`}>
            <h2 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-docs-dark-text' : 'text-docs-text'}`}>
              Construction Knowledge Base (RAG)
            </h2>
            {/* File Upload */}
            <div className={`mb-6 border-2 border-dashed rounded-lg p-6 text-center ${borderColor} ${cardBg}`}> 
              <input type="file" accept=".csv,.xlsx,.xls,.txt,.json" multiple className="hidden" id="file-upload" onChange={handleFileUpload} />
              <label htmlFor="file-upload" className="cursor-pointer block text-lg font-medium mb-2">Drag and drop files here, or <span className="text-docs-accent underline">browse</span></label>
              {uploadedFiles.length > 0 && (
                <div className="mt-2 text-sm">{uploadedFiles.map(f => f.name).join(', ')}</div>
              )}
              <div className="mt-2 text-sm text-docs-muted">Supported: PDF, DOCX, CSV, XLSX, TXT, JSON, MD, etc.</div>
            </div>
            {/* URL Ingestion */}
            <div className="mb-6 flex items-center gap-2">
              <input
                type="text"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                placeholder="Paste a public URL (e.g., OSHA, PMBOK)"
                className={`flex-1 border rounded px-3 py-2 ${borderColor} ${cardBg}`}
              />
              <button onClick={handleUrlIngest} className={`px-4 py-2 ${accentBg} text-white rounded font-semibold`}>Ingest URL</button>
            </div>
            {/* Tagging UI */}
            <div className="mb-6">
              <div className="mb-2 font-medium">Tags:</div>
              <div className="flex flex-wrap gap-2">
                {tagOptions.map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-1 rounded border transition-colors duration-150
                      ${selectedTags.includes(tag)
                        ? accentBg + ' text-white border-docs-accent'
                        : borderColor + ' ' + mutedText + ' bg-transparent hover:' + (theme === 'dark' ? 'bg-docs-dark-bg' : 'bg-docs-section')}
                    `}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            {/* Filtering Controls */}
            <div className="mb-4 flex gap-2 items-center">
              <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }} className="border rounded px-2 py-1">
                <option value="">All Types</option>
                <option value="PDF">PDF</option>
                <option value="Web">Web</option>
                <option value="DOCX">DOCX</option>
                <option value="CSV">CSV</option>
                <option value="TXT">TXT</option>
                <option value="XLSX">XLSX</option>
              </select>
              <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} className="border rounded px-2 py-1">
                <option value="">All Statuses</option>
                <option value="Ready">Ready</option>
                <option value="Processing">Processing</option>
              </select>
              <input type="text" value={filterTag} onChange={e => { setFilterTag(e.target.value); setPage(1); }} placeholder="Tag" className="border rounded px-2 py-1" />
            </div>
            {/* Knowledge Base Browser */}
            <div className="mb-6">
              <div className="mb-2 font-medium">Knowledge Base Entries:</div>
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className={`text-left px-2 py-2 ${accent} ${theme === 'dark' ? 'bg-docs-dark-bg' : 'bg-white'} font-semibold`}>Name</th>
                    <th className={`text-left px-2 py-2 ${accent} ${theme === 'dark' ? 'bg-docs-dark-bg' : 'bg-white'} font-semibold`}>Type</th>
                    <th className={`text-left px-2 py-2 ${accent} ${theme === 'dark' ? 'bg-docs-dark-bg' : 'bg-white'} font-semibold`}>Tags</th>
                    <th className={`text-left px-2 py-2 ${accent} ${theme === 'dark' ? 'bg-docs-dark-bg' : 'bg-white'} font-semibold`}>Status</th>
                    <th className={`px-2 py-2 ${theme === 'dark' ? 'bg-docs-dark-bg' : 'bg-white'}`}></th>
                  </tr>
                </thead>
                <tbody>
                  {sources.map(s => (
                    <tr key={s.id} className={`${theme === 'dark' ? 'bg-docs-dark-bg' : 'bg-white'}`}> 
                      <td className={`px-2 py-2 ${theme === 'dark' ? 'text-docs-dark-text' : 'text-docs-text'}`}>
                        {s.sourceType === 'url' ? (
                          <a href={s.source} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                            {s.source}
                          </a>
                        ) : (
                          s.source || s.name || s.id
                        )}
                      </td>
                      <td className={`px-2 py-2 ${theme === 'dark' ? 'text-docs-dark-text' : 'text-docs-text'}`}>
                        {s.type || s.sourceType || 'Unknown'}
                      </td>
                      <td className={`px-2 py-2 ${theme === 'dark' ? 'text-docs-dark-text' : 'text-docs-text'}`}>
                        {Array.isArray(s.tags) ? s.tags.join(', ') : (s.tags || '')}
                      </td>
                      <td className={`px-2 py-2 ${theme === 'dark' ? 'text-docs-dark-text' : 'text-docs-text'}`}>
                        {s.status || 'Ready'}
                      </td>
                      <td className="px-2 py-2 flex gap-2">
                        <button onClick={() => handleDeleteSource(s.id)} className="text-red-500 hover:underline">Delete</button>
                        <button
                          onClick={() => handleAddToKnowledgeGraph(s.source || s.name || s.id)}
                          className="text-blue-600 hover:underline"
                          disabled={addToGraphLoading === (s.source || s.name || s.id)}
                        >
                          {addToGraphLoading === (s.source || s.name || s.id) ? 'Adding...' : 'Add to Knowledge Graph'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
              <span>Page {page} of {Math.max(1, Math.ceil(total / limit))}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page * limit >= total} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
            </div>
            {/* Test a Query */}
            <div className="mb-6">
              <div className="mb-2 font-medium">Test a Query:</div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Ask a construction management question..."
                  className={`flex-1 border rounded px-3 py-2 ${borderColor} ${cardBg}`}
                />
                <button onClick={handleTestQuery} className={`px-4 py-2 ${accentBg} text-white rounded font-semibold`}>Run RAG</button>
              </div>
              {llmAnswer && (
                <div className="mb-4 p-4 bg-green-50 dark:bg-green-900 rounded shadow">
                  <div className="font-semibold mb-1 text-green-800 dark:text-green-200">LLM Answer:</div>
                  <div className="text-green-900 dark:text-green-100">{llmAnswer}</div>
                </div>
              )}
              {ragMatches.length > 0 && (
                <div className="mb-4">
                  <div className="font-semibold mb-2">Top Sources:</div>
                  <div className="grid gap-3">
                    {ragMatches.map((m, i) => (
                      <div key={i} className="p-3 rounded border bg-white dark:bg-docs-dark-bg">
                        <div className="text-xs text-docs-muted mb-1">
                          Source {i + 1} ({m.metadata?.sourceType || 'unknown'})
                        </div>
                        <div>
                          {/* Optionally highlight query terms */}
                          {m.metadata?.chunk}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case 'chat':
        return (
          <div className={`px-6 py-4 ${baseFont} ${primaryText}`}>
            <div className="max-w-16xl mx-auto">
              <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-[#FF7F50] to-[#4A90E0] inline-block text-transparent bg-clip-text">
                  DcisionAI
                </h1>
                <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Optimizing construction workflows with intelligent decision-making
                </p>
                <div className="mt-8 inline-flex gap-8 px-6 py-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <span className="text-sm text-blue-600 dark:text-blue-400">1</span>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Input Analysis</p>
                      <p className="text-xs text-gray-500">AI analyzes query intent</p>
                    </div>
                    <span className="text-gray-300 dark:text-gray-600">→</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <span className="text-sm text-green-600 dark:text-green-400">2</span>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Intent Classification</p>
                      <p className="text-xs text-gray-500">Determines query type</p>
                    </div>
                    <span className="text-gray-300 dark:text-gray-600">→</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <span className="text-sm text-purple-600 dark:text-purple-400">3</span>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Path Selection</p>
                      <p className="text-xs text-gray-500">Routes to solution</p>
                    </div>
                    <span className="text-gray-300 dark:text-gray-600">→</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                      <span className="text-sm text-orange-600 dark:text-orange-400">4</span>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Solution Delivery</p>
                      <p className="text-xs text-gray-500">Delivers with metrics</p>
                    </div>
                  </div>
                </div>
              </div>
              <AgentChat
                placeholder="Ask about construction workflows, project phases, or resource allocation..."
              />
            </div>
          </div>
        );
      case 'scenario':
        return (
          <div className={`px-6 py-4 ${baseFont} ${primaryText}`}>
            <h2 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-docs-dark-text' : 'text-docs-text'}`}>
              Scenario Analysis
            </h2>
            <div className="mb-6">
              <p className={`text-sm ${mutedText}`}>
                Analyze different project scenarios and their potential impacts on cost, duration, and efficiency.
              </p>
            </div>

            {/* Scenario Analysis Input */}
            <form onSubmit={handleScenarioAnalysis} className="mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  className={`flex-1 border rounded px-3 py-2 ${borderColor} ${cardBg}`}
                  placeholder="Describe a scenario (e.g., what if labor costs increase by 20%?)"
                  value={llmPrompt}
                  onChange={(e) => setLlmPrompt(e.target.value)}
                  disabled={llmLoading}
                />
                <button
                  type="submit"
                  className={`px-4 py-2 ${accentBg} text-white rounded font-semibold disabled:opacity-50`}
                  disabled={llmLoading || !llmPrompt.trim()}
                >
                  {llmLoading ? 'Analyzing...' : 'Analyze'}
                </button>
              </div>
            </form>

            {/* Scenario Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {scenarioData.map((scenario) => (
                <div
                  key={scenario.name}
                  onClick={() => setSelectedScenario(scenario.name)}
                  className={`rounded-lg p-4 cursor-pointer transition-all border-2 
                    ${selectedScenario === scenario.name 
                      ? 'border-docs-accent bg-docs-accent/10' 
                      : `border-transparent ${cardBg} hover:border-docs-accent`}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold">{scenario.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${
                      scenario.impact === 'high' ? 'bg-red-500' :
                      scenario.impact === 'medium' ? 'bg-yellow-500' :
                      'bg-green-500'
                    } text-white`}>
                      {scenario.impact.toUpperCase()}
                    </span>
                  </div>
                  <p className={`text-sm ${mutedText} mb-2`}>{scenario.description}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full">
                      <div
                        className="h-1 bg-docs-accent rounded-full"
                        style={{ width: `${scenario.probability}%` }}
                      />
                    </div>
                    <span className={`text-xs ${mutedText}`}>{scenario.probability}%</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Palantir-style Visualization Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Radar Chart for scenario comparison */}
              <div className={`rounded-lg p-4 shadow ${tableCellBg}`}>
                <h4 className="font-semibold mb-4">Scenario Metrics Comparison</h4>
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
              <div className={`rounded-lg p-4 shadow ${tableCellBg}`}>
                <h4 className="font-semibold mb-4">Scenario Details</h4>
                {(() => {
                  const scenario = scenarioData.find(s => s.name === selectedScenario);
                  if (!scenario) return (
                    <div className={`text-center p-8 ${mutedText}`}>
                      Select a scenario to view details
                    </div>
                  );
                  return (
                    <div className="space-y-4">
                      <div>
                        <span className="font-semibold">Description:</span>
                        <p className="text-sm mt-1">{scenario.description}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="font-semibold">Probability:</span>
                          <p className="text-sm mt-1">{scenario.probability}%</p>
                        </div>
                        <div>
                          <span className="font-semibold">Impact:</span>
                          <p className="text-sm mt-1">{scenario.impact}</p>
                        </div>
                      </div>
                      <div>
                        <span className="font-semibold">Metrics:</span>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          <div className={`p-2 rounded ${cardBg}`}>
                            <div className={`text-xs ${mutedText}`}>Cost</div>
                            <div className="font-semibold">${scenario.metrics.cost.toLocaleString()}</div>
                          </div>
                          <div className={`p-2 rounded ${cardBg}`}>
                            <div className={`text-xs ${mutedText}`}>Duration</div>
                            <div className="font-semibold">{scenario.metrics.duration} months</div>
                          </div>
                          <div className={`p-2 rounded ${cardBg}`}>
                            <div className={`text-xs ${mutedText}`}>Efficiency</div>
                            <div className="font-semibold">{(scenario.metrics.efficiency * 100).toFixed(0)}%</div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <span className="font-semibold">Risks:</span>
                        <ul className="list-disc pl-4 mt-1 space-y-1">
                          {scenario.risks.map((risk, index) => (
                            <li key={index} className="text-sm">{risk}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="font-semibold">Recommendations:</span>
                        <ul className="list-disc pl-4 mt-1 space-y-1">
                          {scenario.recommendations.map((rec, index) => (
                            <li key={index} className="text-sm">{rec}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        );
      case 'api':
        return (
          <div className={`px-6 py-4 ${baseFont} ${primaryText}`}>
            <h2 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-docs-dark-text' : 'text-docs-text'}`}>API</h2>
            <div className={`border rounded-lg p-6 min-h-[calc(100vh-12rem)] ${cardBg} ${borderColor}`}>
              <ApiInterfaceConstruction />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className={`border-b ${theme === 'dark' ? 'border-docs-dark-muted' : 'border-docs-muted'}`}>
        <nav className="flex space-x-8 px-6" aria-label="Workflow Tabs">
          {mainTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center py-4 px-1 border-b-2 font-medium text-sm group
                ${
                  activeTab === tab.id
                    ? 'border-docs-accent text-docs-accent'
                    : `border-transparent ${
                        theme === 'dark' ? 'text-docs-dark-muted' : 'text-docs-muted'
                      } hover:${theme === 'dark' ? 'text-docs-dark-text' : 'text-docs-text'}`
                }
              `}
            >
              <span className="group-hover:transform group-hover:scale-110 transition-transform">
                {tab.icon}
              </span>
              <span className="ml-2">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default ConstructionWorkflowTabs;