import React from 'react';
import { CheckCircleIcon, ClockIcon, ArrowPathIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

type AgentStatus = 'pending' | 'running' | 'completed' | 'error';

interface AgentStep {
  name: string;
  description: string;
  status: AgentStatus;
  output?: string;
  agent: string;
}

interface AgentStatusCardProps {
  step: AgentStep;
}

const AgentStatusCard: React.FC<AgentStatusCardProps> = ({ step }) => {
  const getStatusConfig = (status: AgentStatus) => {
    switch (status) {
      case 'completed':
        return {
          icon: CheckCircleIcon,
          bgColor: 'bg-green-500/10',
          textColor: 'text-green-500',
          borderColor: 'border-green-500/20'
        };
      case 'running':
        return {
          icon: ArrowPathIcon,
          bgColor: 'bg-blue-500/10',
          textColor: 'text-blue-500',
          borderColor: 'border-blue-500/20'
        };
      case 'error':
        return {
          icon: ExclamationCircleIcon,
          bgColor: 'bg-red-500/10',
          textColor: 'text-red-500',
          borderColor: 'border-red-500/20'
        };
      default:
        return {
          icon: ClockIcon,
          bgColor: 'bg-gray-500/10',
          textColor: 'text-gray-500',
          borderColor: 'border-gray-500/20'
        };
    }
  };

  const config = getStatusConfig(step.status);
  const Icon = config.icon;

  return (
    <div className={`${config.bgColor} border ${config.borderColor} rounded-lg p-4 flex flex-col`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-5 h-5 ${config.textColor} ${step.status === 'running' ? 'animate-spin' : ''}`} />
        <h3 className={`${config.textColor} font-medium text-sm`}>{step.name}</h3>
      </div>
      <p className="text-gray-400 text-xs">{step.description}</p>
    </div>
  );
};

interface AgentStatusCardsProps {
  steps: AgentStep[];
}

export default function AgentStatusCards({ steps }: AgentStatusCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {steps.slice(0, 3).map((step, index) => (
        <AgentStatusCard key={index} step={step} />
      ))}
    </div>
  );
} 