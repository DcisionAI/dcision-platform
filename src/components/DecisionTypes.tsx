import React from 'react';
import { LightBulbIcon, CogIcon, ArrowPathRoundedSquareIcon } from '@heroicons/react/24/outline';

const decisionTypes = [
  {
    path: 'RAG Path',
    type: 'Knowledge Retrieval',
    description: 'Provides answers by searching the knowledge base.',
    icon: LightBulbIcon,
    iconBgColor: 'bg-yellow-100/50',
    iconTextColor: 'text-yellow-700',
  },
  {
    path: 'Optimization Path',
    type: 'Mathematical Optimization',
    description: 'Solves complex decision-making problems.',
    icon: CogIcon,
    iconBgColor: 'bg-blue-100/50',
    iconTextColor: 'text-blue-700',
  },
  {
    path: 'Hybrid Path',
    type: 'Combined Analysis',
    description: 'Multi-step analysis using both knowledge and optimization.',
    icon: ArrowPathRoundedSquareIcon,
    iconBgColor: 'bg-green-100/50',
    iconTextColor: 'text-green-700',
  }
];

const DecisionTypes = () => {
  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Decision Types & Execution Paths
          </h2>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {decisionTypes.map((decision) => (
            <div key={decision.path} className="bg-white/50 rounded-lg shadow-md p-6 text-center border border-gray-200/50">
              <div className={`flex items-center justify-center h-12 w-12 rounded-full ${decision.iconBgColor} mx-auto mb-4`}>
                <decision.icon className={`h-6 w-6 ${decision.iconTextColor}`} />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">{decision.path}</h3>
              <p className="text-md text-gray-600">{decision.type}</p>
              <p className="mt-2 text-base text-gray-500">{decision.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DecisionTypes; 