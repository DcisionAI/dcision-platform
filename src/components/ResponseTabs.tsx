import React, { useState } from 'react';
import { useTheme } from './layout/ThemeContext';
import MermaidChart from './ui/MermaidChart';
import ReactMarkdown from 'react-markdown';

interface SubIntent {
  name: string;
  confidence: number;
}

interface IdentifiedEntities {
  resources: string[];
  phases: string[];
  timeframe: string;
}

interface IntentAnalysis {
  primaryIntent: string;
  confidence: number;
  subIntents: SubIntent[];
  keyConstraints: string[];
  identifiedEntities: IdentifiedEntities;
}

interface IntentAgentAnalysis {
  decisionType: string;
  confidence: number;
  reasoning: string;
  ragQuery?: string;
  optimizationQuery?: string;
  keywords: string[];
  primaryIntent: string;
  secondaryIntent?: string;
}

interface ResponseTabsProps {
  content: {
    intentAnalysis?: IntentAnalysis;
    intentAgentAnalysis?: IntentAgentAnalysis;
    visualization?: string;
    zoom?: string;
    problem?: any;
    solution?: any;
    summary?: string;
    rag?: string;
    optimization?: any;
    explanation?: any;
  } | string;
}

const ResponseTabs: React.FC<ResponseTabsProps> = ({ content }) => {
  const [activeTab, setActiveTab] = useState('analysis');
  const { theme } = useTheme();

  if (typeof content === 'string') {
    return (
      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">
          {content}
        </pre>
      </div>
    );
  }

  // Determine content type and available tabs
  const getContentType = () => {
    if (typeof content === 'string') return 'general';
    if (content.rag && content.optimization) return 'hybrid';
    if (content.rag) return 'rag';
    if (content.solution || content.optimization) return 'optimization';
    return 'general';
  };

  const contentType = getContentType();

  const getTabs = () => {
    const baseTabs = [
      { id: 'analysis', label: 'Analysis' },
    ];

    switch (contentType) {
      case 'hybrid':
        return [
          ...baseTabs,
          { id: 'overview', label: 'Overview' },
          { id: 'rag', label: 'Knowledge Base' },
          { id: 'optimization', label: 'Optimization' },
        ];
      case 'rag':
        return [
          ...baseTabs,
          { id: 'content', label: 'Search Results' }
        ];
      case 'optimization':
        return [
          ...baseTabs,
          { id: 'details', label: 'Solution Details' },
          { id: 'summary', label: 'Summary' },
          { id: 'visualization', label: 'Visualization' },
        ];
      default:
        // Fallback for general or unknown content
        return [
          ...baseTabs,
          { id: 'content', label: 'Response' }
        ];
    }
  };

  const tabs = getTabs();

  useState(() => {
    if (tabs.length > 0 && tabs[0].id !== activeTab) {
      setActiveTab(tabs[0].id);
    }
  });

  const renderIntentAnalysis = () => {
    const intentAnalysis = content.intentAgentAnalysis;
    
    if (!intentAnalysis) {
      return (
        <div className="text-gray-500 dark:text-gray-400 text-center py-8">
          Intent analysis is not available for this response.
        </div>
      );
    }

    const getIntentTypeColor = (type: string) => {
      switch (type.toLowerCase()) {
        case 'knowledge_retrieval':
        case 'rag':
          return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
        case 'optimization':
          return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
        case 'hybrid_analysis':
        case 'hybrid':
          return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        default:
          return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      }
    };

    const getConfidenceColor = (confidence: number) => {
      if (confidence >= 0.8) return 'text-green-600 dark:text-green-400';
      if (confidence >= 0.6) return 'text-yellow-600 dark:text-yellow-400';
      return 'text-red-600 dark:text-red-400';
    };

    const getConfidenceBarColor = (confidence: number) => {
      if (confidence >= 0.8) return 'bg-green-500';
      if (confidence >= 0.6) return 'bg-yellow-500';
      return 'bg-red-500';
    };

    return (
      <div className="space-y-6">
        {/* Intent Classification */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            🧠 Intent Analysis
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Primary Intent */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Primary Intent
              </h4>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getIntentTypeColor(intentAnalysis.primaryIntent)}`}>
                {intentAnalysis.primaryIntent.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            {/* Decision Type */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Decision Type
              </h4>
              <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                {intentAnalysis.decisionType}
              </p>
            </div>
          </div>

          {/* Confidence Score */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-700 dark:text-gray-300">Confidence Level</span>
              <span className={`font-medium ${getConfidenceColor(intentAnalysis.confidence)}`}>
                {(intentAnalysis.confidence * 100).toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getConfidenceBarColor(intentAnalysis.confidence)} transition-all duration-300`}
                style={{ width: `${intentAnalysis.confidence * 100}%` }}
              />
            </div>
          </div>

          {/* Keywords */}
          {intentAnalysis.keywords && intentAnalysis.keywords.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Key Concepts Identified
              </h4>
              <div className="flex flex-wrap gap-2">
                {intentAnalysis.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Secondary Intent */}
          {intentAnalysis.secondaryIntent && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Secondary Intent
              </h4>
              <p className="text-sm text-gray-900 dark:text-gray-100">
                {intentAnalysis.secondaryIntent}
              </p>
            </div>
          )}
        </div>

        {/* Reasoning */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            💭 AI Reasoning
          </h3>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {intentAnalysis.reasoning}
            </p>
          </div>
        </div>

        {/* Query Analysis */}
        {(intentAnalysis.ragQuery || intentAnalysis.optimizationQuery) && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              🔍 Query Analysis
            </h3>
            
            {intentAnalysis.ragQuery && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Knowledge Base Query
                </h4>
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    {intentAnalysis.ragQuery}
                  </p>
                </div>
              </div>
            )}

            {intentAnalysis.optimizationQuery && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Optimization Problem
                </h4>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    {intentAnalysis.optimizationQuery}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderRAGContent = () => {
    return (
      <div className="space-y-6">
        <div className="bg-gray-100/50 dark:bg-gray-800/50 rounded-lg p-6">
          <ReactMarkdown
            components={{
              h2: ({ children }) => <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">{children}</h2>,
              h3: ({ children }) => <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">{children}</h3>,
              p: ({ children }) => <p className="text-gray-700 dark:text-gray-300 mb-3">{children}</p>,
              ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-3">{children}</ul>,
              li: ({ children }) => <li className="text-gray-700 dark:text-gray-300">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold text-gray-900 dark:text-gray-100">{children}</strong>,
              em: ({ children }) => <em className="italic text-gray-600 dark:text-gray-400">{children}</em>,
            }}
          >
            {content.rag || (content as any).toString()}
          </ReactMarkdown>
        </div>
      </div>
    );
  };

  const renderHybridOverview = () => {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            🧠 Smart Routing: Hybrid Approach
          </h3>
          <p className="text-blue-800 dark:text-blue-200 mb-4">
            This response combines knowledge base search with optimization to provide comprehensive insights.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">📚 Knowledge Base</h4>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Searched construction best practices and industry standards
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
              <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">⚡ Optimization</h4>
              <p className="text-sm text-green-800 dark:text-green-200">
                Applied mathematical optimization to crew scheduling
              </p>
            </div>
          </div>
        </div>
        
        {content.summary && (
          <div className="bg-gray-100/50 dark:bg-gray-800/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Summary</h3>
            <p className="text-gray-700 dark:text-gray-300">{content.summary}</p>
          </div>
        )}
      </div>
    );
  };

  const renderHybridOptimization = () => {
    return (
      <div className="space-y-6">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-3">
            ⚡ Optimization Results
          </h3>
          <p className="text-green-800 dark:text-green-200 mb-4">
            Crew allocation optimized considering knowledge base constraints
          </p>
        </div>
        
        <div className="bg-gray-100/50 dark:bg-gray-800/50 rounded-lg p-6">
          <ReactMarkdown
            components={{
              h2: ({ children }) => <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">{children}</h2>,
              h3: ({ children }) => <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">{children}</h3>,
              p: ({ children }) => <p className="text-gray-700 dark:text-gray-300 mb-3">{children}</p>,
              ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-3">{children}</ul>,
              li: ({ children }) => <li className="text-gray-700 dark:text-gray-300">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold text-gray-900 dark:text-gray-100">{children}</strong>,
            }}
          >
            {content.optimization || ''}
          </ReactMarkdown>
        </div>
      </div>
    );
  };
  const renderSummary = () => {
    // Prioritize the detailed explanation object.
    const explanation = content.explanation;
    const summary = explanation?.summary || content.summary;

    if (!summary) {
      return (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No summary is available for this response.
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Executive Summary</h3>
          <ReactMarkdown className="prose dark:prose-invert max-w-none">{summary}</ReactMarkdown>
        </div>

        {explanation?.tradeoffs && (
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Trade-offs Considered</h3>
            <ReactMarkdown className="prose dark:prose-invert max-w-none">{explanation.tradeoffs}</ReactMarkdown>
          </div>
        )}

        {explanation?.alternatives && (
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Alternatives Explored</h3>
            <ReactMarkdown className="prose dark:prose-invert max-w-none">{explanation.alternatives}</ReactMarkdown>
          </div>
        )}
      </div>
    );
  };

  const renderAnalysis = () => {
    if (!content.problem) {
      return (
         <div className="text-gray-500 dark:text-gray-400 text-center py-8">
            Analysis is not available for this response type.
          </div>
      )
    }

    const { objective, variables, constraints, metadata } = content.problem;

    const intentAnalysis: IntentAnalysis = {
      primaryIntent: objective?.description || 'Optimization Task',
      confidence: 0.9, // Placeholder confidence for derived analysis
      subIntents: [
        { name: 'Resource Allocation', confidence: 0.9 },
        { name: 'Constraint Satisfaction', confidence: 0.88 },
      ],
      keyConstraints: constraints?.descriptions || ['No constraints specified.'],
      identifiedEntities: {
        resources: variables?.map((v: any) => v.description || v.name) || ['No resources specified.'],
        phases: metadata?.phases?.map((p: any) => p.name) || [],
        timeframe: metadata?.phases ? `${metadata.phases.reduce((sum: number, p: { duration: number }) => sum + (p.duration || 0), 0)} weeks` : 'N/A'
      }
    };

    return (
      <div className="space-y-6">
        {/* Primary Intent */}
        <div className="bg-gray-100/50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Primary Intent</h3>
              <p className="text-gray-900 dark:text-gray-100 mt-1">{intentAnalysis.primaryIntent}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 dark:text-gray-400">Confidence</div>
              <div className="text-lg font-semibold text-[#FF7F50]">{(intentAnalysis.confidence * 100).toFixed(1)}%</div>
            </div>
          </div>
        </div>

        {/* Sub-Intents */}
        <div className="bg-gray-100/50 dark:bg-gray-800/50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Sub-Intents</h3>
          <div className="space-y-3">
            {intentAnalysis.subIntents.map((intent: SubIntent, index: number) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-900 dark:text-gray-100">{intent.name}</span>
                <span className="text-[#FF7F50] font-medium">{(intent.confidence * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Identified Entities */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-100/50 dark:bg-gray-800/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Resources</h3>
            <div className="space-y-2">
              {intentAnalysis.identifiedEntities.resources.map((resource: string, index: number) => (
                <div key={index} className="text-gray-700 dark:text-gray-300">• {resource}</div>
              ))}
            </div>
          </div>
          <div className="bg-gray-100/50 dark:bg-gray-800/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Project Phases</h3>
            <div className="space-y-2">
              {intentAnalysis.identifiedEntities.phases.length > 0 ?
                intentAnalysis.identifiedEntities.phases.map((phase: string, index: number) => (
                  <div key={index} className="text-gray-700 dark:text-gray-300">• {phase}</div>
                )) : <div className="text-gray-700 dark:text-gray-300">N/A</div>
              }
            </div>
          </div>
        </div>

        {/* Key Constraints */}
        <div className="bg-gray-100/50 dark:bg-gray-800/50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Identified Constraints</h3>
          <div className="space-y-2">
            {intentAnalysis.keyConstraints.map((constraint: string, index: number) => (
              <div key={index} className="text-gray-700 dark:text-gray-300">• {constraint}</div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDetails = () => {
    const solution = content.solution;
    if (!solution || !Array.isArray(solution.solution) || solution.solution.length === 0) {
      return <div className="text-center py-8 text-gray-500 dark:text-gray-400">Solution data is not available.</div>;
    }

    const { objective_value, status, solver_name, solve_time_ms, solution: solutionArray } = solution;
    
    const StatCard = ({ title, value,bgColor = 'bg-gray-100/50 dark:bg-gray-800/50' }: { title: string, value: string | number, bgColor?: string }) => (
      <div className={`p-4 rounded-lg shadow ${bgColor}`}>
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      </div>
    );

    const VariableCard = ({ variable }: { variable: { name?: string, variable_name?: string, value: number, category?: string, description?: string } }) => (
        <div className="bg-gray-100/50 dark:bg-gray-800/50 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">{variable.category || 'Variable'}</p>
            <p className="text-md font-semibold text-gray-900 dark:text-gray-100">{variable.name || variable.variable_name}</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{variable.value}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">{variable.description}</p>
        </div>
    );
    
    const ConstraintCard = ({ description, category, sense, rhs }: { description: string, category: string, sense: string, rhs: number }) => (
      <div className="bg-gray-100/50 dark:bg-gray-800/50 rounded-lg p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{description}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{category}</p>
        </div>
        <div className="text-md font-mono text-gray-800 dark:text-gray-200">
          {`value ${sense} ${rhs}`}
        </div>
      </div>
    );

    return (
      <div className="space-y-6">
        {/* Top-level stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Status" value={status} />
          <StatCard title="Objective Value" value={Number(objective_value).toFixed(2)} />
          <StatCard title="Solver" value={solver_name} />
          <StatCard title="Solve Time" value={`${solve_time_ms} ms`} />
        </div>

        {/* Solution Variables */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 p-4 border-b border-gray-200 dark:border-gray-700">
            Optimal Assignments
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {solutionArray.map((variable: any, index: number) => (
                <VariableCard key={index} variable={variable} />
            ))}
          </div>
        </div>

        {/* Constraints (if available) */}
        {solution.constraints && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 p-4 border-b border-gray-200 dark:border-gray-700">
              Constraints
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              {solution.constraints.map((constraint: any, index: number) => (
                <ConstraintCard key={index} {...constraint} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderOptimizationContent = () => {
    const solution = content.solution || content.optimization?.solution;
    const summary = content.summary || content.optimization?.summary;
    const explanation = content.explanation || content.optimization?.explanation;

    if (!solution) {
      return (
        <div className="p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg">
          Solution data is not available.
        </div>
      );
    }
    
    // Fallback for when explanation is a string
    if (typeof explanation === 'string') {
      return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
           <ReactMarkdown>{explanation}</ReactMarkdown>
        </div>
      )
    }

    return (
      <div className="space-y-6 p-4">
        {/* Summary */}
        {summary && (
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h3 className="text-xl font-bold mb-4">Summary</h3>
            <ReactMarkdown>{summary}</ReactMarkdown>
          </div>
        )}
        
        {/* Key Decisions */}
        {explanation?.keyDecisions && (
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h3 className="text-xl font-bold mb-4">Key Decisions</h3>
            <ul className="space-y-4">
              {explanation.keyDecisions.map((decision: {decision: string, rationale: string}, index: number) => (
                <li key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="font-semibold">{decision.decision}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{decision.rationale}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Solution */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4">Solution</h3>
          <ul className="space-y-2">
            {solution.map((item: {variable_name: string, value: number}, index: number) => (
              <li key={index} className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <span className="font-mono">{item.variable_name}:</span> {item.value}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (typeof content === 'string') {
      return (
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">
            {content}
          </pre>
        </div>
      );
    }
    switch (activeTab) {
      case 'overview':
        return renderHybridOverview();
      case 'rag':
        return renderRAGContent();
      case 'optimization':
        return renderHybridOptimization();
      case 'content':
        return renderRAGContent();
      case 'summary':
        return renderSummary();
      case 'analysis':
        return renderIntentAnalysis();
      case 'details':
        return renderDetails();
      case 'visualization':
        const diagram = content.visualization;
        if (!diagram) {
          return (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No visualization available for this solution.
            </div>
          );
        }
        return <MermaidChart content={diagram} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full -mx-6">
      <div className="border-b border-gray-200 dark:border-gray-700 w-full">
        <nav className="-mb-px flex w-full" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-[#FF7F50] text-[#FF7F50]'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-6 w-full px-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default ResponseTabs; 