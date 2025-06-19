import React, { useState } from 'react';
import { useTheme } from '@/components/layout/ThemeContext';

interface IntentAnalysisData {
  executionPath?: string;
  decisionType?: string;
  confidence?: number;
  duration?: number;
  model?: string;
  sessionId?: string;
  intent?: any;
  ragResult?: any;
  optimizationResult?: any;
}

interface IntentAnalysisDisplayProps {
  data: IntentAnalysisData;
  title?: string;
  showRawData?: boolean;
  className?: string;
}

const IntentAnalysisDisplay: React.FC<IntentAnalysisDisplayProps> = ({
  data,
  title = "AI Intent Analysis",
  showRawData = false,
  className = ""
}) => {
  const { theme } = useTheme();
  const [showDetails, setShowDetails] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const getExecutionPathColor = (path: string) => {
    switch (path) {
      case 'rag': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'optimization': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'hybrid': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getExecutionPathIcon = (path: string) => {
    switch (path) {
      case 'rag': return '🔍';
      case 'optimization': return '⚙️';
      case 'hybrid': return '🔄';
      default: return '❓';
    }
  };

  const getExecutionPathDescription = (path: string) => {
    switch (path) {
      case 'rag': return 'Knowledge-based response using construction knowledge base';
      case 'optimization': return 'Mathematical optimization for decision-making problems';
      case 'hybrid': return 'Combined knowledge and optimization analysis';
      default: return 'Unknown execution path';
    }
  };

  const formatConfidence = (confidence: number) => {
    if (confidence >= 0.9) return 'Very High';
    if (confidence >= 0.7) return 'High';
    if (confidence >= 0.5) return 'Medium';
    if (confidence >= 0.3) return 'Low';
    return 'Very Low';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return 'text-green-600 dark:text-green-400';
    if (confidence >= 0.5) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getConfidenceBarColor = (confidence: number) => {
    if (confidence >= 0.7) return 'bg-green-500';
    if (confidence >= 0.5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (!data || Object.keys(data).length === 0) {
    return null;
  }

  return (
    <div className={`rounded-lg border ${theme === 'dark' ? 'bg-docs-dark-bg border-docs-dark-muted' : 'bg-white border-gray-200'} p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-docs-dark-text' : 'text-gray-900'}`}>
          {title}
        </h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      {/* Execution Path Badge */}
      {data.executionPath && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getExecutionPathColor(data.executionPath)}`}>
              <span className="text-base">{getExecutionPathIcon(data.executionPath)}</span>
              {data.executionPath.charAt(0).toUpperCase() + data.executionPath.slice(1)} Path
            </span>
          </div>
          <p className={`text-sm ${theme === 'dark' ? 'text-docs-dark-muted' : 'text-gray-600'}`}>
            {getExecutionPathDescription(data.executionPath)}
          </p>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {data.decisionType && (
          <div className="text-center">
            <div className={`text-xs font-medium ${theme === 'dark' ? 'text-docs-dark-muted' : 'text-gray-500'}`}>
              Decision Type
            </div>
            <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-docs-dark-text' : 'text-gray-900'}`}>
              {data.decisionType}
            </div>
          </div>
        )}
        
        {data.confidence && (
          <div className="text-center">
            <div className={`text-xs font-medium ${theme === 'dark' ? 'text-docs-dark-muted' : 'text-gray-500'}`}>
              Confidence
            </div>
            <div className={`text-sm font-semibold ${getConfidenceColor(data.confidence)}`}>
              {formatConfidence(data.confidence)}
            </div>
          </div>
        )}

        {data.duration && (
          <div className="text-center">
            <div className={`text-xs font-medium ${theme === 'dark' ? 'text-docs-dark-muted' : 'text-gray-500'}`}>
              Response Time
            </div>
            <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-docs-dark-text' : 'text-gray-900'}`}>
              {data.duration}ms
            </div>
          </div>
        )}

        {data.model && (
          <div className="text-center">
            <div className={`text-xs font-medium ${theme === 'dark' ? 'text-docs-dark-muted' : 'text-gray-500'}`}>
              AI Model
            </div>
            <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-docs-dark-text' : 'text-gray-900'}`}>
              {data.model}
            </div>
          </div>
        )}
      </div>

      {/* Confidence Bar */}
      {data.confidence && (
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1">
            <span className={theme === 'dark' ? 'text-docs-dark-muted' : 'text-gray-500'}>Confidence Level</span>
            <span className={`font-medium ${getConfidenceColor(data.confidence)}`}>
              {(data.confidence * 100).toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getConfidenceBarColor(data.confidence)} transition-all duration-300`}
              style={{ width: `${data.confidence * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Detailed Information */}
      {showDetails && (
        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          {/* Decision Type Details */}
          {data.decisionType && (
            <div>
              <h4 className={`text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-docs-dark-text' : 'text-gray-900'}`}>
                Decision Analysis
              </h4>
              <div className={`p-3 rounded ${theme === 'dark' ? 'bg-docs-dark-bg/50' : 'bg-gray-50'}`}>
                <p className={`text-sm ${theme === 'dark' ? 'text-docs-dark-muted' : 'text-gray-600'}`}>
                  The AI identified this as a <strong>{data.decisionType}</strong> problem, 
                  requiring {data.executionPath === 'optimization' ? 'mathematical optimization' : 
                  data.executionPath === 'rag' ? 'knowledge retrieval' : 'combined analysis'}.
                </p>
              </div>
            </div>
          )}

          {/* Performance Metrics */}
          <div>
            <h4 className={`text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-docs-dark-text' : 'text-gray-900'}`}>
              Performance Metrics
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.duration && (
                <div className={`p-3 rounded ${theme === 'dark' ? 'bg-docs-dark-bg/50' : 'bg-gray-50'}`}>
                  <div className={`text-xs font-medium ${theme === 'dark' ? 'text-docs-dark-muted' : 'text-gray-500'}`}>
                    Response Time
                  </div>
                  <div className={`text-lg font-bold ${theme === 'dark' ? 'text-docs-dark-text' : 'text-gray-900'}`}>
                    {data.duration}ms
                  </div>
                </div>
              )}
              
              {data.model && (
                <div className={`p-3 rounded ${theme === 'dark' ? 'bg-docs-dark-bg/50' : 'bg-gray-50'}`}>
                  <div className={`text-xs font-medium ${theme === 'dark' ? 'text-docs-dark-muted' : 'text-gray-500'}`}>
                    AI Model Used
                  </div>
                  <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-docs-dark-text' : 'text-gray-900'}`}>
                    {data.model}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Raw Data Toggle */}
          {showRawData && data.intent && (
            <div>
              <button
                onClick={() => setShowRaw(!showRaw)}
                className={`text-sm font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} hover:underline`}
              >
                {showRaw ? 'Hide' : 'Show'} Raw Intent Data
              </button>
              
              {showRaw && (
                <div className="mt-2">
                  <pre className={`p-3 rounded text-xs overflow-x-auto ${theme === 'dark' ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800'}`}>
                    {JSON.stringify(data.intent, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IntentAnalysisDisplay; 