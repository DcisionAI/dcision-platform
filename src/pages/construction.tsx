import React from 'react';
import HeroSection from '@/components/HeroSection';
import WorkflowTabs, { TabConfig } from '@/components/WorkflowTabs';
import ApiInterfaceConstruction from '@/workflows/construction/components/ApiInterfaceConstruction';
import AgentChat from '@/components/AgentChat';
import StaticDashboard from '@/components/StaticDashboard';
import { DocumentTextIcon, ChatBubbleLeftRightIcon, ChartPieIcon, CommandLineIcon } from '@heroicons/react/24/outline';

const ConstructionPage: React.FC = () => {
  const tabConfig: TabConfig[] = [
    {
      id: 'knowledge',
      label: 'Knowledge Base',
      icon: <DocumentTextIcon className="w-5 h-5" />,
      description: 'Manage and query your construction knowledge base',
      content: <StaticDashboard />
    },
    {
      id: 'chat',
      label: 'AI Assistant',
      icon: <ChatBubbleLeftRightIcon className="w-5 h-5" />,
      description: 'Your intelligent construction assistant',
      content: <AgentChat apiEndpoint="/api/dcisionai/construction/chat" />
    },
    {
      id: 'scenario',
      label: 'Scenario Analysis',
      icon: <ChartPieIcon className="w-5 h-5" />,
      description: 'Analyze different project scenarios and their impacts',
      content: <div>Scenario Analysis Content</div>
    },
    {
      id: 'api',
      label: 'API',
      icon: <CommandLineIcon className="w-5 h-5" />,
      description: 'Access the construction workflow API',
      content: <ApiInterfaceConstruction />
    },
  ];

  return (
    <>
      <HeroSection tagline="Optimizing construction workflows with intelligent decision-making" />
      <WorkflowTabs tabs={tabConfig} defaultTabId="chat" verticalName="Construction" tagline="" />
    </>
  );
};

export default ConstructionPage; 