import React from 'react';
import { LightBulbIcon, CogIcon, ArrowPathRoundedSquareIcon } from '@heroicons/react/24/outline';

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
    iconBgColor: 'bg-yellow-100/50',
    iconTextColor: 'text-yellow-700',
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
    iconBgColor: 'bg-blue-100/50',
    iconTextColor: 'text-blue-700',
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
    iconBgColor: 'bg-green-100/50',
    iconTextColor: 'text-green-700',
  }
];

const ExampleQueries = () => {
  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Example Queries
          </h2>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {exampleQueries.map((query) => (
            <div key={query.title} className="bg-white/50 rounded-lg shadow-md p-6 border border-gray-200/50">
              <h3 className="text-lg font-semibold text-gray-800">{query.title}</h3>
              <div className="flex items-center my-2">
                <div className={`p-1 rounded-full ${query.iconBgColor}`}>
                  <query.icon className={`h-5 w-5 ${query.iconTextColor}`} />
                </div>
                <span className="ml-2 text-sm font-medium text-gray-600">{query.path}</span>
              </div>
              <p className="text-sm text-gray-500 mb-4">{query.description}</p>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <div>
                  <p className="text-gray-500">Decision Type</p>
                  <p className="font-semibold text-gray-700">{query.decisionType}</p>
                </div>
                <div>
                  <p className="text-gray-500">Confidence</p>
                  <p className="font-semibold text-green-600">{query.confidence}</p>
                </div>
                <div>
                  <p className="text-gray-500">Response Time</p>
                  <p className="font-semibold text-gray-700">{query.responseTime}</p>
                </div>
                <div>
                  <p className="text-gray-500">AI Model</p>
                  <p className="font-semibold text-gray-700">{query.aiModel}</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-1">Confidence Level</p>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${query.confidenceLevel}%` }}></div>
                </div>
                <p className="text-right text-sm font-semibold text-gray-700 mt-1">{query.confidenceLevel}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExampleQueries; 