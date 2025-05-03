import React, { useState } from 'react';

export type AgentStatus = 'pending' | 'running' | 'completed' | 'error';
export interface AgentStep {
  name: string;
  description: string;
  status: AgentStatus;
  output?: string;
}

export interface AgentConversationProps {
  steps: AgentStep[];
}

const statusIcon = (status: AgentStatus) => {
  switch (status) {
    case 'pending': return '⏳';
    case 'running': return '🔄';
    case 'completed': return '✅';
    case 'error': return '❌';
    default: return '';
  }
};

export const AgentConversation: React.FC<AgentConversationProps> = ({ steps }) => {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const toggle = (idx: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };
  return (
    <ul className="space-y-4">
      {steps.map((step, idx) => (
        <li key={idx} className="border rounded p-4">
          <div className="flex justify-between items-center cursor-pointer" onClick={() => toggle(idx)}>
            <div className="flex items-center space-x-2">
              <span className="text-xl">{statusIcon(step.status)}</span>
              <div>
                <p className="font-semibold">{step.name}</p>
                <small className="text-gray-500">{step.description}</small>
              </div>
            </div>
            <button className="text-sm text-gray-400">
              {expanded.has(idx) ? 'Hide' : 'Show'}
            </button>
          </div>
          {expanded.has(idx) && step.output && (
            <pre className="mt-2 bg-gray-100 p-2 rounded text-sm whitespace-pre-wrap">
              {step.output}
            </pre>
          )}
        </li>
      ))}
    </ul>
  );
};

export default AgentConversation;