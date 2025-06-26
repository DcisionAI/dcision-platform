import React from 'react';
import WorkflowTabs, { TabConfig } from '@/components/WorkflowTabs';
import ApiInterfaceConstruction from '@/workflows/construction/components/ApiInterfaceConstruction';
import AgentChat from '@/components/AgentChat';
import EnhancedAgentChat from '@/components/EnhancedAgentChat';
import ScenarioAnalysis from '@/components/ScenarioAnalysis';
import KnowledgeBase from '@/components/KnowledgeBase';
import { DocumentTextIcon, ChatBubbleLeftRightIcon, ChartPieIcon, CommandLineIcon, CogIcon, BeakerIcon, ChartBarIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import HeroSection from "@/components/HeroSection";
import ExperimentalAIAssistant from '@/components/ExperimentalAIAssistant';

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
      id: 'experimental',
      label: 'Dcision Flow',
      icon: <BeakerIcon className="w-5 h-5" />,
      description: 'Advanced real-time visualizations and experimental features',
      content: <ExperimentalAIAssistant />
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
        defaultTabId="knowledge"
        verticalName="Construction"
        tagline=""
      />
    </div>
  );
};

export default ConstructionPage; 