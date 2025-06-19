import React, { useState } from 'react';
import { useTheme } from '@/components/layout/ThemeContext';
import { DocumentTextIcon, ChatBubbleLeftRightIcon, ChartPieIcon, CommandLineIcon } from '@heroicons/react/24/outline';

export interface TabConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  content: React.ReactNode;
}

export interface WorkflowTabsProps {
  tabs: TabConfig[];
  defaultTabId?: string;
  verticalName: string;
  tagline: string;
}

const WorkflowTabs: React.FC<WorkflowTabsProps> = ({ 
  tabs, 
  defaultTabId = 'chat', 
  verticalName,
  tagline 
}) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState(defaultTabId);

  const renderTabContent = () => {
    const activeTabConfig = tabs.find(tab => tab.id === activeTab);
    return activeTabConfig ? activeTabConfig.content : null;
  };

  return (
    <div className="flex flex-col h-full">
      <div className={`border-b ${theme === 'dark' ? 'border-docs-dark-muted' : 'border-docs-muted'}`}>
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={
                `flex items-center py-4 px-1 border-b-2 font-medium text-sm ` +
                (activeTab === tab.id
                  ? 'border-docs-accent text-docs-accent'
                  : `border-transparent ${theme === 'dark' ? 'text-docs-dark-muted' : 'text-docs-muted'} hover:${theme === 'dark' ? 'text-docs-dark-text' : 'text-docs-text'}`)
              }
            >
              {tab.icon}
              <span className="ml-2">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
      <div className="flex-1 overflow-hidden">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default WorkflowTabs; 