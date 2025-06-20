import React from 'react';
import WorkflowTabs, { TabConfig } from '@/components/WorkflowTabs';
import ApiInterfaceConstruction from '@/workflows/construction/components/ApiInterfaceConstruction';
import AgentChat from '@/components/AgentChat';
import ScenarioAnalysis from '@/components/ScenarioAnalysis';
import KnowledgeBase from '@/components/KnowledgeBase';
import { DocumentTextIcon, ChatBubbleLeftRightIcon, ChartPieIcon, CommandLineIcon } from '@heroicons/react/24/outline';
import HeroSection from "@/components/HeroSection";

const ConstructionPage: React.FC = () => {
  const tabConfig: TabConfig[] = [
    {
      id: 'knowledge',
      label: 'Knowledge Base',
      icon: <DocumentTextIcon className="w-5 h-5" />,
      description: 'Manage and query your construction knowledge base',
      content: <KnowledgeBase domain="construction" />
    },
    {
      id: 'chat',
      label: 'AI Assistant',
      icon: <ChatBubbleLeftRightIcon className="w-5 h-5" />,
      description: 'Your intelligent construction assistant',
      content: <AgentChat apiEndpoint="/api/dcisionai/construction/chat" showSmartPrompts={true} />
    },
    {
      id: 'scenario-analysis',
      label: 'Scenario Analysis',
      icon: <ChartPieIcon className="w-5 h-5" />,
      description: 'Analyze different project scenarios and their impacts',
      content: <ScenarioAnalysis scenarios={[]} />,
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
    <div className="p-4 md:p-8">
      <HeroSection title="DcisionAI" tagline="Optimizing construction workflows with intelligent decision-making" />
      <WorkflowTabs
        tabs={tabConfig}
        defaultTabId="chat"
        verticalName="Construction"
        tagline=""
      />
    </div>
  );
};

export default ConstructionPage; 