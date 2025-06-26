import React from 'react';
import { DocumentTextIcon, ChatBubbleLeftRightIcon, ChartPieIcon, CommandLineIcon } from '@heroicons/react/24/outline';
import WorkflowTabs, { TabConfig } from '@/components/WorkflowTabs';
import KnowledgeBase from '@/components/KnowledgeBase';

const financeTabs: TabConfig[] = [
  {
    id: 'knowledge',
    label: 'Knowledge Base',
    icon: <DocumentTextIcon className="w-5 h-5" />,
    description: 'Manage and query your finance knowledge base',
    content: <KnowledgeBase domain="finance" />
  },
  {
    id: 'scenario',
    label: 'Scenario Analysis',
    icon: <ChartPieIcon className="w-5 h-5" />,
    description: 'Analyze different finance scenarios and their impacts',
    content: <div className="p-8 text-center text-lg">Finance Scenario Analysis coming soon.</div>
  },
  {
    id: 'api',
    label: 'API',
    icon: <CommandLineIcon className="w-5 h-5" />,
    description: 'Access the finance workflow API',
    content: <div className="p-8 text-center text-lg">Finance API Interface coming soon.</div>
  },
];

const FinanceTabs: React.FC = () => {
  return (
    <WorkflowTabs
      tabs={financeTabs}
      defaultTabId="knowledge"
      verticalName="Finance"
      tagline="Optimizing financial decisions with intelligent analysis"
    />
  );
};

export default FinanceTabs; 