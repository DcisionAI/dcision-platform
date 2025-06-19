import React from 'react';
import { DocumentTextIcon, ChatBubbleLeftRightIcon, ChartPieIcon, CommandLineIcon } from '@heroicons/react/24/outline';
import WorkflowTabs, { TabConfig } from '@/components/WorkflowTabs';

const retailTabs: TabConfig[] = [
  {
    id: 'knowledge',
    label: 'Knowledge Base',
    icon: <DocumentTextIcon className="w-5 h-5" />,
    description: 'Manage and query your retail knowledge base',
    content: <div className="p-8 text-center text-lg">Retail Knowledge Base coming soon.</div>
  },
  {
    id: 'chat',
    label: 'AI Assistant',
    icon: <ChatBubbleLeftRightIcon className="w-5 h-5" />,
    description: 'Your intelligent retail assistant',
    content: <div className="p-8 text-center text-lg">Retail Agent coming soon.</div>
  },
  {
    id: 'scenario',
    label: 'Scenario Analysis',
    icon: <ChartPieIcon className="w-5 h-5" />,
    description: 'Analyze different retail scenarios and their impacts',
    content: <div className="p-8 text-center text-lg">Retail Scenario Analysis coming soon.</div>
  },
  {
    id: 'api',
    label: 'API',
    icon: <CommandLineIcon className="w-5 h-5" />,
    description: 'Access the retail workflow API',
    content: <div className="p-8 text-center text-lg">Retail API Interface coming soon.</div>
  },
];

const RetailTabs: React.FC = () => {
  return (
    <WorkflowTabs
      tabs={retailTabs}
      defaultTabId="chat"
      verticalName="Retail"
      tagline="Optimizing retail operations with intelligent decision-making"
    />
  );
};

export default RetailTabs; 