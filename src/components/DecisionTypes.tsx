import React from 'react';
import { LightBulbIcon, CogIcon, ArrowPathRoundedSquareIcon } from '@heroicons/react/24/outline';
import { useTheme } from './layout/ThemeContext';

const decisionTypes = [
  {
    path: 'RAG Path',
    type: 'Knowledge Retrieval',
    description: 'Provides answers by searching the knowledge base.',
    icon: LightBulbIcon,
    iconLightBg: 'bg-yellow-100/50',
    iconLightText: 'text-yellow-700',
    iconDarkBg: 'bg-yellow-900/20',
    iconDarkText: 'text-yellow-400',
  },
  {
    path: 'Optimization Path',
    type: 'Mathematical Optimization',
    description: 'Solves complex decision-making problems.',
    icon: CogIcon,
    iconLightBg: 'bg-blue-100/50',
    iconLightText: 'text-blue-700',
    iconDarkBg: 'bg-blue-900/20',
    iconDarkText: 'text-blue-400',
  },
  {
    path: 'Hybrid Path',
    type: 'Combined Analysis',
    description: 'Multi-step analysis using both knowledge and optimization.',
    icon: ArrowPathRoundedSquareIcon,
    iconLightBg: 'bg-green-100/50',
    iconLightText: 'text-green-700',
    iconDarkBg: 'bg-green-900/20',
    iconDarkText: 'text-green-400',
  }
];

const DecisionTypes = () => {
  const { theme } = useTheme();
  return (
    <div className="py-12 bg-docs-bg dark:bg-docs-dark-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-docs-text dark:text-docs-dark-text sm:text-4xl">
            Decision Types & Execution Paths
          </h2>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {decisionTypes.map((decision) => (
            <div key={decision.path} className="bg-docs-section dark:bg-gray-800/50 rounded-lg shadow-md p-6 text-center border border-docs-section-border dark:border-gray-700">
              <div className={`flex items-center justify-center h-12 w-12 rounded-full ${theme === 'light' ? decision.iconLightBg : decision.iconDarkBg} mx-auto mb-4`}>
                <decision.icon className={`h-6 w-6 ${theme === 'light' ? decision.iconLightText : decision.iconDarkText}`} />
              </div>
              <h3 className="text-lg font-semibold text-docs-text dark:text-docs-dark-text">{decision.path}</h3>
              <p className="text-md text-docs-muted dark:text-docs-dark-muted">{decision.type}</p>
              <p className="mt-2 text-base text-docs-muted dark:text-docs-dark-muted">{decision.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DecisionTypes; 