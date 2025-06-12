import React, { useState } from 'react';
import { useTheme } from '@/components/layout/ThemeContext';
import FinanceAgent from './FinanceAgent';
import AgentInterface from './AgentInterface';

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const tabs: Tab[] = [
  {
    id: 'chat',
    label: 'Chat',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
  },
  {
    id: 'api',
    label: 'API',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  },
  {
    id: 'data',
    label: 'Data',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
    ),
  },
];

const FinanceTabs: React.FC = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('chat');
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    // TODO: Handle file upload
    console.log('Dropped files:', files);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'chat':
        return <FinanceAgent />;
      case 'api':
        return (
          <AgentInterface
            agentName="Finance"
            baseUrl="/api/dcisionai/chat"
            defaultRequestBody='{\n  "message": "Your message here"\n}'
          />
        );
      case 'data':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Upload Data</h2>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center ${
                isDragging
                  ? 'border-docs-accent bg-docs-accent/10'
                  : theme === 'dark'
                  ? 'border-docs-dark-muted'
                  : 'border-docs-muted'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <svg
                className={`w-12 h-12 mx-auto mb-4 ${
                  theme === 'dark' ? 'text-docs-dark-muted' : 'text-docs-muted'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className={`text-lg mb-2 ${theme === 'dark' ? 'text-docs-dark-text' : 'text-docs-text'}`}>
                Drag and drop your files here
              </p>
              <p className={`text-sm ${theme === 'dark' ? 'text-docs-dark-muted' : 'text-docs-muted'}`}>
                Supported formats: CSV, JSON, Excel
              </p>
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
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center py-4 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === tab.id
                    ? 'border-docs-accent text-docs-accent'
                    : `border-transparent ${
                        theme === 'dark' ? 'text-docs-dark-muted' : 'text-docs-muted'
                      } hover:${theme === 'dark' ? 'text-docs-dark-text' : 'text-docs-text'}`
                }
              `}
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

export default FinanceTabs; 