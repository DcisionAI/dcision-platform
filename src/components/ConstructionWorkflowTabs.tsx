import React, { useState } from 'react';
import { useTheme } from '@/components/layout/ThemeContext';
import ApiInterfaceConstruction from '@/components/ApiInterfaceConstruction';
import AgentChat from '@/components/AgentChat';
import DashboardTab from '@/components/DashboardTab';

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

const mockSources = [
  { id: '1', name: 'OSHA Safety Checklist', type: 'PDF', tags: ['Safety', 'OSHA'], status: 'Ready' },
  { id: '2', name: 'PMBOK Guide', type: 'Web', tags: ['Planning', 'PMBOK'], status: 'Processing' },
];

const tagOptions = ['Safety', 'OSHA', 'Planning', 'PMBOK', 'Budget', 'Quality'];

const ConstructionWorkflowTabs: React.FC = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('knowledge');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sources, setSources] = useState(mockSources);
  const [query, setQuery] = useState('');
  const [ragResult, setRagResult] = useState<{ answer: string, sources: string[] } | null>(null);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles(Array.from(e.target.files));
      // TODO: Send files to backend for ingestion
    }
  };

  const handleUrlIngest = () => {
    if (urlInput) {
      // TODO: Send URL and selectedTags to backend for ingestion
      setSources([...sources, { id: Date.now().toString(), name: urlInput, type: 'Web', tags: selectedTags, status: 'Processing' }]);
      setUrlInput('');
      setSelectedTags([]);
    }
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag]);
  };

  const handleDeleteSource = (id: string) => {
    // TODO: Call backend to delete
    setSources(sources.filter(s => s.id !== id));
  };

  const handleTestQuery = () => {
    // TODO: Call backend RAG endpoint
    setRagResult({
      answer: 'This is a mock RAG answer based on your knowledge base.',
      sources: ['OSHA Safety Checklist', 'PMBOK Guide'],
    });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className={`p-8 ${baseFont} ${primaryText}`}>
            <h2 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-docs-dark-text' : 'text-docs-text'}`}>Dashboard</h2>
            <DashboardTab />
          </div>
        );
      case 'knowledge':
        return (
          <div className={`p-8 ${baseFont} ${primaryText}`}>
            <h2 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-docs-dark-text' : 'text-docs-text'}`}>Build Your Construction Knowledge Base (RAG)</h2>
            {/* File Upload */}
            <div className={`mb-6 border-2 border-dashed rounded-lg p-6 text-center ${borderColor} ${cardBg}`}> 
              <input type="file" multiple className="hidden" id="file-upload" onChange={handleFileUpload} />
              <label htmlFor="file-upload" className="cursor-pointer block text-lg font-medium mb-2">Drag and drop files here, or <span className="text-docs-accent underline">browse</span></label>
              {uploadedFiles.length > 0 && (
                <div className="mt-2 text-sm">{uploadedFiles.map(f => f.name).join(', ')}</div>
              )}
              <div className="mt-2 text-sm text-docs-muted">Supported: PDF, DOCX, CSV, MD, etc.</div>
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
                      <td className={`px-2 py-2 ${theme === 'dark' ? 'text-docs-dark-text' : 'text-docs-text'}`}>{s.name}</td>
                      <td className={`px-2 py-2 ${theme === 'dark' ? 'text-docs-dark-text' : 'text-docs-text'}`}>{s.type}</td>
                      <td className={`px-2 py-2 ${theme === 'dark' ? 'text-docs-dark-text' : 'text-docs-text'}`}>{s.tags.join(', ')}</td>
                      <td className={`px-2 py-2 ${theme === 'dark' ? 'text-docs-dark-text' : 'text-docs-text'}`}>{s.status}</td>
                      <td className="px-2 py-2">
                        <button onClick={() => handleDeleteSource(s.id)} className="text-red-500 hover:underline">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
              {ragResult && (
                <div className={`mt-4 p-4 border rounded ${cardBg} ${borderColor}`}>
                  <div className={`font-semibold mb-1 ${accent}`}>RAG Answer:</div>
                  <div className={`${primaryText} mb-2`}>{ragResult.answer}</div>
                  <div className={`text-xs ${mutedText}`}>Sources: {ragResult.sources.join(', ')}</div>
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