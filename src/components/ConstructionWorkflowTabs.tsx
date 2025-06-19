import React, { useState, useEffect } from 'react';
import { useTheme } from '@/components/layout/ThemeContext';
import ApiInterfaceConstruction from '@/components/ApiInterfaceConstruction';
import AgentChat from '@/components/AgentChat';
import StaticDashboard from '@/components/StaticDashboard';
import axios from 'axios';

const mainTabs = [
  {
    id: 'knowledge',
    label: 'Knowledge',
    icon: (
      // Database/Upload icon
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      // Dashboard icon
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8v-10h-8v10zm0-18v6h8V3h-8z" />
      </svg>
    ),
  },
  {
    id: 'chat',
    label: 'Chat',
    icon: (
      // Chat bubble icon
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
  },
  {
    id: 'api',
    label: 'API',
    icon: (
      // Code/API icon
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
      </svg>
    ),
  },
];

const tagOptions = ['Safety', 'OSHA', 'Planning', 'PMBOK', 'Budget', 'Quality'];

const ConstructionWorkflowTabs: React.FC = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('knowledge');
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

  useEffect(() => {
    if (activeTab === 'knowledge') fetchSources();
    // eslint-disable-next-line
  }, [activeTab, page, limit, filterType, filterTag, filterStatus]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className={`p-8 ${baseFont} ${primaryText}`}>
            <h2 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-docs-dark-text' : 'text-docs-text'}`}>Dashboard</h2>
            <StaticDashboard />
          </div>
        );
      case 'knowledge':
        return (
          <div className={`p-8 ${baseFont} ${primaryText}`}>
            <h2 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-docs-dark-text' : 'text-docs-text'}`}>Build Your Construction Knowledge Base (RAG)</h2>
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
          <div className={`p-8 ${baseFont} ${primaryText}`}>
            <h2 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-docs-dark-text' : 'text-docs-text'}`}>Chat</h2>
            <div className={`border rounded-lg p-6 min-h-[400px] ${cardBg} ${borderColor}`}>
              <AgentChat
                sendMessage={async (message) => {
                  const res = await fetch('/api/dcisionai/construction/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message }),
                  });
                  if (!res.ok) {
                    const error = await res.json().catch(() => ({}));
                    throw new Error(error.error || 'Failed to get response');
                  }
                  return res.json();
                }}
                initialMessage="Hello! I'm your DcisionAI Construction Assistant. How can I help you with your project today?"
                placeholder="Ask about cost estimation, timelines, risks, or construction best practices..."
              />
            </div>
          </div>
        );
      case 'api':
        return (
          <div className={`p-8 ${baseFont} ${primaryText}`}>
            <h2 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-docs-dark-text' : 'text-docs-text'}`}>API</h2>
            <div className={`border rounded-lg p-6 min-h-[400px] ${cardBg} ${borderColor}`}>
              <ApiInterfaceConstruction />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`flex flex-col h-full ${baseFont} ${theme === 'dark' ? 'bg-docs-dark-bg' : 'bg-docs-bg'}`}>
      {/* Main Tabs */}
      <div className={`border-b ${borderColor}`}>
        <nav className="flex space-x-8 px-6" aria-label="Workflow Tabs">
          {mainTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={
                `flex items-center py-4 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === tab.id
                    ? 'border-docs-accent text-docs-accent'
                    : `border-transparent ${
                        theme === 'dark' ? 'text-docs-dark-muted' : 'text-docs-muted'
                      } hover:${theme === 'dark' ? 'text-docs-dark-text' : 'text-docs-text'}`
                }
              `
              }
            >
              {tab.icon}
              <span className="ml-2">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default ConstructionWorkflowTabs;