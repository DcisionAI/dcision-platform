import React from 'react';
import { LightBulbIcon, CogIcon, ArrowPathRoundedSquareIcon } from '@heroicons/react/24/outline';
import { useTheme } from './layout/ThemeContext';

const exampleQueries = [
  {
    title: 'Knowledge Query Example',
    path: 'Rag Path',
    description: 'Knowledge-based response using construction knowledge base',
    decisionType: 'Knowledge Query',
    confidence: 'Very High',
    confidenceLevel: 92,
    responseTime: '1247ms',
    aiModel: 'claude-3-5-sonnet-20241022',
    icon: LightBulbIcon,
    iconLightBg: 'bg-yellow-100/50',
    iconLightText: 'text-yellow-700',
    iconDarkBg: 'bg-yellow-900/20',
    iconDarkText: 'text-yellow-400',
    progressLight: 'bg-green-500',
    progressDark: 'bg-green-400',
  },
  {
    title: 'Optimization Example',
    path: 'Optimization Path',
    description: 'Mathematical optimization for decision-making problems',
    decisionType: 'Resource Optimization',
    confidence: 'High',
    confidenceLevel: 87,
    responseTime: '2156ms',
    aiModel: 'claude-3-5-sonnet-20241022',
    icon: CogIcon,
    iconLightBg: 'bg-blue-100/50',
    iconLightText: 'text-blue-700',
    iconDarkBg: 'bg-blue-900/20',
    iconDarkText: 'text-blue-400',
    progressLight: 'bg-green-500',
    progressDark: 'bg-green-400',
  },
  {
    title: 'Hybrid Analysis Example',
    path: 'Hybrid Path',
    description: 'Combined knowledge and optimization analysis',
    decisionType: 'Complex Analysis',
    confidence: 'High',
    confidenceLevel: 78,
    responseTime: '3421ms',
    aiModel: 'claude-3-5-sonnet-20241022',
    icon: ArrowPathRoundedSquareIcon,
    iconLightBg: 'bg-green-100/50',
    iconLightText: 'text-green-700',
    iconDarkBg: 'bg-green-900/20',
    iconDarkText: 'text-green-400',
    progressLight: 'bg-yellow-500',
    progressDark: 'bg-yellow-400',
  }
];

const ExampleQueries = () => {
  const { theme } = useTheme();
  return (
    <div className="py-12 bg-docs-bg dark:bg-docs-dark-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-docs-text dark:text-docs-dark-text sm:text-4xl">
            Example Queries
          </h2>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {exampleQueries.map((query) => (
            <div key={query.title} className="bg-docs-section dark:bg-gray-800/50 rounded-lg shadow-md p-6 border border-docs-section-border dark:border-gray-700">
              <h3 className="text-lg font-semibold text-docs-text dark:text-docs-dark-text">{query.title}</h3>
              <div className="flex items-center my-2">
                <div className={`p-1 rounded-full ${theme === 'light' ? query.iconLightBg : query.iconDarkBg}`}>
                  <query.icon className={`h-5 w-5 ${theme === 'light' ? query.iconLightText : query.iconDarkText}`} />
                </div>
                <span className="ml-2 text-sm font-medium text-docs-muted dark:text-docs-dark-muted">{query.path}</span>
              </div>
              <p className="text-sm text-docs-muted dark:text-docs-dark-muted mb-4">{query.description}</p>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <div>
                  <p className="text-docs-muted dark:text-docs-dark-muted">Decision Type</p>
                  <p className="font-semibold text-docs-text dark:text-docs-dark-text">{query.decisionType}</p>
                </div>
                <div>
                  <p className="text-docs-muted dark:text-docs-dark-muted">Confidence</p>
                  <p className="font-semibold text-green-600 dark:text-green-400">{query.confidence}</p>
                </div>
                <div>
                  <p className="text-docs-muted dark:text-docs-dark-muted">Response Time</p>
                  <p className="font-semibold text-docs-text dark:text-docs-dark-text">{query.responseTime}</p>
                </div>
                <div>
                  <p className="text-docs-muted dark:text-docs-dark-muted">AI Model</p>
                  <p className="font-semibold text-docs-text dark:text-docs-dark-text">{query.aiModel}</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-docs-muted dark:text-docs-dark-muted mb-1">Confidence Level</p>
                <div className="w-full bg-docs-section-border dark:bg-gray-700 rounded-full h-2.5">
                  <div className={`${theme === 'light' ? query.progressLight : query.progressDark} h-2.5 rounded-full`} style={{ width: `${query.confidenceLevel}%` }}></div>
                </div>
                <p className="text-right text-sm font-semibold text-docs-text dark:text-docs-dark-text mt-1">{query.confidenceLevel}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExampleQueries; 