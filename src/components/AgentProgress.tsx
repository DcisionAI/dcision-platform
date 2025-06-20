import React from 'react';
import { useTheme } from './layout/ThemeContext';

export interface ProgressEvent {
  step: string;
  status: 'start' | 'progress' | 'complete' | 'error';
  message: string;
  data?: any;
  error?: any;
}

interface AgentProgressProps {
  events: ProgressEvent[];
  isActive: boolean;
}

const AgentProgress: React.FC<AgentProgressProps> = ({ events, isActive }) => {
  const { theme } = useTheme();

  const getStepIcon = (step: string) => {
    switch (step) {
      case 'intent':
        return '🧠';
      case 'rag':
        return '📚';
      case 'data_enrichment':
        return '🔧';
      case 'model_building':
        return '🏗️';
      case 'solving':
        return '⚡';
      case 'optimization':
        return '🎯';
      case 'explanation':
        return '💡';
      case 'error':
        return '❌';
      default:
        return '⚙️';
    }
  };

  const getStepTitle = (step: string) => {
    switch (step) {
      case 'intent':
        return 'Intent Analysis';
      case 'rag':
        return 'Knowledge Search';
      case 'data_enrichment':
        return 'Data Enrichment';
      case 'model_building':
        return 'Model Building';
      case 'solving':
        return 'Optimization Solving';
      case 'optimization':
        return 'Optimization Workflow';
      case 'explanation':
        return 'Explanation Generation';
      case 'error':
        return 'Error';
      default:
        return step.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'text-green-600 dark:text-green-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'progress':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'bg-green-100 dark:bg-green-900/30';
      case 'error':
        return 'bg-red-100 dark:bg-red-900/30';
      case 'progress':
        return 'bg-blue-100 dark:bg-blue-900/30';
      default:
        return 'bg-gray-100 dark:bg-gray-800/50';
    }
  };

  if (!isActive && events.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            🤖 Agent Orchestration Progress
          </h3>
          {isActive && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-blue-600 dark:text-blue-400">Active</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {events.map((event, index) => (
            <div
              key={`${event.step}-${index}`}
              className={`flex items-start space-x-3 p-3 rounded-lg transition-all duration-300 ${getStatusBgColor(event.status)}`}
            >
              <div className="flex-shrink-0 text-2xl">
                {getStepIcon(event.step)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {getStepTitle(event.step)}
                  </h4>
                  <span className={`text-xs font-medium ${getStatusColor(event.status)}`}>
                    {event.status.toUpperCase()}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {event.message}
                </p>

                {event.error && (
                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300">
                    Error: {event.error.message || 'Unknown error'}
                  </div>
                )}

                {event.data && event.status === 'complete' && (
                  <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-xs text-green-700 dark:text-green-300">
                    ✓ Completed successfully
                  </div>
                )}
              </div>
            </div>
          ))}

          {isActive && events.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-gray-600 dark:text-gray-400">Initializing agents...</span>
              </div>
            </div>
          )}

          {!isActive && events.length > 0 && (
            <div className="flex items-center justify-center py-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                  Workflow completed successfully
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentProgress; 